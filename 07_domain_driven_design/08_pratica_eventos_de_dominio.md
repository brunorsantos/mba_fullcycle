# Introducao a eventos de domínio

Trabalhar com eventos vai ajudar muito.

O evento podem ser disparados toda vez que ocorrer um comando, Pensando em `Event` no caso nao ficaria no construtor por exemplo sim no create. Em `Event` tudo é passivel. `create`, `changeName`, `changeDescription`

- Somente agregados que disparam eventos

# Criando primeiro evento de domínio

Comecando criando um abstração para os eventos de dominio na camada domain em, `@core/common/domain/domain.event.ts`

```ts
import { ValueObject } from './value-objects/value-object';

export interface IDomainEvent {
  aggregate_id: ValueObject;
  occurred_on: Date;
  event_version: number;
}
```

- O id do evento será o id do entidade(agregate root), sabemos que esse id sempre sera um value object. O evento terá sempre um data em que ocorreu e uma versao.


Apenas agregados vao disparar eventos, entao pode incluir funcionalidade na interface do aggregate root.

```ts
import { IDomainEvent } from './domain-event';
import { Entity } from './entity';

export abstract class AggregateRoot extends Entity {
  events: Set<IDomainEvent> = new Set<IDomainEvent>();

  addEvent(event: IDomainEvent) {
    this.events.add(event);
  }

  clearEvents() {
    this.events.clear();
  }
}
```

- Vamos trabalhar escolhendo a abordagem que é registramos os eventos na hora do comando para apenas depois enviar
- Vamos manter no agregado um set de domainEvent (assim nem deixa duplicar)
- Podemos adicionar um evento nessa lista a ser enviado ou limpar a lista

Sendo assim, agora vamos ter a lista de eventos possiveis em si. Vamos ter um diretorio especifico e comecar com `partner` como exemplo. Como `@core/events/domain/events/partner-created.event.ts`

```ts
import { IDomainEvent } from '../../../../common/domain/domain-event';
import { PartnerId } from '../../entities/partner.entity';

export class PartnerCreated implements IDomainEvent {
  readonly event_version: number = 1;
  readonly occurred_on: Date;

  constructor(readonly aggregate_id: PartnerId, readonly name: string) {
    this.occurred_on = new Date();
  }
}
```

- No fim é uma classe anemica que preenche a data que ocorreu como a data atual, id do partner e os dados do agregado. 
- Inlcluimos somente nome nesse caso. Não precisa ser todos, mas pelo menos modificados naquela operacao é adequado

E `@core/events/domain/events/domain-events/partner-changed-name.event.ts`

```ts
import { IDomainEvent } from '../../../../common/domain/domain-event';
import { PartnerId } from '../../entities/partner.entity';

export class PartnerChangedName implements IDomainEvent {
  readonly event_version: number = 1;
  readonly occurred_on: Date;

  constructor(readonly aggregate_id: PartnerId, readonly name: string) {
    this.occurred_on = new Date();
  }
}
```

- Tambem com todos os dados de partner

Em `partner.entity.ts` vamos alterar para incluir os eventos no commandos

```ts

export class Partner extends AggregateRoot {
  id: PartnerId;
  name: string;

  ...

  static create(command: { name: string }) {
    const partner = new Partner({
      name: command.name,
    });
    partner.addEvent(new PartnerCreated(partner.id, partner.name));
    return partner;
  }

  initEvent(command: InitEventCommand) {
    return Event.create({
      ...command,
      partner_id: this.id,
    });
  }

  changeName(name: string) {
    this.name = name;
    this.addEvent(new PartnerChangedName(this.id, this.name));
  }

}
```

- Cada operacao vai adicionar o seu evento adequado

# Criando gerenciador de eventos

Considerando a abordagem de nao disparar assim que ele acontece(diferente do livro de Vernon).
Vamos disparar isso no application service. Na hora que o unit of work efetivar.

Vamos comecar criando um event manager que seria basicamente um mediator. Vamos comecar criando ele em `@core/common/domain/domain.event-manager.ts`

```ts
import EventEmitter2 from 'eventemitter2';
import { AggregateRoot } from './aggregate-root';

export class DomainEventManager {
  domainEventsSubscriber: EventEmitter2;

  constructor() {
    this.domainEventsSubscriber = new EventEmitter2({
      wildcard: true,
    });
  }

  register(event: string, handler: any) {
    this.domainEventsSubscriber.on(event, handler);
  }


  async publish(aggregateRoot: AggregateRoot) {
    for (const event of aggregateRoot.events) {
      const eventClassName = event.constructor.name;
      await this.domainEventsSubscriber.emitAsync(eventClassName, event);
    }
  }
}
```

