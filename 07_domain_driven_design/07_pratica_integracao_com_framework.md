Utilizando Nestjs, criamos todas as camadas dele fora da pasta `@core`, ele trabalha dessa forma sua modularizacao.

- No diretorio `database` criamos um `database.module` em que vamos de forma global com nestjs criar as instancias do entitityManager (schemas)

- No diretorio `events` criamos um `events.module`, em que vamos de forma global o application services e controllers

# Criando endpoints da API Rest

O Controller vão ficar no diretorio `events` do nestjs.

Por exemplo o `events.controller` seria:

```ts
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { EventService } from '../../@core/events/application/event.service';
import { EventDto } from './event.dto';

@Controller('events')
export class EventsController {
  constructor(private eventService: EventService) {}

  @Get()
  async list() {
    const events = await this.eventService.findEvents();
    logSizeInBytes('events', events[0]);
    return events;
  }

  @Post()
  create(
    @Body()
    body: EventDto,
  ) {
    return this.eventService.create(body);
  }

  @Put(':event_id/publish-all')
  publish(@Param('event_id') event_id: string) {
    return this.eventService.publishAll({ event_id: event_id });
  }
}
```

- Aqui podemos usar um Dto para receber do mundo externo considerando que estamos na camada de apresentação
- Injetamos o service do agregado apenas

Podemos ver por exemplo, que até podemos ter um controller para um filho do agregado(section no caso), mas ele tambem vai injetar o service do agregado.


```ts
@Controller('events/:event_id/sections')
export class EventSectionsController {
  constructor(private eventService: EventService) {}

  @Get()
  async list(@Param('event_id') event_id: string) {
    return this.eventService.findSections(event_id);
  }

  @Post()
  create(
    @Param('event_id') event_id: string,
    @Body()
    body: {
      name: string;
      description?: string | null;
      total_spots: number;
      price: number;
    },
  ) {
    return this.eventService.addSection({
      ...body,
      event_id: event_id,
    });
  }

  @Put(':section_id')
  update(
    @Param('event_id') event_id: string,
    @Param('section_id') section_id: string,
    @Body()
    body: {
      name: string;
      description?: string | null;
    },
  ) {
    return this.eventService.updateSection({
      ...body,
      event_id: event_id,
      section_id: section_id,
    });
  }
}
```

- Podemos ver o mapeamento da url dentro de um event.