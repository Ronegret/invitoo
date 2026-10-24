-- ============================================================================
-- Invitoo — migración «mejora» (octubre 2026)
-- ----------------------------------------------------------------------------
-- Idempotente: se puede lanzar las veces que haga falta. Se aplica DESPUÉS de
-- schema.sql en bases que ya existían (schema.sql ya incluye todo esto para
-- instalaciones nuevas).
--
--   node herramientas/db.mjs migrar
--
-- Qué cambia:
--   1. invitados: `cupo` (plazas totales, el invitado incluido), `telefono` y
--      `trato` (querida/querido/queridos, para el saludo de la apertura).
--      El token del enlace personal pasa a 16 caracteres para los nuevos.
--   2. rsvp: una respuesta por invitado (o por nombre) con upsert, y el
--      detalle POR PERSONA en `personas` (menú, alérgenos, alergias).
--      `bus` pasa de boolean a no|ida|vuelta|ida_vuelta, más `parada`.
--      Se eliminan los duplicados que dejaba el insert antiguo.
--   3. muro: `aprobado` sigue existiendo; la pareja oculta/enseña desde el panel.
--   4. invitaciones: la restricción de plantillas admite el catálogo nuevo
--      (y los ids antiguos, que siguen resolviendo por alias).
-- ============================================================================

begin;

-- ──────────────────────────────────────────────────────────────── invitados
alter table public.invitados add column if not exists cupo int;
alter table public.invitados add column if not exists telefono text;
alter table public.invitados add column if not exists trato text;
alter table public.invitados drop constraint if exists invitados_trato_check;
alter table public.invitados add constraint invitados_trato_check
  check (trato in ('querida', 'querido', 'queridos'));

-- `acompanantes_max` era «además de él»; `cupo` cuenta al invitado.
update public.invitados set cupo = coalesce(acompanantes_max, 0) + 1 where cupo is null;
alter table public.invitados alter column cupo set default 1;
alter table public.invitados alter column cupo set not null;
alter table public.invitados drop constraint if exists invitados_cupo_check;
alter table public.invitados add constraint invitados_cupo_check check (cupo between 1 and 12);

alter table public.invitados alter column token set default encode(gen_random_bytes(8), 'hex');
update public.invitados set token = encode(gen_random_bytes(8), 'hex') where token is null;
alter table public.invitados alter column token set not null;

create index if not exists invitados_grupo_idx on public.invitados (invitacion_id, grupo);

-- ─────────────────────────────────────────────────────────────────────  rsvp
alter table public.rsvp add column if not exists clave text;
alter table public.rsvp add column if not exists personas jsonb not null default '[]'::jsonb;
alter table public.rsvp add column if not exists parada text;
alter table public.rsvp add column if not exists mensaje text;
alter table public.rsvp add column if not exists telefono text;
alter table public.rsvp add column if not exists actualizado_en timestamptz not null default now();

-- bus: boolean → texto. Solo si todavía es boolean (idempotente).
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'rsvp'
       and column_name = 'bus' and data_type = 'boolean'
  ) then
    alter table public.rsvp alter column bus drop default;
    alter table public.rsvp alter column bus type text
      using case when bus then 'ida_vuelta' else 'no' end;
  end if;
end $$;
alter table public.rsvp alter column bus set default 'no';
alter table public.rsvp drop constraint if exists rsvp_bus_check;
alter table public.rsvp add constraint rsvp_bus_check
  check (bus in ('no', 'ida', 'vuelta', 'ida_vuelta'));

-- Hasta 12 plazas por enlace (antes eran 8 acompañantes como mucho).
alter table public.rsvp drop constraint if exists rsvp_acompanantes_check;
alter table public.rsvp add constraint rsvp_acompanantes_check
  check (acompanantes between 0 and 19);

-- La clave de deduplicación. Misma normalización que `normalizarNombre`
-- (src/lib/rsvp.ts): minúsculas, sin tildes, espacios colapsados.
update public.rsvp
   set clave = case
     when invitado_id is not null then 'invitado:' || invitado_id::text
     else 'nombre:' || btrim(regexp_replace(
            translate(lower(nombre),
                      'áàäâãéèëêíìïîóòöôõúùüûñçý',
                      'aaaaaeeeeiiiiooooouuuuncy'),
            '\s+', ' ', 'g'))
   end
 where clave is null;

-- Las respuestas antiguas, a formato por persona: quien respondió + sus
-- acompañantes sin nombre, con el menú y las alergias que dejó.
update public.rsvp
   set personas = (
     select jsonb_agg(p)
       from (
         select jsonb_build_object(
                  'nombre', nombre,
                  'menu', 'adulto',
                  'alergenos', '[]'::jsonb,
                  'alergias_texto', alergias) as p
         union all
         select jsonb_build_object(
                  'nombre', 'Acompañante ' || g || ' de ' || nombre,
                  'menu', 'adulto',
                  'alergenos', '[]'::jsonb,
                  'alergias_texto', null)
           from generate_series(1, case when asiste then acompanantes else 0 end) g
       ) t
   )
 where personas = '[]'::jsonb;

-- Duplicados: se queda la respuesta más reciente de cada (invitación, clave).
delete from public.rsvp r
 using public.rsvp otra
 where r.invitacion_id = otra.invitacion_id
   and r.clave = otra.clave
   and (r.creado_en, r.id) < (otra.creado_en, otra.id);

update public.rsvp set actualizado_en = creado_en where actualizado_en < creado_en;
alter table public.rsvp alter column clave set not null;

alter table public.rsvp drop constraint if exists rsvp_invitacion_clave_key;
alter table public.rsvp add constraint rsvp_invitacion_clave_key unique (invitacion_id, clave);

drop index if exists public.rsvp_invitacion_idx;
create index if not exists rsvp_invitacion_idx on public.rsvp (invitacion_id, actualizado_en desc);

drop trigger if exists rsvp_tocar on public.rsvp;
create trigger rsvp_tocar
  before update on public.rsvp
  for each row execute function public.tocar_actualizado();

-- ─────────────────────────────────────────────────────────────────────  muro
-- `aprobado` ya existía (default true): se publica y la pareja oculta lo que
-- no quiera. Se asegura por si la tabla es anterior.
alter table public.muro add column if not exists aprobado boolean not null default true;

-- ─────────────────────────────────────────────────────────────  invitaciones
alter table public.invitaciones drop constraint if exists invitaciones_plantilla_check;
alter table public.invitaciones add constraint invitaciones_plantilla_check
  check (plantilla in (
    -- catálogo actual
    'sobre','floracion','mar','velo','constelacion','tinta','registro','azulejo',
    -- ids antiguos: siguen resolviendo por alias
    'cielo','marea','bruma','lino','jardin','terracota','brasa'
  ));

commit;
