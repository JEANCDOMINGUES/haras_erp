# Proposta Técnica - Sistema de Gestão Haras MAJ

**Documento de Arquitetura e Especificação Técnica**  
**Data**: 29 de março de 2026  
**Versão**: 1.0  
**Autor**: Manus AI

---

## 1. Visão Geral

O Sistema de Gestão Haras MAJ é uma plataforma web integrada desenvolvida para gerenciar todas as operações de um haras especializado em cavalos da raça Mangalarga Marchador. O sistema centraliza a gestão de estoque (cavalos, baias, embriões), operações comerciais (vendas, aluguéis, leilões, consignações), dados genealógicos e controle financeiro em uma interface elegante e intuitiva.

### Objetivos Principais

O projeto visa alcançar os seguintes objetivos: (1) proporcionar controle centralizado e em tempo real de todas as operações do haras; (2) integrar dados genealógicos oficiais da ABCCMM para validação e rastreabilidade; (3) automatizar processos comerciais e administrativos; (4) gerar insights através de relatórios e analytics; (5) escalar para múltiplos clientes mantendo isolamento de dados e segurança; (6) oferecer experiência de usuário elegante e eficiente.

---

## 2. Stack Tecnológico

### Frontend
- **React 19**: Framework UI moderno com suporte a Server Components
- **Tailwind CSS 4**: Utility-first CSS com OKLCH colors
- **TypeScript**: Type safety end-to-end
- **shadcn/ui**: Componentes acessíveis e customizáveis
- **Recharts**: Visualizações de dados e gráficos
- **React Hook Form + Zod**: Validação de formulários robusta
- **Wouter**: Roteamento leve e eficiente
- **Framer Motion**: Animações suaves e micro-interações

### Backend
- **Node.js 22**: Runtime JavaScript server-side
- **Express 4**: Framework web minimalista
- **tRPC 11**: RPC type-safe com end-to-end type inference
- **Drizzle ORM**: Query builder type-safe com migrations
- **Puppeteer**: Web scraping para integração ABCCMM

### Banco de Dados
- **MySQL/TiDB**: Banco de dados relacional (fornecido pelo Manus)
- **Redis**: Cache distribuído (opcional, para otimizações futuras)

### Autenticação & Autorização
- **Manus OAuth**: Autenticação centralizada
- **JWT**: Session management com cookies seguros
- **Role-based Access Control (RBAC)**: Três níveis de acesso (admin, funcionário, cliente)

### Infraestrutura & DevOps
- **Manus Hosting**: Deployment automático com SSL
- **S3 Storage**: Armazenamento de arquivos (fotos, documentos, certificados)
- **Email Service**: Integração para alertas automáticos

---

## 3. Arquitetura de Dados

### Modelo de Entidades Principais

A arquitetura de dados foi estruturada em torno de sete entidades principais que representam os componentes centrais do negócio do haras.

#### 3.1 Cavalos (Horses)
Representa cada cavalo no sistema, com informações completas de identificação, genealogia e histórico.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| harasId | INT | Referência ao haras (multi-tenancy) |
| nome | VARCHAR | Nome do cavalo |
| registroABCCMM | VARCHAR | Número de registro genealógico |
| raca | ENUM | Raça (Mangalarga Marchador, etc) |
| sexo | ENUM | Sexo (macho, fêmea) |
| dataNascimento | TIMESTAMP | Data de nascimento |
| cor | VARCHAR | Cor/pelagem |
| microchip | VARCHAR | Identificação por microchip |
| status | ENUM | Ativo, vendido, falecido, consignado |
| genealogia | JSON | Dados genealógicos da ABCCMM |
| historicoMedico | JSON | Registros de saúde e vacinações |
| fotos | JSON | URLs de fotos no S3 |
| documentos | JSON | URLs de documentos (pedigree, certificados) |
| proprietarioId | INT | Referência ao proprietário (se consignado) |
| dataRegistro | TIMESTAMP | Data de entrada no sistema |
| dataAtualizacao | TIMESTAMP | Última atualização |

