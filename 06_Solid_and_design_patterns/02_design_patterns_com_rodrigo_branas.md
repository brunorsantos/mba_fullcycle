# Introducao

O termo vem da decada de 80... O livro famoso do GOF é focado em Object oriented (Orientacao a objetos)

os design patterns nada mais são do que soluções comuns que você muitas vezes chegaria naturalmente. Às vezes, uma simples interface que você implementa e você varia um comportamento de maneira polimórfica. Muitas vezes já recebe um nome, muita gente chama de Strategy, um dos padrões de comportamento. Às vezes, você simplesmente converte uma classe na outra, tem gente que dá o nome de Adapter. Quando você faz essa conversão entre diferentes interfaces, propriamente ditas, você está criando uma espécie de wrapper. Quando você tem algum tipo de padrão que notifica algum objeto, muito comum para quem trabalha na web, para quem está acostumado a criar um listener de um botão, você dá o nome de um padrão, como por exemplo um Observer. Então os padrões são mais comuns, mais triviais do que a gente imagina, e eu acho que a gente tem que justamente encarar os padrões com mais naturalidade, para que você não necessariamente tenha que premeditar o uso de um padrão.



![alt text](image-17.png)

todo código que a gente escreve, obrigatoriamente, está apoiado sobre uma decisão de design. E essa decisão de design é restringida por uma escolha de arquitetura.

Existem:
- Padroes do GOF
- J2EE
- PoEAA (Martin Fowler)


Padroes do GOF sao do tipo: 
- Criacao
- Estrutura
- Comportamento

# Criando o contexto

[Code](<02_design_patterns_com_rodrigo_branas_source/v0_contexto_projeto>)


Aplicacao de geracao de notas fiscais.

Comecando pelos testes, temos um teste `Deve gerar as notas fiscais` que chama um use case que executa essa acao

```ts
import GenerateInvoices from "../src/GenerateInvoices";

test("Deve gerar as notas fiscais", async function () {
    const generateInvoices = new GenerateInvoices();
    const output = await generateInvoices.execute();
    console.log(output);
});
```

```ts
import pgp from "pg-promise";

export default class GenerateInvoices {

    async execute () {
        const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
        const contracts = await connection.query("select * from branas.contract", []);
        console.log(contracts);
        return [];
    }

}
```

Considerando tambem a migration que incui um contrato e um pagamento:

```sql
drop schema branas cascade;

create schema branas;

create table branas.contract (
	id_contract uuid not null default uuid_generate_v4() primary key,
	description text,
	amount numeric,
	periods integer,
	date timestamp
);

create table branas.payment (
	id_payment uuid not null default uuid_generate_v4() primary key,
	id_contract uuid references branas.contract (id_contract),
	amount numeric,
	date timestamp
);

insert into branas.contract values ('4224a279-c162-4283-86f5-1095f559b08c', 'Prestação de serviços escolares', 6000, 12, '2022-01-01T10:00:00');
insert into branas.payment values ('c931d9db-c8d8-44d4-8861-b3d6b734c64e', '4224a279-c162-4283-86f5-1095f559b08c', 6000, '2022-01-05T10:00:00');
```


# DTO - Data Transfer Object

[Code](<02_design_patterns_com_rodrigo_branas_source/v1_dto>)

Objeto que só tem propriedades, sendo utilizado para transporte entre camadas da aplicação (Entrada e saida)

Adicionando mais funcionalidades, queremos checar no teste, saida baseada em entreada, sendo assim modificamos o teste existente para um verificao por reginme de caixa e outro por competencia:

```ts
test("Deve gerar as notas fiscais por regime de caixa", async function () {
	const input = {
		month: 1,
		year: 2022,
		type: "cash"
	};
	const output = await generateInvoices.execute(input);
	expect(output.at(0)?.date).toEqual(new Date("2022-01-05T13:00:00Z"));
	expect(output.at(0)?.amount).toBe(6000);
});

test("Deve gerar as notas fiscais por regime de competência", async function () {
	const input = {
		month: 1,
		year: 2022,
		type: "accrual"
	};
	const output = await generateInvoices.execute(input);
	expect(output.at(0)?.date).toEqual(new Date("2022-01-01T13:00:00Z"));
	expect(output.at(0)?.amount).toBe(500);
});
```

Informamos no input, ano, mes e regime da nota fiscal que queremos e a saida é uma lista.

