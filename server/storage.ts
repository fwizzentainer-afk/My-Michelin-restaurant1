import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import {
  users,
  menus,
  tables,
  historicalServices,
  appState,
  insertUserSchema,
  type User,
  type InsertUser,
  type Menu,
  type InsertMenu,
  type Table,
  type InsertTable,
  type HistoricalService,
  type InsertHistoricalService,
} from "../shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUserCredentials(username: string, password: string): Promise<User | null>;

  listMenus(): Promise<Menu[]>;
  createMenu(menu: InsertMenu): Promise<Menu>;
  updateMenu(id: string, updates: Partial<InsertMenu>): Promise<Menu | null>;
  deleteMenu(id: string): Promise<boolean>;

  listTables(): Promise<Table[]>;
  upsertTable(table: InsertTable): Promise<Table>;

  logHistorical(entry: InsertHistoricalService): Promise<HistoricalService>;
  listHistorical(): Promise<HistoricalService[]>;

  getSharedState(): Promise<SharedState>;
  updateSharedState(patch: Partial<SharedState>): Promise<SharedState>;
}

const SALT_ROUNDS = 10;
const LOGIN_USERS_FILE = path.resolve(process.cwd(), ".node", "login-users.json");
const SHARED_STATE_FILE = path.resolve(process.cwd(), ".node", "shared-state.json");

export interface SharedState {
  tables: any[];
  menus: any[];
  historicalLogs: any[];
}

const defaultSharedState: SharedState = {
  tables: [],
  menus: [],
  historicalLogs: [],
};