#### 3.2 Baias (Stalls)
Representa as instalações de alojamento com controle de ocupação e aluguel.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| harasId | INT | Referência ao haras |
| numero | VARCHAR | Número/identificação da baia |
| tipo | ENUM | Tipo (individual, coletiva, maternidade) |
| status | ENUM | Disponível, ocupada, manutenção |
| cavaloId | INT | Cavalo atualmente alojado (NULL se vazia) |
| dataOcupacao | TIMESTAMP | Quando foi ocupada |
| dataLiberacao | TIMESTAMP | Quando será liberada |
| valorAluguel | DECIMAL | Valor mensal de aluguel |
| ultimoAluguel | TIMESTAMP | Data do último pagamento |
| condicoes | JSON | Especificações (tamanho, amenidades) |

#### 3.3 Coberturas e Embriões (Breedings & Embryos)
Gerencia eventos de reprodução e rastreamento de embriões.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| harasId | INT | Referência ao haras |
| tipo | ENUM | Cobrição natural, IA, embrião |
| egeaId | INT | Cavalo fêmea |
| cavaloId | INT | Cavalo macho (se cobrição) |
| dataAgendamento | TIMESTAMP | Data planejada |
| dataRealizacao | TIMESTAMP | Data efetiva |
| status | ENUM | Agendada, realizada, cancelada, sucesso, falha |
| resultado | JSON | Dados do resultado (gestação confirmada, etc) |
| custoServico | DECIMAL | Valor cobrado |
| observacoes | TEXT | Notas adicionais |
| dataVencimento | TIMESTAMP | Prazo de validade do embrião |

#### 3.4 Consignações (Consignments)
Controla cavalos de terceiros em regime de consignação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| harasId | INT | Referência ao haras |
| cavaloId | INT | Cavalo consignado |
| proprietarioId | INT | Proprietário original |
| dataInicio | TIMESTAMP | Início da consignação |
| dataFim | TIMESTAMP | Fim previsto |
| comissaoPercentual | DECIMAL | % de comissão do haras |
| statusVenda | ENUM | Disponível, vendido, devolvido |
| dataPagamento | TIMESTAMP | Data do pagamento ao proprietário |
| valorVenda | DECIMAL | Preço de venda (se vendido) |
| comissaoPaga | BOOLEAN | Se comissão foi paga |
| contrato | VARCHAR | URL do contrato em S3 |

#### 3.5 Leilões (Auctions)
Gerencia eventos de leilão com lotes e lances.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| harasId | INT | Referência ao haras |
| nome | VARCHAR | Nome do leilão |
| dataEvento | TIMESTAMP | Data do evento |
| status | ENUM | Planejado, em andamento, encerrado |
| totalLotes | INT | Quantidade de lotes |
| totalArrecadado | DECIMAL | Valor total arrecadado |
| descricao | TEXT | Descrição do leilão |
| regulamento | VARCHAR | URL do regulamento |

#### 3.6 Lotes de Leilão (Auction Lots)
Itens individuais em um leilão.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| leilaoId | INT | Referência ao leilão |
| numero | INT | Número do lote |
| cavaloId | INT | Cavalo sendo leiloado |
| lanceInicial | DECIMAL | Lance inicial |
| lanceFinal | DECIMAL | Lance final (preço de venda) |
| status | ENUM | Disponível, vendido, retirado |
| comprador | VARCHAR | Nome do comprador |
| dataVenda | TIMESTAMP | Data da venda |

#### 3.7 Transações Financeiras (Transactions)
Registro centralizado de todas as operações financeiras.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Identificador único |
| harasId | INT | Referência ao haras |
| tipo | ENUM | Venda, aluguel, comissão, despesa |
| referencia | VARCHAR | ID do cavalo, baia, leilão, etc |
| valor | DECIMAL | Valor da transação |
| dataTransacao | TIMESTAMP | Data da transação |
| status | ENUM | Pendente, confirmada, cancelada |
| descricao | TEXT | Descrição |
| usuarioId | INT | Quem registrou |

---

## 4. Funcionalidades por Módulo

