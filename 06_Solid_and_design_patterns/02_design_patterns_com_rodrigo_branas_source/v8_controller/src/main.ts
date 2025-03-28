import ContractDatabaseRepository from "./infra/repository/ContractDatabaseRepository";
import ExpressAdapter from "./infra/http/ExpressAdapter";
import GenerateInvoices from "./application/usecase/GenerateInvoices";
import JsonPresenter from "./infra/presenter/JsonPresenter";
import LoggerDecorator from "./application/decorator/LoggerDecorator";
import MainController from "./infra/http/MainController";
import PgPromiseAdapter from "./infra/database/PgPromiseAdapter";
import Mediator from "./infra/mediator/Mediator";

const connection = new PgPromiseAdapter();
const contractRepository = new ContractDatabaseRepository(connection);
const mediator = new Mediator();
const generateInvoices = new LoggerDecorator(new GenerateInvoices(contractRepository, new JsonPresenter(), mediator));
const httpServer = new ExpressAdapter();
new MainController(httpServer, generateInvoices);
httpServer.listen(3000);