function loadLocalUsers(): User[] {
  try {
    if (!fs.existsSync(LOGIN_USERS_FILE)) return [];
    const raw = fs.readFileSync(LOGIN_USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as User[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn("Falha ao carregar banco local de login:", err);
    return [];
  }
}

function saveLocalUsers(usersList: User[]) {
  try {
    fs.mkdirSync(path.dirname(LOGIN_USERS_FILE), { recursive: true });
    fs.writeFileSync(LOGIN_USERS_FILE, JSON.stringify(usersList, null, 2), "utf-8");
  } catch (err) {
    console.warn("Falha ao salvar banco local de login:", err);
  }
}

function loadSharedState(): SharedState {
  try {
    if (!fs.existsSync(SHARED_STATE_FILE)) return { ...defaultSharedState };
    const raw = fs.readFileSync(SHARED_STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SharedState>;
    return {
      tables: Array.isArray(parsed.tables) ? parsed.tables : [],
      menus: Array.isArray(parsed.menus) ? parsed.menus : [],
      historicalLogs: Array.isArray(parsed.historicalLogs) ? parsed.historicalLogs : [],
    };
  } catch (err) {
    console.warn("Falha ao carregar estado compartilhado:", err);
    return { ...defaultSharedState };
  }
}

function saveSharedState(state: SharedState) {
  try {
    fs.mkdirSync(path.dirname(SHARED_STATE_FILE), { recursive: true });
    fs.writeFileSync(SHARED_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Falha ao salvar estado compartilhado:", err);
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private menus: Map<string, Menu>;
  private tables: Map<string, Table>;
  private historical: HistoricalService[];
  private sharedState: SharedState;

  constructor() {
    const bootUsers = loadLocalUsers();
    this.users = new Map(bootUsers.map((user) => [user.id, user]));
    this.menus = new Map();
    this.tables = new Map();
    this.historical = [];
    this.sharedState = loadSharedState();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashed = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const user: User = { ...insertUser, id, password: hashed };
    this.users.set(id, user);
    saveLocalUsers(Array.from(this.users.values()));
    return user;
  }

  async verifyUserCredentials(
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  }

  async listMenus(): Promise<Menu[]> {
    return Array.from(this.menus.values());
  }

  async createMenu(menu: InsertMenu): Promise<Menu> {
    const id = randomUUID();
    const menuRow: Menu = { ...menu, id, isActive: menu.isActive ?? true };
    this.menus.set(id, menuRow);
    return menuRow;
  }

  async updateMenu(id: string, updates: Partial<InsertMenu>): Promise<Menu | null> {
    const existing = this.menus.get(id);
    if (!existing) return null;
    const next = { ...existing, ...updates };
    this.menus.set(id, next);
    return next;
  }

  async deleteMenu(id: string): Promise<boolean> {
    return this.menus.delete(id);
  }

  async listTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async upsertTable(table: InsertTable): Promise<Table> {
    // tables are keyed by id if provided, otherwise by number
    const existing =
      (table as Table).id &&
      this.tables.get((table as Table).id as string) ||
      Array.from(this.tables.values()).find((t) => t.number === table.number);

    const id = existing?.id || randomUUID();
    const next: Table = { ...existing, ...table, id } as Table;
    this.tables.set(id, next);
    return next;
  }

  async logHistorical(entry: InsertHistoricalService): Promise<HistoricalService> {
    const row: HistoricalService = {
      ...entry,
      id: (entry as HistoricalService).id ?? randomUUID(),
    } as HistoricalService;
    this.historical.push(row);
    return row;
  }

  async listHistorical(): Promise<HistoricalService[]> {
    return this.historical;
  }

  async getSharedState(): Promise<SharedState> {
    return this.sharedState;
  }

  async updateSharedState(patch: Partial<SharedState>): Promise<SharedState> {
    this.sharedState = {
      tables: Array.isArray(patch.tables) ? patch.tables : this.sharedState.tables,
      menus: Array.isArray(patch.menus) ? patch.menus : this.sharedState.menus,
      historicalLogs: Array.isArray(patch.historicalLogs)
        ? patch.historicalLogs
        : this.sharedState.historicalLogs,
    };
    saveSharedState(this.sharedState);
    return this.sharedState;
  }
}

export class PostgresStorage implements IStorage {
  private db;
  private readonly stateKey = "global";

  constructor(pool: Pool) {
    this.db = drizzle(pool, { schema });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const parsed = insertUserSchema.parse(insertUser);
    const hashed = await bcrypt.hash(parsed.password, SALT_ROUNDS);
    const [user] = await this.db
      .insert(users)
      .values({ ...parsed, password: hashed })
      .returning();
    return user;
  }

  async verifyUserCredentials(
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  }

  async listMenus(): Promise<Menu[]> {
    return this.db.select().from(menus);
  }

  async createMenu(menu: InsertMenu): Promise<Menu> {
    const [row] = await this.db.insert(menus).values(menu).returning();
    return row;
  }

  async updateMenu(id: string, updates: Partial<InsertMenu>): Promise<Menu | null> {
    const [row] = await this.db
      .update(menus)
      .set({ ...updates })
      .where(eq(menus.id, id))
      .returning();
    return row ?? null;
  }

  async deleteMenu(id: string): Promise<boolean> {
    const res = await this.db.delete(menus).where(eq(menus.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  async listTables(): Promise<Table[]> {
    return this.db.select().from(tables);
  }

  async upsertTable(tableData: InsertTable): Promise<Table> {
    // Upsert by table number to keep ids stable per mesa
    const existing = await this.db.query.tables.findFirst({
      where: eq(tables.number, tableData.number),
    });

    if (existing) {
      const [row] = await this.db
        .update(tables)
        .set({ ...tableData, updatedAt: new Date() })
        .where(eq(tables.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await this.db
      .insert(tables)
      .values({ ...tableData, updatedAt: new Date() })
      .returning();
    return row;
  }

  async logHistorical(entry: InsertHistoricalService): Promise<HistoricalService> {
    const [row] = await this.db
      .insert(historicalServices)
      .values(entry)
      .returning();
    return row;
  }

  async listHistorical(): Promise<HistoricalService[]> {
    return this.db.select().from(historicalServices);
  }

  async getSharedState(): Promise<SharedState> {
    try {
      const row = await this.db.query.appState.findFirst({
        where: eq(appState.key, this.stateKey),
      });

      if (!row) {
        const [created] = await this.db
          .insert(appState)
          .values({
            key: this.stateKey,
            tables: defaultSharedState.tables,
            menus: defaultSharedState.menus,
            historicalLogs: defaultSharedState.historicalLogs,
            updatedAt: new Date(),
          })
          .returning();
        return {
          tables: created.tables ?? [],
          menus: created.menus ?? [],
          historicalLogs: created.historicalLogs ?? [],
        };
      }

      return {
        tables: row.tables ?? [],
        menus: row.menus ?? [],
        historicalLogs: row.historicalLogs ?? [],
      };
    } catch (err: any) {
      if (err?.code === "42P01") {
        throw new Error("Tabela app_state não encontrada. Execute as migrations antes de iniciar o servidor.");
      }
      throw err;
    }
  }

  async updateSharedState(patch: Partial<SharedState>): Promise<SharedState> {
    const current = await this.getSharedState();
    const next: SharedState = {
      tables: Array.isArray(patch.tables) ? patch.tables : current.tables,
      menus: Array.isArray(patch.menus) ? patch.menus : current.menus,
      historicalLogs: Array.isArray(patch.historicalLogs)
        ? patch.historicalLogs
        : current.historicalLogs,
    };

    try {
      const [row] = await this.db
        .insert(appState)
        .values({
          key: this.stateKey,
          tables: next.tables,
          menus: next.menus,
          historicalLogs: next.historicalLogs,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: appState.key,
          set: {
            tables: next.tables,
            menus: next.menus,
            historicalLogs: next.historicalLogs,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        tables: row.tables ?? [],
        menus: row.menus ?? [],
        historicalLogs: row.historicalLogs ?? [],
      };
    } catch (err: any) {
      if (err?.code === "42P01") {
        throw new Error("Tabela app_state não encontrada. Execute as migrations antes de iniciar o servidor.");
      }
      throw err;
    }
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL obrigatório: persistência em memória foi desativada para proteger dados de produção.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const storage: IStorage = new PostgresStorage(pool);

export async function ensureAdminUser(
  username: string,
  password: string,
  role: "admin" | "sala" | "cozinha" = "admin",
) {
  const existing = await storage.getUserByUsername(username);
  if (existing) return existing;
  return storage.createUser({ username, password, role });
}