### 4.1 Dashboard Administrativo
O dashboard fornece visão consolidada do negócio com widgets de KPIs principais: total de cavalos disponíveis, baias ocupadas, leilões ativos, consignados em andamento, receita do mês, comissões a pagar. Gráficos mostram tendências de vendas, ocupação de baias e performance de leilões. Alertas destacam eventos urgentes (contratos vencendo, resultados de coberturas).

### 4.2 Gestão de Cavalos
Módulo completo de cadastro com formulário multi-etapas: (1) informações básicas (nome, raça, sexo, data de nascimento); (2) genealogia com busca automática na ABCCMM; (3) documentação (upload de pedigree, certificados); (4) fotos (galeria com múltiplas imagens); (5) histórico médico (vacinações, tratamentos, cirurgias); (6) status e localização. Busca e filtros avançados permitem localizar cavalos por múltiplos critérios. Integração com ABCCMM valida registros genealógicos.

### 4.3 Coberturas e Embriões
Sistema de agendamento com calendário visual. Permite registrar coberturas naturais, inseminação artificial e embriões. Rastreamento de resultados com confirmação de gestação. Histórico completo de cada fêmea. Alertas para datas críticas (parto previsto, vacinações necessárias).

### 4.4 Gestão de Baias
Visualização em grid das baias com status de cor (verde=disponível, amarelo=ocupada, vermelho=manutenção). Controle de ocupação com datas de entrada/saída. Gestão de aluguéis com registro de pagamentos. Histórico de ocupação para análise de utilização.

### 4.5 Cavalos Consignados
Registro de consignações com contrato digital. Controle de comissões com cálculo automático. Rastreamento de vendas com notificação ao proprietário. Gestão de prazos com alertas de vencimento. Relatório de comissões a pagar.

### 4.6 Leilões
Criação de eventos de leilão com regulamento. Cadastro de lotes com descrição e lance inicial. Registro de lances em tempo real. Controle de vendas com geração de documentos. Relatório de arrecadação.

### 4.7 Controle Financeiro
Visão consolidada de receitas (vendas, aluguéis, serviços) e despesas. Relatórios por período. Análise de comissões a pagar. Integração com dados de vendas, aluguéis e leilões para cálculo automático.

### 4.8 Autenticação e Autorização
Três níveis de acesso: **Admin** (acesso completo ao sistema, gestão de usuários, configurações); **Funcionário** (gestão de cavalos, baias, coberturas, leilões, sem acesso a financeiro); **Cliente** (visualização de seus cavalos consignados, histórico de transações, contatos).

### 4.9 Relatórios e Analytics
Relatórios pré-configurados: vendas por período, ocupação de baias, performance de leilões, comissões, receita total. Gráficos de tendências. Exportação em PDF e Excel. Dashboard com métricas customizáveis.

### 4.10 Interface Responsiva
Design elegante e moderno com Tailwind CSS 4. Paleta de cores sofisticada (tons de azul e ouro para elegância). Tipografia refinada com Google Fonts. Totalmente responsivo para desktop, tablet e mobile. Micro-interações com Framer Motion para feedback visual.

### 4.11 Alertas por Email
Sistema automático de notificações: (1) vencimento de contratos de aluguel de baias; (2) resultados de coberturas; (3) datas de leilões; (4) atualizações de cavalos consignados; (5) comissões a pagar. Emails personalizados com template HTML elegante.

---

## 5. Integração ABCCMM

### 5.1 Estratégia de Integração

Dado que a ABCCMM não oferece API pública documentada, implementaremos uma estratégia em três fases:

