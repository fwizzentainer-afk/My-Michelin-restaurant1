import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type Role = 'sala' | 'cozinha' | 'admin' | null;

export type TableStatus = 'idle' | 'preparing' | 'ready' | 'paused';

export interface MomentLog {
  momentNumber: number;
  momentName: string;
  startTime: number | null; // time sala started (sent to cozinha)
  readyTime: number | null; // time cozinha marked ready
  finishTime: number | null; // time sala picked it up (started next moment or finished)
}

export interface Table {
  id: string;
  number: string;
  menu: string | null;
  pairing: string | null;
  status: TableStatus;
  currentMoment: number;
  totalMoments: number;
  startTime: number | null;
  lastMomentTime: number | null;
  momentsHistory: MomentLog[];
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

interface StoreState {
  role: Role;
  tables: Table[];
  menus: Menu[];
  pairings: string[];
  historicalLogs: HistoricalService[];
  login: (role: Role) => void;
  logout: () => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  createMenu: (menu: Omit<Menu, 'id'>) => void;
  updateMenu: (id: string, updates: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
  finishService: (id: string) => void;
  notifyVibration: () => void;
}

const defaultTables: Table[] = ['10', '20', '21', '40', '41', '1', '2', '3'].map((num) => ({
  id: `t-${num}`,
  number: num,
  menu: null,
  pairing: null,
  status: 'idle',
  currentMoment: 0,
  totalMoments: 0,
  startTime: null,
  lastMomentTime: null,
  momentsHistory: [],
}));

const defaultMenus: Menu[] = [
  { id: 'm1', name: 'Menu 9 momentos', moments: ['Crocante de sementes & coalhada', 'Crocante de sementes & coalhada', 'Moluscos', 'Peixe', 'Verão', 'Carne', 'Arroz con leche', 'Bolo de milho & rosquilha de chocolate', 'Bolo de milho & rosquilha de chocolate'], isActive: true },
  { id: 'm2', name: 'Menu 11 momentos', moments: ['Crocante de sementes & coalhada', 'Crocante de sementes & coalhada', 'Moluscos', 'Lagostim', 'Peixe', 'Verão', 'Carne', 'Texturas de abóbora', 'Arroz con leche', 'Bolo de milho & rosquilha de chocolate', 'Bolo de milho & rosquilha de chocolate'], isActive: true },
];

const defaultPairings = ['Essencial', 'Gastronômico', 'À Carta', 'Sem Pearing'];

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [tables, setTables] = useState<Table[]>(defaultTables);
  const [menus, setMenus] = useState<Menu[]>(defaultMenus);
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalService[]>([]);

  const login = (newRole: Role) => setRole(newRole);
  const logout = () => setRole(null);

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const finishService = (id: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        if (t.startTime) {
          setHistoricalLogs(logs => [...logs, {
            id: `hist-${Date.now()}`,
            tableNumber: t.number,
            menuName: t.menu || '',
            pairing: t.pairing,
            startTime: t.startTime!,
            endTime: Date.now(),
            momentsHistory: t.momentsHistory
          }]);
        }
        return {
          ...t,
          menu: null,
          pairing: null,
          status: 'idle',
          currentMoment: 0,
          totalMoments: 0,
          startTime: null,
          lastMomentTime: null,
          momentsHistory: []
        };
      }
      return t;
    }));
  };

  const createMenu = (menu: Omit<Menu, 'id'>) => {
    setMenus(prev => [...prev, { ...menu, id: `m${Date.now()}` }]);
  };

  const updateMenu = (id: string, updates: Partial<Menu>) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMenu = (id: string) => {
    const menu = menus.find(m => m.id === id);
    if (menu?.isActive) return;
    setMenus(prev => prev.filter(m => m.id !== id));
  };

  const notifyVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  return (
    <StoreContext.Provider value={{
      role, tables, menus, pairings: defaultPairings, historicalLogs,
      login, logout, updateTable, createMenu, updateMenu, deleteMenu, finishService, notifyVibration
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