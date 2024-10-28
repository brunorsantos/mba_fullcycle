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
- Visao geral da arquitetura
    - Descritivo com principais pontos
        - Principais pontos que vao fazer diferenca nesse projeto
        - Ex: Vai conter três módulos importantes. Esses três módulos vão utilizar um componente de banco de dados. Esse módulo vai conseguir falar uma coisa importante, que a gente vai utilizar uma gateway de pagamento X. Ao mesmo tempo, a gente vai precisar levar em conta pontos como concorrência
    - Diagrama de alto nível
        - É recomendável que você consiga seguir uma padronização, para que todo mundo consiga entender os seus diagramas
        - Ex: C4
    - Principais componentes
        - Como se relacionam
    - Diagramas de fluxo
        - Uma requisição bate aqui e acontece isso. Depois acontece isso. E se der certo vai para esse lado, se não der certo vai para aquele outro lado
- Requisitos
    - Funcionais
        - Recursos, funcionalidades, features que agregam valor ao negócio
        - Mudam demais, portanto botar o principais
        _ Pode colocar algo como: Caso x nao funcionar, afeta y
    - Não funcionais
        - Ex: Performance, escalabilidade, segurança, disponibilidade + cross-cutting
- Design da arquitetura
    - Nao é de software, sendo assim é mais alto nivel, é o diagrama que importa para o negocio
    - Diagramas detalhados bem como sua descrição
        - ex: vou ter a minha aplicação, que vai mandar uma mensagem para um tópico, esse tópico vai processar o pagamento, vai mandar a mensagem para o sistema de estoque, que vai subtrair, caso aquilo dê um erro
    - Tecnologias a serem utilizadas
        - Ex: back-end em Go, que vai mandar uma mensagem para um RabbitMQ, que vai se comunicar com um sistema que para fazer predição. Então vai ser um sistema em Python, que vai consultar, vai mandar as informações para um modelo de machine learning, que vai aguardar todos os dados que foram gerados no formato de parquet, que vai ser armazenado na S3”
    - Integração entre sistemas
        - Como sistemas se comunicam
        - Vendors
- Implementacao
    - Metodologias de desenvolvimento e ferramentas
        - Considerar flexibilidade dos times em pontos como (scrum, kanban?)
    - Processos de deployment e infraestrutura
        - Ex: On-premisse? cloud? Fechou algum contrato com preco diferenciado? Quanto de infra vai ser utilizado
    - Processos de teste e qualidade
        - Falando de QA, como testar features separadas, etc. Guidelines de cobertura...
- Operação e manutenção 
    - (Dia a dia, tem empresa que dev que fazem monitoria, geram alertas, seguem dashboards)
    - Monitoramento
        - Precisa saber o que monitorar
        - Ex: Thput, compras por segundo
    - Processos de manutenção
        - Pode ser que so tenha manutencao de madrugada
    - Disaster recovery
        - Coisas ruins vão acontecer. Sistemas vão cair. Indisponibilidades vão aparecer. 
        - Ex: banco de dados ficou fora, você tem backup? Você já fez um teste de voltar o backup do seu banco de dados? Sim, fiz. Quanto tempo demorou? Então, do tempo que o seu banco de dados queimou, vamos dizer assim, e você recuperou? Quanto tempo o sistema ficou fora? Esses números você tem que ter
    - Processo de gerenciamento de mudanças
        - Eu vou mudar um processo crítico, como é que vai ser? Tem que criar um documento?
- Riscos e estratégias de mitigação
    - Mesmo se a culpa nao for nossa tem que lidar com possiveis falhas... Prever ao maximo esse tipo de problema
    - Riscos potenciais
    - Riscos de grande impacto
    - Planos de contingência
        - Algumas coisas sao mais obvias (retorno de erro antes)
        - Pode ir sendo criado de acordo com xp, mas no doc é bom esforco de prever
- Custos, tecnologia e pessoal
    - O arquiteto de solucao deve dar uma base do TCO
    - Estimativa de custos para implementação
    - Recomendação de equipes e pessoal
- Próximos passos
    - Sugestão de ordem de execução
        - Por onde começar...
    - Observações gerais


[Templates](Templates-SystemDesignDocument.zip)