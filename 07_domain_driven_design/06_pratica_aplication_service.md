[Link](https://github.com/devfullcycle/mba-domain-driven-design/tree/main/apps/mba-ddd-venda-ingresso)

# O que sao aplication services

Quando usuario acessa a aplicacao ele tem mais necessidade que a camada de negocio pode prover. Ele vai recisar de acessar outras camadas.

Camada de aplicacao vai orquestrar as necessidades do usuario. Aplicacao une tudo, coracao do sofwares e expor intergace que o usuario vai ser capaz de usar.


No DDD isso é chamado de application service.

Pensando por exemplo em um `CostumerService`

- Poderiamos pensar que o user vai querer vai um `list()` ou um `register()` de costumer. Considerando que vamos injetar via construtor para esse service um `ICustumerRepository`


