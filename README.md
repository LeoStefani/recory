# RECORY

Historial de partidas entre amigos, con validación cruzada de resultados.

Esta es la **etapa 1**: cuentas con username, email y contraseña; tags de personas y juegos; carga, edición y borrado de partidas con equipos; historial, cara a cara y estadísticas por juego. La base de datos ya está preparada para la etapa 2 (vínculo entre cuentas y validación), así que no va a hacer falta migrar datos.

Las decisiones de producto, los flujos y los criterios de diseño están en [`docs/specs/`](docs/specs/README.md).

## Cómo está armado

| Parte | Tecnología | Dónde |
| --- | --- | --- |
| Web | TypeScript, React, Vite | `src/` |
| Base de datos, cuentas y reglas | Supabase (Postgres) | `supabase/migrations/` |
| Ingreso con username | Supabase Edge Function (TypeScript) | `supabase/functions/login-with-username/` |
| Pruebas | Vitest y un Postgres temporal | `tests/` |

Las reglas importantes viven en la base de datos, no en la web: cada usuario solo puede leer y modificar sus propios datos (Row Level Security), y los tags rechazan `@` y `*`, que quedan reservados para cuentas (`@juan` activa, `@juan*` eliminada).

El ingreso con username pasa por una función del servidor que busca el email con la clave de servicio. Así nadie puede averiguar el email de otro a partir de su username.

## Correrlo en tu computadora

Requisitos: Node 20 o más nuevo, y un proyecto de Supabase (gratis).

```bash
npm install
cp .env.example .env.local   # completalo con la URL y la anon key de tu proyecto
npm run dev
```

## Poner en marcha Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. **Base de datos**: abrí *SQL Editor*, pegá el contenido de `supabase/migrations/20261008000000_init.sql` y ejecutalo. Con la CLI de Supabase también podés hacer `supabase link` y `supabase db push`.
3. **Función de ingreso con username**: con la CLI, `supabase functions deploy login-with-username`. Usa las variables que Supabase ya define (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); no hay que configurar nada.
4. **Authentication → URL Configuration**: poné la dirección de la web en *Site URL* (por ejemplo `https://recory.pages.dev`) y agregala, junto con `http://localhost:5173`, en *Redirect URLs*. Los links de verificación y de recuperación de contraseña vuelven ahí.
5. **Authentication → Providers → Email**: dejá activada la confirmación de email y poné 8 como largo mínimo de contraseña.
6. **Mails**: el envío que trae Supabase tiene un límite muy bajo, pensado para pruebas. Para usarla con amigos, configurá un SMTP propio en *Authentication → SMTP Settings*, por ejemplo con [Resend](https://resend.com) (necesita un dominio verificado).

## Publicar la web en Cloudflare Pages

1. En Cloudflare, *Workers & Pages → Create → Pages → Connect to Git*, y elegí este repositorio.
2. Build command: `npm run build`. Output directory: `dist`.
3. En *Environment variables*, cargá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Cada push a `main` publica una versión nueva. El archivo `public/_redirects` hace que cualquier dirección abra la app.

## Pruebas

```bash
npm test          # lógica de tags y estadísticas
npm run test:db   # reglas y privacidad de la base, en un Postgres temporal
```

`test:db` necesita Postgres 15 o más nuevo instalado localmente (`initdb`, `pg_ctl` y `psql`). Levanta una base descartable, aplica las migraciones sobre una imitación mínima de Supabase y verifica, entre otras cosas, que un usuario no pueda ver ni tocar los datos de otro.

## Límites conocidos de esta etapa

- La app trae todas las partidas de una vez. Supabase devuelve hasta 1.000 filas por consulta por defecto; más allá de eso hay que paginar.
- Siempre hay dos lados por partida: no entran tres o más equipos ni todos contra todos.
- Todas las partidas son personales: el vínculo entre cuentas y la validación llegan en la etapa 2.
