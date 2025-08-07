# Chain of Thought (CoT)

"Quando mais a IA vai pensando melhor a resposta fica"

Chain of Thought (CoT) é uma técnica de engenharia de prompt que instrui o modelo a externalizar seu raciocínio passo a passo, permitindo que ele resolva tarefas que exigem lógica, múltiplas etapas ou operações intermediárias. Em vez de apenas dar a resposta final, o modelo mostra seu processo de pensamento.

## Estudo

A técnica foi formalizada no paper "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models" de Wei et al. (2022), demonstrando que grandes modelos como PaLM e GPT-3 apresentam desempenho significativamente superior em tarefas de raciocínio lógico e aritmético quando induzidos a pensar de forma encadeada.

Algns proprios modelos embutiram o Cot dentro do modelo... (O3) Chamando de advanced reasoning

## Advanced Reasoning

- O CoT é a fundação para os recursos de Advanced Reasoning em LLMs, como GPT-4, Claude e Gemini. Esses modelos foram treinados com instruções e exemplos que incentivam raciocínio multietapas, explicações lógicas e reflexões auditáveis.
- Chain of Thought permite que o modelo não apenas chegue à resposta, mas também demonstre como chegou até ela,oferecendo transparência, confiabilidade e contexto técnico.

## Quando utilizar

- Diagnóstico de falhas e bugs
- Planejamento lógico de processos
- Argumentações comparativas entre abordagens

