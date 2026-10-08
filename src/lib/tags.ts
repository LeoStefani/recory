/** Reglas de nombres de tags y usernames, compartidas por toda la app. */

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

/** Clave para comparar tags: sin mayúsculas, acentos ni espacios de más. */
export function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

export const same = (a: string, b: string) => norm(a) === norm(b);

/** Limpia espacios de un nombre ingresado. */
export const cleanName = (s: string) => s.trim().replace(/\s+/g, ' ');

/** @ y * quedan reservados para cuentas: @juan (activa) y @juan* (eliminada). */
export const hasReserved = (s: string) => /[@*]/.test(s);

/** Si ya existe un tag equivalente, devuelve su nombre; si no, el nombre limpio. */
export function canonical(name: string, existing: { name: string }[]): string {
  const hit = existing.find((t) => same(t.name, name));
  return hit ? hit.name : cleanName(name);
}
