# Sobre estrutura de pastas

Um recomendacao para seguir o DDD de forma mais pura seria dividir entre

- application
- domain
- infra

# Criando primeira entidade

Em pasta domain/entities criamos a primeira entidade (agregados vao ficar aqui tambem)

Uma arquivo novo `customer.entity.ts`

```ts
export type CustomerConstructorProps = {
    id: string;
    cpf: string;
    name: string;
};

export class Customer {
    id: string;
    cpf: string;
    name: string;

    constructor(props: CustomerConstructorProps) {
        this.id = props.id;
        this.cpf = props.cpf;
        this.name = props.name;
    }

    static create(command: { name: string; cpf: string }) {
        return new Customer(command);
    }

    toJSON() {
        return {
            id: this.id,
            cpf: this.cpf,
            name: this.name,
        };
    }
}
```

Em que `id` vai ser uma identidade, snedo que `CPF` vai acabar tambem sendo uma identidade natural.

É interessante ter o metodo estatico `create()` para explicitar uma operacao dessa entidade

# Marcacao do artefatos do DDD

Queremos marcar a entidade nova como agregado e ter formas de marcar entidades, explicitando o DDD melhor

Sendo assim criamos uma estrutura nova:

```
@core
│── common
│   ├── application
│   ├── domain
│   │   ├── aggrate-root.ts   
│   │   ├── entity.ts   
│   ├── infra
│── events
│   ├── domain
│   │   ├── custumer-entity.ts   
```

Fazendo aggregate-root herdar de entity:

```ts
export abstract class AggregateRoot extends Entity {
```

E nossa entidade que tambem é um aggretae root herdar de aggregate-root

```rs
export class Customer extends AggregateRoot{
```

# Criando primeiro objeto de valor

Da para usar uma marcacao tambeo para value object, sendo assim criamos uma interface:

```ts
import isEqual from 'lodash/isEqual';

export abstract class ValueObject<Value = any> {
  protected readonly _value: Value;

  constructor(value: Value) {
    this._value = deepFreeze(value);
  }

  get value(): Value {
    return this._value;
  }

  public equals(obj: this): boolean {
    if (obj === null || obj === undefined) {
      return false;
    }

    if (obj.value === undefined) {
      return false;
    }

    if (obj.constructor.name !== this.constructor.name) {
      return false;
    }

    return isEqual(this.value, obj.value);
  }

  toString = () => {
    if (typeof this.value !== 'object' || this.value === null) {
      try {
        return this.value.toString();
      } catch (e) {
        return this.value + '';
      }
    }
    const valueStr = this.value.toString();
    return valueStr === '[object Object]'
      ? JSON.stringify(this.value)
      : valueStr;
  };
}

export function deepFreeze<T>(obj: T) {
  try {
    const propNames = Object.getOwnPropertyNames(obj);

    for (const name of propNames) {
      const value = obj[name as keyof T];

      if (value && typeof value === 'object') {
        deepFreeze(value);
      }
    }

    return Object.freeze(obj);
  } catch (e) {
    return obj;
  }
}

```

- Temos uma forma de fazer freezing para no TypeScript
- Um equal que usa lib que verifica se todos os campos sao iguais (definicao do value object para evitar efeitos colaterais)
- Outras funcionalidades como toString
- Para acessar sempre usar o metodo `.value()` que vai explicitar ainda mais que estamos usando um value-object

Podemos criar um value Object `Name` apenas como exeplo

```ts
import { ValueObject } from './value-object';

export class Name extends ValueObject<string> {
  constructor(name: string) {
    super(name);
    this.isValid();
  }

  isValid() {
    return this.value.length >= 3;
  }
}
```
A estutura fica assim, considerando name algo nao espefico para events, como mais carater de comum vamos colocar em um diretorio de value-objects

```
@core
│── common
│   ├── application
│   ├── domain
│   │   ├── aggrate-root.ts   
│   │   ├── entity.ts   
│   │   ├── value-objects.ts   
│   │   │   ├── value-objects.ts   
│   │   │   ├── name.vo.ts   
│   ├── infra
│── events
│   ├── domain
│   │   ├── custumer-entity.ts   
```

