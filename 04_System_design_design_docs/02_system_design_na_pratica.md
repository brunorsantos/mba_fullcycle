O plano de capacidade pode ser feito antes ou depois do system design...

No system design é onde vamos fazer a modelagem em si.

Podemos preocupar aqui a principio apenas com as funcionalidades core

# Premissas

Então, sempre que a gente vai começar alguma coisa, a gente tem algum pressuposto, Assumptions,  temos que pensar: “bom, eu vou partir da premissa que…

![alt text](image-12.png)

# Modelagem inicial

## Opcao 1

![alt text](image-13.png)

# Discutindo modelagem

É sempre necessario ver vantagens e desvantagens na soliucao que voce está criando... Ver os trade-offs
Sendo assim podemos procurar na modelagem "Pontos unicos de falha" (baseado em coisas fora do nosso controle) e "Pontos de possivel lentidão".

![alt text](image-14.png)

- Se o gateway cair, vai prejudicar muito a gente
    - Nao podemos simplemente culpar o outro nesse momento e perder a venda
- Geracao de codigo unico pode causar lentidao ao consultar DB, o algoritmo que gera o codigo, etc
- QRCode para gerar uma imagem

Sendo assim podemos fazer uma opcao 2 com melhorias

## Opcao 2

Apenas colocar um message broker em que o servico de compra de ingressos envia um mensagem para fila e nao sofre com degradaçoes no envio de email a ser feito por outro serviço

![alt text](image-15.png)

## Opcao 3

Usando o pattern (padrao arquitetural) sequence podemos resolver tambem o caso da lentidao com ids unicos sendo gerados no momento do thput alto.

Posso ter um servico apartado que de tempo em tempos gerar um codigo sequencial e QRcode armazenando por exemplo em um bucket. No momento da compra do ingresso esse servico sera requisitado e terá apenas o trabalho de baixa falando que esse codido está em uso. Sendo assim eu tiro a carga com esse trabalho pre-feito.

![alt text](image-16.png)

