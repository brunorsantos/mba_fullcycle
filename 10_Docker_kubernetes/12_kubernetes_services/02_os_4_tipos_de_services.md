- ClusterIP: Chamadas internas no Kubernetes
    - Nao tem nada de fora
    - O service vai gerar um ip que ao chamar ele, vai no serive e depois faz o balanciamento
    - O mais utilizado em acessos nao externo
- LoadBalancer: IP Externo para acesso ao cluster
    - Nao é pq esse tem esse nome, é que o ClusterIP nao balenceia tambem
    - A diferenca é que esse tem um ip externo
    - Quando usa um cluster externo (AWS) ja tem um camada de rede do cloud provider. Ai nesses caso provedor ja da um ip
- NodePort: Acesso externo ao cluster através de uma porta pré-definida que pode ser acessada através do IP externo de qualquer um dos nodes
    - atacha uma porta do node que redireciona para os pods correspondentes
    - Utiliza-se em debuging por exemplo
- ExternalName: Mapeia o serviço para um endereço externo
    - Uma forma de internamente chamar um service por nome que rediciona para algo configurado diretamente no service pra outro endereco externo