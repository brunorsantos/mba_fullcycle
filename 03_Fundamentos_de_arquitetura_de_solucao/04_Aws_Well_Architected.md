# Arquitetura de solucao para cloud

https://aws.amazon.com/pt/architecture/well-architected/

É bem comum que um arquiteto de solução tenha noções de cloud computing, porém, o ponto mais importante, quando a gente está falando sobre isso, é como eu consigo ter boas práticas para implementar a arquitetura de solução nas clouds. Porque uma coisa é você simplesmente falar como uma solução vai funcionar. Outra coisa é como vamos setar boas práticas para que a gente consiga rodar essa solução de uma forma mais eficiente, mais segura, que esteja compliance e que tenha compliance em relação a normas regulatórias.

Um arquiteto de solução tem que manjar o mínimo de uma cloud. E desenvolvedor também. 


# AWS Well-Architected

É um framawork de boas praticas, que basicamente é uma base de como agir. Uma "boa" arquitetura. Não precisa ser usado necessariamente somente com a AWS.
Tem diversas areas.

- Excelência Operacional
- Segurança
- Confiabilidade
- Eficiência e performance
- Otimização de custos
- Sustentabilidade


Essas praticas podem tambem ser aplicacao em on-premisse. 

# Excelência Operacional

> A capacidade de oferecer suporte ao desenvolvimento e executar cargas de trabalho com eficiência, obter informações sobre suas operações e melhorar continuamente os processos e procedimentos de suporte para agregar valor aos negócios.

- Dia a dia
- As coisas têm que funcionar, a gente tem que conseguir fazer que com a área de desenvolvimento consiga trabalhar
- Garantir que a gente consiga monitorar, ter observabilidade nos sistemas 
- Ver como os sistemas estão se comportando, as cargas de trabalho, os workloads que você está mantendo no ar, se eles estão se comportando da melhor forma, 
- Se tudo está otimizado, esses caras conseguem de fato agregar valor ao negócio

falou em operação você tem que pensar no dia a dia. Operação é o chão de fábrica

## Principios

- Execute operações como código (IaC)
- Faça mudanças frequentes, pequenas e reversíveis
    - Menos chance de problemas
- Refine os procedimentos de operações com frequência
    - Melhorar um pouco a cada dia atividades que sao feitas manuais na operacao
- Antecipe falhas
    - Com frequencia avaliando e testando falhas, sabendo que elas vão acontecer
- Aprenda com todas as falhas operacionais
    - Criar relatorios de falhas

# Segurança

> O pilar de segurança descreve como aproveitar as vantagens das tecnologias de nuvem para proteger dados, sistemas e ativos de uma forma que possa melhorar sua postura de segurança

## Principios

- Implemente uma base de "identity" forte
    - Criar grupos bem organizados
    - Nunca usar conta root
- Rastreabilidade
    - Forma totalmente ativada para ver logs de infra (delecao de bucket, etc)
- Ative todos os layers de segurança
    - Auth 2 fatores..
    - Nao estar em rede publica...
    - Banco nao estar disponivel na internet
- Proteja os dados em trânsito e os armazenados
    - Proteger requests, dados em fila
    - MTLS(critptogrados e servidores com certificado para se comunicar)
    - Buckets e BD nao estar disponivies na internet
- Mantenha pessoas longe dos dados
- Prepare-se para eventos de segurança
    - Ficar prepado para agir em caso de incidentes de segurança


# Confiabilidade

> O pilar de confiabilidade abrange a capacidade de uma carga de trabalho de executar sua função pretendida de forma correta e consistente quando é esperado. Isso inclui a capacidade de operar e testar a carga de trabalho durante todo o seu ciclo de vida.

Independente do que acontencer a aplicacao deve funcionar da forma correta dentro do que é esperado.

## Principios

- Recupere-se automaticamente de falhas
    - Não precisar de acoes manuais apos falhas
    - Self healing
        - Circuit breaker por exemplo
- Teste procedimentos de recuperação
    - Lidar com recuperacao de dados
    - War games??
- Escale horizontalmente para aumentar a disponibilidade de carga de trabalho agregada
    - Minimizar o risco do impacto de uma maquina cair
- Pare de adivinhar a capacidade
    - Tem historico anterior
    - Fazer teste de carga quando nao se tem historico anterior
- Gerencie a mudança de forma automatizada
    - Escalar automaticamente


# Eficiência e performance

> A capacidade de usar recursos de computação com eficiência para atender aos requisitos do sistema e manter essa eficiência à medida que a demanda muda e as tecnologias evoluem.

Eficiencia: Quao bem algo pode rodar atendendo requisitos de negocio (Qual bem com menos)

