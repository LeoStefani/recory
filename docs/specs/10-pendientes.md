# 10 · Pendientes

Decisiones abiertas y supuestos sin confirmar. Cuando una se resuelve, se pasa a la spec que corresponde y se borra de acá.

## Decisiones de producto

| N.º | Pregunta | Propuesta actual | Afecta a |
| --- | --- | --- | --- |
| 1 | ¿Qué partidas cuentan en las estadísticas por defecto? | Cuentan personales, pendientes y validadas; no cuentan rechazadas ni en disputa. Hay un filtro para ver solo las validadas. | [03](03-partidas.md), [06](06-validacion.md) |
| 2 | ¿El límite de correcciones es 10? | 10 por partida, con aviso desde la octava. | [06](06-validacion.md) |
| 3 | ¿Cuánto tiempo queda reservado un username después de cambiarlo o de eliminar la cuenta? | Sin definir. Mientras tanto, queda libre de inmediato. | [04](04-cuentas.md) |
| 4 | ¿Se puede poner un apodo privado a un usuario vinculado? | Sin definir. Hoy se mostraría solo el username. | [05](05-vinculo.md) |
| 5 | Al aceptar "todas" las partidas anteriores al vínculo, ¿pasan a validadas directamente? | Sí, la aceptación en bloque equivale a validar cada una. | [05](05-vinculo.md), [06](06-validacion.md) |
| 6 | ¿Qué pasa con una partida rechazada? | Queda visible para quien la cargó, marcada como rechazada, y puede editarla para volver a enviarla. | [06](06-validacion.md) |
| 7 | En una partida en disputa, ¿hay forma de destrabarla? | Sin definir. | [06](06-validacion.md) |
| 8 | ¿Cómo es el chat? | Sin definir: entre dos usuarios vinculados, dentro de cada partida, o ambos. | [01](01-producto.md) |
| 9 | ¿Mejoras a las sugerencias? | Dar peso a lo reciente y sugerir según contexto (rivales frecuentes para el juego elegido). Sin decidir. | [03](03-partidas.md) |

## Antes de publicar

- [ ] Probar el registro, los mails y el ingreso con username contra un proyecto real de Supabase.
- [ ] Política de privacidad y términos de uso, necesarios al guardar emails.
- [ ] Dominio propio y verificación en Resend.
- [ ] Importar a una cuenta las partidas cargadas en el prototipo, si se quieren conservar.
- [ ] Paginación del historial para más de 1.000 partidas.

## Pantallas sin dibujar

- Mapeo de juegos al validar.
- Revisión de duplicados lado a lado.
- Solicitud de vínculo con la vista previa de tags y partidas.
- Configuración de notificaciones.