# CPF como objeto de value

Para CPF tambem no diretorio de value-objects, podemos criar sua classe marcando como value-object, com validacoes para o tipo novo no contstrutor

```ts
import { ValueObject } from './value-object';

export class Cpf extends ValueObject<string> {
  constructor(value: string) {
    super(value.replace(/\D/g, ''));
    this.validate();
  }

  private validate() {
    if (this.value.length != 11) {
      throw new InvalidCpfError(
        'CPF must have 11 digits, but has ' + this.value.length + ' digits',
      );
    }

    const allDigitsEquals = /^\d{1}(\d)\1{10}$/.test(this.value);
    if (allDigitsEquals) {
      throw new InvalidCpfError('CPF must have at least two different digits');
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(this.value.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit > 9) {
      firstDigit = 0;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(this.value.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit > 9) {
      secondDigit = 0;
    }

    if (
      firstDigit !== parseInt(this.value.charAt(9)) ||
      secondDigit !== parseInt(this.value.charAt(10))
    ) {
      throw new InvalidCpfError('CPF is invalid');
    }
  }
}

export class InvalidCpfError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidCpfError';
  }
}

export default Cpf;
```

Podemos usar em `Custumer`, como o construtor recebendo um string, mas tendo conhecimento de como criar um CPF correto

```ts
  static create(command: { name: string; cpf: string }) {
    const customer = new Customer({
      name: command.name,
      cpf: new Cpf(command.cpf),
    });
  }
```

# Como trabalhar melhor com Id das entidades

O Id utilizando Uuid, tambem será um objeto de valor, sendo assim vamos criar um `uuid.vo.ts`

```ts
import { validate as uuidValidate } from 'uuid';
import crypto from 'crypto';
import { ValueObject } from './value-object';

export class Uuid extends ValueObject<string> {
  constructor(id?: string) {
    super(id || crypto.randomUUID());
    this.validate();
  }

  private validate() {
    const isValid = uuidValidate(this.value);
    if (!isValid) {
      throw new InvalidUuidError(this.value);
    }
  }
}

export class InvalidUuidError extends Error {
  constructor(invalidValue: any) {
    super(`Value ${invalidValue} must be a valid UUID`);
    this.name = 'InvalidUuidError';
  }
}

export default Uuid;
```

- Construtor permite nao passar id e gera randomicamente
- Permite passar um Id
- Efetivamente salva um id
- Usa lib para validar

Na hora de usar em `Customer`, se cria um `CustumerId` especifico

```ts
export class CustomerId extends Uuid {}

export type CustomerConstructorProps = {
  id?: CustomerId | string;
  cpf: Cpf;
  name: string;
};

export class Customer extends AggregateRoot {
  id: CustomerId;
  cpf: Cpf;
  name: string;

  constructor(props: CustomerConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new CustomerId(props.id)
        : props.id ?? new CustomerId();
    this.cpf = props.cpf;
    this.name = props.name;
  }

...
}

```

- Contrutor aceita tanto `CustomerId` ou string
- Construtor aceita nao passar nada em id

Podemos tambem melhorar nossa classe abstrata para forcar os filhos a terem Id e criar um equals para comparar o id e nome da entidade

```ts
export abstract class Entity {
  readonly id: any;

  abstract toJSON(): any;

  equals(obj: this) {
    if (obj === null || obj === undefined) {
      return false;
    }

    if (obj.id === undefined) {
      return false;
    }

    if (obj.constructor.name !== this.constructor.name) {
      return false;
    }

    return obj.id.equals(this.id);
  }
}
```

**No DDD uma entidade é igual a outra se tiver Id igual**

# Criando a base de um agregado

Criamos `Event`, `Section` e `Spot` com intencao de ter a relacao

Event -> Sections -> Spots

## Event (src/@core/events/domain/entities/event.entity.ts)

