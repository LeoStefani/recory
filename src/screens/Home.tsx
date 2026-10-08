import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { deleteTag, loadData, mergeTags, myUsername, renameTag, type Data, type Tag } from '../lib/data';
import { message } from '../lib/supabase';
import { groupBy, involves, record, sorted, streakText, type Match, type Record } from '../lib/stats';
import { hasReserved } from '../lib/tags';
import MatchForm, { type Preset } from './MatchForm';
import Profile from './Profile';

type TabId = 'historial' | 'contactos' | 'juegos';
type Kind = 'person' | 'game';
interface View {
  tab: TabId;
  detail: { kind: Kind; id: string } | null;
  filter: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'historial', label: 'Historial' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'juegos', label: 'Juegos' },
];

const fmtDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function Home({ session }: { session: Session }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>({ tab: 'historial', detail: null, filter: '' });
  const [form, setForm] = useState<{ match: Match | null; preset: Preset } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState('');

  const reload = useCallback(async () => {
    try {
      setData(await loadData());
      setError('');
    } catch (e) {
      setError(message(e));
    }
  }, []);

  useEffect(() => {
    reload();
    myUsername(session.user.id).then(setUsername).catch(() => {});
  }, [reload, session.user.id]);

  const tags = useMemo(() => new Map((data?.tags ?? []).map((t) => [t.id, t])), [data]);
  const name = (id: string) => tags.get(id)?.name ?? '(borrado)';
  const open = (kind: Kind, id: string) => {
    setView({ tab: kind === 'person' ? 'contactos' : 'juegos', detail: { kind, id }, filter: '' });
    window.scrollTo(0, 0);
  };
  const newMatch = (preset: Preset = {}) => setForm({ match: null, preset });

  if (profileOpen) {
    return (
      <Profile
        session={session}
        username={username}
        data={data}
        onUsername={setUsername}
        onClose={() => setProfileOpen(false)}
      />
    );
  }

  let content;
  if (!data) {
    content = <div className="empty"><p>{error || 'Cargando tus partidas…'}</p></div>;
  } else if (view.detail) {
    content = (
      <Detail
        key={view.detail.id}
        data={data}
        kind={view.detail.kind}
        id={view.detail.id}
        name={name}
        onOpen={open}
        onEdit={(m) => setForm({ match: m, preset: {} })}
        onNew={newMatch}
        onBack={() => setView({ ...view, detail: null })}
        onChanged={reload}
        onGone={() => setView({ ...view, detail: null })}
      />
    );
  } else if (view.tab === 'historial') {
    content = (
      <History
        data={data}
        filter={view.filter}
        onFilter={(filter) => setView({ ...view, filter })}
        name={name}
        onOpen={open}
        onEdit={(m) => setForm({ match: m, preset: {} })}
        onNew={() => newMatch()}
      />
    );
  } else {
    content = <TagList data={data} kind={view.tab === 'contactos' ? 'person' : 'game'} onOpen={open} onNew={() => newMatch()} />;
  }

  return (
    <div className="app">
      <header className="top">
        <h1 className="brand">RECORY</h1>
        <div className="top-actions">
          <button className="btn primary" onClick={() => newMatch()}>+ Cargar partida</button>
          <button className="avatar" aria-label="Mi perfil" onClick={() => setProfileOpen(true)}>
            {(username || '?').slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>
      <nav className="tabs" aria-label="Secciones">
        {TABS.map((t) => (
          <button key={t.id} aria-current={view.tab === t.id} onClick={() => setView({ tab: t.id, detail: null, filter: '' })}>
            {t.label}
          </button>
        ))}
      </nav>
      <main>
        {data && error && <p className="error">{error}</p>}
        {content}
      </main>
      {form && data && (
        <MatchForm
          data={data}
          match={form.match}
          preset={form.preset}
          onClose={() => setForm(null)}
          onSaved={async () => {
            setForm(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function Tiles({ rec }: { rec: Record }) {
  return (
    <div className="tiles">
      <div className="tile"><b>{rec.n}</b><span>jugadas</span></div>
      <div className="tile"><b>{rec.w}</b><span>ganadas</span></div>
      <div className="tile"><b>{rec.pct}%</b><span>efectividad</span></div>
    </div>
  );
}

interface RowProps {
  m: Match;
  name: (id: string) => string;
  onOpen: (kind: Kind, id: string) => void;
  onEdit: (m: Match) => void;
}

function Names({ ids, name, onOpen }: { ids: string[]; name: RowProps['name']; onOpen: RowProps['onOpen'] }) {
  return (
    <>
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && <span className="vs"> + </span>}
          <button className="link" onClick={() => onOpen('person', id)}>{name(id)}</button>
        </span>
      ))}
    </>
  );
}

function MatchRow({ m, name, onOpen, onEdit }: RowProps) {
  const res = m.winner === 'mine' ? ['win', 'Ganaste'] : m.winner === 'theirs' ? ['loss', 'Perdiste'] : ['', 'Empate'];
  return (
    <li className="row">
      <div className="row-main">
        <div className="row-title">
          <button className="link" onClick={() => onOpen('game', m.gameId)}>{name(m.gameId)}</button>{' '}
          {m.mates.length > 0 && (
            <>
              <span className="vs">con </span>
              <Names ids={m.mates} name={name} onOpen={onOpen} />{' '}
            </>
          )}
          <span className="vs">vs </span>
          <Names ids={m.rivals} name={name} onOpen={onOpen} />
        </div>
        <div className="sub">
          {fmtDate(m.playedOn)} · Personal{m.editedAt ? ' · Editada' : ''}
        </div>
      </div>
      {m.myScore != null && <div className="score">{m.myScore}–{m.theirScore}</div>}
      <span className={`result ${res[0]}`}>{res[1]}</span>
      <button className="icon-btn" aria-label="Editar partida" onClick={() => onEdit(m)}>✎</button>
    </li>
  );
}

function History(props: {
  data: Data;
  filter: string;
  onFilter: (id: string) => void;
  name: RowProps['name'];
  onOpen: RowProps['onOpen'];
  onEdit: RowProps['onEdit'];
  onNew: () => void;
}) {
  const { data, filter } = props;
  if (!data.matches.length) {
    return (
      <div className="empty card">
        <h2>Todavía no cargaste partidas</h2>
        <p>Anotá contra quién jugaste, a qué y cómo salió. El historial y el cara a cara se arman solos.</p>
        <button className="btn primary" onClick={props.onNew}>Cargar la primera partida</button>
      </div>
    );
  }
  const games = data.tags.filter((t) => t.kind === 'game' && data.matches.some((m) => m.gameId === t.id));
  const ms = filter ? data.matches.filter((m) => m.gameId === filter) : data.matches;
  return (
    <>
      <Tiles rec={record(ms)} />
      <div className="chips">
        <button className="chip-btn" aria-pressed={!filter} onClick={() => props.onFilter('')}>Todos</button>
        {games.map((g) => (
          <button key={g.id} className="chip-btn" aria-pressed={filter === g.id} onClick={() => props.onFilter(g.id)}>{g.name}</button>
        ))}
      </div>
      <ul className="list">
        {sorted(ms).map((m) => <MatchRow key={m.id} m={m} name={props.name} onOpen={props.onOpen} onEdit={props.onEdit} />)}
      </ul>
    </>
  );
}

function TagList({ data, kind, onOpen, onNew }: { data: Data; kind: Kind; onOpen: RowProps['onOpen']; onNew: () => void }) {
  const items = data.tags
    .filter((t) => t.kind === kind)
    .map((t) => ({ t, rec: record(data.matches.filter((m) => involves(m, kind, t.id))) }))
    .sort((a, b) => b.rec.n - a.rec.n);
  if (!items.length) {
    return (
      <div className="empty card">
        <p>
          {kind === 'person'
            ? 'Tus contactos son nombres que creás vos al cargar una partida. Todavía no hay ninguno.'
            : 'Los juegos se agregan al cargar una partida. Todavía no hay ninguno.'}
        </p>
        <button className="btn primary" onClick={onNew}>Cargar partida</button>
      </div>
    );
  }
  return (
    <ul className="list">
      {items.map(({ t, rec }) => (
        <li key={t.id}>
          <button className="list-btn" onClick={() => onOpen(kind, t.id)}>
            <div className="row-main">
              <div className="row-title">{t.name}</div>
              <div className="sub">{plural(rec.n, 'partida', 'partidas')} · {rec.pct}% ganadas</div>
            </div>
            <div className="score">{rec.w}–{rec.l}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Detail(props: {
  data: Data;
  kind: Kind;
  id: string;
  name: RowProps['name'];
  onOpen: RowProps['onOpen'];
  onEdit: RowProps['onEdit'];
  onNew: (p: Preset) => void;
  onBack: () => void;
  onChanged: () => Promise<void>;
  onGone: () => void;
}) {
  const { data, kind, id } = props;
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [mergeTo, setMergeTo] = useState('');
  const [error, setError] = useState('');
  const tag = data.tags.find((t) => t.id === id);
  useEffect(() => setNewName(tag?.name ?? ''), [tag?.name]);
  if (!tag) return null;

  const isPerson = kind === 'person';
  const ms = data.matches.filter((m) => involves(m, kind, id));
  const together = isPerson ? data.matches.filter((m) => m.mates.includes(id)) : [];
  const all = [...ms, ...together];
  const rec = record(ms);
  const team = record(together);
  const others: Tag[] = data.tags.filter((t) => t.kind === kind && t.id !== id);
  const breakdown = isPerson ? groupBy(ms, 'game', data.tags.filter((t) => t.kind === 'game')) : groupBy(ms, 'person', data.tags.filter((t) => t.kind === 'person'));

  async function run(action: () => Promise<void>, after?: () => void) {
    setError('');
    try {
      await action();
      setEditing(false);
      after?.();
      await props.onChanged();
    } catch (e) {
      setError(message(e));
    }
  }
  function rename(e: FormEvent) {
    e.preventDefault();
    if (hasReserved(newName)) return setError('Los tags no pueden llevar @ ni *: esos símbolos quedan reservados para las cuentas.');
    run(() => renameTag(id, newName.trim().replace(/\s+/g, ' ')));
  }
  function merge(e: FormEvent) {
    e.preventDefault();
    const to = mergeTo || others[0]?.id;
    if (to) run(() => mergeTags(id, to), () => props.onOpen(kind, to));
  }

  return (
    <>
      <div className="head">
        <button className="btn" aria-label="Volver" onClick={props.onBack}>←</button>
        <h2>{tag.name}</h2>
        <button className="btn" onClick={() => setEditing(!editing)}>{editing ? 'Cerrar' : 'Editar'}</button>
      </div>

      {editing && (
        <div className="card">
          <form className="inline-form" onSubmit={rename}>
            <div className="field">
              <label htmlFor="rename-input">Nombre</label>
              <input id="rename-input" value={newName} onChange={(e) => setNewName(e.target.value)} required maxLength={60} />
            </div>
            <button className="btn">Guardar</button>
          </form>
          {others.length > 0 && (
            <form className="inline-form" onSubmit={merge}>
              <div className="field">
                <label htmlFor="merge-select">{isPerson ? 'Es la misma persona que' : 'Es el mismo juego que'}</label>
                <select id="merge-select" value={mergeTo} onChange={(e) => setMergeTo(e.target.value)}>
                  {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <button className="btn">Fusionar</button>
            </form>
          )}
          <span className="sub">Al fusionar, las partidas pasan al otro {isPerson ? 'contacto' : 'juego'} y este se elimina. No se puede deshacer.</span>
          {all.length ? (
            <span className="sub">Para eliminarlo, antes borrá o fusioná sus partidas.</span>
          ) : (
            <button className="btn danger" onClick={() => run(() => deleteTag(id), props.onGone)}>Eliminar este tag</button>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {isPerson ? (
        <div className="card">
          <div className="sub center">
            Cara a cara · {plural(rec.n, 'partida', 'partidas')}
            {rec.d ? ` · ${plural(rec.d, 'empate', 'empates')}` : ''}
          </div>
          <div className="h2h">
            <div className="me"><b>{rec.w}</b>Vos</div>
            <div className="dash">–</div>
            <div><b>{rec.l}</b>{tag.name}</div>
          </div>
          <div className="bar"><i style={{ width: `${rec.pct}%` }} /></div>
          <div className="sub center">{streakText(ms)}</div>
          {team.n > 0 && <div className="sub center">En el mismo equipo: {plural(team.w, 'ganada', 'ganadas')} de {team.n}</div>}
        </div>
      ) : (
        <>
          <Tiles rec={rec} />
          <div className="sub">{streakText(ms)}</div>
        </>
      )}

      {breakdown.length > 0 && (
        <>
          <h3>{isPerson ? 'Por juego' : 'Contra quién'}</h3>
          <ul className="list">
            {breakdown.map((g) => (
              <li key={g.item.id} className="bar-row">
                <button className="link" onClick={() => props.onOpen(isPerson ? 'game' : 'person', g.item.id)}>{g.item.name}</button>
                <div className="bar"><i style={{ width: `${g.rec.pct}%` }} /></div>
                <span className="num">{g.rec.w}–{g.rec.l}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {all.length ? (
        <>
          <h3>Partidas</h3>
          <ul className="list">
            {sorted(all).map((m) => <MatchRow key={m.id} m={m} name={props.name} onOpen={props.onOpen} onEdit={props.onEdit} />)}
          </ul>
        </>
      ) : (
        <p className="sub">Sin partidas todavía.</p>
      )}

      <button className="btn primary block" onClick={() => props.onNew(isPerson ? { rival: tag.name } : { game: tag.name })}>
        Cargar partida {isPerson ? 'con' : 'de'} {tag.name}
      </button>
    </>
  );
}