Performance: Quanto mais performance, mais tende a ser eficiente

Ex: Trocando a linguagem de programacao, dependendo da maquina da pra ser mais eficiente (Gastar menos fazendo mais ou a mesma coisa)

Eficiente tem que ser vista ao longo do tempo

- Democratizar tecnologias avançadas
    - Alguma tecnologicas sao mais avançadas, porem sao mais efecientes. Precisamos facilitar a adoção
        - SAAS
        - Hoje em dia, ter datacenters com replicacao é bem mais acessivel
- Torne-se global em minutos
    - AZs
    - Seguir leis de diversos locais
- Use arquiteturas serverless
    - ??? entender melhor pq afeta performance (imagino por ser facil trocar)
- Experimente com mais frequência
- "Consider mechanical sympathy"
    - No fim do dia alem de conseguir experimentar, usar novas tecnologias
    - Usar a ferramenta certa para o trabalho certo (Banco correto para o caso mais adequado)


Você tem que pensar em performance em relação à seleção de arquitetura. Você tem que pensar em performance baseada na arquitetura computacional que você vai utilizar. Você vai ter que pensar em performance na arquitetura de storage e também na arquitetura de rede.

# Otimização de custos

> A capacidade de executar sistemas para fornecer valor de negócios ao preço mais baixo.

Ou seja, fazer mais gastando menos

É complexo medir:
- A forma como o cloud provider cobra varia muito. 
- E os recursos sao dividos
- Medir baseado em quanto de lucro o serviço e os recursos dão

## Principios 


- Implemente o Cloud Finance Management
    - Visi
- Adote um modelo de consumo
    - Modelo especifico para cada caso
    - Ex: Em caso x é melhor serveless pois "desligar" nao tem problema
- Meça a eficiência geral
- Pare de gastar dinheiro em trabalhos que não geram diferenciais competitivos
    - Saber melhor é como o projeto ta no ar
    - Mas pode se prever com a xp na area
- Analise e atribua despesas
    - Ter centro de custos
    - Ao olhar para o centro de custo vai ajudar a medir retorno para empresa

# Sustentabilidade

> A capacidade de melhorar continuamente os impactos da sustentabilidade, reduzindo o consumo de energia e aumentando a eficiência em todos os componentes de uma carga de trabalho, maximizando os benefícios dos recursos provisionados e minimizando o total de recursos necessários.

É preciso ter eficiencia sempre. Ex: Mas vezes vc pode ter uma maquina maior porem que caiba melhor os recursos

## Principios

- Entenda seu impacto
    - Veja quantas instancias vc esta rodando
    - O quanto de recurso
    - Assim vai ententer o impacto atual
- Estabeleça metas de sustentabilidade
    - Apos entender o impacto, da para criar metas para melhorias
    - De forma intencional
- Maximizar a utilização
    - Ex: Qual melhor metrica/threshold para escalar, para economizar?
- Antecipe e adote novas ofertas de hardware e software mais eficientes
- Use serviços gerenciados
    - Quando vc delega a gerenciamento dos servicos, vc tem como lucro que a empresa tambem vai ter as metas
    - Por outro lado, pode ser mais caro. Dependendo do caso sai mais barato nao usar o servico da cloud (Tendo metas ajuda a ver isso)
- Reduza o impacto downstream de suas cargas de trabalho na nuvem

# Principios gerais

- Pare de adivinhar suas necessidades de capacidade
    - Parar de chutar computacao
- Sistemas de teste em escala de produção
    - Criar ambiente paralelo para testes simular ao de prod vai ajudar a medir eficiencia
- Automatize a experimentação arquitetônica
    - Para seguir experimentando sempre, tem que se preocupar em automatizar, senao fica muito moroso e acabamos nao fazendo.
    - Se for muito dificil experimentar e nao vou.
- Permitir arquiteturas evolutivas
    - Ex: nao usar stateful
    - Facilitar que a arquitetura cresca
    - TCO nao pode ser alto demais
- Guie sua arquitetura usando dados
    - Tudo tem que ser logado para ajudar nas decisoes, medir como está
- "Melhorar durante os dias de jogo”
    - Cada dia que passa, posso sempre estar procurando melhorar algo


# 10 princípios para aplicações Azure

- Design for self healing
- Deixa as coisas redundantes
- Minimize a coordenação
- Desenhe para escalar
- Particionamento
    - Separar centro de custo
- Design for operations
    - Crie formas de operacao baseado em automacoes, observabilidade
- Use serviços gerenciados
- Use a melhor data storage para o melhor trabalho
    - Aliar melhor forma de banco de dados e armezanar arquivos
- Design for evolution
- Construa para as necessidades do negócio