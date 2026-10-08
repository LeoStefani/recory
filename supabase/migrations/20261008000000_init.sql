-- RECORY · esquema inicial (etapa 1)
--
-- Etapa 1: cuentas, tags, partidas y estadísticas propias.
-- Las tablas ya contemplan la etapa 2 (vínculo entre cuentas y validación):
-- un participante puede ser un tag propio o un usuario, y tag_links guarda
-- el vínculo tag → usuario como una capa aparte que nunca reescribe partidas.

-- ---------------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null
             check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create unique index profiles_username_key on public.profiles (lower(username));

comment on column public.profiles.username is
  'Único sin distinguir mayúsculas. Solo letras, números y guion bajo, así nunca contiene @ ni *.';

-- Crea el perfil al registrarse, con el username que manda la app en los metadatos.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ¿Está libre este username? Se usa en el registro, antes de tener sesión.
create function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

-- Elimina la cuenta propia y, en cascada, todos sus datos.
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No hay sesión iniciada';
  end if;
  -- Primero las partidas, para que los tags queden sin referencias y la cascada no se trabe.
  -- Etapa 2: antes de esto, las partidas de otros contra este usuario pasan a un tag @username*.
  delete from public.matches where owner_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- Tags (personas y juegos), privados de cada usuario
-- ---------------------------------------------------------------------------

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('person', 'game')),
  name       text not null
             check (length(btrim(name)) between 1 and 60)
             check (name !~ '[@*]'),
  name_key   text generated always as (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) stored,
  created_at timestamptz not null default now(),
  unique (owner_id, kind, name_key)
);

comment on column public.tags.name is '@ y * están reservados para cuentas: @juan (activa) y @juan* (eliminada).';

-- ---------------------------------------------------------------------------
-- Partidas
-- ---------------------------------------------------------------------------

create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_tag_id uuid not null references public.tags (id),
  played_on   date not null check (played_on <= current_date + 1),
  my_score    integer check (my_score >= 0),
  their_score integer check (their_score >= 0),
  winner      text not null check (winner in ('mine', 'theirs', 'draw')),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  check ((my_score is null) = (their_score is null))
);

-- Cada participante es un tag del dueño de la partida o un usuario (etapa 2), nunca ambos.
create table public.match_participants (
  id       uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  side     text not null check (side in ('mine', 'theirs')),
  tag_id   uuid references public.tags (id),
  user_id  uuid references public.profiles (id),
  check ((tag_id is null) <> (user_id is null)),
  unique (match_id, tag_id),
  unique (match_id, user_id)
);

create index match_participants_match_idx on public.match_participants (match_id);
create index matches_owner_idx on public.matches (owner_id, played_on desc);

-- Etapa 2: vínculo tag → usuario. Una capa aparte; las partidas guardan siempre su tag original.
create table public.tag_links (
  tag_id     uuid primary key references public.tags (id) on delete cascade,
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Los tags que usa una partida tienen que ser del dueño y del tipo correcto.
create function public.check_match_refs()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.tags t
    where t.id = new.game_tag_id and t.owner_id = new.owner_id and t.kind = 'game'
  ) then
    raise exception 'El juego no es un tag de juego tuyo';
  end if;
  return new;
end;
$$;

create trigger matches_check_refs
  before insert or update on public.matches
  for each row execute function public.check_match_refs();

create function public.check_participant_refs()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tag_id is not null and not exists (
    select 1
    from public.tags t
    join public.matches m on m.id = new.match_id
    where t.id = new.tag_id and t.owner_id = m.owner_id and t.kind = 'person'
  ) then
    raise exception 'El participante no es un tag de persona tuyo';
  end if;
  return new;
end;
$$;

create trigger participants_check_refs
  before insert or update on public.match_participants
  for each row execute function public.check_participant_refs();

-- ---------------------------------------------------------------------------
-- Funciones que usa la app
-- ---------------------------------------------------------------------------

