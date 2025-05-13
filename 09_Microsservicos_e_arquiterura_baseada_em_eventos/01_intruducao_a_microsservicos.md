# Sistemas Monolíticos

- Todos os escopos e áreas dentro de um mesmo sistema  
- Todas as equipes trabalham em um mesmo sistema  
    - Precisa muito de testes
- Mais simples de se começar um projeto  
    - Mesmo BD
    - Sem filas ou chamadas rest
    - Relatorios com mais facilidade
- Atende facilmente grande parte dos projetos em diversos tipos de empresa
- Restrição de uso de diversas tecnologias, como linguagens de programação
    - Preco que paga, nao tem como alterar a linguagem para um funcionalidade especifica
- Facilidade no processo de comunicação
    - Integracao em si acaba nao sendo necessaria, é muito mais facil
    - Em troubleshooting pode ser mais simples, sem precisar achar onde está o erro 
- Risco no processo de deploy se mal projetado

# O que sao microsservicos

- Aplicações comuns com propósitos e escopo bem definidos  
    - Como qualquer outro, porem muda o escopo... Precisa um motivo para mudar
    - Da pra fazer a comparacao dom o Single responsability do SOLID
- Independentes e autônomos
    - Se outros servicos cairem o seu deve ficar no ar
    - Voce nao pode depender diretamente de outro microsservico, fallback e degradacao para evitar dependencias fortes
- Participam de um ecossistema maior. Uma parte da engrenagem

# Arquitetura baseada em microsservicos

- Possibilidade de múltiplas tecnologias  
    - Ajuda a avaliar cases específicos
    - Normalmente empresa tem um politica de governanca para nao permitir de tudo
    - Lei de Lehman - Quanto maior familiaridade, maior eficiencia
- Processo de deploy menos arriscado 
    - Afeta apenas seu microsservico, ate quem depende de você
- Maior complexidade no setup  
    - Ideal ter templates
- Equipes especializadas por microsserviço 
    - Pode especializar devs pra resolver algo muito bem
- Auxilia no processo de escala de aplicações  
    - **Obs:** isso não significa que monólitos não escalam
    - Isso nao siginica economia, pois todo o restante sobe o valor (custos com variacao de CI, K8s para orquestrar... Infra diversa para manter a arquitetura)



![alt text](image-1.png)

Trabalhar com microsservicos é um "mal necessario"
Ambiente com desenvolvedores que nem se conhecem todos


# 🔷 Quando optar por um monolito

- Provas de conceito de um sistema que tem possibilidade de crescer  
    - Se der errado joga fora com pouco custo
    - Ser der certo, pode jogar fora tambem e refazer com arq melhor
- Projetos onde não conhecemos todos os contextos
    - Evita mudar demais microsservicos, contratos, etc. Por desconhecimento
- Necessidade de realizar mudanças bruscas nas regras de negócio e funcionalidades do sistema  
    - Um pouco parecido com o acima, as vezes vc teve que criar todo uma regra coesa para pessoa fisica, depois muda tudo e vc tem que jogar fora microservicos, criar novos com novos setups
- Governança simplificada  
- Restrições de orçamento  
    - Normalmente infra é mais barata, observabilidade, tracing, etc
- Baixa quantidade de desenvolvedores
    - Se nao tem equipde de plataforma e tal
    - Poucos devs, nao deve ocorrer de um invadir contexto de outro

# 🔶 Quando optar por Microsserviços

- Escalar times / Alta quantidade de desenvolvedores  
    - Muitos devs em um servico só é inviavel
- Contextos e unidades de negócio definidos  
- Necessidade de escalar partes específicas de um sistema 
    - Nesse caso o custo pode valer a pena, nao escalar tudo tudo
- Necessidade de tecnologias específicas para resolver problemas específicos



## 🔶 Provocação: O mínimo para trabalhar com microsserviços

- Seu time tiver maturidade  
  - CI / CD  
  - CR  
- Arquitetura de software  
- Arquitetura de soluções  

- Comunicação assíncrona  
  - Message brokers  
- Concorrência  
  - Locks (pessimista, otimista)  
- Cache (distribuído)  
  - tipos  
- Banco para cada serviço  
  - Como fazer relatórios?  
- DDD  
- Observabilidade  
  - Logs (padronizados)  
  - Métricas  
  - Tracing distribuído  