```ts
import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { PartnerId } from './partner.entity';
import Uuid from '../../../common/domain/value-objects/uuid.vo';
import { EventSection } from './event-section';

export class EventId extends Uuid {}

export type CreateEventCommand = {
  name: string;
  description?: string | null;
  date: Date;
  partner_id: PartnerId;
};

export type EventConstructorProps = {
  id?: EventId | string;
  name: string;
  description: string | null;
  date: Date;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  partner_id: PartnerId | string;
};

export class Event extends AggregateRoot {
  id: EventId;
  name: string;
  description: string | null;
  date: Date;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  partner_id: PartnerId;

  constructor(props: EventConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new EventId(props.id)
        : props.id ?? new EventId();

    this.name = props.name;
    this.description = props.description;
    this.date = props.date;
    this.is_published = props.is_published;
    this.total_spots = props.total_spots;
    this.total_spots_reserved = props.total_spots_reserved;
    this.partner_id =
      props.partner_id instanceof PartnerId
        ? props.partner_id
        : new PartnerId(props.partner_id);
    this.sections = props.sections ?? new Set<EventSection>();
  }

  static create(command: CreateEventCommand) {
    return new Event({
      ...command,
      description: command.description ?? null,
      is_published: false,
      total_spots: 0,
      total_spots_reserved: 0,
    });
  }



  toJSON() {
    return {
      id: this.id.value,
      name: this.name,
      description: this.description,
      date: this.date,
      is_published: this.is_published,
      total_spots: this.total_spots,
      total_spots_reserved: this.total_spots_reserved,
      partner_id: this.partner_id.value,
      sections: [...this.sections].map((section) => section.toJSON()),
    };
  }
}
```

- Como partner nao é uma relacao detro do agregado so relacionamos usando `PartnerId`
- Mantenho a logica de aceitar um id nulo
- Tenho explicitamente um comando para criar a entidade usando o construtor privado
- Inicio utilizando total_spots e total_spots_reserved zerado
    - Fizemos escolha de manter esses dados nao calculados em memoria toda vez (vai acabar sendo salvo no banco)
- Inicio utilizando published com false    


## Section (src/@core/events/domain/entities/event-section.ts)

```ts
import { Entity } from '../../../common/domain/entity';
import Uuid from '../../../common/domain/value-objects/uuid.vo';
import { EventSpot } from './event-spot';

export class EventSectionId extends Uuid {}

export type EventSectionCreateCommand = {
  name: string;
  description?: string | null;
  total_spots: number;
  price: number;
};

export type EventSectionConstructorProps = {
  id?: EventSectionId | string;
  name: string;
  description: string | null;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  price: number;
};

export class EventSection extends Entity {
  id: EventSectionId;
  name: string;
  description: string | null;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  price: number;


  constructor(props: EventSectionConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new EventSectionId(props.id)
        : props.id ?? new EventSectionId();
    this.name = props.name;
    this.description = props.description;
    this.is_published = props.is_published;
    this.total_spots = props.total_spots;
    this.total_spots_reserved = props.total_spots_reserved;
    this.price = props.price;
  }

  static create(command: EventSectionCreateCommand) {
    const section = new EventSection({
      ...command,
      description: command.description ?? null,
      is_published: false,
      total_spots: 0,
      total_spots_reserved: 0,
    });

    return section;
  }

  toJSON() {
    return {
      id: this.id.value,
      name: this.name,
      description: this.description,
      is_published: this.is_published,
      total_spots: this.total_spots,
      total_spots_reserved: this.total_spots_reserved,
      price: this.price,
    };
  }
}
```

- Inicio utilizando total_spots e total_spots_reserved zerado



## Spots (src/@core/events/domain/entities/event-spot.ts)

```ts
import { Entity } from '../../../common/domain/entity';
import Uuid from '../../../common/domain/value-objects/uuid.vo';

export class EventSpotId extends Uuid {}

export type EventSpotConstructorProps = {
  id?: EventSpotId | string;
  location: string | null;
  is_reserved: boolean;
  is_published: boolean;
};

export class EventSpot extends Entity {
  id: EventSpotId;
  location: string | null;
  is_reserved: boolean;
  is_published: boolean;

  constructor(props: EventSpotConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new EventSpotId(props.id)
        : props.id ?? new EventSpotId();
    this.location = props.location;
    this.is_reserved = props.is_reserved;
    this.is_published = props.is_published;
  }

  static create() {
    return new EventSpot({
      location: null,
      is_published: false,
      is_reserved: false,
    });
  }

  toJSON() {
    return {
      id: this.id.value,
      location: this.location,
      reserved: this.is_reserved,
      is_published: this.is_published,
    };
  }
}
```

