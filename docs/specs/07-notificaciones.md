# 07 · Notificaciones

Estado: **definido** (etapa 2).

## Criterio general

Todo llega a una bandeja dentro de la app. El mail se usa solo para lo que requiere que la persona haga algo. No hay recordatorios.

## Eventos

| Evento | Quién la recibe | Bandeja | Mail |
| --- | --- | --- | --- |
| Te informaron una partida | Cada participante con cuenta, salvo quien la cargó | Sí | Sí |
| Propusieron una corrección | Todos los participantes con cuenta | Sí | Sí |
| Quieren editar o borrar una validada | Los demás participantes con cuenta | Sí | Sí |
| Solicitud de vínculo | El usuario buscado | Sí | Sí |
| Validaron tu partida | Quien la cargó, al llegar a la mayoría | Sí | No |
| Rechazaron tu partida | Quien la cargó | Sí | No |
| Quedan 2 correcciones para la disputa | Todos los participantes con cuenta | Sí | No |
| La partida quedó en disputa | Todos los participantes con cuenta | Sí | No |
| Aceptaron tu vínculo | Quien lo pidió | Sí | No |
| Tenés partidas anteriores para revisar | Quien acepta un vínculo, una sola vez y en bloque | Sí | No |
| Un usuario vinculado eliminó su cuenta | Quienes estaban vinculados | Sí | No |

**No notifican**: rechazar un vínculo, bloquear a alguien, y las pendientes sin responder.

## Bandeja

- Recibe todos los avisos y muestra un contador en el ícono.
- Cada aviso lleva directo a la acción: validar, revisar o aceptar.
- Un aviso está **sin leer**, **leído** o **resuelto**. Los que piden una acción siguen en la bandeja hasta que se responden, aunque ya se hayan leído.
- La bandeja no se puede apagar.

## Mails

- **Agrupados.** Si alguien carga varias partidas seguidas, llega un solo mail ("@juan informó 5 partidas"), no uno por partida.
- **Configurables en el perfil**: activados o no por tipo, y la opción de recibir un resumen diario en lugar de avisos sueltos.
- **Silenciar a una persona**: sigue vinculada y sus partidas llegan a la bandeja, pero sin mail.

## Fuera de la primera versión

Notificaciones push en el celular.
