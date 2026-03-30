import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg, { Pool } from "pg";
import {
  InsertUser,
  users,
  haras,
  cavalos,
  baias,
  coberturas,
  consignacoes,
  leiloes,
  lotes,
  proprietarios,
  transacoes,
  alertas,
  sincronizacaoABCCMM,
} from "../drizzle/schema";
import { mockDb } from "../drizzle/mockData";
import { ENV } from "./_core/env";

const USE_MOCK = process.env.USE_MOCK === "true" || !process.env.DATABASE_URL;
let mockMode = USE_MOCK;

export function isMockMode(): boolean {
  return mockMode;
}

export function setMockMode(enabled: boolean): void {
  mockMode = enabled;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, "CONNECTION_ERROR", originalError);
    this.name = "ConnectionError";
  }
}

export class QueryError extends DatabaseError {
  constructor(
    message: string,
    public query?: string,
    originalError?: Error
  ) {
    super(message, "QUERY_ERROR", originalError);
    this.name = "QueryError";
  }
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[Database] ${operationName} - Tentativa ${attempt}/${maxRetries} falhou:`,
        error
      );

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new QueryError(
    `${operationName} falhou após ${maxRetries} tentativas`,
    operationName,
    lastError!
  );
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export interface AccessValidationResult {
  allowed: boolean;
  reason?: string;
}

export async function validarHarasAccess(
  usuarioId: number,
  harasId: number
): Promise<AccessValidationResult> {
  const db = await getDb();
  if (!db) {
    return { allowed: false, reason: "Database not available" };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, usuarioId))
      .limit(1);

    if (!user) {
      return { allowed: false, reason: "Usuário não encontrado" };
    }

    if (user.role === "admin") {
      return { allowed: true };
    }

    if (user.harasId !== harasId) {
      return { allowed: false, reason: "Acesso negado ao haras" };
    }

    if (!user.ativo) {
      return { allowed: false, reason: "Usuário inativo" };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[Database] Erro na validação de acesso:", error);
    return { allowed: false, reason: "Erro na validação de acesso" };
  }
}

export async function validarAcessoRecurso(
  usuarioId: number,
  recursoHarasId: number
): Promise<AccessValidationResult> {
  const db = await getDb();
  if (!db) {
    return { allowed: false, reason: "Database not available" };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, usuarioId))
      .limit(1);

    if (!user) {
      return { allowed: false, reason: "Usuário não encontrado" };
    }

    if (user.role === "admin") {
      return { allowed: true };
    }

    if (user.harasId !== recursoHarasId) {
      return { allowed: false, reason: "Acesso negado a este recurso" };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[Database] Erro na validação de acesso ao recurso:", error);
    return { allowed: false, reason: "Erro na validação de acesso" };
  }
}

let _pool: Pool | null = null;
let _db: any = null;

interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

function parseDatabaseUrl(url: string): PoolConfig | null {
  try {
    const match = url.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) return null;

    return {
      host: match[3],
      port: parseInt(match[4], 10),
      user: match[1],
      password: match[2],
      database: match[5],
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  } catch {
    return null;
  }
}

async function createPool(): Promise<Pool | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const config = parseDatabaseUrl(url);
  if (!config) {
    console.error("[Database] Invalid DATABASE_URL format");
    return null;
  }

  try {
    const pool = new pg.Pool(config);
    const client = await pool.connect();
    client.release();
    console.log("[Database] Pool de conexões estabelecido");
    return pool;
  } catch (error) {
    console.error("[Database] Falha ao criar pool:", error);
    return null;
  }
}

const mockDbWrapper = {
  select: () => ({
    from: (table: any) => ({
      where: () => Promise.resolve([]),
      orderBy: () => Promise.resolve([]),
      limit: () => ({ offset: () => Promise.resolve([]) }),
    }),
  }),
  insert: () => ({
    values: () => ({
      onDuplicateKeyUpdate: () => Promise.resolve({}),
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => Promise.resolve({}),
    }),
  }),
};

export async function getDb(): Promise<any> {
  if (mockMode) {
    console.log("[Database] Usando dados mock (USE_MOCK=true)");
    return mockDbWrapper;
  }

  if (!_pool) {
    _pool = await createPool();
  }

  if (_pool && !_db) {
    _db = drizzle(_pool as any);
  }

  return _db;
}

export async function closeDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
    console.log("[Database] Pool de conexões fechado");
  }
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (user.harasId !== undefined) {
      values.harasId = user.harasId;
      updateSet.harasId = user.harasId;
    }

    if (user.ativo !== undefined) {
      values.ativo = user.ativo;
      updateSet.ativo = user.ativo;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (mockMode) {
    return mockDb.users.find((u: any) => u.openId === openId) || undefined;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// HARAS QUERIES
// ============================================================================

export async function createHaras(data: typeof haras.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(haras).values(data);
  return result;
}

export async function getHarasById(id: number) {
  if (mockMode) {
    return mockDb.haras.find((h: any) => h.id === id) || undefined;
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(haras).where(eq(haras.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CAVALOS QUERIES
// ============================================================================

export async function createCavalo(data: typeof cavalos.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cavalos).values(data);
  return result;
}

export async function getCavaloById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(cavalos)
    .where(eq(cavalos.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCavalosByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof cavalos.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.cavalos.filter((c: any) => c.harasId === harasId);
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(cavalos)
      .where(eq(cavalos.harasId, harasId))
      .orderBy(desc(cavalos.dataRegistro))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(cavalos)
      .where(eq(cavalos.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getCavaloByRegistroABCCMM(registroABCCMM: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(cavalos)
    .where(eq(cavalos.registroABCCMM, registroABCCMM))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCavalo(
  id: number,
  data: Partial<typeof cavalos.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(cavalos).set(data).where(eq(cavalos.id, id));
}

// ============================================================================
// BAIAS QUERIES
// ============================================================================

export async function createBaia(data: typeof baias.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(baias).values(data);
}

export async function getBaiasByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof baias.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.baias.filter((b: any) => b.harasId === harasId);
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(baias)
      .where(eq(baias.harasId, harasId))
      .orderBy(baias.numero)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(baias)
      .where(eq(baias.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getBaiaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(baias).where(eq(baias.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBaia(
  id: number,
  data: Partial<typeof baias.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(baias).set(data).where(eq(baias.id, id));
}

// ============================================================================
// COBERTURAS QUERIES
// ============================================================================

export async function createCobertura(data: typeof coberturas.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(coberturas).values(data);
}

export async function getCoberturasByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof coberturas.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.coberturas.filter((c: any) => c.harasId === harasId);
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(coberturas)
      .where(eq(coberturas.harasId, harasId))
      .orderBy(desc(coberturas.dataAgendamento))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(coberturas)
      .where(eq(coberturas.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getCoberturasByEgea(egeaId: number) {
  if (mockMode) {
    return mockDb.coberturas
      .filter((c: any) => c.egeaId === egeaId)
      .sort(
        (a: any, b: any) =>
          b.dataAgendamento.getTime() - a.dataAgendamento.getTime()
      );
  }

  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(coberturas)
    .where(eq(coberturas.egeaId, egeaId))
    .orderBy(desc(coberturas.dataAgendamento));
}

export async function updateCobertura(
  id: number,
  data: Partial<typeof coberturas.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(coberturas).set(data).where(eq(coberturas.id, id));
}

// ============================================================================
// CONSIGNAÇÕES QUERIES
// ============================================================================

export async function createConsignacao(
  data: typeof consignacoes.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(consignacoes).values(data);
}

export async function getConsignacoesByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof consignacoes.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.consignacoes.filter(
      (c: any) => c.harasId === harasId
    );
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(consignacoes)
      .where(eq(consignacoes.harasId, harasId))
      .orderBy(desc(consignacoes.dataInicio))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(consignacoes)
      .where(eq(consignacoes.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getConsignacaoById(id: number) {
  if (mockMode) {
    return mockDb.consignacoes.find((c: any) => c.id === id) || undefined;
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(consignacoes)
    .where(eq(consignacoes.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateConsignacao(
  id: number,
  data: Partial<typeof consignacoes.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(consignacoes).set(data).where(eq(consignacoes.id, id));
}

// ============================================================================
// LEILÕES QUERIES
// ============================================================================

export async function createLeilao(data: typeof leiloes.$inferInsert) {
  if (mockMode) {
    console.log("[Database] Mock createLeilao:", data);
    return { id: Math.floor(Math.random() * 1000) };
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(leiloes).values(data);
}

export async function getLeiloesByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof leiloes.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.leiloes.filter((l: any) => l.harasId === harasId);
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(leiloes)
      .where(eq(leiloes.harasId, harasId))
      .orderBy(desc(leiloes.dataEvento))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(leiloes)
      .where(eq(leiloes.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getLeilaoById(id: number) {
  if (mockMode) {
    return mockDb.leiloes.find((l: any) => l.id === id) || undefined;
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(leiloes)
    .where(eq(leiloes.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLeilao(
  id: number,
  data: Partial<typeof leiloes.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(leiloes).set(data).where(eq(leiloes.id, id));
}

// ============================================================================
// LOTES QUERIES
// ============================================================================

export async function createLote(data: typeof lotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(lotes).values(data);
}

export async function getLotesByLeilao(leilaoId: number) {
  if (mockMode) {
    return mockDb.lotes
      .filter((l: any) => l.leilaoId === leilaoId)
      .sort((a: any, b: any) => a.numero - b.numero);
  }

  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(lotes)
    .where(eq(lotes.leilaoId, leilaoId))
    .orderBy(lotes.numero);
}

export async function updateLote(
  id: number,
  data: Partial<typeof lotes.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(lotes).set(data).where(eq(lotes.id, id));
}

// ============================================================================
// PROPRIETÁRIOS QUERIES
// ============================================================================

export async function createProprietario(
  data: typeof proprietarios.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(proprietarios).values(data);
}

export async function getProprietariosByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof proprietarios.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.proprietarios.filter(
      (p: any) => p.harasId === harasId
    );
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(proprietarios)
      .where(eq(proprietarios.harasId, harasId))
      .orderBy(proprietarios.nome)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(proprietarios)
      .where(eq(proprietarios.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getProprietarioById(id: number) {
  if (mockMode) {
    return mockDb.proprietarios.find((p: any) => p.id === id) || undefined;
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(proprietarios)
    .where(eq(proprietarios.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// TRANSAÇÕES QUERIES
// ============================================================================

export async function createTransacao(data: typeof transacoes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(transacoes).values(data);
}

export async function getTransacoesByHaras(
  harasId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<typeof transacoes.$inferSelect>> {
  if (mockMode) {
    const { page, limit, offset } = getPaginationParams(pagination || {});
    const filtered = mockDb.transacoes.filter(
      (t: any) => t.harasId === harasId
    );
    const total = filtered.length;
    return {
      data: filtered.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  const { page, limit, offset } = getPaginationParams(pagination || {});

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(transacoes)
      .where(eq(transacoes.harasId, harasId))
      .orderBy(desc(transacoes.dataTransacao))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(transacoes)
      .where(eq(transacoes.harasId, harasId)),
  ]);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getTransacoesByPeriodo(
  harasId: number,
  dataInicio: Date,
  dataFim: Date
) {
  if (mockMode) {
    return mockDb.transacoes
      .filter(
        (t: any) =>
          t.harasId === harasId &&
          t.dataTransacao >= dataInicio &&
          t.dataTransacao <= dataFim
      )
      .sort(
        (a: any, b: any) => b.dataTransacao.getTime() - a.dataTransacao.getTime()
      );
  }

  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transacoes)
    .where(
      and(
        eq(transacoes.harasId, harasId),
        // @ts-ignore
        transacoes.dataTransacao.gte(dataInicio),
        // @ts-ignore
        transacoes.dataTransacao.lte(dataFim)
      )
    )
    .orderBy(desc(transacoes.dataTransacao));
}

// ============================================================================
// ALERTAS QUERIES
// ============================================================================

export async function createAlerta(data: typeof alertas.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(alertas).values(data);
}

export async function getAlertasByUsuario(usuarioId: number) {
  if (mockMode) {
    return mockDb.alertas.filter((a: any) => a.usuarioId === usuarioId);
  }

  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(alertas)
    .where(eq(alertas.usuarioId, usuarioId))
    .orderBy(desc(alertas.dataEnvio));
}

export async function marcarAlertaComoLido(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(alertas).set({ lido: true }).where(eq(alertas.id, id));
}

// ============================================================================
// SINCRONIZAÇÃO ABCCMM QUERIES
// ============================================================================

export async function createSincronizacaoABCCMM(
  data: typeof sincronizacaoABCCMM.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(sincronizacaoABCCMM).values(data);
}

export async function getSincronizacaoByCavaloId(cavaloId: number) {
  if (mockMode) {
    // Retorna um status fixo para mock
    return {
      id: 1,
      cavaloId,
      status: "sucesso",
      ultimaSincronizacao: new Date(),
      detalhes: { modo: "mock" },
    };
  }

  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(sincronizacaoABCCMM)
    .where(eq(sincronizacaoABCCMM.cavaloId, cavaloId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSincronizacaoABCCMM(
  id: number,
  data: Partial<typeof sincronizacaoABCCMM.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(sincronizacaoABCCMM)
    .set(data)
    .where(eq(sincronizacaoABCCMM.id, id));
}
