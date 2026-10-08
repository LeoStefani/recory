// Ingreso con username + contraseña.
// Busca el email del username con la clave de servicio (que nunca llega al navegador)
// e inicia sesión con él. Ante cualquier fallo responde lo mismo, para no revelar
// qué usernames existen ni a qué email corresponden.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const fail = () =>
  new Response(JSON.stringify({ error: 'Usuario o contraseña incorrectos' }), {
    status: 401,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail();

  let username = '';
  let password = '';
  try {
    const body = await req.json();
    username = String(body.username ?? '').trim();
    password = String(body.password ?? '');
  } catch {
    return fail();
  }
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username) || !password) return fail();

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', username.replace(/_/g, '\\_'))
    .maybeSingle();
  if (!profile) return fail();

  const { data: user } = await admin.auth.admin.getUserById(profile.id);
  const email = user?.user?.email;
  if (!email) return fail();

  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) return fail();

  return new Response(
    JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  );
});
