import { describe, expect, it } from 'vitest';
import { canonical, hasReserved, norm, USERNAME_RE } from '../../src/lib/tags';
import { groupBy, record, sorted, streakText, usage, winnerFromScores, type Match } from '../../src/lib/stats';

const m = (p: Partial<Match>): Match => ({
  id: Math.random().toString(36), gameId: 'truco', playedOn: '2026-10-01', myScore: null, theirScore: null,
  winner: 'mine', mates: [], rivals: ['juan'], editedAt: null, createdAt: '2026-10-01T10:00:00Z', ...p,
});

describe('tags', () => {
  it('compara sin mayúsculas, acentos ni espacios', () => {
    expect(norm('  Ajedréz   RÁPIDO ')).toBe('ajedrez rapido');
    expect(canonical('truco', [{ name: 'Truco' }])).toBe('Truco');
    expect(canonical('  truco   gallo ', [{ name: 'Truco' }])).toBe('truco gallo');
  });
  it('reserva @ y *', () => {
    expect(hasReserved('@juan')).toBe(true);
    expect(hasReserved('juan*')).toBe(true);
    expect(hasReserved('Juan')).toBe(false);
  });
  it('valida usernames', () => {
    expect(USERNAME_RE.test('nico_23')).toBe(true);
    expect(USERNAME_RE.test('ni')).toBe(false);
    expect(USERNAME_RE.test('nico*')).toBe(false);
  });
});

describe('estadísticas', () => {
  const ms = [
    m({ playedOn: '2026-10-05', winner: 'mine' }),
    m({ playedOn: '2026-10-04', winner: 'mine' }),
    m({ playedOn: '2026-10-03', winner: 'theirs', rivals: ['caro'] }),
    m({ playedOn: '2026-10-02', winner: 'draw', gameId: 'ajedrez' }),
  ];
  it('cuenta ganadas, perdidas y empates', () => {
    expect(record(ms)).toEqual({ n: 4, w: 2, l: 1, d: 1, pct: 50 });
  });
  it('ordena y calcula la racha', () => {
    expect(sorted(ms)[0].playedOn).toBe('2026-10-05');
    expect(streakText(ms)).toBe('Racha actual: 2 ganadas');
  });
  it('agrupa por rival', () => {
    const g = groupBy(ms, 'person', [{ id: 'juan' }, { id: 'caro' }, { id: 'nadie' }]);
    expect(g.map((x) => [x.item.id, x.rec.n])).toEqual([['juan', 3], ['caro', 1]]);
  });
  it('cuenta usos de tags', () => {
    expect(usage(ms).get('truco')).toBe(3);
  });
  it('deduce el ganador del score', () => {
    expect(winnerFromScores(15, 12)).toBe('mine');
    expect(winnerFromScores(3, 3)).toBe('draw');
  });
});
