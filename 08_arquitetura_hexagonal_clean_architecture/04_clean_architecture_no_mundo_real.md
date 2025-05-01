Link do [repo](https://github.com/devfullcycle/MBA-hexagonal-architecture) a ser refatorado

Utilizando java mais spring é dificil fazer toda separacao proposta na teoria, pois o spring tenta cobrir de ponta a pontas com funcionalidades. Gestao de dependencias, web router, persistencia...


# Segregando as camadas de domain e application

- Podemos criar um modulo novo em na raiz chamado `domain` escolhendo build system gradle com DSL do kotlin