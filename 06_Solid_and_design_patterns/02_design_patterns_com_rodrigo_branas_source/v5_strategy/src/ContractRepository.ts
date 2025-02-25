import Contract from "./Contract";

export default interface ContractRepository {
	list (): Promise<Contract[]>;
}