Mudamos o use case, incluindo nele os contratos seguindo o pattern DTO

```ts
type Input = {
	month: number,
	year: number,
	type: string,
}

export type Output = {
	date: Date,
	amount: number
}
```

E deixando o use case com a logica devida para cada regime de nota fiscal que eu quero

```ts
export default class GenerateInvoices {

    async execute (input: Input): Promise<Output[]> {
        const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
        const contracts = await connection.query("select * from branas.contract", []);
        const output: Output[] = [];
        for (const contract of contracts) {
            if (input.type === "cash") {
                const payments = await connection.query(
                    "select * from branas.payment where id_contract = $1", 
                    [contract.id_contract]
                );
                for (const payment of payments) {
                    if (
                        payment.date.getMonth() + 1 !== input.month || 
                        payment.date.getFullYear() !== input.year
                    ) continue;
                    
                    output.push({ 
                        date: moment(payment.date).format("YYYY-MM-DD"), 
                        amount: parseFloat(payment.amount) 
                    });
                }
            }
            
            if (input.type === "accrual") {
                let period = 0;
                while (period <= contract.periods) {
                    const date = moment(contract.date).add(period++, "months").toDate();
                    if (date.getMonth() + 1 !== input.month || date.getFullYear() !== input.year) continue;
                    const amount = parseFloat(contract.amount) / contract.periods;
                    output.push({ date: moment(date).format("YYYY-MM-DD"), amount });
                }
            }
        }
        
        await connection.$pool.end();
        return output;
    }

}
```

Bom levar em conta que estamos ferindo o principrio do Single responsability do solid.

> Devemos separar coisas que mudam por motivos diferentes

O que muda por motivo diferente:

- Conexao (Se mudar como eu conecto, banco, etc)
- Obtencao de dados (Como eu faco o SQL)
- Tipo de regime (Se ele muda mudo nessa clase, tem um tipo novo, etc, muda essa classe)
- Forma de pagamento/apuracao (Logica para falar como cada tipo se comporta)

# Repository

[Code](<02_design_patterns_com_rodrigo_branas_source/v2_repository>)

Realizar a persistência de aggregates (clusters de objetos de domínio como entities e value objects), separando essa responsabilidade da aplicação

Vamos separar a parte de dados da aplicacao, de forma com que eu consiga ate trocar ela se necessario. 
- Dando atenca que nao é um padrao que persiste qualquer coisa e sim agreggates (pensando em dominio)

Vamos entao criar o repositório ja com interface `ContractRepository`

```ts
export default interface ContractRepository {
	list (): Promise<any>;
}
```

Com um possivel implementacao chamada `ContractDatabaseRepository` que é uma versao desse repositório para obter dados do banco.

- Que por agora pode ate ficar com a conexao de banco, por falta de um lugar melhor
- REspositorio esta falando de aggretates, sendo assim, podemos pensar que no nosso dominio nao faz sendito desassociar contrato de payment, por isso podemos manter em um unico repositorio as duas coisas. (O cluster é formado de 2 entidades)

```ts
import ContractRepository from "./ContractRepository";
import pgp from "pg-promise";

export default class ContractDatabaseRepository implements ContractRepository {

    async list(): Promise<any> {
        const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
        const contracts = await connection.query("select * from branas.contract", []);
        for (const contract of contracts) {
            contract.payments = await connection.query(
                "select * from branas.payment where id_contract = $1", 
                [contract.id_contract]
            );
        }
        return contracts;
    }
}
```

Tirando tanto a parte de criar conxecao e obter dados do bando do use case.


```ts
    async execute (input: Input): Promise<Output[]> {
        const output: Output[] = [];
        const contractRepository = new ContractDatabaseRepository()
        const contracts = await contractRepository.list()
        for (const contract of contracts) {
            if (input.type === "cash") {
                for (const payment of contract.payments) {
                    if (
                        payment.date.getMonth() + 1 !== input.month || 
                        payment.date.getFullYear() !== input.year
                    ) continue;
                    
                    output.push({ 
                        date: moment(payment.date).format("YYYY-MM-DD"), 
                        amount: parseFloat(payment.amount) 
                    });
                }
            }
            
            if (input.type === "accrual") {
                let period = 0;
                while (period <= contract.periods) {
                    const date = moment(contract.date).add(period++, "months").toDate();
                    if (date.getMonth() + 1 !== input.month || date.getFullYear() !== input.year) continue;
                    const amount = parseFloat(contract.amount) / contract.periods;
                    output.push({ date: moment(date).format("YYYY-MM-DD"), amount });
                }
            }
        }
    
        return output;
    }
```

