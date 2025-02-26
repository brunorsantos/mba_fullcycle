import express from "express"
import PgPromiseAdapter from "./PgPromiseAdapter";
import JsonPresenter from "./JsonPresenter";
import GenerateInvoices from "./GenerateInvoices";
import ContractDatabaseRepository from "./ContractDatabaseRepository";
import LoggerDecorator from "./LoggerDecorator";
const app = express();
app.use(express.json());

const connection = new PgPromiseAdapter();
const contractRepository = new ContractDatabaseRepository(connection);
const generateInvoices = new LoggerDecorator(new GenerateInvoices(contractRepository, new JsonPresenter()));

app.post("/generate_invoices", async function (req: any, res: any) {
    console.log(req.headers);
    const input = req.body;
    const output = await generateInvoices.execute(input);
    res.json(output);
});

app.listen(3000);