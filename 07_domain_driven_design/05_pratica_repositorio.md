# ORM

A melhor forma de usar ORM com DDD é selecionado alguem que tenha Data mapper, tendem a funcionar melhor do que os que usar active record.

Active record é padrao que que vc extende um modelo que ja inclui ja acoplado metodos de save, update, insert

Data mapper, facilita pois vamos ter as classes com entidade mais dummy que a gente mapeia (como anotations) com campos de banco. A classe fica clean...
Podemos tambem evitar mapeador com ele

# Primeiro mapeamento entidade relacional

Usando MikrORM para trabalhar com ORM com data mapper. Porem sem o modelo com anotations para nao sujar as classes de entidades como acoplamento com dados de infra.

Vamos criar o primeiro mapeamento na folder `@core/events/infra/db` em `schemas.ts`

```ts
import { EntitySchema } from '@mikro-orm/core';
import { Partner } from '../../domain/entities/partner.entity';

export const PartnerSchema = new EntitySchema<Partner>({
    class: Partner,
    properties: {
        id: { primary: true, type: 'uuid' },
        name: { type: 'string', length: 255 },
    },
});
```

Para utilizar seria: 



```ts
test('partner repository', async () => {
  const orm = await MikroORM.init<MySqlDriver>({
    entities: [PartnerSchema],
    dbName: 'events',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    type: 'mysql',
    forceEntityConstructor: true,
  });
await orm.schema.refreshDatabase();
const em = orm.em.fork();

const partner = Partner.create({ name: 'Partner 1' });
console.log(partner.id);
em.persist(partner);
await em.flush();
await em.clear();

const partnerFound = await em.findOne(Partner, { id: partner.id });
console.log(partnerFound);

await orm.close();
```

Reparando que o em vai lidar em retornar o tipo da entidade e esperar o tipo da entidade.

Porem dessa forma atual, o que é retornado apos um select (`findOne`) tomando cuidado para limpar o unit of work (`em.clear`) não vai transformar o id em um objeto de valor

# Criando campos personalizados no mapeamento

O mikrOrm nao usa o construtor por padrao, precisamos configurar com `forceEntityConstructor: true,`

Alem disso precisamos criar um tipo espefico configurado para converter corretamente o id para o valueObject nosso

```ts
import { Type, Platform, EntityProperty } from '@mikro-orm/core';
import { PartnerId } from '../../../domain/entities/partner.entity';

export class PartnerIdSchemaType extends Type<PartnerId, string> {
  convertToDatabaseValue(
    valueObject: PartnerId | undefined | null,
    platform: Platform,
  ): string {
    return valueObject instanceof PartnerId
      ? valueObject.value
      : (valueObject as string);
  }

  //não funciona para relacionamentos
  convertToJSValue(value: string, platform: Platform): PartnerId {
    return new PartnerId(value);
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return 'varchar(36)';
  }
}
```

E usar esse tipo na definicao do schema com

```ts
export const PartnerSchema = new EntitySchema<Partner>({
  class: Partner,
  properties: {
    id: { primary: true, customType: new PartnerIdSchemaType() },
    name: { type: 'string', length: 255 },
  },
});
```

Assim convereremos adequadamento o valueObject na obtencao do banco

# Criando contrato para os repositorios

Dentro de @core/common/dommain podemos criar um `repository.interface.ts`. Que vai ser o contrato dos repositories

```ts
import { AggregateRoot } from './aggregate-root';

export interface IRepository<E extends AggregateRoot> {
  add(entity: E): Promise<void>;
  findById(id: any): Promise<E | null>;
  findAll(): Promise<E[]>;
  delete(entity: E): Promise<void>;
}
```

- Via generic restrinjo que posso ter repositorios apenas para agregados
- Nao posso ter operacoes que representam regras de negocio, apenas persistencias
- Prefirmos usar `add` ao inves de save para explicitar melhor que estamos usando unit-of-work (que o dado nao sera salvo na hora) 

Apos isso podemos criar a prineira interface do respositorio para partner. Vamos colocar na camada de dominio em @core/events/domain/repositories. O arquivo `partner-repository.interface.ts`

```ts
import { IRepository } from '../../../common/domain/repository-interface';
import { Partner } from '../entities/partner.entity';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPartnerRepository extends IRepository<Partner> {}
```

# Criando primeira implementacao de um repositorio

na camada de infra que criamos, vamos criar um arquivo `partner-mysqql.respository.ts` na pasta repositories `@core/events/infra/db/repositories`

```ts
import { EntityManager } from '@mikro-orm/mysql';
import { Partner, PartnerId } from '../../../domain/entities/partner.entity';
import { IPartnerRepository } from '../../../domain/repositories/partner-repository.interface';

export class PartnerMysqlRepository implements IPartnerRepository {
  constructor(private entityManager: EntityManager) {}

  async add(entity: Partner): Promise<void> {
    this.entityManager.persist(entity);
  }

  findById(id: string | PartnerId): Promise<Partner | null> {
    return this.entityManager.findOneOrFail(Partner, {
      id: typeof id === 'string' ? new PartnerId(id) : id,
    });
  }

  findAll(): Promise<Partner[]> {
    return this.entityManager.find(Partner, {});
  }

  async delete(entity: Partner): Promise<void> {
    this.entityManager.remove(entity);
  }
}
```

- inejetamos o entity manager
- O o persist to mikrorm funciona para insersao e update, sendo assim o nosso metodo add vai servir tambem
No findBy id, demos opcao de receber uma string que sera convertidade para object value que o EntityManager entende
- Lembrando que a operacao nao é efetivada no banco por conta do unit-of-work

Para executar seria(com teste)
```ts
import { MikroORM, MySqlDriver } from '@mikro-orm/mysql';
import { PartnerSchema } from '../../schemas';
import { Partner } from '../../../../domain/entities/partner.entity';
import { PartnerMysqlRepository } from '../partner-mysql.repository';

test('partner repository', async () => {
  const orm = await MikroORM.init<MySqlDriver>({
    entities: [PartnerSchema],
    dbName: 'events',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    type: 'mysql',
    forceEntityConstructor: true,
  });
  await orm.schema.refreshDatabase();
  const em = orm.em.fork();
  const partnerRepo = new PartnerMysqlRepository(em);

  const partner = Partner.create({ name: 'Partner 1' });
  await partnerRepo.add(partner);
  await em.flush();
  await em.clear(); // limpa o cache do entity manager (unit of work)

  let partnerFound = await partnerRepo.findById(partner.id);
  expect(partnerFound.id.equals(partner.id)).toBeTruthy();
  expect(partnerFound.name).toBe(partner.name);

  partner.changeName('Partner 2');
  await partnerRepo.add(partner);
  await em.flush();
  await em.clear(); // limpa o cache do entity manager (unit of work)

  partnerFound = await partnerRepo.findById(partner.id);
  expect(partnerFound.id.equals(partner.id)).toBeTruthy();
  expect(partnerFound.name).toBe(partner.name);

  console.log(await partnerRepo.findAll());

  partnerRepo.delete(partner);
  await em.flush();

  console.log(await partnerRepo.findAll());

  await orm.close();
});
```

- Quem vai ficar responsavel pelo controle transacional vai ser a camada de aplicacao.