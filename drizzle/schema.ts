import {
  serial,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "funcionario", "cliente"]);
export const racaEnum = pgEnum("raca", [
  "Mangalarga Marchador",
  "Mangalarga",
  "Quarto de Milha",
  "Puro Sangue Inglês",
  "Árabe",
  "Outro",
]);
export const sexoEnum = pgEnum("sexo", ["macho", "fêmea"]);
export const cavaloStatusEnum = pgEnum("cavalo_status", [
  "ativo",
  "vendido",
  "falecido",
  "consignado",
  "aposentado",
]);
export const baiaTipoEnum = pgEnum("baia_tipo", [
  "individual",
  "coletiva",
  "maternidade",
  "isolamento",
]);
export const baiaStatusEnum = pgEnum("baia_status", [
  "disponivel",
  "ocupada",
  "manutencao",
]);
export const coberturaTipoEnum = pgEnum("cobertura_tipo", [
  "cobracao_natural",
  "inseminacao_artificial",
  "embriao",
]);
export const coberturaStatusEnum = pgEnum("cobertura_status", [
  "agendada",
  "realizada",
  "cancelada",
  "sucesso",
  "falha",
]);
export const consignacaoStatusEnum = pgEnum("consignacao_status", [
  "disponivel",
  "vendido",
  "devolvido",
]);
export const LeilaoStatusEnum = pgEnum("leilao_status", [
  "planejado",
  "em_andamento",
  "encerrado",
]);
export const loteStatusEnum = pgEnum("lote_status", [
  "disponivel",
  "vendido",
  "retirado",
]);
export const transacaoTipoEnum = pgEnum("transacao_tipo", [
  "venda",
  "aluguel",
  "comissao",
  "despesa",
  "outro",
]);
export const transacaoStatusEnum = pgEnum("transacao_status", [
  "pendente",
  "confirmada",
  "cancelada",
]);
export const alertaTipoEnum = pgEnum("alerta_tipo", [
  "vencimento_aluguel",
  "resultado_cobracao",
  "data_leilao",
  "atualizacao_consignado",
  "comissao_pagar",
  "outro",
]);
export const sincronizacaoStatusEnum = pgEnum("sincronizacao_status", [
  "sucesso",
  "falha",
  "pendente",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: roleEnum().default("cliente").notNull(),
    harasId: integer("harasId"),
    ativo: boolean("ativo").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => ({
    openIdIdx: index("idx_users_openid").on(table.openId),
    harasIdIdx: index("idx_users_haras").on(table.harasId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const haras = pgTable(
  "haras",
  {
    id: serial("id").primaryKey(),
    nome: varchar("nome", { length: 255 }).notNull(),
    cnpj: varchar("cnpj", { length: 18 }).unique(),
    endereco: text("endereco"),
    telefone: varchar("telefone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    website: varchar("website", { length: 255 }),
    logo: varchar("logo", { length: 500 }),
    descricao: text("descricao"),
    ativo: boolean("ativo").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    cnpjIdx: index("idx_haras_cnpj").on(table.cnpj),
  })
);

export type Haras = typeof haras.$inferSelect;
export type InsertHaras = typeof haras.$inferInsert;

export const proprietarios = pgTable(
  "proprietarios",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    cpfCnpj: varchar("cpfCnpj", { length: 18 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    telefone: varchar("telefone", { length: 20 }),
    endereco: text("endereco"),
    cidade: varchar("cidade", { length: 100 }),
    estado: varchar("estado", { length: 2 }),
    ativo: boolean("ativo").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_proprietarios_haras").on(table.harasId),
    cpfCnpjIdx: index("idx_proprietarios_cpf").on(table.cpfCnpj),
  })
);

export type Proprietario = typeof proprietarios.$inferSelect;
export type InsertProprietario = typeof proprietarios.$inferInsert;

export const cavalos = pgTable(
  "cavalos",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    registroABCCMM: varchar("registroABCCMM", { length: 50 }).unique(),
    raca: racaEnum().notNull(),
    sexo: sexoEnum().notNull(),
    dataNascimento: timestamp("dataNascimento"),
    cor: varchar("cor", { length: 100 }),
    microchip: varchar("microchip", { length: 50 }).unique(),
    status: cavaloStatusEnum().default("ativo").notNull(),
    proprietarioId: integer("proprietarioId"),
    genealogia: json("genealogia"),
    historicoMedico: json("historicoMedico"),
    fotos: json("fotos"),
    documentos: json("documentos"),
    observacoes: text("observacoes"),
    dataRegistro: timestamp("dataRegistro").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_cavalos_haras").on(table.harasId),
    harasStatusIdx: index("idx_cavalos_haras_status").on(
      table.harasId,
      table.status
    ),
    registroIdx: index("idx_cavalos_registro").on(table.registroABCCMM),
    microchipIdx: index("idx_cavalos_microchip").on(table.microchip),
    proprietarioIdx: index("idx_cavalos_proprietario").on(table.proprietarioId),
    dataRegistroIdx: index("idx_cavalos_data_registro").on(table.dataRegistro),
  })
);

export type Cavalo = typeof cavalos.$inferSelect;
export type InsertCavalo = typeof cavalos.$inferInsert;

export const baias = pgTable(
  "baias",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    numero: varchar("numero", { length: 50 }).notNull(),
    tipo: baiaTipoEnum().notNull(),
    status: baiaStatusEnum().default("disponivel").notNull(),
    cavaloId: integer("cavaloId"),
    dataOcupacao: timestamp("dataOcupacao"),
    dataLiberacao: timestamp("dataLiberacao"),
    valorAluguel: decimal("valorAluguel", { precision: 10, scale: 2 }).default(
      "0"
    ),
    ultimoAluguel: timestamp("ultimoAluguel"),
    condicoes: json("condicoes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_baias_haras").on(table.harasId),
    harasStatusIdx: index("idx_baias_haras_status").on(
      table.harasId,
      table.status
    ),
    cavaloIdIdx: index("idx_baias_cavalo").on(table.cavaloId),
  })
);

export type Baia = typeof baias.$inferSelect;
export type InsertBaia = typeof baias.$inferInsert;

export const coberturas = pgTable(
  "coberturas",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    tipo: coberturaTipoEnum().notNull(),
    egeaId: integer("egeaId").notNull(),
    cavaloId: integer("cavaloId"),
    dataAgendamento: timestamp("dataAgendamento").notNull(),
    dataRealizacao: timestamp("dataRealizacao"),
    status: coberturaStatusEnum().default("agendada").notNull(),
    resultado: json("resultado"),
    custoServico: decimal("custoServico", { precision: 10, scale: 2 }).default(
      "0"
    ),
    observacoes: text("observacoes"),
    dataVencimento: timestamp("dataVencimento"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_coberturas_haras").on(table.harasId),
    egeaIdIdx: index("idx_coberturas_egea").on(table.egeaId),
    cavaloIdIdx: index("idx_coberturas_cavalo").on(table.cavaloId),
    dataAgendamentoIdx: index("idx_coberturas_data").on(table.dataAgendamento),
  })
);

