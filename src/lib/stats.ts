/** Cálculos de estadísticas a partir de las partidas cargadas. */

export type Winner = 'mine' | 'theirs' | 'draw';

export interface Match {
  id: string;
  gameId: string;
  playedOn: string; // AAAA-MM-DD
  myScore: number | null;
  theirScore: number | null;
  winner: Winner;
  mates: string[]; // ids de tags de persona
  rivals: string[];
  editedAt: string | null;
  createdAt: string;
}

export interface Record {
  n: number;
  w: number;
  l: number;
  d: number;
  pct: number;
}

export function record(ms: Match[]): Record {
  const w = ms.filter((m) => m.winner === 'mine').length;
  const l = ms.filter((m) => m.winner === 'theirs').length;
  const n = ms.length;
  return { n, w, l, d: n - w - l, pct: n ? Math.round((w / n) * 100) : 0 };
}

/** Más recientes primero; a igual fecha, la última cargada primero. */
export function sorted(ms: Match[]): Match[] {
  return [...ms].sort(
    (a, b) => b.playedOn.localeCompare(a.playedOn) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function streak(ms: Match[]): { winner: Winner; count: number } | null {
  const s = sorted(ms);
  if (!s.length) return null;
  let count = 0;
  while (count < s.length && s[count].winner === s[0].winner) count++;
  return { winner: s[0].winner, count };
}

export function streakText(ms: Match[]): string {
  const s = streak(ms);
  if (!s) return '';
  const one = s.count === 1;
  const word =
    s.winner === 'mine' ? (one ? 'ganada' : 'ganadas') : s.winner === 'theirs' ? (one ? 'perdida' : 'perdidas') : one ? 'empate' : 'empates';
  return `Racha actual: ${s.count} ${word}`;
}

/** Partidas en las que una persona fue rival, o un juego fue el jugado. */
export function involves(m: Match, kind: 'person' | 'game', id: string): boolean {
  return kind === 'game' ? m.gameId === id : m.rivals.includes(id);
}

/** Récord agrupado por tag, ordenado por cantidad de partidas. Omite los que no tienen partidas. */
export function groupBy<T extends { id: string }>(ms: Match[], kind: 'person' | 'game', items: T[]) {
  return items
    .map((x) => ({ item: x, rec: record(ms.filter((m) => involves(m, kind, x.id))) }))
    .filter((g) => g.rec.n > 0)
    .sort((a, b) => b.rec.n - a.rec.n);
}

/** Cantidad de partidas en que aparece cada tag, para ordenar sugerencias. */
export function usage(ms: Match[]): Map<string, number> {
  const u = new Map<string, number>();
  const add = (id: string) => u.set(id, (u.get(id) ?? 0) + 1);
  for (const m of ms) {
    add(m.gameId);
    m.mates.forEach(add);
    m.rivals.forEach(add);
  }
  return u;
}

export function winnerFromScores(my: number, their: number): Winner {
  return my > their ? 'mine' : my < their ? 'theirs' : 'draw';
}
