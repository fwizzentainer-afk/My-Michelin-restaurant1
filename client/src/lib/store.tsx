import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import socket from "@/socket";

// Types
export type Role = 'sala' | 'cozinha' | 'admin' | null;

export type TableStatus = 'idle' | 'preparing' | 'ready' | 'paused' | 'finished';

export interface MomentLog {
  momentNumber: number;
  momentName: string;
  startTime: number | null; 
  readyTime: number | null; 
  finishTime: number | null; 
}

export interface Table {
  id: string;
  number: string;
  menu: string | null;
  pairing: string | null;
  pax: number | null;
  language: string | null;
  status: TableStatus;
  currentMoment: number;
  totalMoments: number;
  startTime: number | null;
  lastMomentTime: number | null;
  momentsHistory: MomentLog[];
  restrictions: {
    type: 'alergia' | 'intolerancia' | 'gravidez' | null;
    description: string;
  };
}

export interface Menu {
  id: string;
  name: string;
  moments: string[];
  isActive: boolean;
}

export interface HistoricalService {
  id: string;
  tableNumber: string;
  menuName: string;
  pairing: string | null;
  startTime: number;
  endTime: number;
  momentsHistory: MomentLog[];
}

type SyncType = "SYNC_TABLES" | "SYNC_MENUS" | "SYNC_LOGS" | "SYNC_SETTINGS" | "NOTIFICATION";

interface SyncEnvelope {
  type: SyncType;
  payload: any;
  sourceId: string;
  ts: number;
}

interface StoreState {
  role: Role | null;
  tables: Table[];
  menus: Menu[];
  pairings: string[];
  historicalLogs: HistoricalService[];
  settings: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    requireRoleLogin: boolean;
  };
  connectionStatus: {
    online: boolean;
    socketConnected: boolean;
    pendingSync: number;
    mode: "online" | "offline" | "reconnecting";
  };
  login: (role: Role | null) => void;
  logout: () => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  createMenu: (menu: Omit<Menu, 'id'>) => void;
  updateMenu: (id: string, updates: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
  finishService: (id: string) => void;
  triggerNotification: (targetRole: Role | null, title: string, body: string) => void;
  updateSettings: (settings: Partial<StoreState['settings']>) => void;
}

const tableNumbers = [
  '10', '11', '20', '21', '40', '41', '50', '1', '2', '3',
  '51', '52', '53', '54', '55', '56', '57'
];

const defaultTables: Table[] = tableNumbers.map((num) => ({
  id: `t-${num}`,
  number: num,
  menu: null,
  pairing: null,
  pax: null,
  language: null,
  status: 'idle',
  currentMoment: 0,
  totalMoments: 0,
  startTime: null,
  lastMomentTime: null,
  momentsHistory: [],
  restrictions: { type: null, description: '' }
}));

const defaultMenus: Menu[] = [
  { id: 'm1', name: 'Menu 9 momentos', moments: ['Crocante de sementes & coalhada', 'Moluscos', 'Peixe', 'Verão', 'Carne', 'Arroz con leche', 'Bolo de milho & rosquilha de chocolate'], isActive: true },
  { id: 'm2', name: 'Menu 11 momentos', moments: ['Crocante de sementes & coalhada', 'Moluscos', 'Lagostim', 'Peixe', 'Verão', 'Carne', 'Texturas de abóbora', 'Arroz con leche', 'Bolo de milho & rosquilha de chocolate'], isActive: true },
];

const defaultPairings = ['Essencial', 'Gastronômico', 'À Carta', 'Sem Pearing'];
const SETTINGS_STORAGE_KEY = "michelin_settings_v1";
const MENUS_STORAGE_KEY = "michelin_menus_v1";
const TABLES_STORAGE_KEY = "michelin_tables_v1";
const LOGS_STORAGE_KEY = "michelin_logs_v1";
const defaultSettings: StoreState["settings"] = {
  soundEnabled: true,
  notificationsEnabled: true,
  requireRoleLogin: true,
};

