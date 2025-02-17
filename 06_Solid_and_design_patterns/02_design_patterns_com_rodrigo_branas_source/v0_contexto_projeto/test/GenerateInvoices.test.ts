import GenerateInvoices from "../src/GenerateInvoices";

test("Deve gerar as notas fiscais", async function () {
    const generateInvoices = new GenerateInvoices();
    const output = await generateInvoices.execute();
    console.log(output);
});