Em que criamos um objeto de `ContractDatabaseRepository` no use case.

Fizemos algumas decisoes de design, distribuindo responsabilidades. Isso foi permitido pela arquitetura (Escolher paradigma de orientacao objeto)

Fica o problema que estamos usando uma interface sem todas as vantagens dela. Estamos por exemplo deixando o teste acoplado com o banco de dados. Fazendo o teste ter um controle dessa dependencia `ContractRepository`.

# Principio DIP (Dependency inversion principle)

[Code](<02_design_patterns_com_rodrigo_branas_source/v3_dip>)

> Componentes de alto nível não devem depender de componentes de baixo nível, eles devem depender de abstrações

Sendo assim o alto nivel (use case nao pode depdender do banco de dados), assim precisamos tirar o New em `ContractDatabaseRepository` do use case.

Sendo assim vamos injetar a dependencia usando um construtor que espera a interface `ContractDatabaseRepository`

```ts
export default class GenerateInvoices {

    constructor (
		readonly contractRepository: ContractRepository
	) {
	}

    async execute (input: Input): Promise<Output[]> {
        const output: Output[] = [];
        const contracts = await this.contractRepository.list()
        for (const contract of contracts) {
           ....     
```

Assim vamos poder usar coisas como `generateInvoices = new GenerateInvoices(contractRepository);`

Me dando a possibilidade de desacoplar meu teste do banco de dados, dando uma implementacao falsa do `list()`, mockando ele.

Podemos usar um `beforeEach` por exemplo para isto

```ts
beforeEach(() => {
	const contractRepository: ContractRepository = {
		async list (): Promise<any> {
			return [
				{
					idContract: "",
					description: "",
					periods: 12,
					amount: "6000",
					date: new Date("2022-01-01T10:00:00"),
					payments: [
						{
							idPayment: "",
							idContract: "",
							amount: 6000,
							date: new Date("2022-01-05T10:00:00")
						}
					]
				}
			]
		}
	}

	generateInvoices = new GenerateInvoices(contractRepository);
});
```
Fazendo cada teste usar o `generateInvoices` criado com o banco falso. Melhoramos assim o padrao repository.

Temos um problema ainda, estamos criando um conexao fixa dentro do repository

# Adapter

[Code](<02_design_patterns_com_rodrigo_branas_source/v4_adapter>)

> Converte a interface de uma classe em outra esperada pelo cliente, permitindo que classes incompatíveis trabalhem juntas

Podemos criar uma abstracao chamada `DatabaseConnection` que permite que a gente faca um query e feche uma conexao. Que basicamente é um contrato.

```ts
export default interface DatabaseConnection {
	query (statement: string, params: any): Promise<any>;
	close (): Promise<void>;
}
```

![alt text](image-18.png)

No nosso caso o cliente é nosso sistema que vai conhecer apenas DatabaseConnection

Sendo assim, vamos criar um PgPromisseAdapter para a Connection

```ts
import DatabaseConnection from "./DatabaseConnection";
import pgp from "pg-promise";

export default class PgPromiseAdapter implements DatabaseConnection {
	connection: any;

	constructor () {
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

Desta forma agora podemos de novo usando inversao de dependencia injetando no repository o databaseConnection, usando 

```ts
	constructor (readonly connection: DatabaseConnection) {
	}
```

e usando o `this.connection.query`.

Isso vai permitir mais controle como no teste. Em que agora podemos passar a connection que a gente quer ao criar o repository


```ts
let connection: DatabaseConnection;
let contractRepository: ContractRepository;

beforeEach(() => {
	connection = new PgPromiseAdapter();
	contractRepository = new ContractDatabaseRepository(connection);
	generateInvoices = new GenerateInvoices(contractRepository);
});
```

Da melhorar ainda mais o padrao repository, criando o aggreate (objetos de dominios) e fazendo ele retornar esse tipo(ao inves de Any).
Criamos entao `Contract` e `Payment`

```ts
import Invoice from "./Invoice";
import InvoiceGenerationFactory from "./InvoiceGenerationFactory";
import InvoiceGenerationStrategy from "./InvoiceGenerationStrategy";
import Payment from "./Payment";
import moment from "moment";

