# 🚀 Desafio Atalhos Digitais - Plataforma de Processamento & Automação de Candidatos

Uma API robusta, escalável e resiliente desenvolvida em **NestJS** e **TypeScript** para o cadastro, gerenciamento e automação assíncrona de candidatos. O projeto utiliza **MongoDB**, **Redis**, **BullMQ** e **Zod** para garantir alta performance, tolerância a falhas, segurança de tipos de ponta a ponta e idempotência.

---

## 📋 Sumário

- [1. Visão Geral & Contexto do Desafio](#1-visão-geral--contexto-do-desafio)
- [2. Tecnologias Utilizadas](#2-tecnologias-utilizadas)
- [3. Arquitetura e Organização do Código](#3-arquitetura-e-organização-do-código)
  - [Camadas da Aplicação](#camadas-da-aplicação)
  - [Sub-serviço de Fila & Worker / Processador](#sub-serviço-de-fila--worker--processador)
- [4. Escolhas Técnicas & Trade-offs](#4-escolhas-técnicas--trade-offs)
  - [Resiliência e Tratamento de Instabilidade (BullMQ + Exponential Backoff)](#resiliência-e-tratamento-de-instabilidade-bullmq--exponential-backoff)
  - [Idempotência e Proteção contra Duplicidade](#idempotência-e-proteção-contra-duplicidade)
  - [Type Safety Estrita com Zod e Mongoose sem `any`](#type-safety-estrita-com-zod-e-mongoose-sem-any)
  - [Processamento Assíncrono & Non-Blocking HTTP Response](#processamento-assíncrono--non-blocking-http-response)
- [5. Instalação e Execução](#5-instalação-e-execução)
  - [Variáveis de Ambiente (`.env`)](#variáveis-de-ambiente-env)
  - [Executando via Docker Compose](#executando-via-docker-compose-recomendado)
  - [Executando Localmente (pnpm / npm)](#executando-localmente-pnpm--npm)
  - [Execução dos Testes](#execução-dos-testes)
- [6. Documentação dos Endpoints REST](#6-documentação-dos-endpoints-rest)
  - [`POST /registerCandidate`](#post-registercandidate)
  - [`GET /listCandidates`](#get-listcandidates)
  - [`POST /automations/retry`](#post-automationsretry)
  - [`POST /webhook`](#post-webhook)

---

## 1. Visão Geral & Contexto do Desafio

O **Desafio Atalhos Digitais** consiste no desenvolvimento de uma solução backend para gerenciar a entrada de novos candidatos e automatizar a integração de seus dados com serviços externos via Webhook.

Em cenários reais de integração, APIs externas sujeitam o sistema a instabilidades temporárias, variações de latência e falhas de rede. Para atender a esses requisitos sem comprometer a experiência do usuário ou a consistência dos dados, esta solução adota uma **arquitetura orientada a eventos e filas de mensagens**, separando o recebimento HTTP da execução pesada/inconstante de automações.

---

## 2. Tecnologias Utilizadas

- **Framework Mainframe**: [NestJS](https://nestjs.com/) (`v11`) - Framework TypeScript progressivo para construção de aplicações backend modulares e eficientes.
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (`v5.7`) - Garantia de checagem de tipos estática, auto-documentação e manutenibilidade.
- **Banco de Dados Documental**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) - Persistência nosql dinâmica para dados de candidatos e histórico de automações.
- **Fila de Mensagens & Background Jobs**: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/) - Sistema de enfileiramento distribuído para processamento de tarefas em background com suporte a retentativas automáticas e backoff exponencial.
- **Validação & Schemas**: [Zod](https://zod.dev/) - Validação e parsing de dados runtime de schemas tipados.
- **Conteinerização**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) - Padronização do ambiente de execução contendo a aplicação NestJS, MongoDB e Redis.

---

## 3. Arquitetura e Organização do Código

A aplicação segue os princípios da arquitetura em camadas e desacoplamento de responsabilidades (*Separation of Concerns*):

```
src/
├── controllers/          # Trata requisições HTTP, validação de DTOs e respostas
├── factories/            # Construção padronizada de objetos e entidades domain/job
├── intefaces/            # Contratos de interfaces TypeScript reutilizáveis
├── repositories/         # Camada de abstração de dados (Mongoose/MongoDB)
├── schemas/              # Schemas Zod + Schemas Mongoose tipados
└── services/             # Regras de negócio e sub-serviços
    ├── automation/       # Gerenciamento de automações e Processadores BullMQ (Worker)
    ├── queue/            # Integração com BullMQ e publicação de jobs
    ├── user/             # Orquestração de candidatos
    └── webhook/          # Integração simulada/real com webhooks externos
```

### Camadas da Aplicação

1. **Schemas (`src/schemas`)**: Definem a estrutura dos modelos de dados usando **Zod**, derivando os tipos TypeScript nativos (`z.infer`) e os schemas do **Mongoose**.
2. **Repositories (`src/repositories`)**: Encapsulam todas as operações de banco de dados (`UserModel`, `AutomationModel`), isolando a camada de persistência dos serviços de domínio.
3. **Factories (`src/factories`)**: Responsáveis por criar objetos de domínio, payloads de jobs e entidades com dados iniciais e valores padrão seguros.
4. **Services (`src/services`)**: Contêm as regras de negócio puras (como orquestração de cadastro de candidatos, regras de retry de automações e envios de webhook).
5. **Controllers (`src/controllers`)**: Expõem os endpoints REST, executam a validação dos payloads recebidos no corpo da requisição utilizando schemas Zod e delegam a execução aos serviços apropriados.

### Sub-serviço de Fila & Worker / Processador

- **QueueService (`src/services/queue/queue.service.ts`)**: Responsável por receber a ordem de enfileiramento e publicar jobs na fila Redis chamada `automationQueue`.
- **AutomationProcessor (`src/services/automation/processors/automation.processor.ts`)**: Atua como o **Worker / Consumer** (`@Processor('automationQueue')`). Ele consome assincronamente os jobs da fila, atualiza os estados da automação para `PROCESSING`, chama o `WebhookService` e lida com eventuais exceções e retentativas configuradas.

---

## 4. Escolhas Técnicas & Trade-offs

### Resiliência e Tratamento de Instabilidade (BullMQ + Exponential Backoff)

Automações externas podem falhar devido a indisponibilidades temporárias. Para resolver isso:
- O `QueueService` adiciona jobs com **3 tentativas no total** (`attempts: 3`).
- Utiliza a estratégia de **Exponential Backoff** (`type: 'exponential'`, `delay: 3000ms`), garantindo espaçamento crescente entre tentativas em caso de erro, evitando sobrecarregar o serviço de destino.
- Em caso de falha definitiva após exaurir as tentativas, o estado da automação e do candidato é atualizado para `FAILED` com o registro do erro ocorrido (`lastError`).

### Idempotência e Proteção contra Duplicidade

- Ao acionar a repetição de uma automação via `POST /automations/retry`, o serviço verifica o estado atual do registro no MongoDB.
- Se o status for `PROCESSING`, o sistema interrompe a operação imediatamente lançando uma exceção HTTP `400 Bad Request`. Isso previne que múltiplas requisições simultâneas criem jobs duplicados para o mesmo processo em andamento.

### Type Safety Estrita com Zod e Mongoose sem `any`

Em conformidade com regras estritas de segurança de tipos:
- O código **não utiliza `any`**, `@ts-ignore` ou casting desnecessário.
- Os DTOs de entrada dos controllers aceitam `body: unknown` e utilizam o método `.parse()` do Zod para garantir validação em tempo de execução e tipagem estática inferida automaticamente.
- Os tipos dos documentos do Mongoose herdam diretamente do `z.infer<typeof SchemaZod>`.

### Processamento Assíncrono & Non-blocking HTTP Response

- No endpoint `POST /registerCandidate`, o candidato e a entidade de automação são salvos sincronamente no MongoDB.
- Em seguida, a adição do job na fila do BullMQ é disparada de forma assíncrona (`this.queue.startQueue(...).catch(...)`) em background.
- A requisição HTTP retorna imediatamente o código `201 Created` para o cliente sem aguardar a execução do webhook externo.

---

## 5. Instalação e Execução

### Pré-requisitos

- **Docker** e **Docker Compose** instalados (método recomendado), ou
- **Node.js** (v18+) + **pnpm** (ou npm/yarn) + instâncias locais de **MongoDB** e **Redis**.

---

### Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

```env
MONGO_URI=mongodb://localhost:27017/desafio_atalhos
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

*Nota: Ao rodar via Docker Compose, as variáveis de conexão com MongoDB e Redis são sobrescritas automaticamente para apontar para os nomes dos serviços internos da rede Docker (`mongodb` e `redis`).*

---

### Executando via Docker Compose (Recomendado)

O projeto possui um ambiente completo pré-configurado no `docker-compose.yml` que levanta a API NestJS, o MongoDB e o Redis.

Para construir e iniciar todos os serviços:

```bash
docker-compose up --build
```

Para encerrar a execução:

```bash
docker-compose down
```

A aplicação estará acessível em `http://localhost:3000`.

---

### Executando Localmente (pnpm / npm)

1. Instale as dependências:

```bash
pnpm install
# ou
npm install
```

2. Certifique-se de que o MongoDB e o Redis estejam rodando localmente (ou via containers isolados).

3. Inicie o servidor em modo de desenvolvimento:

```bash
pnpm start:dev
# ou
npm run start:dev
```

---

### Execução dos Testes

Para rodar a suíte de testes unitários com Jest:

```bash
pnpm test
# ou
npm test
```

Para verificar a cobertura de testes:

```bash
pnpm test:cov
```

---

## 6. Documentação dos Endpoints REST

### `POST /registerCandidate`

Cadastra um novo candidato e agenda automaticamente a automação em background.

- **URL**: `/registerCandidate`
- **Método**: `POST`
- **Header**: `Content-Type: application/json`

#### Body da Requisição:
```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role": "Desenvolvedor Backend",
  "linkedin": "https://www.linkedin.com/in/joaosilva"
}
```

#### Resposta de Sucesso (`201 Created`):
```json
{
  "_id": "66c3a1f9e4b0123456789abc",
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "role": "Desenvolvedor Backend",
  "linkedin": "https://www.linkedin.com/in/joaosilva",
  "automationStatus": "PENDING",
  "createdAt": "2026-08-19T17:45:00.000Z",
  "updatedAt": "2026-08-19T17:45:00.000Z"
}
```

---

### `GET /listCandidates`

Lista todos os candidatos cadastrados no sistema.

- **URL**: `/listCandidates`
- **Método**: `GET`

#### Resposta de Sucesso (`200 OK`):
```json
[
  {
    "_id": "66c3a1f9e4b0123456789abc",
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "role": "Desenvolvedor Backend",
    "linkedin": "https://www.linkedin.com/in/joaosilva",
    "automationStatus": "SUCCESS",
    "createdAt": "2026-08-19T17:45:00.000Z",
    "updatedAt": "2026-08-19T17:45:05.000Z"
  }
]
```

---

### `POST /automations/retry`

Solicita o reprocessamento de uma automação que falhou ou precisa ser executada novamente. Aceita o ID da automação ou o ID do candidato.

- **URL**: `/automations/retry`
- **Método**: `POST`
- **Header**: `Content-Type: application/json`

#### Body da Requisição:
```json
{
  "id": "66c3a1f9e4b0123456789abc"
}
```

#### Resposta de Sucesso (`200 OK`):
```json
{
  "_id": "66c3a1f9e4b0123456789def",
  "candidateId": "66c3a1f9e4b0123456789abc",
  "status": "PENDING",
  "attempts": 0,
  "maxAttempts": 3,
  "lastError": null,
  "createdAt": "2026-08-19T17:45:00.000Z",
  "updatedAt": "2026-08-19T17:50:00.000Z"
}
```

#### Resposta de Erro de Idempotência (`400 Bad Request`):
```json
{
  "statusCode": 400,
  "message": "Automação já está em processamento! ID: 66c3a1f9e4b0123456789def",
  "error": "Bad Request"
}
```

---

### `POST /webhook`

Endpoint de integração para simulação ou recepção de chamadas de Webhook externas.

- **URL**: `/webhook`
- **Método**: `POST`

#### Resposta de Sucesso (`200 OK`):
```json
{
  "Status": 200,
  "Message": "Webhook processado com sucesso!"
}
```