export type Cobertura = typeof coberturas.$inferSelect;
export type InsertCobertura = typeof coberturas.$inferInsert;

export const consignacoes = pgTable(
  "consignacoes",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    cavaloId: integer("cavaloId").notNull(),
    proprietarioId: integer("proprietarioId").notNull(),
    dataInicio: timestamp("dataInicio").notNull(),
    dataFim: timestamp("dataFim"),
    comissaoPercentual: decimal("comissaoPercentual", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"),
    statusVenda: consignacaoStatusEnum().default("disponivel").notNull(),
    dataPagamento: timestamp("dataPagamento"),
    valorVenda: decimal("valorVenda", { precision: 10, scale: 2 }).default("0"),
    comissaoPaga: boolean("comissaoPaga").default(false).notNull(),
    contrato: varchar("contrato", { length: 500 }),
    observacoes: text("observacoes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_consignacoes_haras").on(table.harasId),
    cavaloIdIdx: index("idx_consignacoes_cavalo").on(table.cavaloId),
    proprietarioIdIdx: index("idx_consignacoes_proprietario").on(
      table.proprietarioId
    ),
    statusVendaIdx: index("idx_consignacoes_status").on(table.statusVenda),
  })
);

export type Consignacao = typeof consignacoes.$inferSelect;
export type InsertConsignacao = typeof consignacoes.$inferInsert;

