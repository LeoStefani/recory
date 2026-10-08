import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { configured, supabase } from './lib/supabase';
import Auth, { NewPassword } from './screens/Auth';
import Home from './screens/Home';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <div className="auth">
        <h1 className="brand">RECORY</h1>
        <p className="notice">
          Falta configurar la conexión con Supabase. Copiá <code>.env.example</code> como <code>.env.local</code>,
          completalo con los datos de tu proyecto y reiniciá <code>npm run dev</code>.
        </p>
      </div>
    );
  }
  if (session === undefined) return <div className="auth"><p className="sub">Cargando…</p></div>;
  if (session && recovering) return <NewPassword onDone={() => setRecovering(false)} />;
  if (!session) return <Auth />;
  return <Home session={session} />;
}
