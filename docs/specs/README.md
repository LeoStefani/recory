# Especificaciones de RECORY

RECORY es una web para llevar el historial de partidas de cualquier juego entre amigos y conocidos. Cada persona anota contra quién jugó, a qué y cómo salió, y los demás participantes pueden validar el resultado.

Estos documentos reúnen las decisiones de producto, los flujos y los criterios de diseño acordados. Son la referencia para construir: si el código y una spec no coinciden, hay que corregir uno de los dos, no dejarlo pasar.

## Documentos

| N.º | Documento | Qué define |
| --- | --- | --- |
| 01 | [Producto y alcance](01-producto.md) | Qué es, para quién, etapas y qué queda fuera |
| 02 | [Tags y usuarios](02-tags-y-usuarios.md) | Tags de personas y juegos, usuarios, la convención de `@` y `*` |
| 03 | [Partidas](03-partidas.md) | Datos de una partida, equipos, carga, edición y estadísticas |
| 04 | [Cuentas y perfil](04-cuentas.md) | Registro, ingreso, cambios de datos y eliminación |
| 05 | [Vínculo entre cuentas](05-vinculo.md) | La capa tag → usuario, desvincular y mapeo de juegos |
| 06 | [Validación](06-validacion.md) | Mayoría, estados, correcciones, edición de partidas validadas |
| 07 | [Notificaciones](07-notificaciones.md) | Eventos, bandeja, mails y configuración |
| 08 | [Diseño](08-diseno.md) | Principios de interfaz, pantallas, colores, tipografías y textos |
| 09 | [Arquitectura](09-arquitectura.md) | Tecnologías, modelo de datos, seguridad, pruebas, hosting y costos |
| 10 | [Pendientes](10-pendientes.md) | Decisiones abiertas y supuestos sin confirmar |

## Cómo leer el estado de cada punto

Cada sección indica en qué situación está:

- **Implementado**: existe en el código de este repositorio.
- **Definido**: la decisión está tomada, falta construirlo.
- **Pendiente**: falta decidir. Está listado en [10-pendientes.md](10-pendientes.md).

## Glosario

| Término | Significado |
| --- | --- |
| Tag | Nombre libre que un usuario crea en su perfil. Hay tags de persona y tags de juego. Son privados de quien los crea. |
| Usuario | Una cuenta real, identificada por un username único. Se escribe `@juan`. |
| Usuario eliminado | Una cuenta que ya no existe. Se escribe `@juan*`. |
| Participante | Quien juega una partida. Es un tag de persona o un usuario. |
| Lado | Cada uno de los dos bandos de una partida: "tu lado" y "rivales". |
| Vínculo | Relación entre uno o más tags propios y un usuario. No modifica las partidas. |
| Mapeo de juegos | Correspondencia entre un tag de juego mío y uno de otra persona. |
| Partida personal | Partida en la que ningún otro participante tiene cuenta vinculada. Vale solo la palabra de quien la cargó. |
| Partida validada | Partida aprobada por la mayoría de los participantes con cuenta. |
| Cara a cara | Historial de resultados contra una persona en particular. |
