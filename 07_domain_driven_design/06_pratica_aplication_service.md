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

Considerando criar as regras de order e reserva

```ts
export enum OrderStatus {
  PENDING,
  PAID,
  CANCELLED,
}

export class OrderId extends Uuid {}

export type OrderConstructorProps = {
  id?: OrderId | string;
  customer_id: CustomerId;
  amount: number;
  event_spot_id: EventSpotId;
};

export class Order extends AggregateRoot {
  id: OrderId;
  customer_id: CustomerId;
  amount: number;
  event_spot_id: EventSpotId;
  status: OrderStatus = OrderStatus.PENDING;

  constructor(props: OrderConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new OrderId(props.id)
        : props.id ?? new OrderId();
    this.amount = props.amount;
    this.customer_id =
      props.customer_id instanceof CustomerId
        ? props.customer_id
        : new CustomerId(props.customer_id);
    this.event_spot_id =
      props.event_spot_id instanceof EventSpotId
        ? props.event_spot_id
        : new EventSpotId(props.event_spot_id);
  }

  static create(props: OrderConstructorProps) {
    const order = new Order(props);
    return order;
  }

  pay() {
    this.status = OrderStatus.PAID;
    this.addEvent(new OrderPaid(this.id, this.status));
  }

  cancel() {
    this.status = OrderStatus.CANCELLED;
    this.addEvent(new OrderCancelled(this.id, this.status));
  }

  toJSON() {
    return {
      id: this.id.value,
      amount: this.amount,
      customer_id: this.customer_id.value,
      event_spot_id: this.event_spot_id.value,
    };
  }
}
```

```ts
export type SpotReservationCreateCommand = {
  spot_id: EventSpotId | string;
  customer_id: CustomerId;
};

export type SpotReservationConstructorProps = {
  spot_id: EventSpotId | string;
  reservation_date: Date;
  customer_id: CustomerId;
};

export class SpotReservation extends AggregateRoot {
  spot_id: EventSpotId;
  reservation_date: Date;
  customer_id: CustomerId;

  constructor(props: SpotReservationConstructorProps) {
    super();
    this.spot_id =
      props.spot_id instanceof EventSpotId
        ? props.spot_id
        : new EventSpotId(props.spot_id);
    this.reservation_date = props.reservation_date;
    this.customer_id =
      props.customer_id instanceof CustomerId
        ? props.customer_id
        : new CustomerId(props.customer_id);
  }

  static create(command: SpotReservationCreateCommand) {
    const reservation = new SpotReservation({
      spot_id: command.spot_id,
      customer_id: command.customer_id,
      reservation_date: new Date(),
    });
    reservation.addEvent(
      new SpotReservationCreated(
        reservation.spot_id,
        reservation.reservation_date,
        reservation.customer_id,
      ),
    );
    return reservation;
  }

  changeReservation(customer_id: CustomerId) {
    this.customer_id = customer_id;
    this.reservation_date = new Date();
    this.addEvent(
      new SpotReservationChanged(
        this.spot_id,
        this.reservation_date,
        this.customer_id,
      ),
    );
  }

  toJSON() {
    return {
      spot_id: this.spot_id.value,
      customer_id: this.customer_id.value,
      reservation_date: this.reservation_date,
    };
  }
}

```

- Reserva serve basicamente para garantir que um spot fique para um pessoa so
- Está tudo bem a indentidade de reservation ser aproveitada
- Por consequenecia temos que criar o schema e os repositorios

## Operacao de reserva

Em order service vamos efetivar essa reserva

Sendo assim em `order-service` vamos ter esse trabalho de criar um order e tambem um reservation. Sendo assim esse application service vai injetar, `IOrderRepository` (que vai adicionar a order no banco) `ISpotReservationRepository` que vai adicionar a reservation no banco, `IUnitOfWork`, `ICustomerRepository`(para checkar que existe o costumer), `IEventRepository` em que vamos buscar dados do evento para fazer a reserva nele.

Importante ver algumas regras a serem feitas utilizando o agregado de event como `allowReserveSpot` e `markSpotAsReserved` na sessao e spot do evento em questao:

```ts
export class Event extends AggregateRoot {
  ...

  allowReserveSpot(data: { section_id: EventSectionId; spot_id: EventSpotId }) {
    if (!this.is_published) {
      return false;
    }

    const section = this.sections.find((s) => s.id.equals(data.section_id));
    if (!section) {
      throw new Error('Section not found');
    }

    return section.allowReserveSpot(data.spot_id);
  }

    markSpotAsReserved(command: {
    section_id: EventSectionId;
    spot_id: EventSpotId;
  }) {
    const section = this.sections.find((s) => s.id.equals(command.section_id));

    if (!section) {
      throw new Error('Section not found');
    }

    section.markSpotAsReserved(command.spot_id);
    this.addEvent(
      new EventMarkedSportAsReserved(this.id, section.id, command.spot_id),
    );
  }
}
```

