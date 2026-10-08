import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && key);

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'falta-configurar');

/** Convierte un error de Supabase o de Postgres en un mensaje para mostrar. */
export function message(e: unknown): string {
  const raw = (e as { message?: string })?.message ?? String(e);
  if (/duplicate key|profiles_username_key/.test(raw)) return 'Ese nombre de usuario ya está en uso.';
  if (/foreign key/.test(raw)) return 'No se puede eliminar porque todavía tiene partidas.';
  if (/Invalid login credentials/.test(raw)) return 'Usuario o contraseña incorrectos.';
  if (/Email not confirmed/.test(raw)) return 'Todavía no verificaste tu email. Revisá tu casilla.';
  if (/Password should be at least/.test(raw)) return 'La contraseña tiene que tener al menos 8 caracteres.';
  if (/Failed to fetch|NetworkError/.test(raw)) return 'No hay conexión. Revisá internet y volvé a intentar.';
  return raw;
}