export const leiloes = pgTable(
  "leiloes",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    nome: varchar("nome", { length: 255 }).notNull(),
    dataEvento: timestamp("dataEvento").notNull(),
    status: LeilaoStatusEnum().default("planejado").notNull(),
    totalLotes: integer("totalLotes").default(0),
    totalArrecadado: decimal("totalArrecadado", {
      precision: 12,
      scale: 2,
    }).default("0"),
    descricao: text("descricao"),
    regulamento: varchar("regulamento", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_leiloes_haras").on(table.harasId),
    dataEventoIdx: index("idx_leiloes_data").on(table.dataEvento),
    statusIdx: index("idx_leiloes_status").on(table.status),
  })
);

export type Leilao = typeof leiloes.$inferSelect;
export type InsertLeilao = typeof leiloes.$inferInsert;

export const lotes = pgTable(
  "lotes",
  {
    id: serial("id").primaryKey(),
    leilaoId: integer("leilaoId").notNull(),
    numero: integer("numero").notNull(),
    cavaloId: integer("cavaloId").notNull(),
    lanceInicial: decimal("lanceInicial", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    lanceFinal: decimal("lanceFinal", { precision: 10, scale: 2 }).default("0"),
    status: loteStatusEnum().default("disponivel").notNull(),
    comprador: varchar("comprador", { length: 255 }),
    dataVenda: timestamp("dataVenda"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    leilaoIdIdx: index("idx_lotes_leilao").on(table.leilaoId),
    cavaloIdIdx: index("idx_lotes_cavalo").on(table.cavaloId),
    statusIdx: index("idx_lotes_status").on(table.status),
  })
);

export type Lote = typeof lotes.$inferSelect;
export type InsertLote = typeof lotes.$inferInsert;

export const transacoes = pgTable(
  "transacoes",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    tipo: transacaoTipoEnum().notNull(),
    referencia: varchar("referencia", { length: 100 }),
    referenciaTabela: varchar("referenciaTabela", { length: 50 }),
    valor: decimal("valor", { precision: 12, scale: 2 }).notNull().default("0"),
    dataTransacao: timestamp("dataTransacao").notNull(),
    status: transacaoStatusEnum().default("pendente").notNull(),
    descricao: text("descricao"),
    usuarioId: integer("usuarioId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    harasIdIdx: index("idx_transacoes_haras").on(table.harasId),
    dataTransacaoIdx: index("idx_transacoes_data").on(table.dataTransacao),
    tipoIdx: index("idx_transacoes_tipo").on(table.tipo),
    statusIdx: index("idx_transacoes_status").on(table.status),
  })
);

export type Transacao = typeof transacoes.$inferSelect;
export type InsertTransacao = typeof transacoes.$inferInsert;

export const alertas = pgTable(
  "alertas",
  {
    id: serial("id").primaryKey(),
    harasId: integer("harasId").notNull(),
    tipo: alertaTipoEnum().notNull(),
    usuarioId: integer("usuarioId").notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    mensagem: text("mensagem"),
    referencia: varchar("referencia", { length: 100 }),
    referenciaTabela: varchar("referenciaTabela", { length: 50 }),
    lido: boolean("lido").default(false).notNull(),
    dataEnvio: timestamp("dataEnvio").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    usuarioIdIdx: index("idx_alertas_usuario").on(table.usuarioId),
    lidoIdx: index("idx_alertas_lido").on(table.lido),
    harasIdIdx: index("idx_alertas_haras").on(table.harasId),
  })
);

export type Alerta = typeof alertas.$inferSelect;
export type InsertAlerta = typeof alertas.$inferInsert;

export const sincronizacaoABCCMM = pgTable(
  "sincronizacao_abccmm",
  {
    id: serial("id").primaryKey(),
    cavaloId: integer("cavaloId").notNull(),
    registroABCCMM: varchar("registroABCCMM", { length: 50 }),
    dadosGenealogia: json("dadosGenealogia"),
    statusSincronizacao: sincronizacaoStatusEnum()
      .default("pendente")
      .notNull(),
    ultimaSincronizacao: timestamp("ultimaSincronizacao"),
    proximaSincronizacao: timestamp("proximaSincronizacao"),
    erroMensagem: text("erroMensagem"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  table => ({
    cavaloIdIdx: index("idx_sinc_abccmm_cavalo").on(table.cavaloId),
    registroIdx: index("idx_sinc_abccmm_registro").on(table.registroABCCMM),
    statusIdx: index("idx_sinc_abccmm_status").on(table.statusSincronizacao),
  })
);

export type SincronizacaoABCCMM = typeof sincronizacaoABCCMM.$inferSelect;
export type InsertSincronizacaoABCCMM = typeof sincronizacaoABCCMM.$inferInsert;
