# 02 · Tags y usuarios

## Los tres tipos de nombre

Un participante de una partida es siempre un tag o un usuario. La forma de escribirlo indica cuál de los dos es, sin ambigüedad posible.

| Qué es | Cómo se escribe | Ejemplo |
| --- | --- | --- |
| Tag | Texto libre, sin `@` ni `*` | `Juan` |
| Usuario activo | Empieza con `@` | `@juan` |
| Usuario eliminado | Empieza con `@` y termina con `*` | `@juan*` |

**Símbolos reservados.** `@` y `*` no se pueden usar en ningún tag, ni de persona ni de juego. El username solo admite letras, números y guion bajo, así que tampoco puede contenerlos. Por eso un tag nunca se solapa con un usuario, y un usuario eliminado nunca se confunde con uno activo.

Si otra persona registra más adelante el username `juan`, es una cuenta nueva y distinta de `@juan*`, que sigue representando a la anterior en el historial de quienes jugaron con ella.

Estado: la restricción de `@` y `*` está **implementada** en la web y en la base de datos. La representación `@juan*` está **definida** (etapa 2).

## Tags

Estado: **implementado**.

- Hay dos tipos: **de persona** y **de juego**. No se mezclan: el campo de juego nunca sugiere personas, ni al revés.
- Son **privados**: cada usuario tiene los suyos y nadie más los ve.
- Se crean **solos al cargar una partida**, escribiendo un nombre que no existe. No hay un paso previo de alta.
- Largo: de 1 a 60 caracteres.

### Tags de juego

Cada persona distingue los juegos como quiera. `Truco`, `Truco gallo` y `Truco con flor` son tres tags distintos, cada uno con sus estadísticas. Quien prefiera un solo número usa un único tag `Truco` para todo.

No existe un total que sume variantes: los tags de juego no se agrupan (ver [01-producto.md](01-producto.md), "Descartado").

### Evitar duplicados

El objetivo es que los mismos tags se reutilicen y no aparezcan variantes del mismo valor.

- **Comparación tolerante.** Dos nombres se consideran el mismo tag si coinciden sin distinguir mayúsculas, acentos ni espacios de más. `TRUCO`, `truco` y ` Truco ` son el mismo; `ajedréz` y `Ajedrez` también. Al escribir uno existente, se usa el que ya está guardado, con su forma original.
- **Sugerencias al escribir.** Ver [03-partidas.md](03-partidas.md).

La base de datos garantiza la unicidad sin distinguir mayúsculas ni espacios. La tolerancia a acentos la resuelve la web antes de guardar.

### Operaciones sobre un tag

| Operación | Efecto | Reversible |
| --- | --- | --- |
| Renombrar | Cambia el nombre. Las partidas no se tocan. | Sí |
| Fusionar con otro | Todas las partidas del tag pasan al otro, del mismo tipo, y el primero se elimina. Sirve para corregir duplicados propios. | No |
| Eliminar | Solo si el tag no tiene partidas. Si tiene, antes hay que borrarlas o fusionar el tag. | No |

Al fusionar dos tags de persona que aparecen en la misma partida, queda una sola aparición.

**Fusionar no es vincular.** Fusionar reescribe las partidas y es permanente. Vincular (ver [05-vinculo.md](05-vinculo.md)) no toca las partidas y se puede deshacer.

## Usuarios

Un usuario es una cuenta real. Sus reglas están en [04-cuentas.md](04-cuentas.md). En las partidas aparece como participante solo a partir de la etapa 2, cuando existe un vínculo.

## Equipos fijos

Estado: **fuera de la primera versión**.

Un equipo fijo es un grupo de tags de personas con nombre. "Grupos de tags" y "equipos fijos" son la misma función. Se aplica solo a personas, nunca a juegos.
