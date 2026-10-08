\o /dev/null
-- Pruebas de reglas y privacidad. Cualquier assert que falle corta la ejecución con error.
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''

-- Registro: el trigger crea el perfil con el username de los metadatos.
insert into auth.users (id, email, raw_user_meta_data) values
  (:A, 'a@ejemplo.com', '{"username":"Nico"}'),
  (:B, 'b@ejemplo.com', '{"username":"juanp"}');

do $$ begin
  assert (select count(*) from public.profiles) = 2, 'se crean los perfiles';
  begin
    insert into auth.users (email, raw_user_meta_data) values ('c@ejemplo.com', '{"username":"nico"}');
    raise exception 'debía fallar';
  exception when unique_violation then null; end;
  begin
    insert into auth.users (email, raw_user_meta_data) values ('d@ejemplo.com', '{"username":"@malo"}');
    raise exception 'debía fallar';
  exception when check_violation then null; end;
end $$;

set role anon;
do $$ begin
  assert public.username_available('NICO') = false, 'username ocupado sin distinguir mayúsculas';
  assert public.username_available('libre_1') = true, 'username libre';
  assert public.username_available('ju') = false, 'username demasiado corto';
  assert public.username_available('juan*') = false, 'username con símbolo reservado';
  begin
    perform count(*) from public.profiles;
    raise exception 'anon no debía poder leer perfiles';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Usuario A carga partidas.
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);

do $$
declare m1 uuid; m2 uuid; t1 uuid; t2 uuid;
begin
  m1 := public.save_match(null, 'Truco', '{Caro}', '{Juan,Tincho}', current_date, 15, 11, 'mine');
  m2 := public.save_match(null, '  TRUCO ', '{}', '{juan}', current_date, null, null, 'theirs');
  assert (select count(*) from public.tags where kind = 'game') = 1, 'Truco y TRUCO son el mismo tag';
  assert (select count(*) from public.tags where kind = 'person') = 3, 'Juan y juan son el mismo tag';
  assert (select count(*) from public.match_participants where match_id = m1) = 3, 'tres participantes';

  begin
    perform public.save_match(null, 'Ajedrez', '{}', '{@juanp}', current_date, null, null, 'mine');
    raise exception 'debía fallar';
  exception when raise_exception then
    if sqlerrm not like 'Los tags no pueden llevar @%' then raise; end if;
  end;
  begin
    perform public.save_match(null, 'Ajedrez', '{}', '{}', current_date, null, null, 'mine');
    raise exception 'debía fallar';
  exception when raise_exception then
    if sqlerrm <> 'Falta al menos un rival' then raise; end if;
  end;
  begin
    perform public.save_match(null, 'Ajedrez', '{}', '{Juan}', current_date, 3, null, 'mine');
    raise exception 'debía fallar';
  exception when check_violation then null; end;

  -- Edición
  perform public.save_match(m2, 'Truco gallo', '{}', '{Juan}', current_date, 9, 15, 'theirs');
  assert (select edited_at is not null from public.matches where id = m2), 'queda marcada como editada';
  assert (select t.name from public.matches m join public.tags t on t.id = m.game_tag_id where m.id = m2) = 'Truco gallo', 'cambia el juego';

  -- Un tag con partidas no se puede borrar.
  select id into t1 from public.tags where name = 'Tincho';
  begin
    delete from public.tags where id = t1;
    raise exception 'debía fallar';
  exception when foreign_key_violation then null; end;

  -- Fusionar: Tincho pasa a Juan; en m1 Juan ya estaba, así que queda una sola fila.
  select id into t2 from public.tags where name = 'Juan';
  perform public.merge_tags(t1, t2);
  assert not exists (select 1 from public.tags where id = t1), 'el origen se elimina';
  assert (select count(*) from public.match_participants where match_id = m1) = 2, 'sin participantes repetidos';
end $$;

-- Usuario B no ve ni toca nada de A.
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
do $$
declare v_match uuid; v_tag uuid; n int;
begin
  assert (select count(*) from public.matches) = 0, 'B no ve partidas de A';
  assert (select count(*) from public.tags) = 0, 'B no ve tags de A';
  assert (select count(*) from public.match_participants) = 0, 'B no ve participantes de A';
  assert (select count(*) from public.profiles) = 1, 'B solo ve su perfil';

  reset role;
  select id into v_match from public.matches limit 1;
  select id into v_tag from public.tags where kind = 'game' limit 1;
  set role authenticated;

  update public.matches set winner = 'draw' where id = v_match;
  get diagnostics n = row_count;
  assert n = 0, 'B no puede editar partidas de A';

  begin
    perform public.save_match(v_match, 'Truco', '{}', '{X}', current_date, null, null, 'mine');
    raise exception 'debía fallar';
  exception when raise_exception then
    if sqlerrm <> 'No se encontró la partida' then raise; end if;
  end;
  begin
    insert into public.match_participants (match_id, side, tag_id) values (v_match, 'theirs', null);
    raise exception 'debía fallar';
  exception when insufficient_privilege or check_violation then null; end;
  begin
    -- B no puede usar un tag de A como juego de su propia partida.
    insert into public.matches (game_tag_id, played_on, winner) values (v_tag, current_date, 'mine');
    raise exception 'debía fallar';
  exception when raise_exception then
    if sqlerrm <> 'El juego no es un tag de juego tuyo' then raise; end if;
  end;
  begin
    update public.profiles set username = 'Nico2' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
    get diagnostics n = row_count;
    assert n = 0, 'B no puede cambiar el username de A';
  end;
end $$;

-- A elimina su cuenta: se borran todos sus datos.
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select public.delete_account();
reset role;
do $$ begin
  assert (select count(*) from public.matches) = 0, 'se borran las partidas';
  assert (select count(*) from public.tags) = 0, 'se borran los tags';
  assert (select count(*) from public.profiles) = 1, 'queda solo el perfil de B';
end $$;