-- Devuelve el tag con ese nombre (sin distinguir mayúsculas ni espacios) o lo crea.
create function public.tag_for(p_kind text, p_name text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_name text := regexp_replace(btrim(p_name), '\s+', ' ', 'g');
  v_id   uuid;
begin
  if v_name ~ '[@*]' then
    raise exception 'Los tags no pueden llevar @ ni *: esos símbolos quedan reservados para las cuentas';
  end if;
  if v_name = '' then
    raise exception 'El nombre del tag está vacío';
  end if;

  select id into v_id
  from public.tags
  where owner_id = auth.uid() and kind = p_kind and name_key = lower(v_name);

  if v_id is null then
    insert into public.tags (kind, name) values (p_kind, v_name) returning id into v_id;
  end if;
  return v_id;
end;
$$;

-- Crea o edita una partida completa en una sola transacción.
create function public.save_match(
  p_match_id  uuid,
  p_game      text,
  p_mates     text[],
  p_rivals    text[],
  p_played_on date,
  p_my_score  integer,
  p_their_score integer,
  p_winner    text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_game uuid;
  v_id   uuid;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'No hay sesión iniciada';
  end if;
  if coalesce(array_length(p_rivals, 1), 0) = 0 then
    raise exception 'Falta al menos un rival';
  end if;

  v_game := public.tag_for('game', p_game);

  if p_match_id is null then
    insert into public.matches (game_tag_id, played_on, my_score, their_score, winner)
    values (v_game, p_played_on, p_my_score, p_their_score, p_winner)
    returning id into v_id;
  else
    update public.matches
    set game_tag_id = v_game, played_on = p_played_on, my_score = p_my_score,
        their_score = p_their_score, winner = p_winner, edited_at = now()
    where id = p_match_id and owner_id = auth.uid()
    returning id into v_id;
    if v_id is null then
      raise exception 'No se encontró la partida';
    end if;
    delete from public.match_participants where match_id = v_id;
  end if;

  foreach v_name in array coalesce(p_mates, '{}') loop
    insert into public.match_participants (match_id, side, tag_id)
    values (v_id, 'mine', public.tag_for('person', v_name))
    on conflict do nothing;
  end loop;
  foreach v_name in array p_rivals loop
    insert into public.match_participants (match_id, side, tag_id)
    values (v_id, 'theirs', public.tag_for('person', v_name))
    on conflict do nothing;
  end loop;

  return v_id;
end;
$$;

-- Fusiona un tag en otro del mismo tipo: las partidas pasan al destino y el origen se elimina.
create function public.merge_tags(p_from uuid, p_to uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_kind text;
begin
  select kind into v_kind from public.tags where id = p_from and owner_id = auth.uid();
  if v_kind is null or not exists (
    select 1 from public.tags where id = p_to and owner_id = auth.uid() and kind = v_kind
  ) or p_from = p_to then
    raise exception 'Solo se pueden fusionar dos tags tuyos del mismo tipo';
  end if;

  if v_kind = 'game' then
    update public.matches set game_tag_id = p_to where game_tag_id = p_from;
  else
    -- Si la partida ya tenía al destino, se descarta la fila repetida.
    delete from public.match_participants p
    where p.tag_id = p_from
      and exists (select 1 from public.match_participants q where q.match_id = p.match_id and q.tag_id = p_to);
    update public.match_participants set tag_id = p_to where tag_id = p_from;
  end if;

  delete from public.tags where id = p_from;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seguridad: cada uno ve y modifica solo lo suyo
-- ---------------------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.tags               enable row level security;
alter table public.matches            enable row level security;
alter table public.match_participants enable row level security;
alter table public.tag_links          enable row level security;

create policy "perfil propio: leer"      on public.profiles for select using (id = auth.uid());
create policy "perfil propio: modificar" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "tags propios" on public.tags
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "partidas propias" on public.matches
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "participantes de partidas propias" on public.match_participants
  for all
  using (exists (select 1 from public.matches m where m.id = match_id and m.owner_id = auth.uid()))
  with check (exists (select 1 from public.matches m where m.id = match_id and m.owner_id = auth.uid()));

create policy "vínculos propios" on public.tag_links
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

revoke all on public.profiles, public.tags, public.matches, public.match_participants, public.tag_links from anon;
grant select, update (username) on public.profiles to authenticated;
grant select, insert, update, delete on public.tags, public.matches, public.match_participants, public.tag_links to authenticated;

revoke execute on function public.handle_new_user(), public.username_available(text), public.delete_account(),
  public.check_match_refs(), public.check_participant_refs(), public.tag_for(text, text),
  public.save_match(uuid, text, text[], text[], date, integer, integer, text),
  public.merge_tags(uuid, uuid) from public, anon;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.delete_account(), public.tag_for(text, text),
  public.save_match(uuid, text, text[], text[], date, integer, integer, text),
  public.merge_tags(uuid, uuid) to authenticated;
