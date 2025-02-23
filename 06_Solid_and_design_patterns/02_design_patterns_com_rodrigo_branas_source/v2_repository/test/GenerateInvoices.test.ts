import GenerateInvoices from "../src/GenerateInvoices";

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