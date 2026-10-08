import { useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { changeUsername, usernameAvailable, type Data } from '../lib/data';
import { message, supabase } from '../lib/supabase';
import { USERNAME_RE } from '../lib/tags';

export default function Profile({ session, username, data, onUsername, onClose }: {
  session: Session;
  username: string;
  data: Data | null;
  onUsername: (u: string) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<'' | 'username' | 'email' | 'password'>('');
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const start = (field: typeof editing, initial = '') => {
    setEditing(editing === field ? '' : field);
    setValue(initial);
    setError('');
    setNotice('');
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing === 'username') {
        if (!USERNAME_RE.test(value)) throw new Error('De 3 a 20 caracteres: letras, números y guion bajo.');
        if (value.toLowerCase() !== username.toLowerCase() && !(await usernameAvailable(value))) {
          throw new Error('Ese nombre de usuario ya está en uso.');
        }
        await changeUsername(session.user.id, value);
        onUsername(value);
        setNotice('Nombre de usuario actualizado.');
      } else if (editing === 'email') {
        const { error } = await supabase.auth.updateUser({ email: value.trim() }, { emailRedirectTo: window.location.origin });
        if (error) throw error;
        setNotice('Te mandamos un link a la dirección nueva para confirmar el cambio.');
      } else if (editing === 'password') {
        if (value.length < 8) throw new Error('La contraseña tiene que tener al menos 8 caracteres.');
        const { error } = await supabase.auth.updateUser({ password: value });
        if (error) throw error;
        setNotice('Contraseña actualizada.');
      }
      setEditing('');
    } catch (err) {
      setError(message(err));
    }
  }

  function exportData() {
    if (!data) return;
    const name = (id: string) => data.tags.find((t) => t.id === id)?.name ?? '';
    const out = {
      exportado: new Date().toISOString(),
      usuario: username,
      partidas: data.matches.map((m) => ({
        fecha: m.playedOn,
        juego: name(m.gameId),
        tu_equipo: m.mates.map(name),
        rivales: m.rivals.map(name),
        tu_score: m.myScore,
        score_rivales: m.theirScore,
        resultado: m.winner === 'mine' ? 'ganaste' : m.winner === 'theirs' ? 'perdiste' : 'empate',
      })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `recory-${username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!confirmDelete) return setConfirmDelete(true);
    const { error } = await supabase.rpc('delete_account');
    if (error) return setError(message(error));
    await supabase.auth.signOut();
  }

  const row = (field: typeof editing, label: string, shown: string, initial = '') => (
    <div>
      <div className="setting-head">
        <div>
          <div className="sub">{label}</div>
          <div>{shown}</div>
        </div>
        <button className="btn" onClick={() => start(field, initial)}>{editing === field ? 'Cancelar' : 'Cambiar'}</button>
      </div>
      {editing === field && (
        <form className="inline-form" onSubmit={save}>
          <div className="field">
            <label htmlFor={`edit-${field}`}>{field === 'password' ? 'Contraseña nueva' : `${label} nuevo`}</label>
            <input id={`edit-${field}`} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              value={value} onChange={(e) => setValue(e.target.value)} autoCapitalize="none" required />
          </div>
          <button className="btn primary">Guardar</button>
        </form>
      )}
    </div>
  );

  return (
    <div className="app">
      <div className="head">
        <button className="btn" aria-label="Volver" onClick={onClose}>←</button>
        <h2>Mi perfil</h2>
      </div>
      <div className="settings">
        {row('username', 'Nombre de usuario', `@${username}`, username)}
        {row('email', 'Email', session.user.email ?? '')}
        {row('password', 'Contraseña', '••••••••')}
      </div>
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}
      <button className="btn block" onClick={exportData} disabled={!data}>Exportar mis datos</button>
      <button className="btn block" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      <button className="btn block danger" onClick={deleteAccount}>
        {confirmDelete ? 'Tocá de nuevo para eliminar tu cuenta y todas tus partidas' : 'Eliminar mi cuenta'}
      </button>
    </div>
  );
}
