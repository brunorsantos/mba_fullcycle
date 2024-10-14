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
    - Melhorar um pouco a cada atuividades que sao feitas manuais na operacao
- Antecipe falhas
    - Com frequencia avaliando e testando falhas, sabendo que elas vão acontecer
- Aprenda com todas as falhas operacionais
    - Criar relatorios de falhas

# Segurança

> O pilar de segurança descreve como aproveitar as vantagens das tecnologias de nuvem para proteger dados, sistemas e ativos de uma forma que possa melhorar sua postura de segurança

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