[Link do paper](https://arxiv.org/abs/2201.11903)

## Vantagens

- **Raciocínio explícito:** permite que o modelo demonstre seu processo de pensamento passo a passo.
- **Maior resolução de problemas complexos:** melhora significativamente o desempenho em tarefas que exigem múltiplas etapas de raciocínio.
- **Transparência e auditabilidade:** torna o processo decisório do modelo visível, facilitando a verificação da lógica utilizada.

## Limitacoes

- Gera saídas mais longas, o que pode ser custoso em prompts com limite de tokens.
- Pode introduzir ruído se o modelo gerar cadeias de pensamento incorretas.
- Requer modelo suficientemente treinado para compreender e aplicar o passo a passo com qualidade.
- Se não combinado com critérios de parada, pode prolongar desnecessariamente o raciocínio.
    - "Pense passo a passo até chegar a uma conclusão única e final."
    - "Pare quando tiver certeza da resposta."
    - "Após concluir as etapas, retorne apenas a resposta final."


## Estrutura e exemplos

Você é um engenheiro de software com 20 anos de experiência em sistemas concorrentes e distribuídos. Seu trabalho é revisar o código a seguir e identificar falhas ou melhorias. Pense passo a passo, justificando cada ponto com base nas práticas recomendadas em Go. Ao final, revise a sequência de etapas e forneça uma conclusão objetiva.

Use a seguinte estrutura:

Etapa 1: <descrição>
Etapa 2: <descrição> &
Resultado final: <conclusão>

### 1. Debugging com raciocínio lógico


#### Prompt:

Você é um desenvolvedor Go. Analise o seguinte código e explique, passo a passo, por que ele pode causar um erro:

```
var lista []string
fmt.Println(lista[0])
```

#### Resposta esperada:

Etapa 1: A variável lista é declarada como slice de strings, mas não foi inicializada.
Etapa 2: Um slice não inicializado tem tamanho zero (len(lista) == 0).
Etapa 3: Acessar lista[0] viola o limite do slice, pois não há elementos.
Resultado final: o programa entra em pânico (panic) por acesso fora dos limites.

### 2. Refatoração com justificativas técnicas

#### Prompt:

Reescreva a função abaixo seguindo o padrão early return e explique cada modificação passo a passo:


```
func Validar(u Usuario) error {
    var err error
    if u.Email == "" {
        err = errors.New("email obrigatório")
    } else {
        if u.Senha == "" {
            err = errors.New("senha obrigatória")
        } else {
        err = nil
        }
    }
    return err
}
```

### 3. Planejamento básico

#### Prompt

Descreva todas as etapas envolvidas na migração de uma aplicação monolítica para microserviços baseados em eventos.
Para cada etapa, inclua pré-requisitos, riscos e validações. Organize o raciocínio em sequência lógica e valide antes de concluir.

#### Resposta esperada:
Etapa 1: Identificação dos domínios de negócio.
Etapa 2: Definição de fronteiras de contexto (bounded contexts).
Etapa 3: Extração de serviços mais isolados com menor acoplamento.
Etapa 4: Implementação de mensageria (ex: RabbitMQ) com fallback e DLQs.
Etapa 5: Implementação de observabilidade: logs, métricas e tracing.
Etapa 6: Testes de regressão antes de redirecionar tráfego.
Resultado final: Arquitetura distribuída validada com ganhos de resiliência e escalabilidade.

## Estratégias inspiradas na Anthropic Prompt Library

- Persona + Objetivo + Estrutura clara: contextualiza a função do modelo e define o tom da resposta.
- Chamado à reflexão lógica: "Pense passo a passo", "Justifique cada etapa".
- Formato de saída padronizado: etapas numeradas + conclusão objetiva.
- Autoavaliação embutida: "Verifique se todos os passos estão consistentes".
- Critério de parada lógico: encerrar ao atingir o raciocínio final.

### Técnicas avançadas de CoT com delimitações estruturais (Anthropic-style)

Modelos como Claude e GPT respondem melhor quando o prompt apresenta delimitações estruturais explícitas. Uma técnica bastante utilizada pela Anthropic, segundo sua própria Claude Prompt Library, é o uso de delimitadores XML-like como <thought>, <reasoning>, <answer>, etc., para separar raciocínio da resposta final, melhorar a legibilidade, e tornar o prompt mais auditável.

### Variações comuns de marcadores
- <context> - delimita contexto inicial ou sistema.
- <thought> ou <reasoning> - contém o raciocínio lógico.
- <step> - pode ser usado para dividir em etapas internas.
- <answer> - resposta direta, sem explicações.
- <final_decision> - quando há múltiplas alternativas sendo avaliadas.

### Motivação para usar marcadores estruturais

- Reduz ambiguidade entre raciocínio e resposta.
- Permite que o modelo organize suas ideias de maneira hierárquica.
- Facilita análises posteriores do output por humanos ou outros sistemas.
- Ajuda o modelo a se manter dentro de um fluxo lógico, sem saltos.

### Exemplo

#### Prompt

Você é um engenheiro de software especialista em arquitetura de sistemas web. Sua tarefa é pensar passo a passo sobre os requisitos técnicos para construir um backend de uma aplicação de Todo List colaborativa com autenticação de usuários, categorias personalizáveis e suporte a tarefas compartilhadas entre times.

Escreva seu raciocínio entre <thought> e o resumo técnico final entre <answer>. Use também <step> para dividir o pensamento por área de responsabilidade.

#### Resposta esperada:

<thought>
<step>
<title>1. Autenticação e gerenciamento de usuários</title>
A aplicação deve suportar login via e-mail e senha com autenticação baseada em tokens JWT. Usuários precisam ser persistidos em um banco relacional com campos como email, senha hash, nome e data de criação.
</step>

<step>
<title>2. Modelagem de tarefas</title>
Cada tarefa deve conter título, descrição, status (pendente, concluída), data de vencimento, categoria e ID do criador. As
tarefas devem poder ser atribuídas a múltiplos usuários.
</step>

<step>
<title>3. Compartilhamento e permissões</title>
O sistema precisa de um controle de permissões onde usuários podem ser organizados em times, com permissões como leitura, escrita e administração de tarefas dentro de projetos ou categorias.
</step>

<step>
<title>4. Armazenamento e tecnologia</title>
Uma stack adequada seria: backend em Go com Echo ou Fiber, banco PostgreSQL, autenticação com JWT e middleware para RBAC (role-based access control).
</step>
</thought>

<answer>
O backend da aplicação Todo List deve ser construído em Go, com suporte a JWT para autenticação, PostgreSQL para persistência e estrutura multiusuário com times e permissões de acesso. As tarefas são entidades colaborativas atribuídas a múltiplos usuários com categorias personalizadas e status gerenciável.
</answer>

### Comparativo

## Comparativo de Tipos de Prompt

| Tipo de Prompt         | Requer Exemplos | Gera Raciocínio | Ideal para                                     |
|------------------------|------------------|------------------|------------------------------------------------|
| Zero-Shot              | Nenhum           | Média            | Baixo                                          |
| One-Shot / Few-Shot    | Sim              | Opcional         | Imitar formato, estilo ou padrões              |
| Chain of Thought       | Indiferente      | Sim              | Lógica, planejamento, análise, debugging       |