import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { deleteMatch, saveMatch, type Data, type Tag } from '../lib/data';
import { message } from '../lib/supabase';
import { usage, winnerFromScores, type Match, type Winner } from '../lib/stats';
import { canonical, hasReserved, norm, same } from '../lib/tags';

export interface Preset {
  game?: string;
  rival?: string;
}

type Side = 'rivals' | 'mates';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const RESERVED = 'Los tags no pueden llevar @ ni *: esos símbolos quedan reservados para las cuentas.';

export default function MatchForm({ data, match, preset, onClose, onSaved }: {
  data: Data;
  match: Match | null;
  preset: Preset;
  onClose: () => void;
  onSaved: () => void;
}) {
  const nameOf = (id: string) => data.tags.find((t) => t.id === id)?.name ?? '';
  const [game, setGame] = useState(match ? nameOf(match.gameId) : preset.game ?? '');
  const [picked, setPicked] = useState<Record<Side, string[]>>({
    rivals: match ? match.rivals.map(nameOf) : preset.rival ? [preset.rival] : [],
    mates: match ? match.mates.map(nameOf) : [],
  });
  const [typed, setTyped] = useState<Record<Side, string>>({ rivals: '', mates: '' });
  const [my, setMy] = useState(match?.myScore?.toString() ?? '');
  const [their, setTheir] = useState(match?.theirScore?.toString() ?? '');
  const [winner, setWinner] = useState<Winner>(match?.winner ?? 'mine');
  const [date, setDate] = useState(match?.playedOn ?? today());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const uses = useMemo(() => usage(data.matches), [data.matches]);
  const people = data.tags.filter((t) => t.kind === 'person');
  const games = data.tags.filter((t) => t.kind === 'game');
  const allPicked = [...picked.rivals, ...picked.mates];

  function suggestions(pool: Tag[], query: string, exclude: string[], hideExact: boolean) {
    const q = norm(query.split(',').pop() ?? '');
    return pool
      .filter((t) => norm(t.name).includes(q) && !exclude.some((e) => same(e, t.name)) && !(hideExact && norm(t.name) === q))
      .sort((a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0))
      .slice(0, 6);
  }

  /** Suma lo escrito en el campo a la lista y devuelve la lista resultante. */
  function commit(side: Side): Record<Side, string[]> | null {
    const names = typed[side].split(',').map((n) => n.trim()).filter(Boolean);
    if (names.some(hasReserved)) {
      setError(RESERVED);
      return null;
    }
    const next = { ...picked, [side]: [...picked[side]] };
    for (const n of names) {
      if (![...next.rivals, ...next.mates].some((o) => same(o, n))) next[side].push(canonical(n, people));
    }
    setPicked(next);
    setTyped({ ...typed, [side]: '' });
    return next;
  }

  function onScore(nextMy: string, nextTheir: string) {
    setMy(nextMy);
    setTheir(nextTheir);
    if (nextMy !== '' && nextTheir !== '') setWinner(winnerFromScores(Number(nextMy), Number(nextTheir)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const withRivals = commit('rivals');
    if (!withRivals) return;
    const mates = typed.mates.trim() ? commit('mates')?.mates : withRivals.mates;
    if (!mates) return;
    const gameName = game.trim().replace(/\s+/g, ' ');
    if (hasReserved(gameName)) return setError(RESERVED);
    if (!gameName || !withRivals.rivals.length || !date) return setError('Completá el juego, al menos un rival y la fecha.');
    if ((my === '') !== (their === '')) return setError('Cargá los dos puntajes o dejá los dos vacíos.');
    setBusy(true);
    try {
      await saveMatch({
        id: match?.id ?? null,
        game: canonical(gameName, games),
        mates,
        rivals: withRivals.rivals,
        playedOn: date,
        myScore: my === '' ? null : Number(my),
        theirScore: their === '' ? null : Number(their),
        winner,
      });
      onSaved();
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  async function remove() {
    if (!match) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    try {
      await deleteMatch(match.id);
      onSaved();
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  const sideField = (side: Side, label: string, placeholder: string) => (
    <div className="field">
      <label htmlFor={`f-${side}`}>{label}</label>
      {picked[side].length > 0 && (
        <div className="chips">
          {picked[side].map((n) => (
            <button type="button" key={n} className="chip-btn" aria-pressed="true" aria-label={`Quitar ${n}`}
              onClick={() => setPicked({ ...picked, [side]: picked[side].filter((x) => x !== n) })}>
              {n} ✕
            </button>
          ))}
        </div>
      )}
      <div className="addrow">
        <input id={`f-${side}`} value={typed[side]} placeholder={placeholder} autoComplete="off"
          onChange={(e) => setTyped({ ...typed, [side]: e.target.value })}
          onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); commit(side); } }} />
        <button type="button" className="btn" onClick={() => commit(side)}>Agregar</button>
      </div>
      <div className="chips">
        {suggestions(people, typed[side], allPicked, false).map((t) => (
          <button type="button" key={t.id} className="chip-btn suggest"
            onClick={() => { setPicked({ ...picked, [side]: [...picked[side], t.name] }); setTyped({ ...typed, [side]: '' }); }}>
            + {t.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={submit} autoComplete="off">
        <h2>{match ? 'Editar partida' : 'Cargar partida'}</h2>
        <div className="field">
          <label htmlFor="f-game">Juego</label>
          <input id="f-game" value={game} onChange={(e) => setGame(e.target.value)} placeholder="Truco, truco gallo, ajedrez…" autoComplete="off" />
          <div className="chips">
            {suggestions(games, game, [], true).map((t) => (
              <button type="button" key={t.id} className="chip-btn suggest" onClick={() => setGame(t.name)}>+ {t.name}</button>
            ))}
          </div>
        </div>
        {sideField('rivals', 'Rivales', 'Un nombre; si no existe, se crea')}
        {sideField('mates', 'Tu equipo (opcional)', 'Quién jugó de tu lado')}
        <div>
          <div className="legend" style={{ marginBottom: 6 }}>Score (opcional)</div>
          <div className="two">
            <div className="field">
              <label htmlFor="f-my">Tu lado</label>
              <input id="f-my" type="number" inputMode="numeric" min={0} value={my} onChange={(e) => onScore(e.target.value, their)} />
            </div>
            <div className="field">
              <label htmlFor="f-their">Rivales</label>
              <input id="f-their" type="number" inputMode="numeric" min={0} value={their} onChange={(e) => onScore(my, e.target.value)} />
            </div>
          </div>
        </div>
        <div>
          <div className="legend" style={{ marginBottom: 6 }}>Quién ganó</div>
          <div className="seg" role="group" aria-label="Quién ganó">
            {([['mine', 'Tu lado'], ['theirs', 'Rivales'], ['draw', 'Empate']] as const).map(([v, label]) => (
              <button type="button" key={v} aria-pressed={winner === v} onClick={() => setWinner(v)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-date">Fecha</label>
          <input id="f-date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" disabled={busy}>{match ? 'Guardar cambios' : 'Guardar partida'}</button>
        <button type="button" className="btn block" onClick={onClose}>Cancelar</button>
        {match && (
          <button type="button" className="btn block danger" disabled={busy} onClick={remove}>
            {confirmDelete ? 'Tocá de nuevo para confirmar' : 'Borrar partida'}
          </button>
        )}
      </form>
    </div>
  );
}
