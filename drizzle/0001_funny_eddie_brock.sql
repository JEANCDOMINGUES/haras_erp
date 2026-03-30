CREATE TABLE `alertas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`tipo` enum('vencimento_aluguel','resultado_cobracao','data_leilao','atualizacao_consignado','comissao_pagar','outro') NOT NULL,
	`usuarioId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`mensagem` text,
	`referencia` varchar(100),
	`referenciaTabela` varchar(50),
	`lido` boolean NOT NULL DEFAULT false,
	`dataEnvio` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `baias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`numero` varchar(50) NOT NULL,
	`tipo` enum('individual','coletiva','maternidade','isolamento') NOT NULL,
	`status` enum('disponivel','ocupada','manutencao') NOT NULL DEFAULT 'disponivel',
	`cavaloId` int,
	`dataOcupacao` datetime,
	`dataLiberacao` datetime,
	`valorAluguel` decimal(10,2),
	`ultimoAluguel` datetime,
	`condicoes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `baias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cavalos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`registroABCCMM` varchar(50),
	`raca` enum('Mangalarga Marchador','Mangalarga','Quarto de Milha','Puro Sangue Inglês','Árabe','Outro') NOT NULL,
	`sexo` enum('macho','fêmea') NOT NULL,
	`dataNascimento` datetime,
	`cor` varchar(100),
	`microchip` varchar(50),
	`status` enum('ativo','vendido','falecido','consignado','aposentado') NOT NULL DEFAULT 'ativo',
	`proprietarioId` int,
	`genealogia` json,
	`historicoMedico` json,
	`fotos` json,
	`documentos` json,
	`observacoes` text,
	`dataRegistro` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cavalos_id` PRIMARY KEY(`id`),
	CONSTRAINT `cavalos_registroABCCMM_unique` UNIQUE(`registroABCCMM`),
	CONSTRAINT `cavalos_microchip_unique` UNIQUE(`microchip`)
);
--> statement-breakpoint
CREATE TABLE `coberturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`tipo` enum('cobracao_natural','inseminacao_artificial','embriao') NOT NULL,
	`egeaId` int NOT NULL,
	`cavaloId` int,
	`dataAgendamento` datetime NOT NULL,
	`dataRealizacao` datetime,
	`status` enum('agendada','realizada','cancelada','sucesso','falha') NOT NULL DEFAULT 'agendada',
	`resultado` json,
	`custoServico` decimal(10,2),
	`observacoes` text,
	`dataVencimento` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coberturas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consignacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`cavaloId` int NOT NULL,
	`proprietarioId` int NOT NULL,
	`dataInicio` datetime NOT NULL,
	`dataFim` datetime,
	`comissaoPercentual` decimal(5,2) NOT NULL,
	`statusVenda` enum('disponivel','vendido','devolvido') NOT NULL DEFAULT 'disponivel',
	`dataPagamento` datetime,
	`valorVenda` decimal(10,2),
	`comissaoPaga` boolean NOT NULL DEFAULT false,
	`contrato` varchar(500),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consignacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `haras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cnpj` varchar(18),
	`endereco` text,
	`telefone` varchar(20),
	`email` varchar(320),
	`website` varchar(255),
	`logo` varchar(500),
	`descricao` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `haras_id` PRIMARY KEY(`id`),
	CONSTRAINT `haras_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `leiloes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`dataEvento` datetime NOT NULL,
	`status` enum('planejado','em_andamento','encerrado') NOT NULL DEFAULT 'planejado',
	`totalLotes` int DEFAULT 0,
	`totalArrecadado` decimal(12,2) DEFAULT '0',
	`descricao` text,
	`regulamento` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leiloes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leilaoId` int NOT NULL,
	`numero` int NOT NULL,
	`cavaloId` int NOT NULL,
	`lanceInicial` decimal(10,2) NOT NULL,
	`lanceFinal` decimal(10,2),
	`status` enum('disponivel','vendido','retirado') NOT NULL DEFAULT 'disponivel',
	`comprador` varchar(255),
	`dataVenda` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proprietarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cpfCnpj` varchar(18) NOT NULL,
	`email` varchar(320) NOT NULL,
	`telefone` varchar(20),
	`endereco` text,
	`cidade` varchar(100),
	`estado` varchar(2),
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proprietarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sincronizacao_abccmm` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cavaloId` int NOT NULL,
	`registroABCCMM` varchar(50),
	`dadosGenealogia` json,
	`statusSincronizacao` enum('sucesso','falha','pendente') NOT NULL DEFAULT 'pendente',
	`ultimaSincronizacao` datetime,
	`proximaSincronizacao` datetime,
	`erroMensagem` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sincronizacao_abccmm_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`harasId` int NOT NULL,
	`tipo` enum('venda','aluguel','comissao','despesa','outro') NOT NULL,
	`referencia` varchar(100),
	`referenciaTabela` varchar(50),
	`valor` decimal(12,2) NOT NULL,
	`dataTransacao` datetime NOT NULL,
	`status` enum('pendente','confirmada','cancelada') NOT NULL DEFAULT 'pendente',
	`descricao` text,
	`usuarioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','funcionario','cliente') NOT NULL DEFAULT 'cliente';--> statement-breakpoint
ALTER TABLE `users` ADD `harasId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `ativo` boolean DEFAULT true NOT NULL;