# ORM

A melhor forma de usar ORM com DDD é selecionado alguem que tenha Data mapper, tendem a funcionar melhor do que os que usar active record.

Active record é padrao que que vc extende um modelo que ja inclui ja acoplado metodos de save, update, insert

Data model a gente mapper, facilita pois vamos ter as classes com entidade mais dummy que a gente mapeia (como anotations) com campos de banco. A classe fica clean...
Podemos tambem evitar mapeador com ele