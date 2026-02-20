import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type Role = 'sala' | 'cozinha' | 'admin' | null;

export type TableStatus = 'idle' | 'preparing' | 'ready' | 'paused';

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
}

export interface Menu {
  id: string;
  name: string;
  moments: string[];
  isActive: boolean;
}

interface StoreState {
  role: Role;
  tables: Table[];
  menus: Menu[];
  pairings: string[];
  login: (role: Role) => void;
  logout: () => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  createMenu: (menu: Omit<Menu, 'id'>) => void;
  updateMenu: (id: string, updates: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
  notifyVibration: () => void;
}

// Added table 51 to default list
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

  const login = (newRole: Role) => setRole(newRole);
  const logout = () => setRole(null);

  const updateTable = (id: string, updates: Partial<Table>) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const createMenu = (menu: Omit<Menu, 'id'>) => {
    setMenus(prev => [...prev, { ...menu, id: `m${Date.now()}` }]);
  };

  const updateMenu = (id: string, updates: Partial<Menu>) => {
    setMenus(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMenu = (id: string) => {
    // Prevent deleting active menus
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
      role, tables, menus, pairings: defaultPairings,
      login, logout, updateTable, createMenu, updateMenu, deleteMenu, notifyVibration
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