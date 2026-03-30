import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createHaras,
  getHarasById,
  createCavalo,
  getCavalosByHaras,
  getCavaloById,
  updateCavalo,
  getBaiasByHaras,
  createBaia,
  updateBaia,
  getBaiaById,
  getCoberturasByHaras,
  createCobertura,
  updateCobertura,
  getConsignacoesByHaras,
  createConsignacao,
  getConsignacaoById,
  updateConsignacao,
  getLeiloesByHaras,
  createLeilao,
  getLeilaoById,
  updateLeilao,
  getLotesByLeilao,
  createLote,
  updateLote,
  getProprietariosByHaras,
  createProprietario,
  getProprietarioById,
  getTransacoesByHaras,
  createTransacao,
  getAlertasByUsuario,
  marcarAlertaComoLido,
} from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const CavaloSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  registroABCCMM: z.string().optional(),
  raca: z.enum([
    "Mangalarga Marchador",
    "Mangalarga",
    "Quarto de Milha",
    "Puro Sangue Inglês",
    "Árabe",
    "Outro",
  ]),
  sexo: z.enum(["macho", "fêmea"]),
  dataNascimento: z.coerce.date().optional(),
  cor: z.string().optional(),
  microchip: z.string().optional(),
  status: z
    .enum(["ativo", "vendido", "falecido", "consignado", "aposentado"])
    .default("ativo"),
  genealogia: z.record(z.string(), z.any()).optional(),
  historicoMedico: z.record(z.string(), z.any()).optional(),
  fotos: z.array(z.string()).optional(),
  documentos: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
});

const BaiaSchema = z.object({
  numero: z.string().min(1, "Número é obrigatório"),
  tipo: z.enum(["individual", "coletiva", "maternidade", "isolamento"]),
  valorAluguel: z.coerce.string().optional(),
  condicoes: z.record(z.string(), z.any()).optional(),
});

const CoberturaSchema = z.object({
  tipo: z.enum(["cobracao_natural", "inseminacao_artificial", "embriao"]),
  egeaId: z.number(),
  cavaloId: z.number().optional(),
  dataAgendamento: z.coerce.date(),
  custoServico: z.coerce.string().optional(),
  observacoes: z.string().optional(),
});

const ProprietarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2).optional(),
});

const ConsignacaoSchema = z.object({
  cavaloId: z.number(),
  proprietarioId: z.number(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date().optional(),
  comissaoPercentual: z.coerce.string(),
  contrato: z.string().optional(),
  observacoes: z.string().optional(),
});

const LeilaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  dataEvento: z.coerce.date(),
  descricao: z.string().optional(),
  regulamento: z.string().optional(),
});

const LoteSchema = z.object({
  numero: z.number(),
  cavaloId: z.number(),
  lanceInicial: z.coerce.string(),
  leilaoId: z.number(),
});

// ============================================================================
// PROCEDURES AUXILIARES
// ============================================================================

// Validar que o usuário pertence ao haras
async function validarHarasAccess(userId: number, harasId: number) {
  // TODO: Implementar validação de acesso ao haras
  // Por enquanto, permitir acesso para MVP
  return true;
}

