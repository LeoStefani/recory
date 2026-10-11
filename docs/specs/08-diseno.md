# 08 · Diseño

## Principios de interfaz

- **Pensada para el celular.** Una sola columna angosta, que en computadora queda centrada. Todo tiene que funcionar a 400 px de ancho, sin desplazamiento horizontal.
- **La acción principal siempre a mano.** "Cargar partida" está en la cabecera de todas las pantallas.
- **Botones cómodos para el dedo.** Mínimo 44 px de alto en todo lo que se toca.
- **El estado se ve sin leer.** El resultado de cada partida es una etiqueta con forma y color propios, no solo un texto.
- **Nada destructivo con un solo toque.** Borrar una partida o eliminar la cuenta piden un segundo toque sobre el mismo botón. No se usan ventanas emergentes del navegador.
- **Tema claro y oscuro**, según la configuración del dispositivo.
- **Sin emojis ni adornos.** Los íconos son trazos simples.

## Identidad visual

Estado: **implementado** en `src/styles.css`. La referencia es un marcador deportivo: fondo azul profundo, números grandes y un único color de acento.

### Colores

| Uso | Claro | Oscuro |
| --- | --- | --- |
| Fondo | `#EEF1F8` | `#0F1530` |
| Tarjetas | `#FFFFFF` | `#1A2247` |
| Bordes y divisores | `#CFD6E8` | `#2A3463` |
| Texto | `#10162F` | `#F2F4FB` |
| Texto secundario | `#55607F` | `#A6B0D0` |
| Acento (rellenos) | `#C6F24E` | `#C6F24E` |
| Texto sobre acento | `#10162F` | `#0F1530` |
| Acento como texto | `#3F6600` | `#C6F24E` |
| Derrota y acciones destructivas | `#B4521A` | `#FFA36B` |
| Avisos e información | `#2F5FC4` | `#8FB4FF` |

Reglas de uso:

- El **acento lima** marca lo principal: el botón de cargar, la pestaña activa, las victorias.
- **Victoria y derrota se distinguen también por forma**: la victoria es una etiqueta rellena y la derrota una con solo borde. No dependen únicamente del color.
- El **azul de información** se reserva para lo que espera una respuesta: pendientes, solicitudes de vínculo.

### Tipografía

| Uso | Familia |
| --- | --- |
| Marca, títulos y números | Space Grotesk (500 y 700) |
| Texto y controles | IBM Plex Sans (400, 500 y 600) |

Los números que se comparan en columna usan cifras de ancho fijo.

### Formas

- Tarjetas y filas: esquinas de 16 a 20 px.
- Botones: 14 px. Etiquetas de filtro: completamente redondeadas.
- Espaciado entre bloques: 18 a 20 px. Entre filas de una lista: 10 px.

## Navegación

Tres pestañas, siempre visibles:

| Pestaña | Contenido |
| --- | --- |
| Historial | Números generales, filtro por juego y todas las partidas |
| Contactos | Lista de personas y, al entrar, su cara a cara |
| Juegos | Lista de juegos y, al entrar, sus estadísticas |

Además: el formulario de partida se abre como una hoja sobre la pantalla actual (desde abajo en celular, centrada en computadora), y el perfil es una pantalla aparte con botón de volver.

Los nombres de juegos y personas en cualquier fila son enlaces a su pantalla de detalle.

## Pantallas

| Pantalla | Estado |
| --- | --- |
| Ingresar | Implementado |
| Crear cuenta | Implementado |
| Recuperar contraseña y elegir una nueva | Implementado |
| Historial | Implementado |
| Cargar y editar partida | Implementado |
| Lista de contactos y detalle con cara a cara | Implementado |
| Lista de juegos y detalle | Implementado |
| Mi perfil | Implementado, sin cuentas vinculadas |
| Bandeja de pendientes y validar una partida | Dibujado en el prototipo |
| Solicitud y gestión de vínculos | Dibujado en parte, dentro del perfil |
| Mapeo de juegos al validar | Sin dibujar |
| Revisión de duplicados | Sin dibujar |
| Configuración de notificaciones | Sin dibujar |

### Prototipos de referencia

- **Pantallas dibujadas** (incluye validación, registro, ingreso y perfil con vínculos): https://claude.ai/artifact/8VKsezWjEuSptDNLTn4uxM
- **Prototipo interactivo** de la etapa 1, con datos de ejemplo: https://claude.ai/artifact/PkXwbcbGgM3MF6XzeEJwh3

Son privados de la cuenta de Claude que los creó. Si el prototipo y esta spec no coinciden, vale la spec.

## Estados vacíos

Cada lista vacía explica qué va a aparecer ahí y ofrece el botón para cargar una partida. Por ejemplo, en Contactos: "Tus contactos son nombres que creás vos al cargar una partida. Todavía no hay ninguno."

## Textos

- **Español rioplatense, con voseo**: "Cargá", "Completá", "Tenés".
- **Los botones dicen lo que hacen**: "Guardar partida", "Guardar cambios", "Borrar partida".
- **Los errores explican qué pasó y cómo resolverlo**, sin disculpas ni términos técnicos.
- **Se nombra lo que la persona reconoce**: "contactos" y "juegos", no "tags de persona" ni "tags de juego". La palabra "tag" aparece solo donde hace falta, como al fusionar o eliminar.

### Vocabulario fijo

| Concepto | Texto en la interfaz |
| --- | --- |
| Lado de quien carga | Tu lado, Tu equipo |
| Lado contrario | Rivales |
| Resultados | Ganaste, Perdiste, Empate |
| Niveles de una partida | Personal, Pendiente, Validada, Rechazada, En disputa |
| Partida modificada | Editada |