## Precisamos de do modo transaçao

Para lidar bem com pagamento precisar lidar melhor com transacao. Podemos fazer a resevar num lugar e fazer o pagamento de forma controlada.
Tendo certeza que nao tem reserva dupla só deixar o pagamento ser feito nesse caso, alem disso se o pagamento teve sucesso efetivar a reserva.

Para garantir consistencia em toda essa operacao precisamos realmeente trabalhar com transação

## Modo transation no unit of work

Vamos colocar mais metodos na interface do unit of work

```ts
export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  completeTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  runTransaction<T>(callback: () => Promise<T>): Promise<T>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

E implementar

```ts
export class UnitOfWorkMikroOrm implements IUnitOfWork {
  constructor(private em: EntityManager) {}

  beginTransaction(): Promise<void> {
    return this.em.begin();
  }
  completeTransaction(): Promise<void> {
    return this.em.commit();
  }
  rollbackTransaction(): Promise<void> {
    return this.em.rollback();
  }

  runTransaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.em.transactional(callback);
  }

  commit(): Promise<void> {
    return this.em.flush();
  }

  async rollback(): Promise<void> {
    this.em.clear();
  }
}
```

Utilizando o `runTransaction` podemos deixar todo a funcao passada como parametro como argumento a ser feito dentro de uma transaçao se completa todo unicamente.

Podemos inclusive ter uma forma de salvar a order como cancelada quando tivemos um conflito

```ts
export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private customerRepo: ICustomerRepository,
    private eventRepo: IEventRepository,
    private spotReservationRepo: ISpotReservationRepository,
    private uow: IUnitOfWork,
    private paymentGateway: PaymentGateway,
  ) {}

  list() {
    return this.orderRepo.findAll();
  }

  async create(input: {
    event_id: string;
    section_id: string;
    spot_id: string;
    customer_id: string;
    card_token: string;
  }) {
    //const {customer, event} = Promise.all([])
    const customer = await this.customerRepo.findById(input.customer_id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    const event = await this.eventRepo.findById(input.event_id);

    if (!event) {
      throw new Error('Event not found');
    }

    const sectionId = new EventSectionId(input.section_id);
    const spotId = new EventSpotId(input.spot_id);

    if (!event.allowReserveSpot({ section_id: sectionId, spot_id: spotId })) {
      throw new Error('Spot not available');
    }

    const spotReservation = await this.spotReservationRepo.findById(spotId);

    if (spotReservation) {
      throw new Error('Spot already reserved');
    }
    return this.uow.runTransaction(async () => {
      const spotReservationCreated = SpotReservation.create({
        spot_id: spotId,
        customer_id: customer.id,
      });

      await this.spotReservationRepo.add(spotReservationCreated);
      try {
        await this.uow.commit();
        const section = event.sections.find((s) => s.id.equals(sectionId));
        await this.paymentGateway.payment({
          token: input.card_token,
          amount: section.price,
        });

        const order = Order.create({
          customer_id: customer.id,
          event_spot_id: spotId,
          amount: section.price,
        });
        order.pay();
        await this.orderRepo.add(order);

        event.markSpotAsReserved({
          section_id: sectionId,
          spot_id: spotId,
        });

        this.eventRepo.add(event);

        await this.uow.commit();
        return order;
      } catch (e) {
        const section = event.sections.find((s) => s.id.equals(sectionId));
        const order = Order.create({
          customer_id: customer.id,
          event_spot_id: spotId,
          amount: section.price,
        });
        order.cancel();
        this.orderRepo.add(order);
        await this.uow.commit();
        throw new Error('Aconteceu um erro reservar o seu lugar');
      }
    });
  }
}

```


- Garantimos dentro do runTransaction com o try em no primeiro `await this.uow.commit()` 
    - Se eu estiver tentando fazer uma reserva que diferentemente da verirficacao inical agora ja nao tem mais lugar (dara erro no commit por consistencia no banco) vamos inserir uma order cancelada
    - Da mesma forma se `this.paymentGateway.payment` falhar tambem nao completaremos e inserimos uma order com falha
    - Se tudo der certo o commit será feito corretamente
    - Nao da para controllar isso apenas com flush


## Anti corruption layer pagamentos

Tendo um servico novo de pagamento ja proteje a gente como ACL para nao estamos com regras do pagamento dentro do nosso service. Considerando que temos uma integracao conformista pois o api de pagamento nao vai se adaptar a nós

