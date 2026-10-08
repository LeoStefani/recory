import { useEffect, useState, type FormEvent } from 'react';
import { supabase, message } from '../lib/supabase';
import { signIn, usernameAvailable } from '../lib/data';
import { USERNAME_RE } from '../lib/tags';

type Mode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  return (
    <div className="auth">
      <div>
        <h1 className="brand">RECORY</h1>
        <p className="sub" style={{ fontSize: 16 }}>
          {mode === 'register'
            ? 'Creá tu cuenta para vincularte con tus amigos y validar partidas.'
            : mode === 'forgot'
              ? 'Te mandamos un link para elegir una contraseña nueva.'
              : 'Ingresá para ver tu historial.'}
        </p>
      </div>
      {mode === 'login' && <Login onMode={setMode} />}
      {mode === 'register' && <Register onMode={setMode} />}
      {mode === 'forgot' && <Forgot onMode={setMode} />}
    </div>
  );
}

function Login({ onMode }: { onMode: (m: Mode) => void }) {
  const [who, setWho] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(who, password);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="login-who">Usuario o email</label>
        <input id="login-who" value={who} onChange={(e) => setWho(e.target.value)} autoComplete="username" autoCapitalize="none" required />
      </div>
      <div className="field">
        <label htmlFor="login-pass">Contraseña</label>
        <input id="login-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        <button type="button" className="text-btn" style={{ alignSelf: 'flex-end' }} onClick={() => onMode('forgot')}>
          Olvidé mi contraseña
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn primary block" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      <p className="sub center" style={{ fontSize: 15 }}>
        ¿Todavía no tenés cuenta?{' '}
        <button type="button" className="text-btn" onClick={() => onMode('register')}>Crear cuenta</button>
      </p>
    </form>
  );
}

function Register({ onMode }: { onMode: (m: Mode) => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const validFormat = USERNAME_RE.test(username);
  useEffect(() => {
    setAvailable(null);
    if (!validFormat) return;
    const t = setTimeout(() => {
      usernameAvailable(username).then(setAvailable).catch(() => setAvailable(null));
    }, 400);
    return () => clearTimeout(t);
  }, [username, validFormat]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validFormat) return setError('El nombre de usuario tiene que tener de 3 a 20 letras, números o guion bajo.');
    if (password.length < 8) return setError('La contraseña tiene que tener al menos 8 caracteres.');
    setBusy(true);
    try {
      if (!(await usernameAvailable(username))) throw new Error('Ese nombre de usuario ya está en uso.');
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (!data.session) setSentTo(email.trim());
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="card">
        <h2>Revisá tu email</h2>
        <p style={{ margin: 0 }}>Te mandamos un link a <b>{sentTo}</b> para verificar la cuenta. Después de abrirlo, ya podés ingresar.</p>
        <button className="btn block" onClick={() => onMode('login')}>Ir a ingresar</button>
      </div>
    );
  }

  let hint = 'Así te van a buscar tus amigos. Letras, números y guion bajo.';
  let hintOk = false;
  if (username && !validFormat) hint = 'De 3 a 20 caracteres: letras, números y guion bajo.';
  else if (available === true) { hint = 'Disponible.'; hintOk = true; }
  else if (available === false) hint = 'Ese nombre de usuario ya está en uso.';

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="reg-user">Nombre de usuario</label>
        <div className="prefixed">
          <span>@</span>
          <input id="reg-user" value={username} onChange={(e) => setUsername(e.target.value.trim())} autoComplete="username" autoCapitalize="none" maxLength={20} required />
        </div>
        <span className={hintOk ? 'hint ok' : 'hint'}>{hint}</span>
      </div>
      <div className="field">
        <label htmlFor="reg-email">Email</label>
        <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <span className="hint">Te mandamos un link para verificarlo. No se muestra a otros.</span>
      </div>
      <div className="field">
        <label htmlFor="reg-pass">Contraseña</label>
        <input id="reg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        <span className="hint">Mínimo 8 caracteres.</span>
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn primary block" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
      <p className="sub center" style={{ fontSize: 15 }}>
        ¿Ya tenés cuenta? <button type="button" className="text-btn" onClick={() => onMode('login')}>Ingresar</button>
      </p>
    </form>
  );
}

function Forgot({ onMode }: { onMode: (m: Mode) => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) setError(message(error));
    else setSent(true);
  }

  return (
    <form onSubmit={submit}>
      {sent ? (
        <p className="notice">Si hay una cuenta con <b>{email}</b>, te llega un link para elegir una contraseña nueva.</p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="forgot-email">Email de tu cuenta</label>
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn primary block">Mandar link</button>
        </>
      )}
      <button type="button" className="btn block" onClick={() => onMode('login')}>Volver a ingresar</button>
    </form>
  );
}

export function NewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError('La contraseña tiene que tener al menos 8 caracteres.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(message(error));
    else onDone();
  }

  return (
    <div className="auth">
      <h1 className="brand">RECORY</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="new-pass">Contraseña nueva</label>
          <input id="new-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block">Guardar contraseña</button>
      </form>
    </div>
  );
}