**Fase 1 (MVP)**: Web scraping com Puppeteer da página pública de animais (https://www.abccmm.org.br/animais) com cache local para reduzir requisições e respeitar rate limiting.

**Fase 2 (Curto Prazo)**: Contato direto com ABCCMM para solicitar integração oficial ou acesso a dados em lote.

**Fase 3 (Longo Prazo)**: Migração para API oficial quando disponibilizada.

### 5.2 Fluxo de Integração

O usuário cadastra um cavalo no sistema informando o nome. O sistema busca primeiro em cache local. Se não encontrado, realiza scraping na ABCCMM. Os dados genealógicos são armazenados localmente com timestamp de sincronização. Um job agendado atualiza dados periodicamente. O sistema valida se o registro genealógico corresponde aos dados informados.

### 5.3 Dados Extraídos da ABCCMM

Nome do animal, número de registro genealógico, raça, sexo, data de nascimento, genealogia (pais, avós, bisavós), classificação, status de registro, e informações de transferências anteriores.

---

## 6. Segurança da Informação

### 6.1 Autenticação
OAuth centralizado via Manus com JWT para sessões. Cookies seguros com flags httpOnly, Secure e SameSite=None. Renovação automática de tokens.

### 6.2 Autorização
RBAC implementado em tRPC procedures com verificação em cada operação. Isolamento de dados por haras (multi-tenancy) com filtros automáticos nas queries.

### 6.3 Proteção de Dados
Criptografia de dados sensíveis em repouso (senhas, dados financeiros). HTTPS obrigatório em todas as comunicações. Validação de entrada em todos os endpoints. Sanitização de dados antes de armazenamento.

### 6.4 Auditoria
Log de todas as operações críticas (criação/edição/deleção de cavalos, transações financeiras, alterações de usuários). Rastreabilidade de quem fez o quê e quando.

### 6.5 Conformidade
LGPD: Consentimento para coleta de dados, direito ao esquecimento, portabilidade de dados. Backup automático e plano de recuperação de desastres.

---

## 7. Escalabilidade e Multi-Tenancy

### 7.1 Arquitetura Multi-Tenant
Cada haras é um tenant isolado. Dados separados por harasId em todas as tabelas. Queries filtram automaticamente por tenant. Sem compartilhamento de dados entre tenants.

### 7.2 Performance
Índices em colunas frequentemente consultadas (harasId, status, datas). Paginação em listagens. Lazy loading de dados relacionados. Cache de dados genealógicos. Compressão de respostas.

### 7.3 Escalabilidade Horizontal
Stateless backend permite múltiplas instâncias. Banco de dados gerenciado pelo Manus. S3 para armazenamento distribuído. CDN para servir assets estáticos.

---

## 8. Roadmap de Implementação

### Fase 1: MVP (Semanas 1-4)
- Configuração do banco de dados com schema completo
- Autenticação e autorização com RBAC
- CRUD de cavalos com integração ABCCMM básica
- Dashboard com widgets principais
- Testes unitários

### Fase 2: Funcionalidades Principais (Semanas 5-8)
- Módulos de baias, coberturas, consignações
- Sistema de leilões
- Controle financeiro
- Relatórios básicos
- Testes de integração

### Fase 3: Refinamento e Escalabilidade (Semanas 9-12)
- Alertas por email
- Analytics avançados
- Otimizações de performance
- Testes de carga
- Documentação completa

### Fase 4: Preparação para Venda (Semanas 13+)
- Testes de segurança (penetration testing)
- Documentação para clientes
- Treinamento de suporte
- Plano de onboarding
- Otimizações finais de UX/CX

---

## 9. Tecnologias de Suporte

### 9.1 Desenvolvimento
- Git para versionamento
- GitHub Actions para CI/CD
- Vitest para testes unitários
- TypeScript para type safety

### 9.2 Monitoramento
- Logs centralizados
- Alertas de erro
- Métricas de performance
- Uptime monitoring

### 9.3 Documentação
- README com instruções de setup
- Documentação de API (tRPC)
- Guia de usuário
- Documentação técnica para desenvolvedores

---

## 10. Estimativas e Recursos

### Tempo de Desenvolvimento
Aproximadamente 12-16 semanas para MVP completo com todas as funcionalidades principais, testes e documentação.

### Recursos Necessários
- 1 Desenvolvedor Full-Stack (React + Node.js)
- 1 Designer UI/UX (para refinamento visual)
- Acesso a Manus para hosting e infraestrutura
- Contato com ABCCMM para integração

---

## 11. Próximas Ações

1. Aprovação desta proposta técnica
2. Criação do schema de banco de dados
3. Setup inicial do projeto com scaffolding
4. Implementação da autenticação
5. Desenvolvimento do módulo de cavalos
6. Testes e validação com usuários reais

---

**Fim da Proposta Técnica**
