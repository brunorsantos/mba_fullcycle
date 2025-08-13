# ReAct (Reasoning + Action)

ReAct (Reasoning + Acting) é uma técnica de prompting que permite que LLMs combinem raciocínio passo a passo (Chain of Thought) com a execução de ações externas 4 como chamadas a ferramentas, busca em bancos de dados, execução de código ou uso de APIs.

## Estudo

Foi formalizada no paper "ReAct: Synergizing Reasoning and Acting in Language Models" por Yao et al., 2022. A ideia é fazer com que o modelo pense de forma deliberada e execute ações iterativas com base nesse raciocínio.

## Quando utilizar

- Quando o modelo precisa consultar APIs, sistemas ou bancos de dados.
- Quando o raciocínio sozinho não é suficiente para responder.
- Quando há dependência de informações externas dinâmicas.

## Vantagens e Limitações do ReAct Prompting
### Vantagens:
-Permite que o modelo combine raciocínio com ação em tempo real.
- Ideal para construção de agentes interativos (SRE, DevOps, suporte, CI/CD).
- Gera respostas auditáveis, pois explicita cada passo (Thought 3 Action 3 Observation).
- Pode ser iterado com base em feedbacks dinâmicos, como logs ou APIs externas.
- Compatível com ferramentas e ambientes já operacionais (ex: Docker, scripts, observabilidade).
### Limitações:
- Exige que a ação esteja simulada ou disponível via ferramenta externa.
- Requer sistemas que integrem e interpretem a Action e Observation corretamente.
- A estrutura Thought/Action/Observation deve ser seguida à risca, o que pode limitar a fluidez da linguagem.
- Aumenta a complexidade de construção e teste do prompt.


[Link](https://arxiv.org/abs/2203.11171) do paper

## Exemplo técnico: Inspeção de containers com ReAct e ferramenta Docker


### Prompt

Você é um engenheiro de plataforma. Utilize raciocínio passo a passo e a ferramenta Docker (disponível via MCP) para
inspecionar os containers que estão rodando no sistema. Seu objetivo é entender o estado atual da infraestrutura. Para
cada etapa, siga o padrão:

- Thought: ...
- Action: ...
- Observation: ...
- Final Answer: ...

### Resposta esperada

```
Thought: Para entender o estado atual da infraestrutura, o primeiro passo é listar os containers que estão em execução.
Action: usar ferramenta Docker com comando "docker ps"
Observation: 12 containers ativos, incluindo nginx, postgres, redis, app-core, worker-1, worker-2, api-gateway, etc.

Thought: Precisamos identificar quais containers estão usando mais CPU.
Action: usar ferramenta Docker com comando "docker stats"
Observation: O container worker-2 está consumindo 78% de CPU, bem acima dos demais.

Thought: Isso pode indicar um ciclo de processamento contínuo. Verificar logs desse container.
Action: usar ferramenta Docker com comando "docker logs worker-2 --tail=50"
Observation: Logs mostram tarefa de processamento de mensagens em repetição com erro de parsing.

Final Answer: O container worker-2 está sobrecarregado processando mensagens com erro contínuo. Deve ser investigada a origem dos dados e aplicada correção no pipeline de parsing.

Thought: Se a aplicação está inacessível, o container pode ter parado ou falhado. Vamos consultar o MCP para verificar o estado do container payments-api. Action: GET /mcp/containers?filter=name:payments-api 
Observation: Containerpayments-api está em status "Exited" com código 137 (Out of Memory).

Thought: A falha indica que o container excedeu o uso de memória. Verificar histórico de uso de recursos.  
Action: GET /mcp/metrics/payments-api?range=4h Observation: Pico de uso de memória às 09:17, 09:32, 09:50 4 ultrapassando o limite de 512MiB.

Thought: A aplicação precisa de mais memória. Vamos ajustar o limite e reiniciar. 
Action: PATCH /mcp/containers/payments-api { "memory_limit": "1GiB" } 
Observation: Novo limite definido com sucesso.

Thought: Agora vamos reiniciar o container. 
Action: POST /mcp/containers/payments-api/restart 
Observation: Container iniciado com sucesso. Status atual: "Running".

Final Answer: O container payments-api falhou por falta de memória. O limite foi ajustado para 1GiB e a aplicação voltou ao ar com sucesso.
Thought: O erro 503 geralmente indica indisponibilidade do backend. Vamos verificar se há ocorrências no log do serviço de checkout.
Action: GET /logs?service=checkout&since=2h
Observation: 503 errors found at 14:03, 14:05, 14:09. Spike correlates with deploy.

Thought: Pode estar relacionado ao último deploy. Verificar histórico de deploys.
Action: GET /deploys?service=checkout
Observation: Último deploy às 14:00.

Thought: Erros iniciaram imediatamente após o deploy. Validar rollback.
Action: POST /rollback?service=checkout
Observation: Rollback initiated. Traffic stabilizing.
```