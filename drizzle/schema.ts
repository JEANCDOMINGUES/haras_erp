import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  datetime,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for Haras MAJ.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "funcionario", "cliente"]).default("cliente").notNull(),
  harasId: int("harasId"), // Referência ao haras (para multi-tenancy)
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Haras (Multi-tenancy)
 * Representa cada haras no sistema
 */
export const haras = mysqlTable("haras", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).unique(),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  logo: varchar("logo", { length: 500 }), // URL S3
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Haras = typeof haras.$inferSelect;
export type InsertHaras = typeof haras.$inferInsert;

/**
 * Proprietários (para cavalos consignados)
 * Pessoas/empresas que consignam cavalos
 */
export const proprietarios = mysqlTable("proprietarios", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 18 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proprietario = typeof proprietarios.$inferSelect;
export type InsertProprietario = typeof proprietarios.$inferInsert;

/**
 * Cavalos
 * Entidade principal: cada cavalo no sistema
 */
export const cavalos = mysqlTable("cavalos", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  registroABCCMM: varchar("registroABCCMM", { length: 50 }).unique(),
  raca: mysqlEnum("raca", [
    "Mangalarga Marchador",
    "Mangalarga",
    "Quarto de Milha",
    "Puro Sangue Inglês",
    "Árabe",
    "Outro",
  ]).notNull(),
  sexo: mysqlEnum("sexo", ["macho", "fêmea"]).notNull(),
  dataNascimento: datetime("dataNascimento"),
  cor: varchar("cor", { length: 100 }),
  microchip: varchar("microchip", { length: 50 }).unique(),
  status: mysqlEnum("status", [
    "ativo",
    "vendido",
    "falecido",
    "consignado",
    "aposentado",
  ])
    .default("ativo")
    .notNull(),
  proprietarioId: int("proprietarioId"), // Se consignado
  genealogia: json("genealogia"), // Dados da ABCCMM
  historicoMedico: json("historicoMedico"), // Vacinações, tratamentos
  fotos: json("fotos"), // Array de URLs S3
  documentos: json("documentos"), // Array de URLs S3
  observacoes: text("observacoes"),
  dataRegistro: timestamp("dataRegistro").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cavalo = typeof cavalos.$inferSelect;
export type InsertCavalo = typeof cavalos.$inferInsert;

/**
 * Baias
 * Instalações de alojamento
 */
export const baias = mysqlTable("baias", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  numero: varchar("numero", { length: 50 }).notNull(),
  tipo: mysqlEnum("tipo", ["individual", "coletiva", "maternidade", "isolamento"]).notNull(),
  status: mysqlEnum("status", ["disponivel", "ocupada", "manutencao"]).default("disponivel").notNull(),
  cavaloId: int("cavaloId"), // Cavalo atualmente alojado
  dataOcupacao: datetime("dataOcupacao"),
  dataLiberacao: datetime("dataLiberacao"),
  valorAluguel: decimal("valorAluguel", { precision: 10, scale: 2 }).default("0"),
  ultimoAluguel: datetime("ultimoAluguel"),
  condicoes: json("condicoes"), // Tamanho, amenidades, etc
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Baia = typeof baias.$inferSelect;
export type InsertBaia = typeof baias.$inferInsert;

/**
 * Coberturas e Embriões
 * Rastreamento de reprodução
 */
export const coberturas = mysqlTable("coberturas", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  tipo: mysqlEnum("tipo", ["cobracao_natural", "inseminacao_artificial", "embriao"]).notNull(),
  egeaId: int("egeaId").notNull(), // Cavalo fêmea
  cavaloId: int("cavaloId"), // Cavalo macho (se cobrição)
  dataAgendamento: datetime("dataAgendamento").notNull(),
  dataRealizacao: datetime("dataRealizacao"),
  status: mysqlEnum("status", [
    "agendada",
    "realizada",
    "cancelada",
    "sucesso",
    "falha",
  ])
    .default("agendada")
    .notNull(),
  resultado: json("resultado"), // Gestação confirmada, etc
  custoServico: decimal("custoServico", { precision: 10, scale: 2 }).default("0"),
  observacoes: text("observacoes"),
  dataVencimento: datetime("dataVencimento"), // Para embriões
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cobertura = typeof coberturas.$inferSelect;
export type InsertCobertura = typeof coberturas.$inferInsert;

/**
 * Consignações
 * Cavalos de terceiros em regime de consignação
 */
export const consignacoes = mysqlTable("consignacoes", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  cavaloId: int("cavaloId").notNull(),
  proprietarioId: int("proprietarioId").notNull(),
  dataInicio: datetime("dataInicio").notNull(),
  dataFim: datetime("dataFim"),
  comissaoPercentual: decimal("comissaoPercentual", { precision: 5, scale: 2 }).notNull().default("0"),
  statusVenda: mysqlEnum("statusVenda", ["disponivel", "vendido", "devolvido"])
    .default("disponivel")
    .notNull(),
  dataPagamento: datetime("dataPagamento"),
  valorVenda: decimal("valorVenda", { precision: 10, scale: 2 }).default("0"),
  comissaoPaga: boolean("comissaoPaga").default(false).notNull(),
  contrato: varchar("contrato", { length: 500 }), // URL S3
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consignacao = typeof consignacoes.$inferSelect;
export type InsertConsignacao = typeof consignacoes.$inferInsert;

/**
 * Leilões
 * Eventos de leilão
 */
export const leiloes = mysqlTable("leiloes", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  dataEvento: datetime("dataEvento").notNull(),
  status: mysqlEnum("status", ["planejado", "em_andamento", "encerrado"])
    .default("planejado")
    .notNull(),
  totalLotes: int("totalLotes").default(0),
  totalArrecadado: decimal("totalArrecadado", { precision: 12, scale: 2 }).default("0"),
  descricao: text("descricao"),
  regulamento: varchar("regulamento", { length: 500 }), // URL S3
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Leilao = typeof leiloes.$inferSelect;
export type InsertLeilao = typeof leiloes.$inferInsert;

/**
 * Lotes de Leilão
 * Itens individuais em um leilão
 */
export const lotes = mysqlTable("lotes", {
  id: int("id").autoincrement().primaryKey(),
  leilaoId: int("leilaoId").notNull(),
  numero: int("numero").notNull(),
  cavaloId: int("cavaloId").notNull(),
  lanceInicial: decimal("lanceInicial", { precision: 10, scale: 2 }).notNull().default("0"),
  lanceFinal: decimal("lanceFinal", { precision: 10, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["disponivel", "vendido", "retirado"])
    .default("disponivel")
    .notNull(),
  comprador: varchar("comprador", { length: 255 }),
  dataVenda: datetime("dataVenda"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lote = typeof lotes.$inferSelect;
export type InsertLote = typeof lotes.$inferInsert;

/**
 * Transações Financeiras
 * Registro centralizado de todas as operações financeiras
 */
export const transacoes = mysqlTable("transacoes", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  tipo: mysqlEnum("tipo", ["venda", "aluguel", "comissao", "despesa", "outro"])
    .notNull(),
  referencia: varchar("referencia", { length: 100 }), // ID do cavalo, baia, leilão, etc
  referenciaTabela: varchar("referenciaTabela", { length: 50 }), // cavalos, baias, leiloes, etc
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull().default("0"),
  dataTransacao: datetime("dataTransacao").notNull(),
  status: mysqlEnum("status", ["pendente", "confirmada", "cancelada"])
    .default("pendente")
    .notNull(),
  descricao: text("descricao"),
  usuarioId: int("usuarioId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transacao = typeof transacoes.$inferSelect;
export type InsertTransacao = typeof transacoes.$inferInsert;

/**
 * Alertas e Notificações
 * Registro de alertas enviados aos usuários
 */
export const alertas = mysqlTable("alertas", {
  id: int("id").autoincrement().primaryKey(),
  harasId: int("harasId").notNull(),
  tipo: mysqlEnum("tipo", [
    "vencimento_aluguel",
    "resultado_cobracao",
    "data_leilao",
    "atualizacao_consignado",
    "comissao_pagar",
    "outro",
  ]).notNull(),
  usuarioId: int("usuarioId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem"),
  referencia: varchar("referencia", { length: 100 }), // ID relacionado
  referenciaTabela: varchar("referenciaTabela", { length: 50 }),
  lido: boolean("lido").default(false).notNull(),
  dataEnvio: timestamp("dataEnvio").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alerta = typeof alertas.$inferSelect;
export type InsertAlerta = typeof alertas.$inferInsert;

/**
 * Sincronização ABCCMM
 * Rastreamento de dados genealógicos sincronizados
 */
export const sincronizacaoABCCMM = mysqlTable("sincronizacao_abccmm", {
  id: int("id").autoincrement().primaryKey(),
  cavaloId: int("cavaloId").notNull(),
  registroABCCMM: varchar("registroABCCMM", { length: 50 }),
  dadosGenealogia: json("dadosGenealogia"),
  statusSincronizacao: mysqlEnum("statusSincronizacao", [
    "sucesso",
    "falha",
    "pendente",
  ])
    .default("pendente")
    .notNull(),
  ultimaSincronizacao: datetime("ultimaSincronizacao"),
  proximaSincronizacao: datetime("proximaSincronizacao"),
  erroMensagem: text("erroMensagem"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SincronizacaoABCCMM = typeof sincronizacaoABCCMM.$inferSelect;
export type InsertSincronizacaoABCCMM = typeof sincronizacaoABCCMM.$inferInsert;
