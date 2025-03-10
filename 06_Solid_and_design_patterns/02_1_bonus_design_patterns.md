# Abstract Factory

Padrao de criacao

> Oferece uma interface para criar famílias de objetos relacionados, sem especificar suas classes concretas, promovendo a criação de sistemas flexíveis que se adaptam a diferentes tipos de produtos ou recursos

## Quando Usar?
- Quando você precisa criar um grupo de objetos relacionados (ex: botões e checkboxes para diferentes sistemas operacionais).
- Quando quer garantir que os objetos criados sejam compatíveis entre si.
- Quando deseja ocultar a lógica de criação dos objetos concretos.

---


Consirando o exemplo, vamos supor que queremos dar suporte a outros bancos de dados (por exemplo, MySQL e SQLite). Para isso, podemos usar Abstract Factory para criar a conexão e o repositório apropriados para cada banco.

Ja temos as interfaces `ContractRepository` e `DatabaseConnection`, sendo assim podemos a interface para a abstract factory

```ts
import DatabaseConnection from "../database/DatabaseConnection";
import ContractRepository from "../repository/ContractRepository";

export default interface PersistenceFactory {
    createConnection(): DatabaseConnection;
    createContractRepository(connection: DatabaseConnection): ContractRepository;
}
```

E considerando que tempos ja a implementacoes concretas `PgPromiseAdapter`, `ContractDatabaseReposity`(Para Postgree) e teriamos as novas `MysqlAdapter` e `MysqlContractRepository` podemos criar as fabricas concretas

Fabrica para PostgreSQL
```ts
import PersistenceFactory from "./PersistenceFactory";
import PgPromiseAdapter from "../database/PgPromiseAdapter";
import PgContractRepository from "../repository/PgContractRepository";

export default class PgPersistenceFactory implements PersistenceFactory {
    createConnection() {
        return new PgPromiseAdapter();
    }

    createContractRepository(connection: PgPromiseAdapter) {
        return new PgContractRepository(connection);
    }
}
```

Fábrica para MySQL
```ts
import PersistenceFactory from "./PersistenceFactory";
import MysqlAdapter from "../database/MysqlAdapter";
import MysqlContractRepository from "../repository/MysqlContractRepository";

export default class MysqlPersistenceFactory implements PersistenceFactory {
    createConnection() {
        return new MysqlAdapter();
    }

    createContractRepository(connection: MysqlAdapter) {
        return new MysqlContractRepository(connection);
    }
}
```


E criamos um factory selector que retorna a fabrica correta com base em um parametro

```ts
import PgPersistenceFactory from "./PgPersistenceFactory";
import MysqlPersistenceFactory from "./MysqlPersistenceFactory";
import PersistenceFactory from "./PersistenceFactory";

export default class FactorySelector {
    static getFactory(dbType: string): PersistenceFactory {
        if (dbType === "PostgreSQL") return new PgPersistenceFactory();
        if (dbType === "MySQL") return new MysqlPersistenceFactory();
        throw new Error("Tipo de banco de dados inválido");
    }
}
```

E usar ela para instancias os objetos corretamente no main (Composition Root)

```ts
import FactorySelector from "../factory/FactorySelector";
import GenerateInvoices from "./GenerateInvoices";

const dbType = process.env.DB_TYPE || "PostgreSQL"; // Define o banco de dados dinamicamente
const persistenceFactory = FactorySelector.getFactory(dbType);

// Criamos a conexão e o repositório corretos
const connection = persistenceFactory.createConnection();
const contractRepository = persistenceFactory.createContractRepository(connection);

// Criamos o caso de uso injetando o repositório correto
const generateInvoices = new GenerateInvoices(contractRepository);
```

# Singleton

> Garante que apenas uma instância de uma classe seja criada, sendo útil para objetos que devem ter apenas um ponto de acesso em um sistema.

### Quando Usar?
- Quando precisamos garantir que haja apenas um objeto de uma determinada classe em toda a aplicação.
- Quando queremos compartilhar um estado global sem precisar passar objetos entre as classes.
- Quando a criação de múltiplas instâncias pode causar problemas de concorrência ou inconsistência.

---
Atualmente estamos usando um PgPromiseAdapter para a conexão com o PostgreSQL.
Porém, atualmente, cada vez que um repositório é criado, uma nova conexão é aberta. Isso pode gerar problemas de performance e concorrência. Alem de criar multiplas conexoes desenecessarias

```ts
export default class PgPromiseAdapter implements DatabaseConnection {
    connection: any;

    constructor() {
        this.connection = pgp()("postgres://postgres:123456@localhost:5432/app");
    }

    query(statement: string, params: any): Promise<any> {
        return this.connection.query(statement, params);
    }

    close(): Promise<void> {
        return this.connection.$pool.end();
    }
}
```

