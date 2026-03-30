# Haras MAJ - Desenvolvimento Local

## ✅ Correções Aplicadas

1. **Removido plugin incompatível** - `vite-plugin-jsx-loc` não funciona com Vite 7
2. **Implementado modo de desenvolvimento (DEV_MODE)** - Permite rodar sem OAuth

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- MySQL 8+ (ou usar modo dev sem banco)

### Passos

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Rodar o servidor em modo desenvolvimento
npm run dev
```

### Configuração do .env

O arquivo `.env` já está configurado com:

```env
DEV_MODE=true
DEV_USER_ID=dev-user-1
DEV_USER_NAME=Dev User
DEV_USER_ROLE=admin
```

Para personalizar o usuário de desenvolvimento, edite estas variáveis no `.env`.

## 📁 Arquivos Modificados

| Arquivo                   | Mudança                        |
| ------------------------- | ------------------------------ |
| `vite.config.ts`          | Removido plugin incompatível   |
| `server/_core/env.ts`     | Adicionadas variáveis DEV_MODE |
| `server/_core/context.ts` | Mock user em modo dev          |
| `server/_core/devAuth.ts` | Novo endpoint `/api/dev/login` |
| `server/_core/index.ts`   | Registro de rotas dev          |
| `server/routers.ts`       | Adicionado `auth.devStatus`    |
| `client/src/const.ts`     | Detecção de modo dev           |
| `.env`                    | Variáveis de desenvolvimento   |
| `client/.env`             | Variáveis VITE para cliente    |

## 🔐 Autenticação

Em modo `DEV_MODE=true`:

- O usuário é autenticado automaticamente como "Dev User" com role `admin`
- O botão de login redireciona para `/api/dev/login`
- Não é necessário banco de dados para autenticação

## 🗄️ Banco de Dados

O sistema funciona **sem banco de dados** em modo dev para queries básicas.
Para funcionalidades completas, configure:

```env
DATABASE_URL="mysql://user:password@localhost:3306/haras_maj"
```

Crie o banco:

```sql
CREATE DATABASE haras_maj;
```

Execute migrações:

```bash
npm run db:push
```

## 📝 Notas

- O modo dev **bypassa** toda autenticação OAuth
- Todas as APIs protegidas retornam o usuário mock
- Para produção, remova `DEV_MODE=true` e configure OAuth corretamente
