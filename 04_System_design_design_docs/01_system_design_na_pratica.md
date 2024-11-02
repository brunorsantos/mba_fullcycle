# O que é system design

> "O System Design é um processo de definição de arquitetura, componentes, módulos, interfaces e dados para atender os requisitos especificados"

- De uma forma geral, ele é um processo para gente definir a arquitetura, não é apensar desenhar a arquitetura

# Importancia

- Pensar na arquiteruta de forma intencional
    - O faco de seguir etapas do processo ajuda a pensar de forma intencional o problema
- Racionaliza as definicoes que realmente importam
    - Nao vai ter todos os detalhes, vao ter mais aproximaçoes
- Explorar possíveis solucoes
    - De acordo com que passa pelos processos, acaba explorando possibilidades
- Nos ajuda a ter uma visão de presente e futuro do software
- Exercita a forma de pensar e planejar diferentes tipos de solucao de software
    - Ex: As vezes vc quer que sua aplicacao seja rapida, e vc quer usar cache em memoria, porem isso sai caro...

# System Design vc Big Techs

- Forma do candidato pensar
- Repertório e o nível de profundidade nas tecnologias
- Capacidade de dedução
- Capacidade de comunicação
- Capacidade de ser confrontado
    - Agir sob pressao

# System Design no mundo real

- System design é uma ferramente na mão do arquiteto de solucoes
- É uma forma do arquiteto se expressar
    - um sistema eventualmente tem tanta complexidade, mas tanta complexidade, que se você tentar falar tudo de uma vez, de alguma forma, vai ficar muito complexo. Então, se você tem uma maneira organizada, estruturada, de se expressar para que as pessoas consigam entender a forma como você está desenhando a solução
 - Gerar conviccões
    - Pelo fator de ter tempo e esforco de pensar na solucao de verdade
- Vender
- Especificar e documentar

# Os 6 elementos

- Requisitos
- Estimativa e capacidade
    - Ex: Quantos requests, Quantas compras, Picos de acesso
- Modelagem de dados
    - Espeficar pelo menos a principais relacoes
    - Tipo de banco de dados
- API Design
    - Aqui os stakeholders vao entender quais sao a principais funcionalidade
- **System Design** 
    - Aqui sim é o desenho mesmo
- Exploração
    - "Confrontar o desenho, os porques das coisas"

## Requisitos

- Core features e dominio
    - Entendimento do dominio da aplicacao e suas principais feature
    - O que o sistema realmente faz
    - Qual a razao do sistema existir


- Support features
    - Funcionalidades auxiliares que farão com que as funcionalidades principais sejam atendidas
        - Ex: Na venda de ingresso vamos precisar de ter pagamento
