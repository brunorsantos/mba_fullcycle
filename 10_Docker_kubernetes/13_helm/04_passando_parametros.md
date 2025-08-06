No caso do [mysql](https://artifacthub.io/packages/helm/bitnami/mysql) vamos testar alguns parametros:

- architecture (para ter mais pod)
- auth.rootPassword	



![alt text](image-2.png)

```sh
helm install myqsl-server oci://registry-1.docker.io/bitnamicharts/mysql --set architecture=replication --set auth.rootPassword=senha
```


![alt text](image-3.png)

- O ouput agora é diferente com replicacao automatica

![alt text](image-4.png)

- Temos um servico pro secundario tambem

![alt text](image-5.png)