const StoreContext = createContext<StoreState | undefined>(undefined);
const SYNC_CHANNEL = "michelin_sync";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const loadTables = (): Table[] => {
    try {
      const raw = localStorage.getItem(TABLES_STORAGE_KEY);
      if (!raw) return defaultTables;
      const parsed = JSON.parse(raw) as Table[];
      if (!Array.isArray(parsed)) return defaultTables;

      const byId = new Map(parsed.map((table) => [table.id, table]));
      return defaultTables.map((table) => {
        const stored = byId.get(table.id);
        return stored ? { ...table, ...stored } : table;
      });
    } catch {
      return defaultTables;
    }
  };

  const loadLogs = (): HistoricalService[] => {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as HistoricalService[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [role, setRole] = useState<Role | null>(null);
  const [tables, setTables] = useState<Table[]>(loadTables);
  const [menus, setMenus] = useState<Menu[]>(() => {
    try {
      const raw = localStorage.getItem(MENUS_STORAGE_KEY);
      if (!raw) return defaultMenus;
      const parsed = JSON.parse(raw) as Menu[];
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultMenus;
      return parsed;
    } catch {
      return defaultMenus;
    }
  });
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalService[]>(loadLogs);
  const [settings, setSettings] = useState<StoreState["settings"]>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return defaultSettings;
      const parsed = JSON.parse(raw) as Partial<StoreState["settings"]>;
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  });
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [socketConnected, setSocketConnected] = useState<boolean>(socket.connected);
  const [pendingSync, setPendingSync] = useState(0);
  const syncQueueRef = useRef<SyncEnvelope[]>([]);
  const syncSourceIdRef = useRef<string>(crypto.randomUUID());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const serverSyncEnabledRef = useRef(true);

  const syncServerState = async (patch: Partial<{ tables: Table[]; menus: Menu[]; historicalLogs: HistoricalService[] }>) => {
    if (!role || !serverSyncEnabledRef.current) return;
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.status === 401 || res.status === 403) {
        serverSyncEnabledRef.current = false;
      }
    } catch (err) {
      console.warn("Falha ao sincronizar estado compartilhado:", err);
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  useEffect(() => {
    const applyIncomingSync = (event: SyncEnvelope) => {
      if (event.sourceId === syncSourceIdRef.current) return;

      if (event.type === "SYNC_TABLES") {
        setTables(event.payload);
      } else if (event.type === "SYNC_MENUS") {
        setMenus(event.payload);
      } else if (event.type === "SYNC_LOGS") {
        setHistoricalLogs(event.payload);
      } else if (event.type === "SYNC_SETTINGS") {
        setSettings((prev) => ({ ...prev, ...event.payload }));
      } else if (event.type === "NOTIFICATION") {
        const { targetRole, title, body } = event.payload;
        if (role === targetRole) {
          if (settings.notificationsEnabled) {
            if ("Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(title, { 
                  body, 
                  icon: '/favicon.png',
                  tag: 'michelin-alert'
                });
              } catch (e) {
                console.error("Error firing notification", e);
              }
            }
            if (settings.soundEnabled) {
              playNotificationSound();
            }
          }
        }
      }
    };

    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const payload = event.data as SyncEnvelope;
      applyIncomingSync(payload);
    };

    const onSocketSync = (payload: SyncEnvelope) => applyIncomingSync(payload);
    socket.on("state-sync", onSocketSync);

    return () => {
      socket.off("state-sync", onSocketSync);
      channelRef.current = null;
      channel.close();
    };
  }, [role, settings.soundEnabled, settings.notificationsEnabled]);

  useEffect(() => {
    if (!role) return;
    let cancelled = false;
    serverSyncEnabledRef.current = true;

    const loadFromServer = async () => {
      try {
        const res = await fetch("/api/state", {
          credentials: "include",
        });
        if (res.status === 401 || res.status === 403) {
          serverSyncEnabledRef.current = false;
          return;
        }
        if (!res.ok) return;
        const payload = await res.json() as Partial<{
          tables: Table[];
          menus: Menu[];
          historicalLogs: HistoricalService[];
        }>;

        if (cancelled) return;
        if (Array.isArray(payload.tables) && payload.tables.length > 0) setTables(payload.tables);
        if (Array.isArray(payload.menus) && payload.menus.length > 0) setMenus(payload.menus);
        if (Array.isArray(payload.historicalLogs)) setHistoricalLogs(payload.historicalLogs);
      } catch (err) {
        console.warn("Falha ao carregar estado do servidor:", err);
      }
    };

    void loadFromServer();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const flushQueuedSync = () => {
    if (!online || !socketConnected) return;
    if (syncQueueRef.current.length === 0) return;

    for (const envelope of syncQueueRef.current) {
      socket.emit("state-sync", envelope);
    }
    syncQueueRef.current = [];
    setPendingSync(0);
  };

  const publishSync = (type: SyncType, payload: any) => {
    const envelope: SyncEnvelope = {
      type,
      payload,
      sourceId: syncSourceIdRef.current,
      ts: Date.now(),
    };

    channelRef.current?.postMessage(envelope);

    if (online && socketConnected) {
      socket.emit("state-sync", envelope);
      return;
    }

    syncQueueRef.current.push(envelope);
    setPendingSync(syncQueueRef.current.length);
  };

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      flushQueuedSync();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [socketConnected]);

  useEffect(() => {
    const onConnect = () => {
      setSocketConnected(true);
      flushQueuedSync();
    };
    const onDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [online]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn("Falha ao persistir configurações locais:", err);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
    } catch (err) {
      console.warn("Falha ao persistir menus locais:", err);
    }
  }, [menus]);

  useEffect(() => {
    try {
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
    } catch (err) {
      console.warn("Falha ao persistir mesas locais:", err);
    }
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(historicalLogs));
    } catch (err) {
      console.warn("Falha ao persistir histórico local:", err);
    }
  }, [historicalLogs]);

  const requestNotificationPermission = async () => {
    if (!settings.notificationsEnabled) return;
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.error("Could not request notification permission", e);
      }
    }
  };

  const login = (newRole: Role) => {
    setRole(newRole);
    if (newRole === 'sala' || newRole === 'cozinha') {
      requestNotificationPermission();
    }
  };

  const logout = () => setRole(null);

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      publishSync("SYNC_TABLES", next);
      void syncServerState({ tables: next });
      return next;
    });
  };

  const finishService = (id: string) => {
    setTables(prev => {
      const nextTables = prev.map(t => {
        if (t.id === id) {
          if (t.startTime) {
            setHistoricalLogs(logs => {
              const nextLogs = [...logs, {
                id: `hist-${Date.now()}`,
                tableNumber: t.number,
                menuName: t.menu || '',
                pairing: t.pairing,
                startTime: t.startTime!,
                endTime: Date.now(),
                momentsHistory: t.momentsHistory
              }];
              publishSync("SYNC_LOGS", nextLogs);
              void syncServerState({ historicalLogs: nextLogs });
              return nextLogs;
            });
          }
          return {
            ...t,
            menu: null,
            pairing: null,
            pax: null,
            language: null,
            status: 'idle' as TableStatus,
            currentMoment: 0,
            totalMoments: 0,
            startTime: null,
            lastMomentTime: null,
            momentsHistory: [],
            restrictions: { type: null, description: '' }
          } as Table;
        }
        return t;
      });
      publishSync("SYNC_TABLES", nextTables);
      void syncServerState({ tables: nextTables });
      return nextTables;
    });
  };

  const createMenu = (menu: Omit<Menu, 'id'>) => {
    setMenus(prev => {
      const next = [...prev, { ...menu, id: `m${Date.now()}` }];
      publishSync("SYNC_MENUS", next);
      void syncServerState({ menus: next });
      return next;
    });
  };

  const updateMenu = (id: string, updates: Partial<Menu>) => {
    setMenus(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      publishSync("SYNC_MENUS", next);
      void syncServerState({ menus: next });
      return next;
    });
  };

  const deleteMenu = (id: string) => {
    setMenus(prev => {
      const menu = prev.find(m => m.id === id);
      if (menu?.isActive) return prev;
      const next = prev.filter(m => m.id !== id);
      publishSync("SYNC_MENUS", next);
      void syncServerState({ menus: next });
      return next;
    });
  };


  const triggerNotification = (targetRole: Role, title: string, body: string) => {
    publishSync("NOTIFICATION", { targetRole, title, body });
    if (role === targetRole) {
      if (settings.notificationsEnabled) {
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(title, { 
              body, 
              icon: '/favicon.png',
              tag: 'michelin-alert'
            });
          } catch (e) {}
        }
        if (settings.soundEnabled) {
          playNotificationSound();
        }
      }
    }
  };

  const updateSettings = (newSettings: Partial<StoreState['settings']>) => {
    setSettings(prev => {
      const next = { ...prev, ...newSettings };
      publishSync("SYNC_SETTINGS", next);
      return next;
    });
  };

  const connectionMode: "online" | "offline" | "reconnecting" =
    !online ? "offline" : socketConnected ? "online" : "reconnecting";

  return (
    <StoreContext.Provider value={{
      role,
      tables,
      menus,
      pairings: defaultPairings,
      historicalLogs,
      settings,
      connectionStatus: {
        online,
        socketConnected,
        pendingSync,
        mode: connectionMode,
      },
      login, logout, updateTable, createMenu, updateMenu, deleteMenu, finishService, triggerNotification, updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
