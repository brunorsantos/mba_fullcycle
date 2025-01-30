# Acoplamento

- Tudo nesse mundo é acoplado
- Movimento do seu braço e ombro, um trem com vários vagões
- Acoplamento é algo que sempre existiu e sempre continuará existindo
- Mais importante é: Como conviver bem com ele em nossos códigos?

Sem acoplamento não tem software, mas se o seu software estiver extremamente acoplado eu não tenho como modificá-lo de uma forma que eu deixe ele com mais recursos, ou que uma coisa não afete a outra quando ela é mexida

# Evolucao vs Acoplamento

Toda vez que vc desenvolve o software vc tem que estar sempre com olho no futuro


- É comum fugirmos do acoplamento
- É difícil desenvolver um software complexo sem acoplamento
- Identicar, ter ciência do nível de acoplamento e tirar o máximo benefício disso em comparação com seus “malefícios"
- Se tudo tem um lado bom e ruim, vamos tentar fazer o bom ser muito melhor do que o ruim
    - Não vai dar pra desacoplar tudo, entao temos que escolher
    - As vezes vc desacopla tanto, que isso se torna um problema de tao complexo que fica

# Tipo de acoplamento

[video](https://www.youtube.com/watch?v=esm-1QXtA2Q)

![alt text](image-8.png)

- Operacional
    - Você depende de alguma coisa que está com problema, logo, você não consegue funcionar também. Esse acoplamento é muito crítico, porque faz com que você necessariamente tenha problemas mesmo na hora de rodar as coisas
- Desenvolvimento
    - Se eu mudar um lado, eu obrigatoriamente tenho que coordenar a mudança do outro para que essas duas coisas consigam funcionar
    - Pode ser entre microsservicos diferentes
- Semantico
    - É quando você depende de terminologias, de utilizações em diversos lugares da sua aplicação
    - Ex: Todo mundo a gente está chamando de cliente, mas o nosso sistema de suporte  está chamando de pessoa
- Funcional
    - Muita gente utiliza algo, e se mudar esse algo pode quebrar ou fazer com que diversos pedaços da sua aplicação tenha que mudar
    - Comum quando você tem, por exemplo, uma biblioteca
- Incidental 
    - Você mudou e quebrou alguma coisa sem perceber o porquê. Ou mudou o contrato da sua API sem nenhuma razão e quebrou todo mundo que tava te consultando ou qualquer coisa desse tipo

![alt text](image-9.png)