Exemplo de definicao

```yml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80

```

- O Type padrao é clusterIP

![alt text](image-1.png)

- Internamente o servicos vao chamar pelo nome definido em metadata `nginx-service`
- É possivel fazer port-forward para um service
- O tipo loadbalancer tambem cria um ip externo (mas precisa estar tipo na nuvem)

![alt text](image-2.png)

- Nos casos de loadbalancer vai deixar portas reservadas em todos os nodes para resolver o serviço

