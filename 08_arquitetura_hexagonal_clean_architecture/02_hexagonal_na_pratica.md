Vamos refatorar um projeto que utiliza spring, [na branch main](fhttps://github.com/devfullcycle/MBA-hexagonal-architecture).

Um servico que é um restapi para compra de tickets de evento. Que está em camadas e utiliza serviceLayers.

![alt text](image-2.png)




A principio um primeiro problema que vemos no codigo, é a quantidade de conteudo no controllers.

Ex: `EventController`

```java
@RestController
@RequestMapping(value = "events")
public class EventController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private EventService eventService;

    @Autowired
    private PartnerService partnerService;

    @PostMapping
    @ResponseStatus(CREATED)
    public Event create(@RequestBody EventDTO dto) {
        var event = new Event();
        event.setDate(LocalDate.parse(dto.getDate(), DateTimeFormatter.ISO_DATE));
        event.setName(dto.getName());
        event.setTotalSpots(dto.getTotalSpots());

        var partner = partnerService.findById(dto.getPartner().getId());
        if (partner.isEmpty()) {
            throw new RuntimeException("Partner not found");
        }
        event.setPartner(partner.get());

        return eventService.save(event);
    }

    @Transactional
    @PostMapping(value = "/{id}/subscribe")
    public ResponseEntity<?> subscribe(@PathVariable Long id, @RequestBody SubscribeDTO dto) {

        var maybeCustomer = customerService.findById(dto.getCustomerId());
        if (maybeCustomer.isEmpty()) {
            return ResponseEntity.unprocessableEntity().body("Customer not found");
        }

        var maybeEvent = eventService.findById(id);
        if (maybeEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var maybeTicket = eventService.findTicketByEventIdAndCustomerId(id, dto.getCustomerId());
        if (maybeTicket.isPresent()) {
            return ResponseEntity.unprocessableEntity().body("Email already registered");
        }

        var customer = maybeCustomer.get();
        var event = maybeEvent.get();

        if (event.getTotalSpots() < event.getTickets().size() + 1) {
            throw new RuntimeException("Event sold out");
        }

        var ticket = new Ticket();
        ticket.setEvent(event);
        ticket.setCustomer(customer);
        ticket.setReservedAt(Instant.now());
        ticket.setStatus(TicketStatus.PENDING);

        event.getTickets().add(ticket);

        eventService.save(event);

        return ResponseEntity.ok(new EventDTO(event));
    }
}
```

Em que por exemplo, caso venhamos a utilizar Uma cli ou graphQl vamos ter que copiar uma grande quantidade de codigo (o subscribe por exemplo, verifica se existe costumer, verifica se existe o evento, etc...)

Vemos tambem que os services acabam sendo um padrao que apenas repassa o conteudo pra frente. Como no exemplo de `EventService`

```java
@Service
public class EventService {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Transactional
    public Event save(Event event) {
        return eventRepository.save(event);
    }

    public Optional<Event> findById(Long id) {
        return eventRepository.findById(id);
    }
    
    public Optional<Ticket> findTicketByEventIdAndCustomerId(Long id, Long customerId) {
        return ticketRepository.findByEventIdAndCustomerId(id, customerId);
    }
}
```

# Anatomia de um caso de uso

Um local bom é comecar a extraindo os casos de uso.

Quais os tipo de casos de uso que encontramos? Vamos nesse caso explicitar eles criando classes abstratas(que poderiam ser interfaces). 

Considerando que o caso de uso tem input e output proprio. Não retorna a entidade, o agregado, ou objeto de valor. O caso de uso implementa o padrão Command (Tem apenas um metodo execute)


- Padrao: Recebe um dado e retorna um dado

```java
public abstract class UseCase<INPUT, OUTPUT> {
    public abstract OUTPUT execute(INPUT input);
}
```

- Unit: Recebe um dado e nao retorna

```java
public abstract class UnitUseCase<INPUT> {
    public abstract void execute(INPUT input);
}
```

- Nullary: Nao recebe dado e retorna

```java
package br.com.fullcycle.hexagonal.application.usecases;

public abstract class NullaryUseCase<OUTPUT> {
    public abstract OUTPUT execute();
}
```

Deixando nessa estrutura de pastas

```
br/
 └── com/
     └── fullcycle/
         └── hexagonal/
             └── application/
                 ├── NullaryUseCase
                 ├── UnitUseCase
                 └── UseCase
```

# Extraindo caso de uso createcustumer


Ao criar o primeiro use case `application/usecases/CreateCustomerUseCase` extendemos a classe abstrata `UsecCase` já promvendo um input e output como records

```java
public class CreateCustomerUseCase 
    extends UseCase<CreateCustomerUseCase.Input, CreateCustomerUseCase.Output> {

    @Override
    public Output execute(Input input) {
        return null;
    }

    public record Input(String cpf, String email, String name) {}

    public record Output(Long id, String cpf, String email, String name) {}
}
```

Complementando o useCase

```java
public class CreateCustomerUseCase 
    extends UseCase<CreateCustomerUseCase.Input, CreateCustomerUseCase.Output> {

    @Override
    public Output execute(final Input input) {
        if (customerService.findByCpf(input.cpf).isPresent()) {
            throw new ValidationException("Customer already exists");
        }

        if (customerService.findByEmail(input.email).isPresent()) {
            throw new ValidationException("Customer already exists");
        }

        var customer = new Customer();
        customer.setName(input.name);
        customer.setCpf(input.cpf);
        customer.setEmail(input.email);

        customer = customerService.save(customer);

        return new Output(customer.getId(), customer.getCpf(), customer.getEmail(), customer.getName());
    }

    public record Input(String cpf, String email, String name) {}

    public record Output(Long id, String cpf, String email, String name) {}
}
```


- Por enquanto vamos manter o acomplamento com `CostumerService`.
- Vamos criar um abstracao para uma `ValidationException` que extende a `RuntimeException` ao inves de apensas criar um Runtime
- Mantemos a intanciacao de Custumer por enquqnato
- Retornamos o Output interno



Para o teste do usecase, vamos ter um `CreateCustomerUseCaseTest`

```java
public class CreateCustomerUseCaseTest {

    @Test
    @DisplayName("Deve criar um cliente")
    public void testCreateCustomer() {
        // given
        final var expectedCPF = "12345678901";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        // when
        final var customerService = Mockito.mock(CustomerService.class);
        when(customerService.findByCpf(expectedCPF)).thenReturn(Optional.empty());
        when(customerService.findByEmail(expectedEmail)).thenReturn(Optional.empty());
        when(customerService.save(any())).thenAnswer(a -> {
            var customer = a.getArgument(0, Customer.class);
            customer.setId(UUID.randomUUID().getMostSignificantBits());
            return customer;
        });

        final var useCase = new CreateCustomerUseCase(customerService);
        final var output = useCase.execute(createInput);

        // then
        Assertions.assertNotNull(output.id());
        Assertions.assertEquals(expectedCPF, output.cpf());
        Assertions.assertEquals(expectedEmail, output.email());
        Assertions.assertEquals(expectedName, output.name());
    }
}
```

- Por enquanto vamos manter o service sendo injetado e mockando
- Vamos que criamos o input apenas para o useCase
- Obviamente vamos ter testes para os cenarios de: "Não deve cadastrar um cliente com CPF duplicado" e "Não deve cadastrar um cliente com e-mail duplicado"


Sendo assim agora podemos trocar o Controller para usar o useCase no create

```java
@RestController
@RequestMapping(value = "customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CustomerDTO dto) {
        try {
            final var useCase = new CreateCustomerUseCase(customerService);
            final var output = useCase.execute(new CreateCustomerUseCase.Input(
                dto.getCpf(), dto.getEmail(), dto.getName()
            ));
            return ResponseEntity.created(URI.create("/customers/" + output.id())).body(output);
        } catch (ValidationException ex) {
            return ResponseEntity.unprocessableEntity().body(ex.getMessage());
        }
    }
}
```

- Por enquanto nao estamos usando injecao de dependencia para o `CreateCustomerUseCase`
- O controller fica com a responsabilidade de converter para o body adequado e responseCodes


Assim como agora podemos ter uma implementacao para GraphQl, utilizando o useCase

```java
@Controller
public class CustomerResolver {

    private final CustomerService customerService;

    public CustomerResolver(final CustomerService customerService) {
        this.customerService = Objects.requireNonNull(customerService);
    }

    @MutationMapping
    public CreateCustomerUseCase.Output createCustomer(@Argument CustomerDTO input) {
        final var useCase = new CreateCustomerUseCase(customerService);
        return useCase.execute(new CreateCustomerUseCase.Input(
            input.getCpf(), input.getEmail(), input.getName()));
    }

    ...
}
```

- Por enquanto nao estamos usando injecao de dependencia para o `CreateCustomerUseCase`


Sendo assim tirar as regras de negocio acopladas ao driver(RestAPI).

- O restApi é o driver
- O caso de uso está expondo a porta
- Que torna o controller um adapter
- Assim como resolver do GraphQl tambem um adapter, que acessa a porta do useCase do createCostumer

# Extraindo os casos de uso implicitos

Tambem precisamos criar um use case novo tambem de costumer `application/usecases/GetCustomerByIdUseCase`

```java
package br.com.fullcycle.hexagonal.application.usecases;

import br.com.fullcycle.hexagonal.services.CustomerService;

import java.util.Objects;
import java.util.Optional;

public class GetCustomerByIdUseCase
    extends UseCase<GetCustomerByIdUseCase.Input, Optional<GetCustomerByIdUseCase.Output>> {

    private final CustomerService customerService;

    public GetCustomerByIdUseCase(final CustomerService customerService) {
        this.customerService = Objects.requireNonNull(customerService);
    }

    @Override
    public Optional<Output> execute(final Input input) {
        return customerService.findById(input.id)
            .map(c -> new Output(c.getId(), c.getCpf(), c.getEmail(), c.getName()));
    }

    public record Input(Long id) {}

    public record Output(Long id, String cpf, String email, String name) {}
}
```

- Lembrando de tambem ajustar o controller e o resolver do grphQl para utilizar

Temos 2 usecases de parter tambem para criar


- `application/usecases/CreatePartnerUseCase`

```java

public class CreatePartnerUseCase extends UseCase<CreatePartnerUseCase.Input, CreatePartnerUseCase.Output> {

    private final PartnerService partnerService;

    public CreatePartnerUseCase(final PartnerService partnerService) {
        this.partnerService = Objects.requireNonNull(partnerService);
    }

    @Override
    public Output execute(final Input input) {
        if (partnerService.findByCnpj(input.cnpj()).isPresent()) {
            throw new ValidationException("Partner already exists");
        }

        if (partnerService.findByEmail(input.email()).isPresent()) {
            throw new ValidationException("Partner already exists");
        }

        var partner = new Partner();
        partner.setName(input.name());
        partner.setCnpj(input.cnpj());
        partner.setEmail(input.email());

        partner = partnerService.save(partner);

        return new Output(partner.getId(), partner.getCnpj(), partner.getEmail(), partner.getName());
    }

    public record Input(String cnpj, String email, String name) {}

    public record Output(Long id, String cnpj, String email, String name) {}
}
```

- `application/usecases/GetPartnerByIdUseCase`


```java
public class GetPartnerByIdUseCase 
    extends UseCase<GetPartnerByIdUseCase.Input, Optional<GetPartnerByIdUseCase.Output>> {

    private final PartnerService partnerService;

    public GetPartnerByIdUseCase(final PartnerService partnerService) {
        this.partnerService = Objects.requireNonNull(partnerService);
    }

    @Override
    public Optional<Output> execute(final Input input) {
        return partnerService.findById(input.id)
            .map(p -> new Output(p.getId(), p.getCnpj(), p.getEmail(), p.getName()));
    }

    public record Input(Long id) {}

    public record Output(Long id, String cnpj, String email, String name) {}
}
```

Tambem ajustando o controller `PartnerController` correspondente

# Casos de uso relacionados aos eventos e ticket

Criando mais usecases:

- `application/usecases/CreateEventUseCase`


```java
public class CreateEventUseCase extends UseCase<CreateEventUseCase.Input, CreateEventUseCase.Output> {

    private final EventService eventService;
    private final PartnerService partnerService;

    public CreateEventUseCase(final EventService eventService, final PartnerService partnerService) {
        this.eventService = Objects.requireNonNull(eventService);
        this.partnerService = Objects.requireNonNull(partnerService);
    }

    @Override
    public Output execute(final Input input) {
        var event = new Event();
        event.setDate(LocalDate.parse(input.date(), DateTimeFormatter.ISO_DATE));
        event.setName(input.name());
        event.setTotalSpots(input.totalSpots());

        partnerService.findById(input.partnerId())
            .ifPresentOrElse(event::setPartner, () -> {
                throw new ValidationException("Partner not found");
            });

        event = eventService.save(event);

        return new Output(event.getId(), input.date(), event.getName(), input.partnerId());
    }

    public record Input(String date, String name, Long partnerId, Integer totalSpots) {}
}
```


- `application/usecases/SubscribeCustomerToEvent`


```java
public class SubscribeCustomerToEvent extends UseCase<SubscribeCustomerToEvent.Input, SubscribeCustomerToEvent.Output> {

    private final CustomerService customerService;
    private final EventService eventService;

    public SubscribeCustomerToEvent(final CustomerService customerService, final EventService eventService) {
        this.customerService = Objects.requireNonNull(customerService);
        this.eventService = Objects.requireNonNull(eventService);
    }

    @Override
    public Output execute(final Input input) {
        var customer = customerService.findById(input.customerId())
            .orElseThrow(() -> new ValidationException("Customer not found"));

        var event = eventService.findById(input.eventId())
            .orElseThrow(() -> new ValidationException("Event not found"));

        eventService.findTicketByEventIdAndCustomerId(input.eventId(), input.customerId())
            .ifPresent(t -> {
                throw new ValidationException("Email already registered");
            });

        if (event.getTotalSpots() < event.getTickets().size() + 1) {
            throw new ValidationException("Event sold out");
        }

        var ticket = new Ticket();
        ticket.setEvent(event);
        ticket.setCustomer(customer);
        ticket.setReservedAt(Instant.now());
        ticket.setStatus(TicketStatus.PENDING);

        event.getTickets().add(ticket);
        eventService.save(event);

        return new Output(event.getId(), ticket.getStatus().name());
    }

    public record Input(Long eventId, Long customerId) {}

    public record Output(Long eventId, String ticketStatus) {}
}
```

Para depois acertar o EventController

# Injecao de dependencia nos casos de uso

é muito util ter uma forma de conteiner de injecao de dependencia para os use cases, inclusive para evitar nos testes ter que ficar repassando a depencias todas as vezes

Uma abordagem para nao ter acoplamento de spring (ou ate outra lib que prove anotacoes na classes para criar beans), para isso seria criar uma classe de config como `hexagonal/infrastructure/configurations/UseCaseConfig.java`

```java
@Configuration
public class UseCaseConfig {

    private final CustomerRepository customerRepository;
    private final EventRepository eventRepository;
    private final PartnerRepository partnerRepository;
    private final TicketRepository ticketRepository;

    public UseCaseConfig(
            final CustomerRepository customerRepository,
            final EventRepository eventRepository,
            final PartnerRepository partnerRepository,
            final TicketRepository ticketRepository
    ) {
        this.customerRepository = Objects.requireNonNull(customerRepository);
        this.eventRepository = Objects.requireNonNull(eventRepository);
        this.partnerRepository = Objects.requireNonNull(partnerRepository);
        this.ticketRepository = Objects.requireNonNull(ticketRepository);
    }

    @Bean
    public CreateCustomerUseCase createCustomerUseCase() {
        return new CreateCustomerUseCase(customerRepository);
    }

    @Bean
    public CreateEventUseCase createEventUseCase() {
        return new CreateEventUseCase(eventRepository, partnerRepository);
    }

    @Bean
    public CreatePartnerUseCase createPartnerUseCase() {
        return new CreatePartnerUseCase(partnerRepository);
    }

    @Bean
    public GetCustomerByIdUseCase getCustomerByIdUseCase() {
        return new GetCustomerByIdUseCase(customerRepository);
    }

    @Bean
    public GetPartnerByIdUseCase getPartnerByIdUseCase() {
        return new GetPartnerByIdUseCase(partnerRepository);
    }

    @Bean
    public SubscribeCustomerToEventUseCase subscribeCustomerToEventUseCase() {
        return new SubscribeCustomerToEventUseCase(customerRepository, eventRepository, ticketRepository);
    }
}
```

Dessa forma, podemos no teste integrados utilizando `@Autowired` sem ter que fica instanciando como:

```java
public class CreateCustomerUseCaseIT extends IntegrationTest {

    @Autowired
    private CreateCustomerUseCase useCase;

    @Autowired
    private CustomerRepository customerRepository;

    @BeforeEach
    void setUp() {
        customerRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve criar um cliente")
    public void testCreateCustomer() {
        // given
        final var expectedCPF = "123.456.789-01";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        // when
        final var output = useCase.execute(createInput);

        // then
        Assertions.assertNotNull(output.id());
        Assertions.assertEquals(expectedCPF, output.cpf());
        Assertions.assertEquals(expectedEmail, output.email());
        Assertions.assertEquals(expectedName, output.name());
    }

    @Test
    @DisplayName("Não deve cadastrar um cliente com CPF duplicado")
    public void testCreateWithDuplicatedCPFShouldFail() throws Exception {
        // given
        final var expectedCPF = "123.456.789-01";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";
        final var expectedError = "Customer already exists";

        createCustomer(expectedCPF, expectedEmail, expectedName);

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        // when
        final var actualException = Assertions.assertThrows(ValidationException.class, () -> useCase.execute(createInput));

        // then
        Assertions.assertEquals(expectedError, actualException.getMessage());
    }

    @Test
    @DisplayName("Não deve cadastrar um cliente com e-mail duplicado")
    public void testCreateWithDuplicatedEmailShouldFail() throws Exception {
        // given
        final var expectedCPF = "123.456.789-01";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";
        final var expectedError = "Customer already exists";

        createCustomer("231.321.312-31", expectedEmail, expectedName);

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        // when
        final var actualException = Assertions.assertThrows(ValidationException.class, () -> useCase.execute(createInput));

        // then
        Assertions.assertEquals(expectedError, actualException.getMessage());
    }

    private Customer createCustomer(final String cpf, final String email, final String name) {
        return customerRepository.create(Customer.newCustomer(name, cpf, email));
    }
}
```

# Refatorando adapters dos drivers

Com a alteracao acima que permite utilizar beans do useCases podemos refatorar os controllers para utilizar a injecao de dependencia do spring. Exemplo:

```java
// Adapter
@RestController
@RequestMapping(value = "customers")
public class CustomerController {

    private final CreateCustomerUseCase createCustomerUseCase;
    private final GetCustomerByIdUseCase getCustomerByIdUseCase;

    public CustomerController(
            final CreateCustomerUseCase createCustomerUseCase,
            final GetCustomerByIdUseCase getCustomerByIdUseCase
    ) {
        this.createCustomerUseCase = Objects.requireNonNull(createCustomerUseCase);
        this.getCustomerByIdUseCase = Objects.requireNonNull(getCustomerByIdUseCase);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody NewCustomerDTO dto) {
        try {
            final var output =
                    createCustomerUseCase.execute(new CreateCustomerUseCase.Input(dto.cpf(), dto.email(), dto.name()));

            return ResponseEntity.created(URI.create("/customers/" + output.id())).body(output);
        } catch (ValidationException ex) {
            return ResponseEntity.unprocessableEntity().body(ex.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable String id) {
        return getCustomerByIdUseCase.execute(new GetCustomerByIdUseCase.Input(id))
                .map(ResponseEntity::ok)
                .orElseGet(ResponseEntity.notFound()::build);
    }
}
```

# Modelando as entidades de dominio

Observaçoes:

- Na arquitetura hexagonal, a parte do hexagono é uma só (application e bussines), não existe uma preocupacao grande com essa divisao interna (a preocupacao está focada em proteger o hexagono) entao faz sentido colocar as entidade em `application/entities`

Faz sentido usar os conceitos do DDD para dominio:
- Agregados
    - Conjuntos de Entidades com limite transacional, com relacao de 1 para um repositorio
    - Objeto de valor
        - Para Id incluisive

Vamos criar entao a primeira entidade em `application/entities/Customer`

```java
public class Customer {

    private final CustomerId customerId;
    private final String name;
    private final String cpf;
    private final String email;

    public Customer(final CustomerId customerId, final String name, final String cpf, final String email) {
        if (customerId == null) {
            throw new ValidationException("Invalid customerId for Customer");
        }

        if (name == null) {
            throw new ValidationException("Invalid name for Customer");
        }

        if (cpf == null || !cpf.matches("\\d{3}\\.\\d{3}\\.\\d{3}\\-\\d{2}$")) {
            throw new ValidationException("Invalid cpf for Customer");
        }

        if (email == null || !email.matches("\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})$")) {
            throw new ValidationException("Invalid email for Customer");
        }

        this.customerId = customerId;
        this.name = name;
        this.cpf = cpf;
        this.email = email;
    }

    public static Customer newCustomer(String name, String cpf, String email) {
        return new Customer(CustomerId.unique(), name, cpf, email);
    }

    public CustomerId customerId() {
        return customerId;
    }

    public String name() {
        return name;
    }

    public String cpf() {
        return cpf;
    }

    public String email() {
        return email;
    }
}
```


- Incluindo validacoes em construtor(nome, email e cpf)
- Com factory method (que usa chave unica) e construtor
- Nao faz sentido ter setter, para nao ter caracteristica de dominio anemico, apenas getters



Da mesma utilizando o objeto de valor para o `CustomerId`

```java
public record CustomerId(String value) {

    public CustomerId {
        if (value == null) {
            throw new ValidationException("Invalid value for CustomerId");
        }
    }

    public static CustomerId unique() {
        return new CustomerId(UUID.randomUUID().toString());
    }

    public static CustomerId with(final String value) {
        try {
            return new CustomerId(UUID.fromString(value).toString());
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("Invalid value for CustomerId");
        }
    }
}
```

- Com metodos estaticos para criar uma chave unica ou converter de string passada

Vamos mudar agora para comunicar com o driven actor atraves do useCase, para utilizar o padrao repository. Utilizando uma interface costumer dentro da application que será injetada no use case. O repository nao sera focado em tabelas e sim agregados

Sendo assim criamos a interface `application/repositories/CustomerRepository`

```java
public interface CustomerRepository {

    Optional<Customer> customerOfId(CustomerId anId);

    Optional<Customer> customerOfCPF(Cpf cpf);

    Optional<Customer> customerOfEmail(Email email);

    Customer create(Customer customer);

    Customer update(Customer customer);

    void deleteAll();
}
```

E corrigimos o `CreateCustomerUseCase` para utilizar ambos repository e a entidade nova de Customer

```java

package br.com.fullcycle.hexagonal.application.usecases.customer;

import br.com.fullcycle.hexagonal.application.usecases.UseCase;
import br.com.fullcycle.hexagonal.application.domain.customer.Customer;
import br.com.fullcycle.hexagonal.application.exceptions.ValidationException;
import br.com.fullcycle.hexagonal.application.repositories.CustomerRepository;

public class CreateCustomerUseCase
    extends UseCase<CreateCustomerUseCase.Input, CreateCustomerUseCase.Output> {

    private final CustomerRepository customerRepository;

    public CreateCustomerUseCase(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public Output execute(final Input input) {
        if (customerRepository.customerOfCPF(input.cpf()).isPresent()) {
            throw new ValidationException("Customer already exists");
        }

        if (customerRepository.customerOfEmail(input.email()).isPresent()) {
            throw new ValidationException("Customer already exists");
        }

        var customer = customerRepository.create(
            Customer.newCustomer(input.name(), input.cpf(), input.email())
        );

        return new Output(
            customer.customerId().value().toString(),
            customer.cpf(),
            customer.email(),
            customer.name()
        );
    }

    public record Input(String cpf, String email, String name) {}
    public record Output(String id, String cpf, String email, String name) {}
}
```

- Usamos agora o factory method para criar um customer
- Injetamos a interface do repository ao inves de um service
- Como estamos utilizando objeto de valor para o id, precisamos retornar o value no output
- Observamos que todas a dependencias (imports) sao internas do hexagono

Da mesma forma podemos mudar o use case `GetCustomerByIdUseCase`

Antes de implementar o repository oficial podemos pensar uma tecnica para ajustar os testes unitarios dos use cases. Em que podemos criar uma uma implementacao do `CustomerRepository` para inMemory.

```java
public class InMemoryCustomerRepository implements CustomerRepository {

    private final Map<String, Customer> customers;
    private final Map<String, Customer> customersByCPF;
    private final Map<String, Customer> customersByEmail;

    public InMemoryCustomerRepository() {
        this.customers = new HashMap<>();
        this.customersByCPF = new HashMap<>();
        this.customersByEmail = new HashMap<>();
    }

    @Override
    public Optional<Customer> customerOfId(CustomerId anId) {
        return Optional.ofNullable(this.customers.get(Objects.requireNonNull(anId).value().toString()));
    }

    @Override
    public Optional<Customer> customerOfCPF(Cpf cpf) {
        return Optional.ofNullable(this.customersByCPF.get(cpf.value()));
    }

    @Override
    public Optional<Customer> customerOfEmail(Email email) {
        return Optional.ofNullable(this.customersByEmail.get(email.value()));
    }

    @Override
    public Customer create(Customer customer) {
        this.customers.put(customer.customerId().value().toString(), customer);
        this.customersByCPF.put(customer.cpf().value(), customer);
        this.customersByEmail.put(customer.email().value(), customer);
        return customer;
    }

    @Override
    public Customer update(Customer customer) {
        this.customers.put(customer.customerId().value().toString(), customer);
        this.customersByCPF.put(customer.cpf().value(), customer);
        this.customersByEmail.put(customer.email().value(), customer);
        return customer;
    }

    @Override
    public void deleteAll() {
        this.customers.clear();
        this.customersByCPF.clear();
        this.customersByEmail.clear();
    }
}
```

- Controlamos 3 maps para id, nome e cpf e retornamos deles

E ajustamos o teste `CreateCustomerUseCaseTest` para usar essa implementacao de repository

```java
public class CreateCustomerUseCaseTest {

    @Test
    @DisplayName("Deve criar um cliente")
    public void testCreateCustomer() {
        // given
        final var expectedCPF = "123.456.789-01";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        final var customerRepository = new InMemoryCustomerRepository();

        // when
        final var useCase = new CreateCustomerUseCase(customerRepository);
        final var output = useCase.execute(createInput);

        // then
        Assertions.assertNotNull(output.id());
        Assertions.assertEquals(expectedCPF, output.cpf());
        Assertions.assertEquals(expectedEmail, output.email());
        Assertions.assertEquals(expectedName, output.name());
    }

    @Test
    @DisplayName("Não deve cadastrar um cliente com CPF duplicado")
    public void testCreateWithDuplicatedCPFShouldFail() throws Exception {
        // given
        final var expectedCPF = "123.456.789-01";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";
        final var expectedError = "Customer already exists";

        final var aCustomer = Customer.newCustomer(expectedName, expectedCPF, expectedEmail);

        final var customerRepository = new InMemoryCustomerRepository();
        customerRepository.create(aCustomer);

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        // when
        final var useCase = new CreateCustomerUseCase(customerRepository);
        final var actualException = Assertions.assertThrows(ValidationException.class, () -> useCase.execute(createInput));

        // then
        Assertions.assertEquals(expectedError, actualException.getMessage());
    }

    @Test
    @DisplayName("Não deve cadastrar um cliente com e-mail duplicado")
    public void testCreateWithDuplicatedEmailShouldFail() throws Exception {
        // given
        final var expectedCPF = "123.456.789-01";
        final var expectedEmail = "john.doe@gmail.com";
        final var expectedName = "John Doe";
        final var expectedError = "Customer already exists";

        final var aCustomer = Customer.newCustomer(expectedName, expectedCPF, expectedEmail);

        final var customerRepository = new InMemoryCustomerRepository();
        customerRepository.create(aCustomer);

        final var createInput = new CreateCustomerUseCase.Input(expectedCPF, expectedEmail, expectedName);

        // when
        final var useCase = new CreateCustomerUseCase(customerRepository);
        final var actualException = Assertions.assertThrows(ValidationException.class, () -> useCase.execute(createInput));

        // then
        Assertions.assertEquals(expectedError, actualException.getMessage());
    }
}
```

## Parte2

Ao criar a entidate partner, vemos que estamos repetindo a validacao de email e CPF, sendo assim percebemos que email e Cpf poderia ser objetos de valor e ter essa validacao incluida

```java
public record Cpf(String value) {

    public Cpf {
        if (value == null || !value.matches("^\\d{3}\\.\\d{3}\\.\\d{3}\\-\\d{2}$")) {
            throw new ValidationException("Invalid value for Cpf");
        }
    }
}
```

```java
public record Email(String value) {

    public Email {
        if (value == null || !value.matches("^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$")) {
            throw new ValidationException("Invalid value for Email");
        }
    }
}
```

Se pensarmos bem, é a mesma coisa para Name

```java
public record Name(String value) {

    public Name {
        if (value == null) {
            throw new ValidationException("Invalid value for Name");
        }
    }
}
```

e claro Cnpj

```java
public record Cnpj(String value) {

    public Cnpj {
        if (value == null || !value.matches("^\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}\\-\\d{2}$")) {
            throw new ValidationException("Invalid value for Cnpj");
        }
    }
}
```

- Claro que isso fara temos que colocar ".value()" para utilizar os campos agora...


E teremos a entidade de partner

```java
public class Partner {

    private final PartnerId partnerId;
    private Name name;
    private Cnpj cnpj;
    private Email email;

    public Partner(final PartnerId partnerId, final String name, final String cnpj, final String email) {
        if (partnerId == null) {
            throw new ValidationException("Invalid partnerId for Partner");
        }

        this.partnerId = partnerId;
        this.setName(name);
        this.setCnpj(cnpj);
        this.setEmail(email);
    }

    public static Partner newPartner(String name, String cnpj, String email) {
        return new Partner(PartnerId.unique(), name, cnpj, email);
    }

    public PartnerId partnerId() {
        return partnerId;
    }

    public Name name() {
        return name;
    }

    public Cnpj cnpj() {
        return cnpj;
    }

    public Email email() {
        return email;
    }
}
```

Criamos a interface `application/repositories/PartnerRepository`

```java
public interface PartnerRepository {

    Optional<Partner> partnerOfId(PartnerId anId);

    Optional<Partner> partnerOfCNPJ(Cnpj cnpj);

    Optional<Partner> partnerOfEmail(Email email);

    Partner create(Partner partner);

    Partner update(Partner partner);

    void deleteAll();
}
```

Em que podemos alterar o `CreatePartnerUseCase` para utilizar a nova entidade e injetar a nova interface de repositorio

```java
public class CreatePartnerUseCase extends UseCase<CreatePartnerUseCase.Input, CreatePartnerUseCase.Output> {

    private final PartnerRepository partnerRepository;

    public CreatePartnerUseCase(final PartnerRepository partnerRepository) {
        this.partnerRepository = Objects.requireNonNull(partnerRepository);
    }

    @Override
    public Output execute(final Input input) {
        if (partnerRepository.partnerOfCNPJ(new Cnpj(input.cnpj)).isPresent()) {
            throw new ValidationException("Partner already exists");
        }

        if (partnerRepository.partnerOfEmail(new Email(input.email)).isPresent()) {
            throw new ValidationException("Partner already exists");
        }

        var partner = partnerRepository.create(Partner.newPartner(input.name, input.cnpj, input.email));

        return new Output(
                partner.partnerId().value(),
                partner.cnpj().value(),
                partner.email().value(),
                partner.name().value()
        );
    }

    public record Input(String cnpj, String email, String name) {
    }

    public record Output(String id, String cnpj, String email, String name) {
    }
}
```

- obviamente fazendo a mesma coisa para `GetPartnerByIdUseCase`