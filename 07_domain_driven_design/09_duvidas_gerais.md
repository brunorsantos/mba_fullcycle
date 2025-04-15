# Regras dos agregados

- Um agregado é uma transacao atomica
    - Ao terminar de salvar algo do agredado tem que salvar tudo
- Um agragado protege invariantes de consistencia
    - Para ir na entidade deve se passar pelo agregate root
- Um agregado referencia outros agregados por identidade
    - Nesse caso mantem acoplamento fraco
- Somente um agregado deve ser processado por transacao******
    - Controverso!!!
    - A ideia seria


# Razões para quebrar as regras dos agregados

- Conveniência da Interface do Usuário  
- A falta de mecanismos técnicos ou restrições de negócios  
- Transações globais (legados)  
- Desempenho das consultas (referências)  

# Sobre tamanho dos agregados

Vale em casos criticos, olhar a quantidade de memoria que um agregado usa, isso pode ser um motivador para quebrar um agregado grande em mais, porem. Quando mais agregados mais as regras de negocio vao ficar dispensar e com menos controle

# Sobre tamanho dos aplications service

Não é necessario ter um aplication service por agregado, pode ser criar nesse caso services para spot e section.

A criacao de service está ligada a necessidade das necessidades de cliente. 

Sendo assim no nosso caso poderia ser algo por usario como `AdminEventService`, `PartenerEventService`