# Relacao de agregado com filhos

Evitando utiliar o array, por é uma estrutura muito basica (evitar duplicidades, navegar, etc). Vamos incluir `sections` em `Event` e `spots` em `Section` como dentro de sets.

Incluímos no construtor privado (com possibilidade de ser vazio) mas nao no comando create estatico de cada classe

```ts

export class EventId extends Uuid {}

export type CreateEventCommand = {
  name: string;
  description?: string | null;
  date: Date;
  partner_id: PartnerId;
};

export type EventConstructorProps = {
  id?: EventId | string;
  name: string;
  description: string | null;
  date: Date;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  partner_id: PartnerId | string;
  sections?: Set<EventSection>;
};

export class Event extends AggregateRoot {
  id: EventId;
  name: string;
  description: string | null;
  date: Date;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  partner_id: PartnerId;
  sections: Set<EventSection>;

  constructor(props: EventConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new EventId(props.id)
        : props.id ?? new EventId();

    this.name = props.name;
    this.description = props.description;
    this.date = props.date;
    this.is_published = props.is_published;
    this.total_spots = props.total_spots;
    this.total_spots_reserved = props.total_spots_reserved;
    this.partner_id =
      props.partner_id instanceof PartnerId
        ? props.partner_id
        : new PartnerId(props.partner_id);
    this.sections = props.sections ?? new Set<EventSection>();
  }

  static create(command: CreateEventCommand) {
    return new Event({
      ...command,
      description: command.description ?? null,
      is_published: false,
      total_spots: 0,
      total_spots_reserved: 0,
    });
  }
}
```


```

```


Não utilizamos  `sections.add()` para incliur uma sessao na lista. Assim estou ferindo os comandos. Tenho que manipular tudo por operacao (inclusive sem usar getter and setter)


```ts
import { Entity } from '../../../common/domain/entity';
import Uuid from '../../../common/domain/value-objects/uuid.vo';
import { EventSpot } from './event-spot';

export class EventSectionId extends Uuid {}

export type EventSectionCreateCommand = {
  name: string;
  description?: string | null;
  total_spots: number;
  price: number;
};

export type EventSectionConstructorProps = {
  id?: EventSectionId | string;
  name: string;
  description: string | null;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  price: number;
  spots?: Set<EventSpot>;
};

export class EventSection extends Entity {
  id: EventSectionId;
  name: string;
  description: string | null;
  is_published: boolean;
  total_spots: number;
  total_spots_reserved: number;
  price: number;
  spots: Set<EventSpot>;

  constructor(props: EventSectionConstructorProps) {
    super();
    this.id =
      typeof props.id === 'string'
        ? new EventSectionId(props.id)
        : props.id ?? new EventSectionId();
    this.name = props.name;
    this.description = props.description;
    this.is_published = props.is_published;
    this.total_spots = props.total_spots;
    this.total_spots_reserved = props.total_spots_reserved;
    this.price = props.price;
    this.spots = props.spots ?? new Set<EventSpot>();
  }

  static create(command: EventSectionCreateCommand) {
    const section = new EventSection({
      ...command,
      description: command.description ?? null,
      is_published: false,
      total_spots_reserved: 0,
    });
    return section;
  }
}
```

Nao devemos ter nas filhas relacao com os pais (Ex: `Section` para `Event`) usando id.

Poderimoas ter uma relacao para filho apenas para 1, colocando diretamente o tipo da entidade Filha, sem usar lista. No comando poderiamos receber alguma informacao que é utilizada para criar o filho diretamente


# Regras de negocio em agregados

Lembrando muito de utilizar dominio rico, precisamos deixar que o agregado de `Event` tenha `Sections`

Para isso vamos incluir uma logica de `addSection`

