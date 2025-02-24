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

	addPayment (payment: Payment) {
		this.payments.push(payment);
	}

	getPayments () {
		return this.payments;
	}

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
}


