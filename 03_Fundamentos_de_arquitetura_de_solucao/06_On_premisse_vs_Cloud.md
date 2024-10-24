# On-premisse

## Desvantagens

- Softwares são instalados localmente na empresa ou em um datacenter
- Custo inicial é alto
    - Antes de qualquer coisa, vc ja tem que pagar a infra pronta
    - Nao vai funcionar para startup
- Hardware possui depreciação
    - Inevitavelmente algo precisara ser melhorado
- Hardware exige manutenção
    - Inevitavelmente algo vai queimar
- Precisa de profissionais qualificados com conhecimentos em hardware, rede, software, virtualização, etc.
    - As vezes são profissionais diferentes para cada coisa
- Escalabiliade completa
    - Muito mais
- Alta disponibilidade complexa (rodar em mais datacenters, fisicamente distantes, ao mesmo tempo)


## Vantagens

- Altamente customizável
- Acesso físico por profissionais da empresa
- Hardware normalmente é mais barato e poderoso do que máquinas padrão que rodam na cloud
    - Se colocar no papel um tempo longo fica mais barato um hardware melhor
- Controle dos dados
- Integração com sistemas legados
    - Menos problema de latencia por exemplo
- Compliance e regulações (Armazenamento, PCI DSS, HIPPA (Health Care))
- Custos previsíveis
    - Evita se perder em entender pq algo esta gastando a mais
- Sem lock-in
- Se bem dimensionado, o custo inicial se paga ao longo dos anos
- A longo prazo, se bem dimensionado, o custo pode ser menor do que soluções em Cloud


# Cloud computing

## Desvantagens

- Custo alto ao longo do tempo para determinados serviços
    - As vezes nao tem problema, pois vai ajudar a se pagar rapido
- Alto custo para transferência de dados
    - Ex taxa de tranferencia de video para S3
    - Para tirar os dados da S3 e migrar para outra cloud as vezes nao compensa o valor. Ou seja 
- Previsibilidade de custos mais complexa
    - Geralmente inicialmente, vc nao sabe ser assertivos nas suas taxas para calcular antes das coisas funcionando
- Vendor lock-in
- Riscos adicionais de seguranca
- Controle limitado para fazer upgrades
    - Modelos pre-deinidos de maquina
- Compliance
- Integração pode ser mais complexa com sistemas legados
    - Algumas clouds tem ate servicos específicos para ajudar nisso

## Vantagens

- Baixo custo inicial
    - Otimo para startup
    - Free tiers para provar conceito
- Escalabilidade de uma forma simplificada
- Acessibilidade
    - Acesso maquinas diferentes, servicos...
- Alta disponibilidade (Regions e AZs)
- Custo com profissionais especializados em datacenter, rede, hardware, etc
- “Pay-as-you-go”: Pague conforme o uso
- Hardware exige manutenção
- Servicos ferenciado
    - Alguns servicos sao bem complexos
- Recuperação rápida em casos de desastres
- Amplitude de serviços

# Modelo cloud hibrido

- Pode ser considerado um modelo de transição
    - Estar saindo do on-premisse
- Modelo alternativo para ter mais controle de dados e serviços específicos, porém, com as vantagens da nuvem
    - Pode ser que alguns dados sao ultra sigilosos e fique on premisse
- Redução de custos para grande utilização sazonal
    - Pode ter uma base fixa em premisse, e em black friday usa cloud devido a precisar escalar  
- Integração de serviços pode ser complexa
- Latência pode ser um grande desafio
- Profissionais especializados em diversas áreas
