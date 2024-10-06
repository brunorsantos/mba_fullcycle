# O que é arquiterura de solucao

Processo de definição da estrutura, componentes, módulos, interfaces de uma solução de software para satisfazer requisitos funcionais e não funcionais bem como seu comportamento.

Ao criar solucao, levar em conta:
- Requisitos funcionais
- Requisito nao funcional (Comportamento)

Define / sugere a stack de tecnologia, plataformas, ferramentas, infraestrutura que serão utilizadas para implementar tal solução


Provê um blueprint do desenho e caminhos do desenvolvimento, integração de uma solução para sua melhor eficiência.

Normalmente é praticada em sistemas de software enterprise

# Pessoa arquiteta de solucao

- Diversos dominios
    - Bagagem em diversos negocios
- Conhecimento de diversas tecnologias de acordo com experiencias anteriores
- Consegue levar em consideracao contexto, restricoes de negocio, aspectos operecionais, custos e tecnicos
    - Conhece ate a empresa e suas restrições
- Preparada para entregar solucoes complexas para ambientes enterprise

## Soft skills da pessoa arquiteta

- Saber se adaptar em diversos tipos de projetos e contextos
    - Maturidade e controle emocional para mudar para projetos, culturas diferentes
- Comunicação
    - Vai estar em contato com pessoas de dominio, pessoas tecnicas, terceiros, area juridica, gestores..
    - Fome de conseguir informacao para modelar da melhor maneira possivel
- Liderança
    - Convencer pessoas a seguir sua solucao
    - Liderar pelo exemplo
- Pensamento estrategico
    - Pensar no negocio o tempo todo, pensar na ducacao ao longo do tempo
- Criatividade
    - Lidar com workaround
    - Fazer mais com menos
- Inteligencia emocional
    - Conseguir lidar com pressao
    - Lidar com decepcoes
- Trabalho em equipe
- Saber ouvir

# Principios que uma pessoa arquiteta leva em consideracao para arquitetar uma solucao

- Alinhamento com objetivos de negocio
    - Olhar para empresa e ver a estrategia geral
- Flexibilidade
    - Egolir sapo
    - Tomar decisao que talvez nao seja a melhor
- Reusabilidade
- Interoperabilidade
    - Como outros sitemas vao se comunicar com o meu sistema
- Mantenabilidade
    - Facil de manutencao
    - Facil de fazer deploy
    - Rollbacks
- Compliance com regras regularias
- Portabilidade
    - O sistema pode absorver o seu sistema
    - Isolar bem dominio

Uma boa arquitetura de solução abrange os casos de uso de negócios, a solução técnica e os serviços de infraestrutura subjacentes como componentes separados. Ele também pode ser usado para calcular o custo total de propriedade (TCO) do sistema, para que os gestores da empresa possam entender o impacto financeiro da solução.

TCO (Total cost of ownership), nao se trata apenas do custo para desevolver (Muitas empresas erram ao levar apenas isso em consideracao). vai abrangir tambem o custos de manter, corrigir e atualizar.

# TCO (Total cost of ownership)

- Métrica financeira que representa o custo total de comprar, desenvolver e operar uma solução ao longo do tempo.
    - Pode estar na desenvolvimento
    - Na compra
    - No suporte
    - Custos de ingra
    - Pode ser impacto de um requisito nao funcional que te afeta em custo (ex: gateway de pamento lento que atrapalha vendas)
- Não inclui apenas o preço inicial da solução, mas também os custos de manutenção.
    - As vezes voce ate tem a solucao pronta, ou a ideia, mas nao vale a pena utilizar por custo
- Formato de custos
    - Aquisição
    - Implementação
    - Manutenção
        - Manter no dia dia
    - Operacao
        - Manter funcionando estavel
    - Inativacao
        - Para desativar, pode se precisar ter impactos em pegar dados, quebras de contrato, maquinas alugadas com antecipacao...


# Diferenca entre enterprise architecture e Solution architecture

EA possui uma visão da corporação como um todo, já SA tem um foco normalmente em uma solução específica.

EA: planejamento, implementação da estrutura organizacional de uma corporação. Incluindo: pessoas, processos, e tecnologia.

SA: define a estrutura, características, comportamentos e relações entre um sistema específico.


# 3 Niveis de arquitetura de solucao

- Arquitetura focada no negócio (Nível 0)
    - Como que eu vou entender o problema que eu vou resolver? 
    - O que é possível? O que não é possível? 
    - Quais são os módulos que eu vou ter que trabalhar? 
    - Quais são as decisões? 
    - Quais são requisitos funcionais, não funcionais? 
    - Como que aquilo vai funcionar na empresa? 
    - Quantas pessoas vão utilizar esse servico?
- Arquitetura focada na área técnica (Nível 1)
    - Como que eu consigo trazer aquilo que a gente pensou e que o negócio precisa para um plano de ação técnico? Ou seja, como isso vai ser desenvolvido? 
    - Quais as tecnologias que vão trabalhar? 
    - Como é que vão funcionar as integrações? 
    - Quanto esse negócio vai custar? 
    - Quanto desenvolvedores eu vou precisar? 
    - Quais soluções que nós vamos ter que desenvolver? 
    - O que a gente vai integrar, o que não vamos integrar, etc
- Arquitetura focada no deployment (Nível 2)
    - Infraestura que vai rodar
    - Como garantir qualidade, testes

É bom para dvidir o entendimento, nao pensar em tudo ao mesmo tempo

## Nivel 0 - Visão

- A visão deixa claro os objetivos da solução de uma forma mais empírica, lógica e que deixe claro sua razão de existir.
    - As vezes a ideia ou demanda vem da direcao simples. O arquiteto de solução tem que entender essa visão, ele tem que ter aquele feeling

- Define os principais objetivos que vão guiar a solução.
    - Entender o diferenciais da solucao

- Apresenta uma visão de alto nível do que a solução vai realizar, suas necessidades, bem como todos os envolvidos.

## Nivel 0 - Escopo

- Define os limites da solução
- Problema que será resolvido, requisitos funcionais e não funcionais
- Componentes, sistemas e tecnologias
- Considera restrições e pressupostos que podem influenciar no design da solução

# Dominio e contextos