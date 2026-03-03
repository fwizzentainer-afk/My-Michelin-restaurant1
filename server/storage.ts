import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";
import {
  users,
  menus,
  tables,
  historicalServices,
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
  listUsers(): Promise<User[]>;
  updateUser(
    id: string,
    updates: Partial<InsertUser> & { password?: string },
  ): Promise<User | null>;

  listMenus(): Promise<Menu[]>;
  createMenu(menu: InsertMenu): Promise<Menu>;
  updateMenu(id: string, updates: Partial<InsertMenu>): Promise<Menu | null>;
  deleteMenu(id: string): Promise<boolean>;

  listTables(): Promise<Table[]>;
  upsertTable(table: InsertTable): Promise<Table>;

  logHistorical(entry: InsertHistoricalService): Promise<HistoricalService>;
  listHistorical(): Promise<HistoricalService[]>;
}

const SALT_ROUNDS = 10;

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private menus: Map<string, Menu>;
  private tables: Map<string, Table>;
  private historical: HistoricalService[];

  constructor() {
    this.users = new Map();
    this.menus = new Map();
    this.tables = new Map();
    this.historical = [];
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

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(
    id: string,
    updates: Partial<InsertUser> & { password?: string },
  ): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const next: User = { ...existing, ...updates };
    if (updates.password) {
      next.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }
    this.users.set(id, next);
    return next;
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
}

export class PostgresStorage implements IStorage {
  private pool: Pool;
  private db;

  constructor(pool: Pool) {
    this.pool = pool;
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

  async listUsers(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async updateUser(
    id: string,
    updates: Partial<InsertUser> & { password?: string },
  ): Promise<User | null> {
    const nextUpdates: Partial<InsertUser> & { password?: string } = {
      ...updates,
    };
    if (updates.password) {
      nextUpdates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    const [row] = await this.db
      .update(users)
      .set(nextUpdates)
      .where(eq(users.id, id))
      .returning();
    return row ?? null;
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
}

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : undefined;

export const storage: IStorage = pool
  ? new PostgresStorage(pool)
  : new MemStorage();

export async function ensureAdminUser(
  username: string,
  password: string,
  role: "admin" | "sala" | "cozinha" = "admin",
) {
  const existing = await storage.getUserByUsername(username);
  if (existing) return existing;
  return storage.createUser({ username, password, role });
}