```ts
... 


export type AddSectionCommand = {
  name: string;
  description?: string | null;
  total_spots: number;
  price: number;
};

export class Event extends AggregateRoot {
...
  addSection(command: AddSectionCommand) {
    const section = EventSection.create(command);
    this.sections.add(section);
    this.total_spots += section.total_spots;
  }
...

}
```

- Deixo explicito que esse metodo é um comando considerando que ele espera esse tipo novo como parametro
- Utilizo o commando de create do section
- Com o retorno do que é criado adiciono na lista de sections privado do evento
- Incluo a regra de negocio de incrementar o total de spots do `event`


Precisamos tambem ja adaptar `Section` (commando create ja existente) para criar a lista de spots

```ts
  static create(command: EventSectionCreateCommand) {
    const section = new EventSection({
      ...command,
      description: command.description ?? null,
      is_published: false,
      total_spots_reserved: 0,
    });

    section.initSpots();
    return section;
  }

  private initSpots() {
    for (let i = 0; i < this.total_spots; i++) {
      this.spots.add(EventSpot.create());
    }
  }
```

- Chama um metodo privado(para organizar melhor) que itera criando um spot para o total passado


Uma coisa interessante que é possivel observar, é que o `Event` tem o Id do parceiro entre seus itens, e que a criacao de um evento tende a ser feita por um parceiro.

Sendo assim podemos concluir no DDD que faz sentido que essa logica de criar um evento esteja no Partner. Vamos incluir em `partner.entity.ts`

```ts
export type InitEventCommand = {
  name: string;
  description?: string | null;
  date: Date;
};

export class Partner extends AggregateRoot {

...

  initEvent(command: InitEventCommand) {
    return Event.create({
      ...command,
      partner_id: this.id,
    });
  }
}

```

Nesse formato vamos poder usar algo como:

```ts
    const event = Event.create({
      name: 'Evento 1',
      description: 'Descrição do evento 1',
      date: new Date(),
      partner_id: new PartnerId(),
    });

    event.addSection({
      name: 'Sessão 1',
      description: 'Descrição da sessão 1',
      total_spots: 100,
      price: 1000,
    });
```

Ponto de atencao muito grande, é para nao criar metodos como `update` que nao demostram expressividade no dominio... deve ser criar alteracoes explicitas.

Como `changeName` em `Partner`

```ts

export class Partner extends AggregateRoot {

...

  changeName(name: string) {
    this.name = name;
  }
}
```


Alteracoes de Nome, description e data em `Event`

```ts
export class Event extends AggregateRoot {
...
  changeName(name: string) {
    this.name = name;
    this.addEvent(new EventChangedName(this.id, this.name));
  }

  changeDescription(description: string | null) {
    this.description = description;
    this.addEvent(new EventChangedDescription(this.id, this.description));
  }

  changeDate(date: Date) {
    this.date = date;
    this.addEvent(new EventChangedDate(this.id, this.date));
  }
}
```

- Alteracoes de nome description e price em section 

- Alteracoes em spot de location e publicacao

```ts
export class EventSpot extends Entity {

...

  changeLocation(location: string) {
    this.location = location;
  }

  publish() {
    this.is_published = true;
  }

  unPublish() {
    this.is_published = false;
  }

  markAsReserved() {
    this.is_reserved = true;
  }
}

```

Por consequencia posso ter em `Section` e `Event` forma de publishAll de forma a sair fazendo a publicacao encadeda


```ts
export class EventSection extends Entity {
  
  ...

  publishAll() {
    this.publish();
    this.spots.forEach((spot) => spot.publish());
  }

  publish() {
    this.is_published = true;
  }

  unPublish() {
    this.is_published = false;
  }
}
```

```ts

export class Event extends AggregateRoot {

  ...

  publishAll() {
    this.publish();
    this._sections.forEach((section) => section.publishAll());
    this.addEvent(
      new EventPublishAll(
        this.id,
        this._sections.map((s) => s.id),
      ),
    );
  }

  publish() {
    this.is_published = true;
    this.addEvent(new EventPublish(this.id));
  }

  unPublish() {
    this.is_published = false;
    this.addEvent(new EventUnpublish(this.id));
  }
}

```