// ============================================================================
// ROUTERS
// ============================================================================

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ========================================================================
  // HARAS ROUTERS
  // ========================================================================

  haras: router({
    create: protectedProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          cnpj: z.string().optional(),
          endereco: z.string().optional(),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          website: z.string().optional(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const result = await createHaras({
          ...input,
          ativo: true,
        });

        return { success: true, id: (result as any).insertId };
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getHarasById(input);
      }),
  }),

  // ========================================================================
  // CAVALOS ROUTERS
  // ========================================================================

  cavalos: router({
    create: protectedProcedure
      .input(CavaloSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.harasId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não associado a um haras",
          });
        }

        const result = await createCavalo({
          ...input,
          harasId: ctx.user.harasId,
          dataNascimento: input.dataNascimento || undefined,
        });

        return { success: true, id: (result as any).insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.harasId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não associado a um haras",
        });
      }

      return await getCavalosByHaras(ctx.user.harasId);
    }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const cavalo = await getCavaloById(input);

        if (!cavalo || cavalo.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return cavalo;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: CavaloSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const cavalo = await getCavaloById(input.id);

        if (!cavalo || cavalo.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await updateCavalo(input.id, input.data);
        return { success: true };
      }),
  }),

  // ========================================================================
  // BAIAS ROUTERS
  // ========================================================================

  baias: router({
    create: protectedProcedure
      .input(BaiaSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.harasId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não associado a um haras",
          });
        }

        const result = await createBaia({
          ...input,
          harasId: ctx.user.harasId,
          status: "disponivel",
          valorAluguel: input.valorAluguel ? String(input.valorAluguel) : undefined,
        } as any);

        return { success: true, id: (result as any).insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.harasId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não associado a um haras",
        });
      }

      return await getBaiasByHaras(ctx.user.harasId);
    }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const baia = await getBaiaById(input);

        if (!baia || baia.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return baia;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: BaiaSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const baia = await getBaiaById(input.id);

        if (!baia || baia.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await updateBaia(input.id, input.data);
        return { success: true };
      }),
  }),

  // ========================================================================
  // COBERTURAS ROUTERS
  // ========================================================================

  coberturas: router({
    create: protectedProcedure
      .input(CoberturaSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.harasId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não associado a um haras",
          });
        }

        const result = await createCobertura({
          ...input,
          harasId: ctx.user.harasId,
          status: "agendada",
          custoServico: input.custoServico ? String(input.custoServico) : undefined,
        } as any);

        return { success: true, id: (result as any).insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.harasId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não associado a um haras",
        });
      }

      return await getCoberturasByHaras(ctx.user.harasId);
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z
            .enum(["agendada", "realizada", "cancelada", "sucesso", "falha"])
            .optional(),
          resultado: z.record(z.string(), z.any()).optional(),
          dataRealizacao: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCobertura(id, data as any);
        return { success: true };
      }),
  }),

  // ========================================================================
  // PROPRIETÁRIOS ROUTERS
  // ========================================================================

  proprietarios: router({
    create: protectedProcedure
      .input(ProprietarioSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.harasId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não associado a um haras",
          });
        }

        const result = await createProprietario({
          ...input,
          harasId: ctx.user.harasId,
          ativo: true,
        });

        return { success: true, id: (result as any).insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.harasId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não associado a um haras",
        });
      }

      return await getProprietariosByHaras(ctx.user.harasId);
    }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const proprietario = await getProprietarioById(input);

        if (!proprietario || proprietario.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return proprietario;
      }),
  }),

  // ========================================================================
  // CONSIGNAÇÕES ROUTERS
  // ========================================================================

  consignacoes: router({
    create: protectedProcedure
      .input(ConsignacaoSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.harasId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não associado a um haras",
          });
        }

        const result = await createConsignacao({
          ...input,
          harasId: ctx.user.harasId,
          statusVenda: "disponivel",
          comissaoPaga: false,
          comissaoPercentual: String(input.comissaoPercentual),
        } as any);

        return { success: true, id: (result as any).insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.harasId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não associado a um haras",
        });
      }

      return await getConsignacoesByHaras(ctx.user.harasId);
    }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const consignacao = await getConsignacaoById(input);

        if (!consignacao || consignacao.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return consignacao;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            cavaloId: z.number().optional(),
            proprietarioId: z.number().optional(),
            dataInicio: z.date().optional(),
            dataFim: z.date().optional(),
            comissaoPercentual: z.coerce.string().optional(),
            contrato: z.string().optional(),
            observacoes: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const consignacao = await getConsignacaoById(input.id);

        if (!consignacao || consignacao.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await updateConsignacao(input.id, input.data as any);
        return { success: true };
      }),
  }),

  // ========================================================================
  // LEILÕES ROUTERS
  // ========================================================================

  leiloes: router({
    create: protectedProcedure
      .input(LeilaoSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.harasId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Usuário não associado a um haras",
          });
        }

        const result = await createLeilao({
          ...input,
          harasId: ctx.user.harasId,
          status: "planejado",
          totalLotes: 0,
          totalArrecadado: "0" as any,
        });

        return { success: true, id: (result as any).insertId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.harasId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Usuário não associado a um haras",
        });
      }

      return await getLeiloesByHaras(ctx.user.harasId);
    }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }) => {
        const leilao = await getLeilaoById(input);

        if (!leilao || leilao.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return leilao;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: LeilaoSchema.partial(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const leilao = await getLeilaoById(input.id);

        if (!leilao || leilao.harasId !== ctx.user.harasId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await updateLeilao(input.id, input.data);
        return { success: true };
      }),
  }),

  // ========================================================================
  // LOTES ROUTERS
  // ========================================================================

  lotes: router({
    create: protectedProcedure
      .input(
        z.object({
          leilaoId: z.number(),
          numero: z.number(),
          cavaloId: z.number(),
          lanceInicial: z.string().or(z.number()).transform(v => String(v)),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await createLote({
          ...input,
          status: "disponivel",
          lanceInicial: input.lanceInicial,
        });

        return { success: true, id: (result as any).insertId };
      }),

    listByLeilao: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getLotesByLeilao(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            numero: z.number().optional(),
            cavaloId: z.number().optional(),
            lanceInicial: z.coerce.string().optional(),
            lanceFinal: z.coerce.string().optional(),
            status: z.enum(["disponivel", "vendido", "retirado"]).optional(),
            comprador: z.string().optional(),
            dataVenda: z.date().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateLote(input.id, input.data as any);
        return { success: true };
      }),
  }),

  // ========================================================================
  // ALERTAS ROUTERS
  // ========================================================================

  alertas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getAlertasByUsuario(ctx.user.id);
    }),

    marcarComoLido: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await marcarAlertaComoLido(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
