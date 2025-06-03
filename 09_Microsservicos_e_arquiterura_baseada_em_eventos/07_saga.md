# Saga

## 📚 Visão Geral

- O **padrão Saga** é uma solução para **coordenação de transações distribuídas** em sistemas baseados em microsserviços.
- É utilizado quando há **várias etapas encadeadas** que devem ser executadas em ordem, com a capacidade de **compensar (rollback)** caso algo falhe.

---

## 🛠️ Motivação

- Em sistemas distribuídos:
  - Operações são separadas por microsserviços.
  - Etapas do processo são **interdependentes**.
  - Mudanças frequentes nas regras de negócio exigem **flexibilidade**.
- A Saga garante:
  - **Orquestração das etapas em ordem**.
  - **Execução de ações compensatórias** em caso de falha.

---

## 🏨 Exemplo ilustrativo: Reserva de Viagem

- Etapas:
  1. Reserva de **quarto de hotel**
  2. Reserva de **carro**
  3. Compra de **passagem aérea**
  4. Adição de **seguros**
- Se o **voo for cancelado**, todo o processo deve ser revertido:
  - Cancelar seguro de viagem e bagagem
  - Cancelar carro e hotel

---

## 🛒 Exemplo clássico: E-commerce

1. **Pagamento** aprovado
2. Produto removido do **estoque**
3. **Nota fiscal** emitida
4. Produto enviado à **logística**

→ Se falhar na etapa 4:
- Cancelar nota fiscal
- Repor produto no estoque
- Estornar pagamento

---

## 🧠 Papel do Orquestrador

- O **orquestrador** é o componente que:
  - Garante a **ordem de execução**
  - Coordena **ações compensatórias** se algo falhar
- Pode ser implementado como:
  - Um **serviço centralizado**
  - Ou via **coreografia** entre serviços com eventos

---

## 📬 Comunicação assíncrona

- Em ambientes modernos, muitas etapas usam:
  - **Mensageria (filas, tópicos)** para garantir resiliência
  - Evita chamadas REST síncronas frágeis
- Cada microsserviço atua com base nos **eventos que recebe** e **gera novos eventos** como resposta.

---

## 🧩 Conclusão

- O padrão Saga é essencial quando há:
  - **Dependência entre etapas**
  - **Microsserviços independentes**
  - Necessidade de **rollback parcial**
- É uma solução robusta para garantir **consistência eventual** e **resiliência** em sistemas distribuídos.

# Dinamica de uma saga

## 📌 Orquestração vs Coreografia

- Nesta abordagem, estamos tratando de **Sagas com orquestração**:
  - Um **mediador central** (orquestrador) é responsável por coordenar os passos.
  - Ele **controla a ordem**, inicia as ações e gerencia **compensações em caso de falha**.

---

## 🧱 Estrutura Geral

- Cada etapa da saga é executada por um **microsserviço independente**, com seu próprio banco de dados.
- A comunicação ocorre via **eventos em tópicos** (Kafka, RabbitMQ, etc).

---

## 🛠️ Fluxo da Saga (Sucesso e Compensação)

### 🟢 Execução normal:

1. **Saga iniciada**: mediador recebe uma requisição inicial.
2. Envia evento para o **Microsserviço 1**:
   - Step 1 → `status: running`
   - Ao finalizar → `status: success`
3. Envia evento para o **Microsserviço 2**:
   - Step 2 → `status: running`
   - Ao finalizar → `status: success`
4. Envia evento para o **Microsserviço 3**:
   - Step 3 → executa e... **falha**

---

### 🔴 Fluxo de Compensação:

5. Mediador atualiza status da saga:
   - `status: compensating`
   - Step 3 → `status: failed`
6. Inicia **compensação do Step 3**:
   - Executa rollback no Microsserviço 3 → `status: compensated`
7. Compensação do **Step 2**:
   - Executa rollback no Microsserviço 2 → `status: compensated`
8. Compensação do **Step 1**:
   - Executa rollback no Microsserviço 1 → `status: compensated`

---

## 📊 Estados da Saga

| Etapa      | Status após execução normal | Status após erro        |
|------------|-----------------------------|--------------------------|
| Step 1     | `success`                   | `compensated`           |
| Step 2     | `success`                   | `compensated`           |
| Step 3     | `failed`                    | `compensated`           |
| Saga       | `running` → `compensating`  | `compensated and completed` |

---

## 🔍 Observações Importantes

- Cada step da saga **armazena seu status**, permitindo rastreamento completo.
- O rollback é **ordenado de trás para frente** (último → primeiro).
- A compensação depende de **ações explícitas** de cada microsserviço.
- A implementação de um **orquestrador robusto** é complexa e exige:
  - Controle de estado da saga
  - Tolerância a falhas e reentregas
  - Garantia de idempotência nos handlers

