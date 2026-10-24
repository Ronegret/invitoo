-- Invitoo · plantillas permitidas en `invitaciones.plantilla`
-- La restricción anterior no conocía «carta» ni las 19 temáticas. Debe
-- coincidir con `PlantillaGuardada` en app/src/lib/tipos.ts.
-- Idempotente.
alter table public.invitaciones drop constraint if exists invitaciones_plantilla_check;
alter table public.invitaciones add constraint invitaciones_plantilla_check
  check (plantilla in (
    -- de la casa
    'carta','sobre','floracion','mar','velo','constelacion','tinta','registro','azulejo',
    -- temáticas
    'regencia','aire','cuento','blason','memorias','pasaporte','orilla',
    'pinar','orbita','brazada',
    'festival','vinilo','neon','fuego','bachata',
    'lupulo','estadio','meta','riviera',
    -- ids antiguos: siguen resolviendo por alias
    'cielo','marea','bruma','lino','jardin','terracota','brasa'));
