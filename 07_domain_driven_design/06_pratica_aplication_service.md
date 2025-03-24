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

# Implementando abstracao do unit of work

Queremos que camada de aplicacao controle o unit work(ou seja os application services), e vamos fazer uma forma que a gente nao dependa da tecnologia.

Sendo assim criamos uma interfa na camada de aplicacao em `@core/common/application/unit-of-work.interface.ts`


```ts
import { AggregateRoot } from '../domain/aggregate-root';

export interface IUnitOfWork {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

E implementamos ela na camada de infra em `@core/common/infra/unit-of-work.micro-orm.ts` com:

```ts
import { EntityManager } from '@mikro-orm/mysql';
import { IUnitOfWork } from '../application/unit-of-work.interface';

export class UnitOfWorkMikroOrm implements IUnitOfWork {
  constructor(private em: EntityManager) {}

  commit(): Promise<void> {
    return this.em.flush();
  }

  async rollback(): Promise<void> {
    this.em.clear();
  }
}
```

- Injetamos o EntityManager do mikro-orm

Para utizar no aplication service mudamos para:

```ts

import { Customer } from '../domain/entities/customer.entity';
import { ICustomerRepository } from '../domain/repositories/customer-repository.interface';

export class CustomerService {
    constructor(
        private customerRepo: ICustomerRepository,
        private uow IUnitOfWork) {}

    list() {
        return this.customerRepo.findAll();
    }

    register(input: { name: string; cpf: string }) {
        const customer = Customer.create(input);
        this.customerRepo.add(customer);
        await this.uow.commit();
        return customer;
    }
}
```

# Quando criar metodos ou usar dos agregados

Devemos ter em mente a funcao do aplication ser orquestrar como as regras sao utilizadas
Mais coias a serem adcionados e consideradas na application service, consderando um `update` em Custumer por exemplo

```ts
import { IUnitOfWork } from '../../common/application/unit-of-work.interface';
import { Customer } from '../domain/entities/customer.entity';
import { ICustomerRepository } from '../domain/repositories/customer-repository.interface';

export class CustomerService {
  constructor(
    private customerRepo: ICustomerRepository,
    private uow: IUnitOfWork,
  ) {}

  ... 

  async update(id: string, input: { name?: string }) {
    const customer = await this.customerRepo.findById(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    input.name && customer.changeName(input.name);

    this.customerRepo.add(customer);
    await this.uow.commit();

    return customer;
  }
}

```

- No metodo podemos ter verificacao se a entidade buscada existe para levantar um erro
    - No framework podemos ter um camada para tratar esses casos (converter para HTTP code em alguns casos)
- Nesse update posso ter campos opcionais para verificar quem eu atualizo chamando o comando individualmente

Pensado agora no servico do `Event` que é um agregate root



```ts
export class EventService {
  constructor(
    private eventRepo: IEventRepository,
    private partnerRepo: IPartnerRepository,
    private uow: IUnitOfWork,
  ) {}

  ...

  async create(input: {
    name: string;
    description?: string | null;
    date: Date;
    partner_id: string;
  }) {
    const partner = await this.partnerRepo.findById(input.partner_id);
    if (!partner) {
      throw new Error('Partner not found');
    }

    const event = partner.initEvent({
      name: input.name,
      date: input.date,
      description: input.description,
    });

    this.eventRepo.add(event);
    await this.uow.commit();
    return event;
  }
}
```


- Depende da abordagem, podemos ou nao retornar um novo tipo para fora com objetivo de proteger o dominio
    - Mas podemos deixar essa preocupacao para outro lugar ainda (quem está consumindo ainda)

Posso ter um metodo para consultar apenas as sessoes do eventos:

```ts
export class EventService {
  constructor(
    private eventRepo: IEventRepository,
    private partnerRepo: IPartnerRepository,
    private uow: IUnitOfWork,
  ) {}

  ...

