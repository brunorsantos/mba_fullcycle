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

# Integrando eventos e listeners

Criamos Um modulo domain-events global com arquivo `domain-events.module`

```ts
@Global()
@Module({
  providers: [DomainEventManager]
  exports: [DomainEventManager],
})
export class DomainEventsModule {}
```

- Que vai prover um DomainEventManager global que os outros modulos podem utilizar


Criamos um modulo aplication com um arquivo `application.module`

```ts
@Module({
  providers: [
    {
      provide: ApplicationService,
      useFactory: (
        uow: IUnitOfWork,
        domainEventManager: DomainEventManager,
      ) => {
        return new ApplicationService(uow, domainEventManager);
      },
      inject: ['IUnitOfWork', DomainEventManager],
    },
  ],
  exports: [ApplicationService],
})
export class ApplicationModule {}
```

- Que vai prover uma instancia de ApplicationService
- Precisar passar certinho as instancias injetadas
    - O unit of work vem do modulo database exportado como `IUnitOfWork` de forma global
    - O Aplication service vem do modulo application domain-events que acabamos de criar de forma global 
- Nao vamos deixar esse modulo global, sendo assim vamos precisar de importar onde for utilizar

Sendo assim no modulo events, precisamos importar o ApplicationModule e trocar para um service especifico para utilizar ele


```ts
@Module({
  imports: [
    MikroOrmModule.forFeature([
      CustomerSchema,
      PartnerSchema,
      EventSchema,
      EventSectionSchema,
      EventSpotSchema,
      OrderSchema,
      SpotReservationSchema,
    ]),
    ApplicationModule,
  ],
  providers: [
    ...

    {
      provide: PartnerService,
      useFactory: (
        partnerRepo: IPartnerRepository,
        appService: ApplicationService,
      ) => new PartnerService(partnerRepo, appService),
      inject: ['IPartnerRepository', ApplicationService],
    },
    ....
  ],
 ...
})
export class EventsModule implements OnModuleInit {
    constructor(private readonly domainEventManager: DomainEventManager) {}

    onModuleInit() {
        this.domainEventManager.register(
            PartnerCreated.name,
            (event: PartnerCreated) => {
                console.log('PartnerCreated event received', event);
            },
        );
    }
}
```

- Implementamos `OnModuleInit` para que inicio do modulo possamos registrar eventos
- No caso atual, estamos registrando que ao criar um parter, vamos dar um print apenas
- DomainEventManager precisou ser global para ser unico com todos os registros


# Criando classe como listener

Listeners estao na camada de applicationService, a ideia deles é tirar responsabilidade de dentro do application service, como o envio de um email. Entao vamos criar um MyHandler como exemplo em `@core/events/application/handlers/my-handler.handler.ts` que implementa uma interface na mesma camada em `@core/common/application/domain-event-handler.interface.ts`

```ts
import { IDomainEvent } from '../domain/domain-event';

export interface IDomainEventHandler {
  handle(event: IDomainEvent): Promise<void>;
}
```

```ts
import { IDomainEventHandler } from '../../../common/application/domain-event-handler.interface';
import { DomainEventManager } from '../../../common/domain/domain-event-manager';
import { PartnerCreated } from '../../domain/events/domain-events/partner-created.event';
import { IPartnerRepository } from '../../domain/repositories/partner-repository.interface';

export class MyHandlerHandler implements IDomainEventHandler {
  constructor(
    private partnerRepo: IPartnerRepository,
    private domainEventManager: DomainEventManager,
  ) {}

  async handle(event: PartnerCreated): Promise<void> {
    console.log(event);
    //manipular agregados
    //this.partnerRepo.add()
    //await this.domainEventManager.publish(agregado)
  }

  static listensTo(): string[] {
    return [PartnerCreated.name];
  }
}

```

- Um handler nao pode acessar um aplication service
- Ele pode acessar repositorios
- Ele vai acabar sendo completado pelo unit of work do applicationService que publicou os eventos
- Podemos injetar `DomainEventManager` caso necessario publicar mais eventos que no fim tambem serao chamadas mais possiveis listeners
- Criamos um metodo estatico para deixar logo aqui quem queremos ser listeners para utilizar na criacao do modulo do nestjs

Sendo assim no arquivo `events.module`

```ts
@Module({
  ...
  providers: [
    ...

    {
      provide: MyHandlerHandler,
      useFactory: (
        partnerRepo: IPartnerRepository,
        domainEventManager: DomainEventManager,
      ) => new MyHandlerHandler(partnerRepo, domainEventManager),
      inject: ['IPartnerRepository', DomainEventManager],
    },
    ....
  ],
 ...
})
export class EventsModule implements OnModuleInit {
  constructor(
    private readonly domainEventManager: DomainEventManager,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    console.log('EventsModule initialized');
    MyHandlerHandler.listensTo().forEach((eventName: string) => {
      this.domainEventManager.register(eventName, async (event) => {
        const handler: MyHandlerHandler = await this.moduleRef.resolve(
          MyHandlerHandler,
        );
        await handler.handle(event);
      });
    });
  }
}

```

- Registramos para prover uma instancia de `MyHandlerHandler` injetando um repository e o `DomainEventManager` como queremos publicar mais possiveis eventos registrados
- Ajustamos para que o MyHandler seja listener do `PartnerCreated` (atravez de metodo estatico)

# Criando evento de integracao

Esse tem a funcionalidade notifica fora do meu subdominio (Ex ao registrar um reversa, deve se enviar email, que esta em outro subdominio)

Sendo assim vamos criar um app totalmente diferente chamado `emails`. Fazendo comunicacao asyncrona.


Vamos criar na aplicacao antiga em `@core/events/domain/events/integration-events/partner-created.int-events.ts` implementando uma interface 
`@core/common/domain/integration-event.ts`

```ts
export interface IIntegrationEvent<T = any> {
  event_name: string;
  payload: T;
  event_version: number;
  occurred_on: Date;
}
```

```ts
import { IIntegrationEvent } from '../../../../common/domain/integration-event';
import { PartnerCreated } from '../domain-events/partner-created.event';

export class PartnerCreatedIntegrationEvent implements IIntegrationEvent {
  event_name: string;
  payload: any;
  event_version: number;
  occurred_on: Date;

  constructor(domainEvent: PartnerCreated) {
    this.event_name = PartnerCreatedIntegrationEvent.name;
    this.payload = {
      id: domainEvent.aggregate_id.value,
      name: domainEvent.name,
    };
    this.event_version = 1;
    this.occurred_on = domainEvent.occurred_on;
  }
}
```



- Como estamos falando de eventos de integracai, faz sentido uma comunicao mais formal com um campo de `payload` e um campo que identifique o evento em si
- O evento de integracao vai ser disparado atravez de um evento de dominio, portanto ele será criado esperando um obejto de evento de dominio no construtor.


Como manter a publicacao mais resiliente? (preocupando se ela nao acontecer)

Podemos usar padrao Outbox

A ideia é simples:
	1.	Ao salvar um dado no banco de dados, você também salva uma mensagem de evento em uma tabela “outbox” no mesmo banco e na mesma transação.
	2.	Um processo separado (como um worker ou um serviço agendado) lê essa tabela e publica os eventos na fila ou broker.
	3.	Após o envio bem-sucedido, o evento é marcado como enviado ou removido da tabela.


# Event sourcing e replay dos agregados

