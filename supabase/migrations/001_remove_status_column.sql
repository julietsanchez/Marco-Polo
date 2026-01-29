-- Migración: quitar columna status de items (opcional si ya tenías la tabla con status)
-- Ejecutar SOLO si tu BD ya tiene la tabla items con la columna status.
-- Si creaste la BD desde cero con el schema actual, no hace falta ejecutar esto.

-- 1) Migrar estado a active para receivable/payable (para no perder "pendiente vs hecho")
UPDATE items
SET active = (status IS DISTINCT FROM 'done')
WHERE kind IN ('recurring', 'receivable', 'payable');

-- 2) Quitar columna e índice
DROP INDEX IF EXISTS idx_items_status;
ALTER TABLE items DROP COLUMN IF EXISTS status;