Podemos resolver isso aplicando o Singleton ao PgPromiseAdapter, garantindo uma única instância de conexão para toda a aplicação.

```ts
import DatabaseConnection from "./DatabaseConnection";
import pgp from "pg-promise";

export default class PgPromiseAdapter implements DatabaseConnection {
    private static instance: PgPromiseAdapter;
    private connection: any;

    private constructor() {
        this.connection = pgp()("postgres://postgres:123456@localhost:5432/app");
    }

    static getInstance(): PgPromiseAdapter {
        if (!PgPromiseAdapter.instance) {
            PgPromiseAdapter.instance = new PgPromiseAdapter();
        }
        return PgPromiseAdapter.instance;
    }

    query(statement: string, params: any): Promise<any> {
        return this.connection.query(statement, params);
    }

    close(): Promise<void> {
        return this.connection.$pool.end();
    }
}
```

- Deixamos o construtor privado (private constructor) → impede que outras classes instanciem PgPromiseAdapter diretamente.
- Criamos metodo método estático getInstance() → verifica se já existe uma instância e retorna a mesma, garantindo que apenas uma única conexão seja criada.
- Criamos uma propriedade static instance → armazena a única instância da classe.

```ts
const connection = PgPromiseAdapter.getInstance();
const contractRepository = new ContractDatabaseRepository(connection);
const generateInvoices = new GenerateInvoices(contractRepository);
```

Tambem poderia utilizar a mesma coisa para o Logger

```ts
class Logger {
    private static instance: Logger;

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    log(message: string): void {
        console.log(`[LOG]: ${message}`);
    }
}
```

```ts
const logger = Logger.getInstance();
logger.log("Sistema iniciado");
```

# Builder

> Permite a construção passo a passo de objetos complexos, facilitando a criação de objetos com diferentes configurações sem a necessidade de construtores complexos.

## Quando usar

- Quando precisamos criar objetos complexos com muitas propriedades opcionais.
- Quando temos diferentes representações do mesmo tipo de objeto.
- Quando queremos evitar grandes construtores com muitos parâmetros.

---

Podemos considerar um bom candidato a classe `Contract` que tem varias propriedades como description, amount, periods, date, além dos pagamentos associados (payments).

```ts
export default class Contract {
    private payments: Payment[];

    constructor(
        readonly idContract: string,
        readonly description: string,
        readonly amount: number,
        readonly periods: number,
        readonly date: Date
    ) {
        this.payments = [];
    }

    addPayment(payment: Payment) {
        this.payments.push(payment);
    }

    getPayments() {
        return this.payments;
    }
}
```

Para criar um objeto seria trabalhoso passar todos os parametros, mesmo que alguns deles nao sejam obrigatorios

```ts
const contract = new Contract(
    "1",
    "Serviço de Consultoria",
    5000,
    12,
    new Date("2024-01-01")
);
```

Sendo assim podemos ter um `ContractBuilder` para metodos encadeaveis setando cada propriedade

```ts
import Contract from "./Contract";
import Payment from "./Payment";

export default class ContractBuilder {
    private idContract: string = "";
    private description: string = "";
    private amount: number = 0;
    private periods: number = 0;
    private date: Date = new Date();
    private payments: Payment[] = [];

    setId(id: string): ContractBuilder {
        this.idContract = id;
        return this;
    }

    setDescription(description: string): ContractBuilder {
        this.description = description;
        return this;
    }

    setAmount(amount: number): ContractBuilder {
        this.amount = amount;
        return this;
    }

    setPeriods(periods: number): ContractBuilder {
        this.periods = periods;
        return this;
    }

    setDate(date: Date): ContractBuilder {
        this.date = date;
        return this;
    }

    addPayment(payment: Payment): ContractBuilder {
        this.payments.push(payment);
        return this;
    }

    build(): Contract {
        const contract = new Contract(
            this.idContract,
            this.description,
            this.amount,
            this.periods,
            this.date
        );
        for (const payment of this.payments) {
            contract.addPayment(payment);
        }
        return contract;
    }
}
```

Assim poderiamos criar objetos de contratos de forma mais intuitiva

```ts
const contract = new ContractBuilder()
    .setId("1")
    .setDescription("Serviço de Consultoria")
    .setAmount(5000)
    .setPeriods(12)
    .setDate(new Date("2024-01-01"))
    .addPayment(new Payment("p1", new Date("2024-01-05"), 5000))
    .build();
```

Podemos aplicar por exemplo no repositorio:

Antes do builder

