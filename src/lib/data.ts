import { supabase } from './supabase';
import type { Match, Winner } from './stats';

export interface Tag {
  id: string;
  kind: 'person' | 'game';
  name: string;
}

export interface Data {
  tags: Tag[];
  matches: Match[];
}

interface MatchRow {
  id: string;
  game_tag_id: string;
  played_on: string;
  my_score: number | null;
  their_score: number | null;
  winner: Winner;
  edited_at: string | null;
  created_at: string;
  match_participants: { side: 'mine' | 'theirs'; tag_id: string | null }[];
}

export async function loadData(): Promise<Data> {
  const [tags, matches] = await Promise.all([
    supabase.from('tags').select('id, kind, name').order('name'),
    supabase
      .from('matches')
      .select('id, game_tag_id, played_on, my_score, their_score, winner, edited_at, created_at, match_participants(side, tag_id)')
      .order('played_on', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);
  if (tags.error) throw tags.error;
  if (matches.error) throw matches.error;
  return {
    tags: tags.data as Tag[],
    matches: (matches.data as MatchRow[]).map((r) => ({
      id: r.id,
      gameId: r.game_tag_id,
      playedOn: r.played_on,
      myScore: r.my_score,
      theirScore: r.their_score,
      winner: r.winner,
      editedAt: r.edited_at,
      createdAt: r.created_at,
      mates: r.match_participants.filter((p) => p.side === 'mine' && p.tag_id).map((p) => p.tag_id!),
      rivals: r.match_participants.filter((p) => p.side === 'theirs' && p.tag_id).map((p) => p.tag_id!),
    })),
  };
}

export interface MatchInput {
  id: string | null;
  game: string;
  mates: string[];
  rivals: string[];
  playedOn: string;
  myScore: number | null;
  theirScore: number | null;
  winner: Winner;
}

export async function saveMatch(m: MatchInput): Promise<void> {
  const { error } = await supabase.rpc('save_match', {
    p_match_id: m.id,
    p_game: m.game,
    p_mates: m.mates,
    p_rivals: m.rivals,
    p_played_on: m.playedOn,
    p_my_score: m.myScore,
    p_their_score: m.theirScore,
    p_winner: m.winner,
  });
  if (error) throw error;
}

export async function deleteMatch(id: string) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) throw error;
}

export async function renameTag(id: string, name: string) {
  const { error } = await supabase.from('tags').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function mergeTags(from: string, to: string) {
  const { error } = await supabase.rpc('merge_tags', { p_from: from, p_to: to });
  if (error) throw error;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

export async function usernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('username_available', { p_username: username });
  if (error) throw error;
  return Boolean(data);
}

export async function myUsername(userId: string): Promise<string> {
  const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).single();
  if (error) throw error;
  return data.username as string;
}

export async function changeUsername(userId: string, username: string) {
  const { error } = await supabase.from('profiles').update({ username }).eq('id', userId);
  if (error) throw error;
}

/** Ingreso: con email va directo; con username pasa por la función del servidor. */
export async function signIn(who: string, password: string) {
  if (who.includes('@')) {
    const { error } = await supabase.auth.signInWithPassword({ email: who.trim(), password });
    if (error) throw error;
    return;
  }
  const { data, error } = await supabase.functions.invoke('login-with-username', {
    body: { username: who.trim(), password },
  });
  if (error || !data?.access_token) throw new Error('Usuario o contraseña incorrectos.');
  const res = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (res.error) throw res.error;
}
