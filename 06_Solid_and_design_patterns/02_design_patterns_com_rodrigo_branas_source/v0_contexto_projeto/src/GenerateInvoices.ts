import pgp from "pg-promise";

export default class GenerateInvoices {

    async execute () {
        const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
        const contracts = await connection.query("select * from branas.contract", []);
        console.log(contracts);
        return [];
    }

}