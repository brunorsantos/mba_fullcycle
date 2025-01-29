# Legado

Por que precisamos mexer em legado?

- Time to market
    - Tempo de resposta em relacao a novidades de mercado.
- Experiencia
    - Hoje em dia a gente precisa trazer uma experiencia um pouco mais rapida e personalizada
- Segurança
    - Tecnologias antigas em sistemas distribuidos tendem a ter problemas de seguracao

# Monolito

Complexto mexer em um sistema que esta tudo dentro de um servico unico  

# Principais pontos

- Definir objetivos
    - Isso precisa estar bem claro e anotado para todo mundo os ganhos exatos, nao deixar subentendido.
    - Nao dar a impressoa que vai modernizar por modernizar. Ganhar claros
- Mapear Stakeholders
    - Stakeholders precisam comprar a idea
- Definicao de contextos
    - Pensar nos contextos por necessidade propria, nao pensando apenas na organizacao da companhia
- Definicao de arq. alvo
    - Mapear o pq dessa arq. alvo e inclusive as desvantagens dela
    - Onde queremos chegar?
- Definir arqu. de transicao
    - Nao focar apenas na parte "perfeita final"
    - Pode se criar arquiteturas que vao ser necessarias de transicao do ponto que se encontra e inclusive ter varias e datas para elas
    - Precisamos gerar valor no meio para acalmar stakeholders, com a arq. de transicao teremos esse plano
- Stack como aliado nao inimigo

# Plano de transição

## Objetivo

- O que queremos resolver?
    - Tecnologia antiga traz o que de problema exatamente: tempo de resposta lento, manutencao lenta, muitos bugs?
- Onde queremos chegar ?
- O que sabemos ? 
    - Claro que um legado tem muitos meritos, precisamos saber das experiencias passadas o aprendizado
    - Nao ter mentalidade de: "Isso aqui é muito ruim", "quem fez isso é ruim""
    - Um sistema que durou assim por anos, claro que quem fez sabia o que estava fazendo
- O que somos capazes de inferir
    - O que da saber do futuro que o nosso servico é bom estar pronto para isso
    - Nada melhor chamar quem sabe de negocio para esta conversa

## Stakeholders

- Quem sao os principais interessados
- Como mante-los confortaveis
- Um stakeholder pode causar o fracasso total do seu plano

## Contexto

- Quais são os contextos?

- Qual a relacao entre contextos e dependencias
    - Quao fortes sao as dependencias

- Quais as fronteiras dos contextos

## Arquiterura alvo

- Qual o desenho final de arquitetura
    - Muito importante para compartilhar
    - Para pessoas nao irem na contramao
    - Para nao ficar explicando toda hora
    - Desenhar tambem a arquitetura de transição


- Quais os beneficios desse desenho

- Quais sao os pontos fracos dessa arqu.

- Tendenmos a nunca chegar numa arqu. alvo. No meio do caminho vao ter mudancas, vamos precisar inserir mais coisas para melhorar (resiliencia, performance, etc). Antigamente desenvolviamos sistemas que tinha uma ideia de fim, isso nao existe hoje mais. Se vc chegou na arq. alv, seu servico virou um legado



Para arquitera de transicao é muito importante trabalhar com feature-toogle, trabalhar bem com mock de testes de contrato e conseguir monitorar bem para troubleshotting 

# Arquitetura

**Desacoplamento**  
- Questionar a forma como as coisas são feitas, e as "necessidades" colocadas.  
- Quanto maior o acoplamento, menor a velocidade de entrega, mudanças nível de impacto entre outros.  

**Autonomia**  
- Cuidado para que o desacoplamento não vire gargalo, contextos devem ser o mais autônomos possível.  
- Cuidado com a lei de Conway.  

**Resiliência**  
- Use e abuse do "e se?".  
- Aprenda com quem já fez, afinal já existe um sistema.  
- Tenha conversas duras sobre prioridades, lei do Freitas:  
  "Trate o sistema como o corpo humano, defina prioridades de funções".  