# Pesquisa de Integração ABCCMM

## Contexto
A ABCCMM (Associação Brasileira de Criadores do Cavalo Mangalarga Marchador) é a entidade oficial responsável pelo registro genealógico de cavalos da raça Mangalarga Marchador no Brasil, credenciada pelo MAPA (Ministério da Agricultura, Pecuária e Abastecimento).

## Estrutura Atual da ABCCMM

### Plataformas Disponíveis
1. **Site Público**: https://www.abccmm.org.br/
   - Página de Animais: https://www.abccmm.org.br/animais
   - Consulta pública com CAPTCHA
   - Busca por nome do animal

2. **Sistema ABCCMM**: https://sistema.abccmm.org.br/
   - Acesso restrito com login
   - Grupos de acesso: ASSOCIADOS, USUÁRIO INTERNO, LABORATÓRIO, VETERINÁRIOS, ÓRGÃO EXECUTORES
   - Funcionalidades:
     - Autorizações de transferência
     - Comunicações de cobrição
     - Comunicações de nascimento
     - Comunicações de morte
     - Consultas de processos
     - Atualização de dados

3. **App Mobile**: Data Horse
   - Disponível em iOS e Android
   - Acesso a dados genealógicos

## Dados Genealógicos Disponíveis
- Certificado de Registro Genealógico (identidade do animal)
- Classificação do animal
- Informações de pedigree
- Histórico de transferências
- Dados de cobrição e nascimento

## Desafios de Integração

### 1. Acesso Programático
- **Não há API pública documentada** da ABCCMM
- Acesso via web scraping é necessário para dados públicos
- Acesso ao sistema requer credenciais de associado

### 2. Proteção de Dados
- Página de animais usa CAPTCHA para prevenir scraping automatizado
- Dados sensíveis requerem autenticação

### 3. Estratégia Recomendada

#### Opção A: Web Scraping com Headless Browser (Curto Prazo)
- Usar Puppeteer/Playwright para contornar CAPTCHA
- Scraping da página pública de animais
- Implementar cache para reduzir requisições
- Respeitar robots.txt e rate limiting

#### Opção B: Integração Direta com Sistema (Longo Prazo)
- Solicitar acesso à API ou dados em lote da ABCCMM
- Contato: abccmm@abccmm.org.br
- Tel.: +55 31 3379-6100
- Propor parceria para integração oficial

#### Opção C: Híbrida (Recomendada)
1. Iniciar com web scraping para MVP
2. Implementar cache em banco de dados
3. Solicitar integração oficial em paralelo
4. Migrar para API quando disponível

## Implementação Técnica Proposta

### Stack
- **Backend**: Node.js + Express + tRPC
- **Scraping**: Puppeteer com headless browser
- **Cache**: Redis + Banco de dados
- **Scheduler**: node-cron para sincronizações periódicas

### Fluxo de Dados
1. Usuário cadastra cavalo no Haras MAJ
2. Sistema busca dados genealógicos na ABCCMM (cache primeiro)
3. Se não encontrado em cache, faz scraping
4. Armazena dados localmente
5. Sincroniza periodicamente com ABCCMM

### Campos a Extrair
- Nome do animal
- Registro genealógico (número)
- Raça/Tipo
- Sexo
- Data de nascimento
- Genealogia (pais, avós)
- Classificação
- Status de registro

## Próximas Ações
1. Implementar web scraping com Puppeteer
2. Criar estrutura de cache
3. Desenvolver interface de sincronização
4. Contatar ABCCMM para integração oficial
5. Implementar validação de dados genealógicos

## Contato ABCCMM
- Email: abccmm@abccmm.org.br
- Telefone: +55 31 3379-6100
- Endereço: Av. Amazonas, 6020 - Gameleira, Belo Horizonte - MG
- CNPJ: 17.217.001/0001-95
