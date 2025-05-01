Link do [repo](https://github.com/devfullcycle/MBA-hexagonal-architecture) a ser refatorado tendo como origem o conteudo anterior do modulo de arquiteura hexagonal na sua branch correspondente

Utilizando java mais spring é dificil fazer toda separacao proposta na teoria, pois o spring tenta cobrir de ponta a pontas com funcionalidades. Gestao de dependencias, web router, persistencia...


# Segregando as camadas de domain e application

- Podemos criar um modulo novo em na raiz chamado `domain` escolhendo build system gradle com DSL do kotlin
![alt text](image-12.png)

Nao precisamos de pastas resources que pode ser apagaga do modulo domain junto com o arquivo main
E podemos mover toda a folder `src/main/java/br/com/fullcycle/hexagonal/application/domain` para `domain/src/main/java/br/com/fullcycle/domain` movendo os testes tambem.

- Apos isso criar um module `application`
![alt text](image-13.png)

Movendo o restante que ficou em `src/main/java/br/com/fullcycle/hexagonal/application` para la `repositories` e `usecases`, deixando eles em `application/src/main/java/br/com/fullcycle/application`, sendo desnecessario manter o diretorio `usecases`. Copiando tambem os testes (apenas os integrados)

Uma boa pratica tambem deixar as interfaces do repository dentro do domain, junto com sua entidade correspondente

Como os testes do module application vao precisar de entidades na classe de domain vamos precisar de importar a dependencia. 

```
dependencies {
    implementation(project(":domain"))
}
```


# Segregando as camadas de infrastructure

- Podemos criar um modulo novo `infrastructure` 
Movendo todo conteudo de `src/main/java/br/com/fullcycle/hexagonal/infrastructure` para `infrastructure/src/main/java/br/com/fullcycle/infrastructure`.

Tambem copiando e conteudo do `build.gradle.tks` para o modulo infrastructure.

E copiar tambem os testes.

O `src` restante que estava na raiz nao sera mais necessario

O arquivo `settings.grafle.tks` deve ficar correto:

```
rootProject.name = "mba-hexagonal-arch"
include("domain")
include("application")
include("infrastructure")
```

E o `build.gradle.tks` de `infrastructure` deve incluir como dependencia `domain` e `application`

```
dependencies {
    implementation(project(":domain"))
    implementation(project(":application"))

    implementation("io.hypersistence:hypersistence-tsid:2.1.0")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-graphql")
    implementation("org.springframework.boot:spring-boot-starter-web")

    implementation("jakarta.inject:jakarta.inject-api:2.0.1")

    runtimeOnly("com.mysql:mysql-connector-j")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework:spring-webflux")
    testImplementation("org.springframework.graphql:spring-graphql-test")

    testRuntimeOnly("com.h2database:h2")
}
```


Vamos criar um novo diretorio chamado `buildSrc` em que vamos criar um `buil.gradle.kts`

```
plugins {
    `kotlin-dsl`
}

version = "0.0.1-SNAPSHOT"

java {
    targetCompatibility = JavaVersion.VERSION_17
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}
```

- vamos criar script otimizados de build do gradle, porem utilizando dsl do kotlin
- Todos os modules tem targetCompatibility e sourceCompatibility
- mesma coisa para o version e o repositories com mavenCentral
- Podemos tirar esses itens dos build.gradle do outros arquivos no modules

Tambem vamos criar outro arquivo `buildSrc/src/main/kotlin/java-conventions.gradle.kts` com conteudo:

```
plugins {
    java
    jacoco
}

java {
    targetCompatibility = JavaVersion.VERSION_17
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:5.9.1"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

jacoco {
    toolVersion = "0.8.9"
}

tasks.test {
    useJUnitPlatform()
}
```

- Que vai utilizar essa config em tudo que importar esse arquivo
- java e jacoco todos projetos precisam. jacoco é para cobertura


Dessa forma podemos ajustar `application/build.gradle.kts` do modulo de application para ficar:

```
plugins {
    `java-conventions`
    `java-library`
}

group = "br.com.fullcycle.application"

dependencies {
    implementation(project(":domain"))
}
```

O `domain/build.gradle.kts` pado modulo de domain para ficar

```
plugins {
    `java-conventions`
    `java-library`
}

group = "br.com.fullcycle.domain"
```

O `infrastructure/build.gradle.kts` do modulo de infrastructure para ficar

```
plugins {
    java
    `java-conventions`
    `jacoco-report-aggregation`
    id("org.springframework.boot") version "3.1.2"
    id("io.spring.dependency-management") version "1.1.2"
}

group = "br.com.fullcycle.infrastructure"

tasks.bootJar {
    archiveBaseName.set("application")
    destinationDirectory.set(file("${rootProject.buildDir}/libs"))
}

dependencies {
    implementation(project(":domain"))
    implementation(project(":application"))

    implementation("io.hypersistence:hypersistence-tsid:2.1.0")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-graphql")
    implementation("org.springframework.boot:spring-boot-starter-web")

    implementation("jakarta.inject:jakarta.inject-api:2.0.1")

    runtimeOnly("com.mysql:mysql-connector-j")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework:spring-webflux")
    testImplementation("org.springframework.graphql:spring-graphql-test")

    testRuntimeOnly("com.h2database:h2")
}

tasks.testCodeCoverageReport {
    reports {
        xml.required.set(true)
        xml.outputLocation.set(file("$rootDir/build/reports/jacoco/test/jacocoTestReport.xml"))

        html.required.set(true)
        html.outputLocation.set(file("$rootDir/build/reports/jacoco/test/"))
    }
}

tasks.named("jacocoTestReport") {
    dependsOn(tasks.named<JacocoReport>("testCodeCoverageReport"))
}
```

- Trazendo o java-conventions
- Incluir o `jacoco-report-aggregation` que vai fazer gerar a fusao dos relatorios de cobertura de teste de cada module
- Devemos costumizar o arquivo bootJar tambem
- Criando tasks para fazer o report do code coverage
- Observando que o spring está como dependencia nesse module


//TODO: Saber mais sobre kotlin tks, 

# Adicionando suporte ao padrão presenter

Em casos que faz sentido utilizar presenter é poosivel adicionar dessa maneira.

Criar no module de aplication uma interface para isso em `application/src/main/java/br/com/fullcycle/application/Presenter.java`

```java
package br.com.fullcycle.application;

public interface Presenter<IN, OUT> {

    OUT present(IN input);

    OUT present(Throwable error);
}
```

- Estamos deixando um presenter generico de `IN` e `OUT`
- Metodo que retorna um `OUT` apos receber um `IN`

Em que vamos utilizar eles nos use cases, em que podemos mudar a classe abstrata `application/src/main/java/br/com/fullcycle/application/UseCase.java`

```java
package br.com.fullcycle.application;

public abstract class UseCase<INPUT, OUTPUT> {

    // 1. Cada caso de uso tem um Input e um Output próprio. Não retorna a entidade, o agregado, ou objeto de valor.
    // 2. O caso de uso implementa o padrão Command

    public abstract OUTPUT execute(INPUT input);

    public <T> T execute(INPUT input, Presenter<OUTPUT, T> presenter) {
        try {
            return presenter.present(execute(input));
        } catch (Throwable t) {
            return presenter.present(t);
        }
    }
}
```
- Criamos um metodo abstrato que espera receber um presenter junto com o input
- Esse presenter vai ser de Output do usecase como tipo generico e de um T novo, que tambem será retorno nesse execute
- Podemos obviamente fazer as mesma aplicacoes para os outros tipos de usecase 

Para utilizar vamos implementar no module de `infrastructure` criando por exemplo 2 presenters em `infrastructure/src/main/java/br/com/fullcycle/infrastructure/rest/presenters`

`GetCustomerByIdResponseEntity`

```java
import java.util.Optional;

@Component("privateGetCustomer")
public class GetCustomerByIdResponseEntity implements Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> {

    private static final Logger LOG = LoggerFactory.getLogger(GetCustomerByIdResponseEntity.class);

    @Override
    public ResponseEntity<?> present(final Optional<GetCustomerByIdUseCase.Output> output) {
        return output.map(ResponseEntity::ok)
                .orElseGet(ResponseEntity.notFound()::build);
    }

    @Override
    public ResponseEntity<?> present(Throwable error) {
        LOG.error("An error was observer at GetCustomerByIdUseCase", error);
        return ResponseEntity.notFound().build();
    }
}
```

`PublicGetCustomerByIdString`

```java
@Component("publicGetCustomer")
public class PublicGetCustomerByIdString implements Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> {

    private static final Logger LOG = LoggerFactory.getLogger(PublicGetCustomerByIdString.class);

    @Override
    public String present(final Optional<GetCustomerByIdUseCase.Output> output) {
        return output.map(o -> o.id())
                .orElseGet(() -> "not found");
    }

    @Override
    public String present(Throwable error) {
        LOG.error("An error was observer at GetCustomerByIdUseCase", error);
        return "not found";
    }
}
```

E utilizar no `CustomerController`

```java
@RestController
@RequestMapping(value = "customers")
public class CustomerController {

    private final CreateCustomerUseCase createCustomerUseCase;
    private final GetCustomerByIdUseCase getCustomerByIdUseCase;
    private final Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> publicGetCustomerPresenter;
    private final Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> privateGetCustomerPresenter;

    public CustomerController(
            final CreateCustomerUseCase createCustomerUseCase,
            final GetCustomerByIdUseCase getCustomerByIdUseCase,
            final Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> privateGetCustomer,
            final Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> publicGetCustomer
    ) {
        this.publicGetCustomerPresenter = publicGetCustomer;
        this.privateGetCustomerPresenter = privateGetCustomer;
        this.createCustomerUseCase = Objects.requireNonNull(createCustomerUseCase);
        this.getCustomerByIdUseCase = Objects.requireNonNull(getCustomerByIdUseCase);
    }

    ...

    @GetMapping("/{id}")
    public Object get(@PathVariable String id, @RequestHeader(name = "X-Public", required = false) String xPublic) {
        Presenter<Optional<GetCustomerByIdUseCase.Output>, Object> presenter = privateGetCustomerPresenter;

        if (xPublic != null) {
            presenter = publicGetCustomerPresenter;
        }

        return getCustomerByIdUseCase.execute(new GetCustomerByIdUseCase.Input(id), presenter);
    }
}
```

- Podemos ver é o presenter é passado para o novo execute criado no usecase
- Usamos qualifiers para importar a bean por sao 2 do mesmo tipo
- Dependendo do header escolhemos qual presenter utilizar
- Podemos nao utilizar injecao de dependencia instanciando diretamente no controller sem problemas (uncle bob indica instanciar, mas nao parece nao ter muita necessidade)