  async findSections(event_id: string) {
    const event = await this.eventRepo.findById(event_id);
    return event.sections;
  }


}
```

- Mas buscamos sempre pelo agregado

Um exemplo de outra operacao para o aplication service seria um update do evento:

```ts
  async update(
    id: string,
    input: { name?: string; description?: string; date?: Date },
  ) {
    const event = await this.eventRepo.findById(id);

    if (!event) {
      throw new Error('Event not found');
    }

    input.name && event.changeName(input.name);
    input.description && event.changeDescription(input.description);
    input.date && event.changeDate(input.date);

    this.eventRepo.add(event);
    await this.uow.commit();

    return event;
  }
```

- A regra de negocio representada para entidade(agregate root nesse caso), permite alterar campo a campo e nao tem um metodo unico `update`, sendo assim o aplication service faz todoas a chamadas, atualiza no repositorio e commita

Para adicionar uma sessão

```ts
  async addSection(input: {
    name: string;
    description?: string | null;
    total_spots: number;
    price: number;
    event_id: string;
  }) {
    const event = await this.eventRepo.findById(input.event_id);

    if (!event) {
      throw new Error('Event not found');
    }

    event.addSection({
      name: input.name,
      description: input.description,
      total_spots: input.total_spots,
      price: input.price,
    });
    await this.eventRepo.add(event);
    await this.uow.commit();
    return event;
  }
```

- sendo a manipulacao sendo feita via o aggregate root

Um caso de alterar os dados da sessao:

```ts
  async updateSection(input: {
    name: string;
    description?: string | null;
    event_id: string;
    section_id: string;
  }) {
    const event = await this.eventRepo.findById(input.event_id);

    if (!event) {
      throw new Error('Event not found');
    }

    const sectionId = new EventSectionId(input.section_id);
    event.changeSectionInformation({
      section_id: sectionId,
      name: input.name,
      description: input.description,
    });
    await this.eventRepo.add(event);
    await this.uow.commit();
    return event.sections;
  }
```

com o metodo novo na entidade `event`

```ts
  changeSectionInformation(command: {
    section_id: EventSectionId;
    name?: string;
    description?: string | null;
  }) {
    const section = this.sections.find((section) =>
      section.id.equals(command.section_id),
    );
    if (!section) {
      throw new Error('Section not found');
    }
    'name' in command && section.changeName(command.name);
    'description' in command && section.changeDescription(command.description);
  }
```

- Manipulando pelo `event` (agredate root)
- Da pra observar que talvez a juncao entre description e name poderia ser um ojeto de valor
- A operacao(comando) com o nome `changeSectionInformation` parece bem adequada para o que faz


Poderiamos no mesmo application service de evento ter um findSpots

```ts
  async findSpots(input: { event_id: string; section_id: string }) {
    const event = await this.eventRepo.findById(input.event_id);

    if (!event) {
      throw new Error('Event not found');
    }

    const section = event.sections.find((section) =>
      section.id.equals(new EventSectionId(input.section_id)),
    );
    if (!section) {
      throw new Error('Section not found');
    }
    return section.spots;
  }
```

- Está tudo bem o application service criar objetos de valores

Podemos ter um changeLocation


```ts
  async updateLocation(input: {
    location: string;
    event_id: string;
    section_id: string;
    spot_id: string;
  }) {
    const event = await this.eventRepo.findById(input.event_id);

    if (!event) {
      throw new Error('Event not found');
    }

    const sectionId = new EventSectionId(input.section_id);
    const spotId = new EventSpotId(input.spot_id);
    event.changeLocation({
      section_id: sectionId,
      spot_id: spotId,
      location: input.location,
    });
    await this.eventRepo.add(event);
    const section = event.sections.find((section) =>
      section.id.equals(new EventSectionId(input.section_id)),
    );
    await this.uow.commit();
    return section.spots.find((spot) => spot.id.equals(spotId));
  }
```

# Venda de ingresso


## Modelagem de order e reserva


## Operacao de reserva


## Precisamos de do modo transaçao