```ts
async list(): Promise<Contract[]> {
    const contracts: Contract[] = [];
    const contractsData = await this.connection.query("SELECT * FROM branas.contract", []);
    for (const contractData of contractsData) {
        const contract = new Contract(
            contractData.id_contract,
            contractData.description,
            parseFloat(contractData.amount),
            contractData.periods,
            contractData.date
        );
        contracts.push(contract);
    }
    return contracts;
}
```
Depois do builder

```ts
import ContractBuilder from "../domain/ContractBuilder";

async list(): Promise<Contract[]> {
    const contracts: Contract[] = [];
    const contractsData = await this.connection.query("SELECT * FROM branas.contract", []);
    for (const contractData of contractsData) {
        const contract = new ContractBuilder()
            .setId(contractData.id_contract)
            .setDescription(contractData.description)
            .setAmount(parseFloat(contractData.amount))
            .setPeriods(contractData.periods)
            .setDate(contractData.date)
            .build();
        contracts.push(contract);
    }
    return contracts;
}
```

# Facade

> Fornece uma interface simplificada para um conjunto de interfaces mais complexas, facilitando o uso e reduzindo a complexidade de um subsistema.

### Quando usar

- Quando queremos simplificar a interação com um sistema complexo.
- Quando temos múltiplos componentes interdependentes e queremos expor uma API única e mais amigável.
- Quando queremos diminuir o acoplamento entre partes do sistema.

--- 


Atualmente, para gerar uma nota fiscal, o cliente precisa instanciar e orquestrar diversos componentes:
- Conectar ao banco de dados.
- Criar um repositório.
- Definir o Presenter adequado.
- Chamar o caso de uso GenerateInvoices.

Com o Facade, podemos criar uma única interface que esconde toda essa complexidade, permitindo que o cliente apenas chame um método simplificado.

Sem o Facade, o código que gera notas fiscais pode ser assim:

```ts
const connection = PgPromiseAdapter.getInstance();
const contractRepository = new ContractDatabaseRepository(connection);
const presenter = new JsonPresenter();
const generateInvoices = new GenerateInvoices(contractRepository, presenter);

const input = { month: 1, year: 2022, type: "cash" };
const output = await generateInvoices.execute(input);
console.log(output);
```


Podemos entao criar o facade que encasula toda a logica:

```ts
import PgPromiseAdapter from "../database/PgPromiseAdapter";
import ContractDatabaseRepository from "../repository/ContractDatabaseRepository";
import GenerateInvoices from "../usecase/GenerateInvoices";
import JsonPresenter from "../presenter/JsonPresenter";
import CsvPresenter from "../presenter/CsvPresenter";
import XmlPresenter from "../presenter/XmlPresenter";
import InvoiceFormatter from "../formatter/InvoiceFormatter";

export default class InvoiceFacade {
    private generateInvoices: GenerateInvoices;

    constructor(private formatter: InvoiceFormatter) {
        const connection = PgPromiseAdapter.getInstance();
        const contractRepository = new ContractDatabaseRepository(connection);
        this.generateInvoices = new GenerateInvoices(contractRepository, this.formatter);
    }

    async generate(month: number, year: number, type: string) {
        return await this.generateInvoices.execute({ month, year, type });
    }
}
```

E podemos utilizar:

```ts
const invoiceFacade = new InvoiceFacade(new JsonPresenter());
const output = await invoiceFacade.generate(1, 2022, "cash");
console.log(output);
```

# Proxy

> Atua como um substituto para outro objeto, permitindo o controle do acesso, o retardamento da instanciação ou a adição de comportamentos adicionais, oferecendo uma forma de controlar ou interceptar a interação com outro objeto.

## Quando usar

- Quando queremos controlar o acesso a um objeto (ex: verificações de permissão antes de executar uma ação).
- Quando precisamos adicionar cache para evitar chamadas desnecessárias ao banco de dados.
- Quando queremos implementar lazy loading, carregando objetos pesados somente quando necessário.
- Quando precisamos adicionar logs ou monitoramento sem modificar a implementação original.

--- 

Podemos por exemplo evitar consultas repetidas que a implementacao atual do repositorio faz toda vez que é chamada.

```ts
export default class ContractDatabaseRepository implements ContractRepository {
    constructor(private readonly connection: DatabaseConnection) {}

    async list(): Promise<Contract[]> {
        console.log("Consultando contratos no banco...");
        const contracts: Contract[] = [];
        const contractsData = await this.connection.query("SELECT * FROM branas.contract", []);
        for (const contractData of contractsData) {
            const contract = new Contract(
                contractData.id_contract,
                contractData.description,
                parseFloat(contractData.amount),
                contractData.periods,
                contractData.date
            );
            contracts.push(contract);
        }
        return contracts;
    }
}
```

