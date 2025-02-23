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
