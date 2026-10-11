# 01 · Producto y alcance

## Qué es

Una web muy simple para llevar el conteo y el historial de partidas de cualquier tipo de juego entre amigos y conocidos: truco, ajedrez, ping pong, fútbol 5, juegos de mesa.

Tiene dos niveles de uso, y el segundo es opcional:

1. **Registro personal.** Una persona anota sus partidas usando tags, sin que nadie más necesite tener cuenta. Funciona desde el primer día aunque la use una sola persona.
2. **Registro validado.** Cuando los participantes tienen cuenta y están vinculados, cada resultado puede ser validado, rechazado o corregido por los demás. El historial pasa a ser algo en lo que todos confían.

## Principios

Estas ideas guiaron todas las decisiones, y sirven para resolver los casos que las specs no cubran.

- **Sin grupos.** No hay que crear un grupo ni invitar a nadie para empezar. La unidad es la persona y sus partidas.
- **Las cuentas ajenas no son obligatorias.** Los rivales pueden ser solo nombres (tags). Vincularlos a una cuenta real es un paso posterior y opcional.
- **Cargar una partida tiene que ser rápido.** Desde el celular, en medio de la juntada, en pocos segundos.
- **Los tags se reutilizan.** La app sugiere los existentes y evita que se creen variantes del mismo nombre.
- **Cada uno nombra las cosas como quiere.** Mis tags son míos. Para compatibilizar con otra persona se emparejan tags, no se obliga a nadie a renombrar.
- **Las partidas no se reescriben.** El vínculo entre tags y usuarios es una capa aparte. Lo que se guardó al cargar una partida no cambia por vincular o desvincular.
- **La app no decide por la persona.** Sugiere duplicados o correspondencias, pero unifica solo cuando alguien lo confirma.
- **No molestar.** Las notificaciones son las mínimas; no hay recordatorios.

## Etapas

| Etapa | Contenido | Estado |
| --- | --- | --- |
| 1 | Cuentas, tags, partidas con equipos, edición, historial y estadísticas | Implementado |
| 2 | Vínculo entre cuentas, mapeo de juegos, validación y notificaciones | Definido |

La primera versión pública incluye las dos etapas. La etapa 1 se puede usar sola mientras se construye la 2: todas las partidas figuran como personales.

La base de datos de la etapa 1 ya contempla la etapa 2, para no tener que migrar datos.

## Fuera de la primera versión

Estas funciones quedan para más adelante. El diseño no debe impedirlas.

- **Chat**: los usuarios deben poder chatear entre sí. Falta definir si es entre dos usuarios vinculados, dentro de cada partida, o ambos.
- **Equipos fijos**: grupos de tags de personas con nombre ("Los Pibes"), para cargar una partida eligiendo el equipo y ver estadísticas del equipo. Es la misma función que "grupos de tags"; se aplica solo a personas.
- **Foto de perfil** del usuario.
- **Foto de evidencia** en una partida: opcional, una por partida, visible solo para los participantes.
- **Ingreso con Google.**
- **Notificaciones push** y publicación en tiendas de apps.
- **Compartir** un resultado o un cara a cara como imagen.
- **Más de dos lados** por partida: tres o más equipos, o todos contra todos.

## Descartado

Decisiones tomadas en contra, para no volver a discutirlas sin un motivo nuevo.

| Idea | Por qué se descartó |
| --- | --- |
| Organizar todo en grupos | Agrega fricción al empezar. Se quiere algo más simple, centrado en la persona. |
| Cuenta obligatoria para todos los jugadores | Impide usar la app hasta que los demás se registren. |
| Varios tags de juego por partida | Cada partida lleva un solo tag de juego. Las variantes se distinguen con tags distintos. |
| Grupos o familias de tags de juego | Haría imposible emparejar juegos entre personas, porque habría que compatibilizar también las agrupaciones. |
| Vencimiento de partidas pendientes | Una pendiente queda pendiente hasta que alguien responda. |
| Recordatorios de pendientes | Las pendientes se ven en la bandeja y nada más. |
| Registro sin email | Sin email no hay forma de recuperar la cuenta. |