# Compensação e gerenciamento de erros

- Complementando a aula sobre **Saga com orquestrador**, agora o foco é em **como lidar com falhas** durante a execução e **durante a compensação**.
- O orquestrador pode usar:
  - **Filas/tópicos** (Kafka, RabbitMQ)
  - **REST/gRPC/GraphQL** (síncronos)

---

## 🔄 Comunicação: REST vs Filas

### 🌐 Usando REST/gRPC (síncrono):

- Risco de falhas por:
  - Serviço fora do ar
  - Deploys em andamento
  - Problemas de rede

### ✅ Estratégias necessárias:

- **Retry automático** com **Exponential Backoff**:
  - Ex: 2s → 4s → 8s → 16s → 32s → 1min...

---

### 📨 Usando Filas (assíncrono):

- **Alta resiliência**: eventos são mantidos até serem processados.
- **Menos necessidade de retries manuais**.
- Complexidade maior na configuração e monitoramento das filas.

---

## 💣 Falhas na compensação

- Quando um **erro ocorre durante o processo de compensação**, não há como "compensar a compensação".
- Estratégia recomendada:
  - Criar um **tópico específico de erros** (`dead-letter` ou `saga-errors`).
  - Armazenar todos os eventos de falha para **análise posterior**.

---

## 🛠️ Tratamento de erros

- Enviar erros para um **tópico de erros (DLQ)**.
- Pode haver:
  - **Processamento automático** por outro serviço.
  - **Análise manual** por um operador ou sistema de monitoramento.

---

## 🧠 Considerações finais

- Sempre que possível, garanta que **nenhuma transação falhada seja descartada sem rastreabilidade**.
- Avalie o nível de **resiliência exigido** pelo negócio para decidir entre:
  - Comunicação **síncrona** com robusto mecanismo de retry.
  - Comunicação **assíncrona** com fila e persistência de mensagens.

> Em sistemas distribuídos, **falhas são inevitáveis** — o importante é ter um plano para lidar com elas.


# Draft de codigo

# 💻 Aula: Draft de Código da Saga

## 🧱 Estrutura de uma Saga

- A saga é composta por **vários passos (`SagaStep`)**.
- Cada `SagaStep` possui:
  - `StepName`: nome da operação (ex: "place-order")
  - `StepTopic`: tópico ou canal de mensagem
  - `StepType`: tipo do passo (Normal ou Compensate)
  - `Status`: estado atual do passo (Pending, etc.)
  - `Data`: payload da operação (pode ser []byte com JSON, Protobuf etc.)
  - `CompensateRetries`: número de tentativas em caso de falha na compensação

### 🧩 Exemplo de passos configurados

1. place-order
2. generate-invoice
3. remove-product-from-stock
4. ship-order

---

## ⚙️ Criação e Execução da Saga


A `Saga` é uma struct que agrupa os passos:

```go
    saga := &saga.Saga{
      SagaID: "saga-1",
      SagaName: "saga-1",
      Status: saga.SagaStatusPending,
      CreateTime: time.Now(),
      UpdateTime: time.Now(),
      ExpireTime: time.Now().Add(24 * time.Hour),
      Version: 1,
    }
```
- Cada passo é adicionado via `saga.AddStep(...)`
- A execução da saga inicia com `saga.Init([]byte("data"))`

---

## 🔁 Execução contínua

Um loop infinito simula o consumo de mensagens de uma fila:
```go
    for {
      saga.Init([]byte("data"))
    }
```

- Cada nova mensagem gera uma nova instância da saga.
- O sistema gerencia:
  - Execução dos passos
  - Detecção de falhas
  - Compensações quando necessário

---

## 📋 Estado e Auditoria

- Toda saga **mantém o histórico completo** dos passos.
- Permite:
  - Auditoria
  - Depuração (debug)
  - Replay de eventos
- O modelo implementa um estilo de **Event Sourcing**:
  - Cada mudança de estado é registrada.
  - Possível reconstruir a saga a qualquer momento.

---

## ✅ Benefícios do modelo

- Clareza e rastreabilidade por transação
- Organização modular e extensível por versão
- Suporte a:
  - Reexecução de transações
  - Timeout e expiração (ex: 24h)
  - Versionamento das regras de negócio

---

## 🧠 Considerações Finais

- Embora o código pareça simples, o complexo está nos serviços reais:
  - Operações distribuídas
  - Compensações
  - Persistência de estados
  - Resiliência
- A arquitetura mostrada é base para construção de orquestradores robustos.

