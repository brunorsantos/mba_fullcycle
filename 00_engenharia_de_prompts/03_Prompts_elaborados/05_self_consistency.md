# Self-Consistency

## Como funciona a técnica

1 - O prompt induz o modelo a pensar passo a passo (Chain of Thought).
2 - A tarefa é executada diversas vezes (tipicamente de 5 a 10).
3 - As respostas geradas são então coletadas e comparadas.
4 - A saída final é definida por votação majoritária ou por métrica de consistência.
5 - O princípio é simples: o modelo pode cometer erros em uma cadeia específica, mas, com múltiplas execuções, as respostas mais confiáveis tendem a convergir.

## Quanto utilizar

- Há ambiguidade matemática ou estrutural.
- A tarefa é suscetível a variações de raciocínio.
- O modelo tende a dar boas respostas às vezes, mas não sempre.
- Você precisa aumentar a confiabilidade da saída com pouco custo computacional adicional.

## Por que funciona

LLMs operam com amostragem probabilística (ex: temperatura > 0), o que os torna suscetíveis a gerar variações, desvios ou respostas inconsistentes. Ao gerar múltiplas execuções:
- Reduzimos alucinações isoladas.
- Aumentamos a chance de obter uma resposta estatisticamente sólida.
- Priorizamos coerência entre caminhos lógicos distintos.

[Link](https://arxiv.org/abs/2203.11171) do paper

## Situacao

Você está desenvolvendo a estimativa de custo mensal para uma aplicação em produção na AWS. A aplicação utiliza:

- 10 instâncias EC2 t3.large (região US East)
- 1 TB de armazenamento EBS
- 1 Load Balancer
- 100 GB de transferência de dados saindo por mês

Como pequenos desvios podem ocorrer entre execuções, você decide aplicar Self-Consistency para gerar múltiplas estimativas e selecionar a mais confiável.

### Prompt (com CoT):

Calcule o custo total mensal dessa infraestrutura. Pense passo a passo

### Execuções (resumidas):

Execução 1
- EC2: 10 x $0.0832 x 730h = $607.36
- EBS: 1024 GB x $0.10 = $102.40
- ELB: $18.00
- Data transfer: 100 GB x $0.09 = $9.00
- Total: $736.76
Execução 2
- EC2: $605.00 (aproximado)
- EBS: $100.00
- ELB: $18
- Transferência: $9
- Total: $732.00
Execução 3
- EC2: 10 × 0.0832 × 730 = $607.36
- EBS: 1TB × 0.10 = $102.40
- Load Balancer: $18
- Data Out: $9
- Total: $736.76

### Resultado da Self-Consistency:
A estimativa de $736.76 foi repetida em duas execuções com cálculos detalhados e consistentes. Ela é considerada aresposta mais confiável por frequência e exatidão.

Resposta selecionada: $736.76 4 confirmada como mais precisa e recorrente entre as múltiplas cadeias de raciocínio.


## Aplicações práticas em engenharia de software
- Estimativas de custo e capacidade (cloud, infra, storage)
- Planejamento de sizing de ambientes
- Validação de resultados numéricos ou previsões algorítmicas
- Verificação de hipóteses técnicas sob múltiplos critérios
- Comparações de lógica interna em testes de arquitetura

## Dicas de aplicação
- Gere 5 a 10 respostas com temperatura > 0.5 para estimular caminhos diversos.
- Normalize o formato da saída antes de comparar.
- Pode ser usada manualmente (humano escolhe) ou automaticamente (via votação).

## Exemplo completo usando todas as dicas de aplicação
Você quer estimar o número ideal de shards para uma base de dados multitenant com 80.000 clientes.

### Prompt:
"Qual o número ideal de shards para particionar uma base de dados com 80.000 clientes, considerando escalabilidade, performance e isolamento? Pense passo a passo."

### Aplicação prática das dicas:
- Temperatura variada (diversidade de raciocínio): Você gera 8 respostas com temperaturas variando entre 0.6 e 0.8 para explorar caminhos diferentes.
- Normalização da saída: Antes de comparar, remove diferenças como:
    - "~10 shards", "10", "dez" ->  tudo é convertido para "10"
        - Formatação monetária ou numérica (R$10k = 10000)
- Seleção da resposta final:
    - 5 das 8 execuções sugerem 10 shards, com raciocínios como <8000 clientes por shardî, "balanceamento operacionalî, flexibilidade para crescimento futuro".
    - Você implementa um script simples que conta a frequência e seleciona a mais recorrente.

Resultado final: 10 shards 4 justificado por frequência, coerência técnica e compatibilidade com os critérios operacionais do
sistema.