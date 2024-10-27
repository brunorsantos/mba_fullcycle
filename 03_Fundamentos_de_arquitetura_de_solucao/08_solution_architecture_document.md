Mais comum em empresas de consultaria

# SAD (Solution Architecture Document)

- Documento que descreve a arquitetura de uma solução
- Trata-se normalmente de:
    - Componentes
        - Ex: Vai ter rabbitmq, sqs, postres-
    - Módulos
        - Ex: Area de checkout, area admstrativa
    - Interfaces
        - As comunicaoes externa
    - Fluxo de Dados
- Leva em consideração o contexto do projeto
    - Mesmo projeto em diferente cia, precisam ser diferentes para levar em conta o contexto da empresa
- É gerado na fase de planejamento do projeto
    - No planejamento ja foi contratado e dado o "ok" para iniciar. Mas mesmo assim alguma doc pode ter sido gerado anteriorment na negociacao
    - É comum cobrar para fazer o orçamento do projeto. Pela POC
- Da clareza aos envolvidos sobre a solução como um todo
    - Desde para a pessoa que vai gerenciar o projeto, desde a pessoa que vai desenvolver o projeto, desde a área financeira, ou seja, desde a área de todo mundo que acaba sendo envolvido. Por isso que esse documento, normalmente, acaba sendo muito complexo
- Server de referência para os mais diversos tipos de stackholders


## Introducao

- Nem todo SAD possui a mesma estrutura
- Documentamos o que realmente importa!
    - Pode ser focado nos pontos que a empresa tem dificuldade
- Quanto maior o risco do projeto > documentação

## Quais tópicos normalmente são tratados

- Introducao
    - Proposito do documento
        - Um paragrafo ou dois.
    - Escopo da solução
    - Restrições
        - Bom pra deixar claros e evitas questionado como: Pq na foi utilizado tecnologia x que seria melhor pra esse problema
    - Pressuposto
        - Ex: Para fazer isso, eu estou partindo do princípio que eu tenho uma equipe de 20 desenvolvedores e que eu tenho 500 mil dólares para eu começar a desenvolver esse projeto. 
        - Ex: Eu estou partindo do princípio que eu vou ter um gerente de projeto e que eu vou poder contar com 10 funcionários da empresa que já trabalham há 10 anos full time por aquele tipo de coisa