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

[Code](<06_Solid_and_design_patterns/02_design_patterns_com_rodrigo_branas_source/v0_contexto_projeto>)


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


