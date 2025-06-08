# Introdução:

## 🎯 Introdução e Objetivo

- O conteúdo aborda problemas complexos em sistemas distribuídos, especialmente:
  - Regras de negócio encadeadas
  - Falhas em múltiplos sistemas
  - Situações que exigem rollback além do banco de dados
- O padrão **Saga** é apresentado como uma solução arquitetural nesses cenários.
- Rafael compartilha sua experiência real com a aplicação do padrão, utilizando **linguagem Go** no **Mercado Bitcoin**.

---

## 🧠 Reflexões iniciais

- Nem todos os profissionais vão lidar com Sagas na carreira.
- Quando for necessário, é crucial **saber implementar corretamente**.
- A linguagem usada (Go) **não é o fator principal** — o foco está na **abordagem arquitetural**.

---

## 🏦 Contexto da Empresa

- MB é a maior plataforma de criptoativos da América Latina (desde 2013).
- Cresceu de forma orgânica, passando por:
  - Expansão de produtos (além do Bitcoin)
  - Criação de múltiplas empresas dentro do grupo
  - Adoção de um **sistema core monolítico** (em Python), com alta complexidade e legado

---

## ⚙️ Complexidade organizacional

- **Lei de Conway** se manifesta fortemente: estrutura da empresa influencia a arquitetura.
- Fusões e aquisições aumentaram a complexidade dos sistemas.
- O core da corretora carrega múltiplos padrões arquiteturais misturados.

---

## 📈 Hipercrescimento em 2021

- Janeiro a março de 2021 = volume de 2020 inteiro.
- Abril de 2021 = volume total de 2013 a 2020.
- A empresa se tornou unicórnio e recebeu aporte do **SoftBank**.
- Novos desafios surgiram:
  - Escalabilidade global
  - Conformidade regulatória
  - Entrada de novos perfis de clientes (ex: **market makers** com bots de alta frequência)

---

## 🕒 Novas exigências

- Operações passaram a ser verdadeiramente **24/7** com alta demanda e baixa tolerância a falhas.
- Janelas de manutenção diminuíram.
- A complexidade técnica e de negócio aumentou substancialmente.

# Desafios da arquitetura legada

## 🧭 Contexto pós-hipercrescimento

- Após o pico de 2021, surgiram **problemas graves de estabilidade**.
- As falhas afetavam principalmente **clientes críticos (24/7)**, com **altas exigências comerciais**.
- Crescimento desordenado gerou **arquitetura degradada**, com múltiplos padrões inacabados.
- Sistemas locais até funcionavam bem isoladamente, mas o **conjunto era frágil**.

---

## 🧩 Diagrama de Arquitetura Legada

### Componentes principais:

- `Monolito Core` com banco de dados central (Core DB)
- `Serviços A e B` com seus próprios bancos locais
- Sistema de **eventos e consumidores**
- Interação entre componentes envolvia:
  - HTTP
  - gRPC
  - Mensageria (ex: NATS)

---

## ⚠️ Problemas enfrentados

### 🔄 Transações quebradas

- O `Monolito` iniciava transação, fazia `insert`, chamava `Serviço A` por HTTP.
- Se `Serviço A` retornasse erro → `rollback` simples.
- **Problema**: timeouts não eram tratados corretamente:
  - `Monolito` fazia rollback
  - Mas `Serviço A` seguia processando

### 🔃 Sincronização inconsistente

- Estados divergentes entre banco core e bancos locais.
- `Serviço B` chamado via gRPC:
  - Em caso de erro no canal, era **incerto se a operação havia sido processada ou não**.
  - Cliente ficava no escuro quanto ao resultado da operação.

---

## 💤 Espera ativa (sleep + polling)

- Estratégia usada para esperar mudanças no banco core:
  - Após processar, serviço ficava checando: “já mudou o status?”
  - Se não → `sleep`, depois `poll` de novo.
- Resultado:
  - **Threads bloqueadas**
  - **Pods saturados**
  - Autoscaling ineficaz (não via aumento de CPU)
  - Respostas lentas e erro 500 para clientes

---

## 🔍 Causa raiz

- **Falta de gestão global de estado**
- Dificuldade para rastrear qual o **estado real de cada transação**
- Falta de um **modelo arquitetural unificado**
- Complexidade de múltiplos protocolos, padrões e bancos

---

## 🧠 Intervenção e insight do CTO

- CTO (ex-IBM, Cisco, Vale do Silício) identifica o problema como:
  > “Gestão global de estado inconsistente”
- Sugestão direta:
  - **Adotar o padrão Saga**
  - Investigar livros, palestras, conteúdo sobre o tema
  - Validar se realmente serve para o cenário
- Questionamento recorrente:
  - “Saga é só para carrinho de compras?”
  - “Funciona para contextos financeiros e síncronos?”

---

## ❓ Dilema enfrentado

- Carrinho de compras funciona bem com Saga pois é **naturalmente assíncrono**
- No Mercado Bitcoin:
  - Espera-se **baixa latência e sincronicidade**
  - Grande parte dos processos é **crítica e imediata**
- O desafio: **adaptar o padrão Saga a um contexto diferente**

---

## 💬 Frase-chave do CTO

> “Estou falando de um padrão que funciona. Se não serve, me diga o que serve. Mas temos que resolver.”

