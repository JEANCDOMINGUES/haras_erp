import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

export async function getCavalosByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cavalos)
    .where(eq(cavalos.harasId, harasId))
    .orderBy(desc(cavalos.dataRegistro));
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

export async function getBaiasByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(baias)
    .where(eq(baias.harasId, harasId))
    .orderBy(baias.numero);
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

export async function getCoberturasByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(coberturas)
    .where(eq(coberturas.harasId, harasId))
    .orderBy(desc(coberturas.dataAgendamento));
}

export async function getCoberturasByEgea(egeaId: number) {
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

export async function createConsignacao(data: typeof consignacoes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(consignacoes).values(data);
}

export async function getConsignacoesByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(consignacoes)
    .where(eq(consignacoes.harasId, harasId))
    .orderBy(desc(consignacoes.dataInicio));
}

export async function getConsignacaoById(id: number) {
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(leiloes).values(data);
}

export async function getLeiloesByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(leiloes)
    .where(eq(leiloes.harasId, harasId))
    .orderBy(desc(leiloes.dataEvento));
}

export async function getLeilaoById(id: number) {
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

export async function getProprietariosByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(proprietarios)
    .where(eq(proprietarios.harasId, harasId))
    .orderBy(proprietarios.nome);
}

export async function getProprietarioById(id: number) {
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

export async function getTransacoesByHaras(harasId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transacoes)
    .where(eq(transacoes.harasId, harasId))
    .orderBy(desc(transacoes.dataTransacao));
}

export async function getTransacoesByPeriodo(
  harasId: number,
  dataInicio: Date,
  dataFim: Date
) {
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
