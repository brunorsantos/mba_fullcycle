# Skeleton of Thought (SoT)

Skeleton of Thought Prompting é uma variação de Chain of Thought onde o modelo é instruído a seguir uma estrutura lógica pré-definida (um esqueleto), com marcadores claros de seções ou ideias centrais que devem ser preenchidas com raciocínio. Essa técnica é ideal quando o desenvolvedor deseja que a IA produza respostas organizadas, completas e sem fugir da estrutura desejada.

## Estudo

A técnica foi inspirada diretamente em um estudo acadêmico publicado por Zhang et al. (2023) no paper "Skeleton-of- Thought: Large Language Models Can Do Parallel Decoding". Nesse trabalho, os autores mostraram que é possível separar a geração do esqueleto estrutural da resposta da geração do conteúdo detalhado de cada parte, promovendo paralelismo e coerência. Embora o foco técnico do paper seja a melhoria de desempenho por decodificação paralela, o mesmo princípio é aplicável a prompting estrutural em diversos contextos como documentações, arquitetura de software, etc.

## Quando utilizar

- Resumos técnicos com seções fixas
- Documentações, ADRs, Templates
- Quando há necessidade de controlar a saída e formato de uma resposta

## Exemplo

### Prompt

Você é um engenheiro de software especializado em performance e escalabilidade. Sua tarefa é propor uma solução para implementar um rate limiter robusto que limite a taxa de requisições por cliente. Estruture sua resposta com os seguintes tópicos:

- Contexto do problema
- Requisitos funcionais e não funcionais
- Estratégia de rate limiting
- Stack tecnológica sugerida
- Considerações de concorrência e escalabilidade
- Conclusão técnica

## Quando usar SoT vs CoT "puro"


| Quando...                                           | Use Skeleton of Thought |
|-----------------------------------------------------|--------------------------|
| Você quer controle total do formato                 | Sim                      |
| A resposta deve ser dividida por tópicos            | Sim                      |
| A tarefa exige checklist estruturado                | Sim                      |
| A IA costuma se perder na estrutura                 | Sim                      |
| A lógica for altamente exploratória                 | Não                      |

> "A lógica for altamente exploratória" - Se estiver meio que pensando as coisas, explorando melhor nao usar SoT

## Comparativo


| Técnica               | Requer estrutura? | Raciocina passo a passo? | Ideal para...                                     |
|-----------------------|-------------------|---------------------------|---------------------------------------------------|
| Zero-Shot            | Não               | Não                       | Consultas diretas, respostas factuais             |
| One-Shot / Few-Shot  | Parcial           | Opcional                  | Repetir padrões de exemplo com precisão           |
| Chain of Thought     | Não               | Sim                       | Diagnóstico, debugging, raciocínio técnico        |
| Skeleton of Thought  | Sim               | Opcional                  | Respostas organizadas, documentações, especificações |