export default class Contract {
	private payments: Payment[];

	constructor (
		readonly idContract: string,
		readonly description: string,
		readonly amount: number,
		readonly periods: number,
		readonly date: Date
	) {
		this.payments = [];
	}
}
```

```ts
export default class Payment {

	constructor (
		readonly idPayment: string,
		readonly date: Date,
		readonly amount: number
	) {
	}
}
```

Agora sim está mais proximo de um repositorio (ainda falta colocar logica nas entidades), como `addPayment` e `getPayments`

Fazendo o repositorio (interface e implementacao) retornar esses objetos corretos

```ts
import Contract from "./Contract";

export default interface ContractRepository {
	list (): Promise<Contract[]>;
}
```

```ts
import ContractRepository from "./ContractRepository";
import pgp from "pg-promise";

export default class ContractDatabaseRepository implements ContractRepository {

	constructor (readonly connection: DatabaseConnection) {
	}

	async list(): Promise<Contract[]> {
		const contracts: Contract[] = [];
		const contractsData = await this.connection.query("select * from branas.contract", []);
		for (const contractData of contractsData) {
			const contract = new Contract(contractData.id_contract, contractData.description, parseFloat(contractData.amount), contractData.periods, contractData.date);
			const paymentsData = await this.connection.query("select * from branas.payment where id_contract = $1", [contract.idContract]);
			for (const paymentData of paymentsData) {
				contract.addPayment(new Payment(paymentData.id_payment, paymentData.date, parseFloat(paymentData.amount)));
			}
			contracts.push(contract);
		}
		return contracts;
	}
}
```

Podemos ate tirar o parseFloat to usecase.

Melhorando ainda, pensando nesse trecho do use case:

```ts
        for (const contract of contracts) {
            if (input.type === "cash") {
                for (const payment of contract.getPayments()) {
                    if (
                        payment.date.getMonth() + 1 !== input.month || 
                        payment.date.getFullYear() !== input.year
                    ) continue;
                    
                    output.push({ 
                        date: moment(payment.date).format("YYYY-MM-DD"), 
                        amount: payment.amount 
                    });
                }
            }
            
            if (input.type === "accrual") {
                let period = 0;
                while (period <= contract.periods) {
                    const date = moment(contract.date).add(period++, "months").toDate();
                    if (date.getMonth() + 1 !== input.month || date.getFullYear() !== input.year) continue;
                    const amount = parseFloat(contract.amount) / contract.periods;
                    output.push({ date: moment(date).format("YYYY-MM-DD"), amount });
                }
            }
        }
```

Pensando bem, ele esta pegando um contrato e toma decisa de qual invoice ele vai gerar... Sendo assim podemos transferir isso pra dentro do da entidade de contrato com um metodo `GenerateInvoice`. Percebemos assim que surge uma entidade invoice.

```ts
export default class Invoice {

	constructor (readonly date: Date, readonly amount: number) {
	}
}
```

Para o generate invoice (metodo de contrato) precisamos orientar qual mes e ano (vindo do input) e retorna os invoices criados a partir de um contract.



```ts
	generateInvoices(month: number, year: number, type: string) {
		const invoices: Invoice[] = [];
		if (type === "cash") {
			for (const payment of this.getPayments()) {
				if (payment.date.getMonth() + 1 !== month || payment.date.getFullYear() !== year) continue;
				invoices.push(new Invoice(payment.date, payment.amount));
			}
		}
	
		if (type === "accrual") {
			let period = 0;
			while (period <= this.periods) {
				const date = moment(this.date).add(period++, "months").toDate();
				if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue;
				const amount = this.amount / this.periods;
				invoices.push(new Invoice(date, amount));
			}
		}
		return invoices;
	}
```

Sem a gente dar conta, criamos a possibilidade de teste um teste de contratos (agora sim é um teste de unidade). Assim criamos um `Contract.test.ts`

```ts
import Contract from "../src/domain/Contract";
import Payment from "../src/domain/Payment";
// unit
test("Deve calcular o saldo do contrato", function () {
	const contract = new Contract("", "", 6000, 12, new Date("2022-01-01T10:00:00"));
	contract.addPayment(new Payment("", new Date("2022-01-01T10:00:00"), 2000));
	expect(contract.getBalance()).toBe(4000);
});