- Usamos um lib `EventEmitter2`
    - Utilizando um modo que é possivel usar wildcard para criar listeners usando `*` para identificar os eventos
- Metodo para registrar um listener passando um string com o nome do evento
- Metodo para publicar passando o aggregateRoot em si, em que todos os eventos registrados na lista de eventos sao emitidos
    - Pegamos o nome da classe em si usando `const eventClassName = event.constructor.name`
    - Queremos que todos handlers vao ser executados na hora do emit nesse caso aqui, sendo assim usamos combinacao de async e await para seguir o modo de aguardar todos os handlers e ainda evitar que handlers executem forma paralela

# Criando o servico de ciclo de vida de processo de negocio

Para controlar o ciclo de vida, vamos criar uma camada nova no application service, que na hora que emmitimos um commit no unit of work, vammos publicar os eventos.

Para publicar os eventos, precisamos saber que agregados temos alguma transacao. No nosso caso atual o unit of work do mikroorm tem essa informacao. Preicsamos implementar isso. Colocando um metodo `getAggregateRoots` na interface na camada de aplicacao em `@core/common/application/unit-of-work.interface.ts`

```ts
import { AggregateRoot } from '../domain/aggregate-root';

export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  completeTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  runTransaction<T>(callback: () => Promise<T>): Promise<T>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getAggregateRoots(): AggregateRoot[];
}
```

E implementando ele na camada de infra em `@core/common/infra/unit-of-work-mikro-orm.ts`

```ts
export class UnitOfWorkMikroOrm implements IUnitOfWork {
  constructor(private em: EntityManager) {}

  ... 

  getAggregateRoots(): AggregateRoot[] {
    return [
      ...this.em.getUnitOfWork().getPersistStack(),
      ...this.em.getUnitOfWork().getRemoveStack(),
    ] as AggregateRoot[];
  }
}
```

Na camada de aplicacao em common, vamos precisar de uma classe `@core/common/application/application.service.ts`.

```ts
import { DomainEventManager } from '../domain/domain-event-manager';
import { IUnitOfWork } from './unit-of-work.interface';

export class ApplicationService {
  constructor(
    private uow: IUnitOfWork,
    private domainEventManager: DomainEventManager,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  start() {}

  async finish() {
    const aggregateRoots = this.uow.getAggregateRoots();
    for (const aggregateRoot of aggregateRoots) {
      await this.domainEventManager.publish(aggregateRoot);
    }
    await this.uow.commit();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fail() {}

  async run<T>(callback: () => Promise<T>): Promise<T> {
    await this.start();
    try {
      const result = await callback();
      await this.finish();
      return result;
    } catch (e) {
      await this.fail();
      throw e;
    }
  }
}
```

- Imaginando um ciclo de vida temos `start` `finish` e `fail`
- Ele que vai passar a inejtar o unit of work agora ao inves da propria aplication service espefica
- O `finish` que vai commitar o unit of work e antes disso para cada aggregate root da list do unit of work, vamos publicar o evento.
    - Caso tenha transacoes de banco nos listeners, todos eles serão commitados apenas aqui!
- Para evitar levar a logica do `start` e `finish` para todos os aplication services, criamos o run que faz isso esperando um callback.


Mudamos o `parner.service.ts` para usar adequadamente

```ts
import { ApplicationService } from '../../common/application/application.service';
import { Partner } from '../domain/entities/partner.entity';
import { IPartnerRepository } from '../domain/repositories/partner-repository.interface';

export class PartnerService {
  constructor(
    private partnerRepo: IPartnerRepository,
    private applicationService: ApplicationService,
  ) {}

  list() {
    return this.partnerRepo.findAll();
  }

  async create(input: { name: string }) {
    return await this.applicationService.run(async () => {
      const partner = Partner.create(input);
      await this.partnerRepo.add(partner);
      return partner;
    });
  }

  async update(id: string, input: { name?: string }) {
    return this.applicationService.run(async () => {
      const partner = await this.partnerRepo.findById(id);

      if (!partner) {
        throw new Error('Partner not found');
      }

      input.name && partner.changeName(input.name);

      await this.partnerRepo.add(partner);
      return partner;
    });
  }
}
```

- Unit of work nao é mais injetado aqui
- Em todo caso que é feito uma operacao (commando/persistencia) eu utilizo o `applicationService.run`