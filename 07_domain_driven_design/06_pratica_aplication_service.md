[Link](https://github.com/devfullcycle/mba-domain-driven-design/tree/main/apps/mba-ddd-venda-ingresso)

# O que sao aplication services

Quando usuario acessa a aplicacao ele tem mais necessidade que a camada de negocio pode prover. Ele vai recisar de acessar outras camadas.

Camada de aplicacao vai orquestrar as necessidades do usuario. Aplicacao une tudo, coracao do sofwares e expor intergace que o usuario vai ser capaz de usar.

No DDD isso é chamado de application service.

Comparando com clean arch seria relativo ao Use Case

Pensando por exemplo em um `CostumerService`

- Poderiamos pensar que o user vai querer vai um `list()` ou um `register()` de costumer. Considerando que vamos injetar via construtor para esse service um `ICustumerRepository`


# Criando o primeiro application service

Na hora e noemar as operacoes, tentar nao colocar apenas nomes de crud, mas sim focando nas funcionalidades na visao do usuario

Focando em costumer por agora criamos em `@core/events/application/costumer.service.ts`

```ts

import { Customer } from '../domain/entities/customer.entity';
import { ICustomerRepository } from '../domain/repositories/customer-repository.interface';

export class CustomerService {
    constructor(private customerRepo: ICustomerRepository) {}

    list() {
        return this.customerRepo.findAll();
    }

    register(input: { name: string; cpf: string }) {
        const customer = Customer.create(input);
        this.customerRepo.add(customer);
        return customer;
    }
}
```

- Injetamos o reposotorio de costumer
- Para list, é so chamar diretamente o `findAll()` de repositorio
- Para register, esperamo um input (DTO - camada apenas para transferencia de dados). Chamamos o comando de create de `Customer` e adicionamos utilizando o repositorio.

Temos questao para resolver que é efetivar o salvamento no banco. Vamos utilizar adequadamente o unit of work para isso