Podemos aplicar pattern proxy, criando um ContractRepositoryProxy, que atua como um intermediario antes de chamar o repositorio real

```ts
import Contract from "../domain/Contract";
import ContractRepository from "./ContractRepository";

export default class ContractRepositoryProxy implements ContractRepository {
    private cache: Contract[] | null = null;
    private lastFetchTime: number = 0;
    private cacheDuration: number = 60000; // Cache por 60 segundos

    constructor(private readonly contractRepository: ContractRepository) {}

    async list(): Promise<Contract[]> {
        const currentTime = Date.now();
        
        // Verifica se os contratos estão em cache e ainda são válidos
        if (this.cache && (currentTime - this.lastFetchTime < this.cacheDuration)) {
            console.log("Retornando contratos do cache...");
            return this.cache;
        }

        // Caso contrário, busca os contratos no banco e atualiza o cache
        console.log("Consultando contratos no banco...");
        this.cache = await this.contractRepository.list();
        this.lastFetchTime = currentTime;
        return this.cache;
    }
}
```

Agora, no Composition Root (main.ts), usamos o Proxy em vez do repositório diretamente:

```ts
const connection = PgPromiseAdapter.getInstance();
const contractRepository = new ContractDatabaseRepository(connection);
const contractRepositoryProxy = new ContractRepositoryProxy(contractRepository);

const generateInvoices = new GenerateInvoices(contractRepositoryProxy);
```


Para diferenciar o proxy do decorator...

- O Proxy adiciona uma camada intermediária que pode controlar quando e como um objeto real é acessado.
    - Não adicionamos comportamento novo ao repositório, apenas controlamos quando ele é chamado.
- O Decorator envolve um objeto existente para adicionar novas funcionalidades dinamicamente, sem modificar sua estrutura.
    - O Decorator “embrulha” o repositório, podendo adicionar comportamento antes e depois da chamada.


Lazy loading (bonus)

Podemos evitar que toda vez que carregamos contrato do banco, nao seja carregados os pagamentos do mesmo, fazendo um lazy loading

A classe contract receberá um getter para os pagamentos em vez de carregá-los diretamente, sendo assim os pagamentos só carregados quando getPayments() for chamado pela primeira vez.

```ts
import Payment from "./Payment";

export default class Contract {
    private loadPayments: (() => Promise<Payment[]>) | null = null;
    private payments: Payment[] | null = null;

    constructor(
        readonly idContract: string,
        readonly description: string,
        readonly amount: number,
        readonly periods: number,
        readonly date: Date
    ) {}

    setPaymentLoader(loader: () => Promise<Payment[]>) {
        this.loadPayments = loader;
    }

    async getPayments(): Promise<Payment[]> {
        if (!this.payments && this.loadPayments) {
            console.log("Carregando pagamentos do banco...");
            this.payments = await this.loadPayments();
        } else {
            console.log("Retornando pagamentos do cache...");
        }
        return this.payments ?? [];
    }
}
```

O repositório será responsável por configurar o Lazy Loading.


```ts
import Contract from "../domain/Contract";
import Payment from "../domain/Payment";
import ContractRepository from "./ContractRepository";
import DatabaseConnection from "../database/DatabaseConnection";

export default class ContractDatabaseRepository implements ContractRepository {
    constructor(private readonly connection: DatabaseConnection) {}

    async list(): Promise<Contract[]> {
        console.log("Consultando contratos no banco...");
        const contractsData = await this.connection.query("SELECT * FROM branas.contract", []);

        return contractsData.map(contractData => {
            const contract = new Contract(
                contractData.id_contract,
                contractData.description,
                parseFloat(contractData.amount),
                contractData.periods,
                contractData.date
            );

            // Configuramos o Lazy Loading sem expor o banco para o domínio
            contract.setPaymentLoader(async () => {
                const paymentsData = await this.connection.query(
                    "SELECT * FROM branas.payment WHERE id_contract = $1",
                    [contract.idContract]
                );
                return paymentsData.map(paymentData => 
                    new Payment(paymentData.id_payment, paymentData.date, parseFloat(paymentData.amount))
                );
            });

            return contract;
        });
    }
}
```

Agora, ao buscar contratos, apenas os contratos são carregados primeiro.

```ts
const connection = PgPromiseAdapter.getInstance();
const contractRepository = new ContractDatabaseRepository(connection);

async function main() {
    const contracts = await contractRepository.list();
    console.log("Contratos carregados.");

    // Pagamentos ainda não foram buscados
    const payments = await contracts[0].getPayments(); // Agora os pagamentos são carregados!
    console.log(payments);
}

main();
```