test("Deve gerar faturas de um contrato", function () {
	const contract = new Contract("", "", 6000, 12, new Date("2022-01-01T10:00:00"));
	const invoices = contract.generateInvoices(1, 2022, "accrual");
	expect(invoices.at(0)?.date).toEqual(new Date("2022-01-01T13:00:00.000Z"));
	expect(invoices.at(0)?.amount).toBe(500);
});
```


# Stategy

> Criar comportamento intercambiável

![alt text](image-19.png)

Resolve o principio do open-closed-principle do solid

> Fechado para modificação e aberto para extensão
> Crie pontos de extensão, evitando mexer no que já está funcionando e evitando fragilizar o código

Olhando para este codigo aqui nao está legal, considerando que está bem sensivel a mudanca caso algum type novo seja criado

```ts
	generateInvoices(month: number, year: number, type: string) {
		const invoices: Invoice[] = [];
		if (type === "cash") {
			for (const payment of this.getPayments()) {
				if (payment.date.getMonth() + 1 !== month || payment.date.getFullYear() !== year) continue;
				invoices.push(new Invoice(payment.date, payment.amount));
			}
		}
	
		if (type === "accrual") {
			let period = 0;
			while (period <= this.periods) {
				const date = moment(this.date).add(period++, "months").toDate();
				if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue;
				const amount = this.amount / this.periods;
				invoices.push(new Invoice(date, amount));
			}
		}
		return invoices;
	}
```

Vamos usar o padrao stategy para resolver isso

> Strategy is a behavioral design pattern that lets you define a family of algorithms, put each of them into a separate class, and make their objects interchangeable.

O repository e o adapter chegam a ser strategies seguindo essa logica

Sendo assim, podemos criar um interface `InvoiceGenationStrategy` que o metodo generate espera o ano e mes necessarios para gerar o invoice

```ts
import Contract from "./Contract";
import Invoice from "./Invoice";

export default interface InvoiceGenerationStrategy {
	generate (contract: Contract, month: number, year: number): Invoice[];
}
```

E ter as duas implementacoes que cumpririam o papel do `if` cada uma com sua logica dependendo da estrategia

`CashBasisStrategy`

```ts
import Contract from "./Contract";
import Invoice from "./Invoice";
import InvoiceGenerationStrategy from "./InvoiceGenerationStrategy";

export default class CashBasisStrategy implements InvoiceGenerationStrategy {

	generate(contract: Contract, month: number, year: number): Invoice[] {
		const invoices: Invoice[] = [];
		for (const payment of contract.getPayments()) {
			if (payment.date.getMonth() + 1 !== month || payment.date.getFullYear() !== year) continue;
			invoices.push(new Invoice(payment.date, payment.amount));
		}
		return invoices;
	}

}
```

`AccrualBasisStrategy`

```ts
import Contract from "./Contract";
import Invoice from "./Invoice";
import InvoiceGenerationStrategy from "./InvoiceGenerationStrategy";
import moment from "moment";

export default class AccrualBasisStrategy implements InvoiceGenerationStrategy {

	generate(contract: Contract, month: number, year: number): Invoice[] {
		const invoices: Invoice[] = [];
		let period = 0;
		while (period <= contract.periods) {
			const date = moment(contract.date).add(period++, "months").toDate();
			if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue;
			const amount = contract.amount/contract.periods;
			invoices.push(new Invoice(date, amount));
		}
		return invoices;
	}

}
```

Um coisa necessaria será uma forma associar o type com a strategy, para isso vamos usar um outro padrao `Dynamic Factory`

> Criar uma instância com base em uma string

Em que via a string identificamos a strategy adequada.

```ts
import AccrualBasisStrategy from "./AccrualBasisStrategy";
import CashBasisStrategy from "./CashBasisStrategy";

export default class InvoiceGenerationFactory {

	static create (type: string) {
		if (type === "cash") {
			return new CashBasisStrategy();
		}
		if (type === "accrual") {
			return new AccrualBasisStrategy();
		}
		throw new Error("Invalid type");
	}
}
```

Considerando que vamos escolher essa selecao na geracao do invoice, fazemos o `generateInvoices` da classe do contrato identificar a estrategia

```ts
	generateInvoices (month: number, year: number, type: string) {
		const invoiceGenerationStrategy = InvoiceGenerationFactory.create(type);
		return invoiceGenerationStrategy.generate(this, month, year);
	}
```

Assim deixamos tambem a classe contract com mais itens realmente relacionados a regra de negocio como um `getBalance`




