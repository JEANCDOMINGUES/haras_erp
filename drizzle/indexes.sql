-- Índices para performance - Haras MAJ
-- Execute este arquivo após as migrações iniciais

-- =============================================================================
-- USERS
-- =============================================================================
CREATE INDEX idx_users_openid ON users(openId);
CREATE INDEX idx_users_haras ON users(harasId);

-- =============================================================================
-- HARAS
-- =============================================================================
CREATE INDEX idx_haras_cnpj ON haras(cnpj);

-- =============================================================================
-- PROPRIETARIOS
-- =============================================================================
CREATE INDEX idx_proprietarios_haras ON proprietarios(harasId);
CREATE INDEX idx_proprietarios_cpf ON proprietarios(cpfCnpj);

-- =============================================================================
-- CAVALOS
-- =============================================================================
CREATE INDEX idx_cavalos_haras ON cavalos(harasId);
CREATE INDEX idx_cavalos_haras_status ON cavalos(harasId, status);
CREATE INDEX idx_cavalos_registro ON cavalos(registroABCCMM);
CREATE INDEX idx_cavalos_microchip ON cavalos(microchip);
CREATE INDEX idx_cavalos_proprietario ON cavalos(proprietarioId);
CREATE INDEX idx_cavalos_data_registro ON cavalos(dataRegistro);

-- =============================================================================
-- BAIAS
-- =============================================================================
CREATE INDEX idx_baias_haras ON baias(harasId);
CREATE INDEX idx_baias_haras_status ON baias(harasId, status);
CREATE INDEX idx_baias_cavalo ON baias(cavaloId);

-- =============================================================================
-- COBERTURAS
-- =============================================================================
CREATE INDEX idx_coberturas_haras ON coberturas(harasId);
CREATE INDEX idx_coberturas_egea ON coberturas(egeaId);
CREATE INDEX idx_coberturas_cavalo ON coberturas(cavaloId);
CREATE INDEX idx_coberturas_data ON coberturas(dataAgendamento);

-- =============================================================================
-- CONSIGNACOES
-- =============================================================================
CREATE INDEX idx_consignacoes_haras ON consignacoes(harasId);
CREATE INDEX idx_consignacoes_cavalo ON consignacoes(cavaloId);
CREATE INDEX idx_consignacoes_proprietario ON consignacoes(proprietarioId);
CREATE INDEX idx_consignacoes_status ON consignacoes(statusVenda);

-- =============================================================================
-- LEILOES
-- =============================================================================
CREATE INDEX idx_leiloes_haras ON leiloes(harasId);
CREATE INDEX idx_leiloes_data ON leiloes(dataEvento);
CREATE INDEX idx_leiloes_status ON leiloes(status);

-- =============================================================================
-- LOTES
-- =============================================================================
CREATE INDEX idx_lotes_leilao ON lotes(leilaoId);
CREATE INDEX idx_lotes_cavalo ON lotes(cavaloId);
CREATE INDEX idx_lotes_status ON lotes(status);

-- =============================================================================
-- TRANSACOES
-- =============================================================================
CREATE INDEX idx_transacoes_haras ON transacoes(harasId);
CREATE INDEX idx_transacoes_data ON transacoes(dataTransacao);
CREATE INDEX idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX idx_transacoes_status ON transacoes(status);

-- =============================================================================
-- ALERTAS
-- =============================================================================
CREATE INDEX idx_alertas_usuario ON alertas(usuarioId);
CREATE INDEX idx_alertas_lido ON alertas(lido);
CREATE INDEX idx_alertas_haras ON alertas(harasId);

-- =============================================================================
-- SINCRONIZACAO ABCCMM
-- =============================================================================
CREATE INDEX idx_sinc_abccmm_cavalo ON sincronizacao_abccmm(cavaloId);
CREATE INDEX idx_sinc_abccmm_registro ON sincronizacao_abccmm(registroABCCMM);
CREATE INDEX idx_sinc_abccmm_status ON sincronizacao_abccmm(statusSincronizacao);
