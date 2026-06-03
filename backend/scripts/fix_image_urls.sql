-- ============================================================
-- SCRIPT SQL PARA RENDER: Prefija URLs de imagenes
-- ============================================================
-- Instrucciones:
-- 1. Abre tu BD en Render -> pestaña "Data" o "SQL Console"
-- 2. Ejecuta primero el BACKUP (opcional pero recomendado)
-- 3. Luego ejecuta los UPDATE statements
-- 4. Finalmente ejecuta VERIFICACION para confirmar
-- ============================================================

-- ============================================================
-- PASO 1: BACKUP (ejecuta primero - solo por si acaso)
-- ============================================================
CREATE TABLE IF NOT EXISTS backup_productos_imagen AS 
SELECT id_producto, imagen FROM productos;

CREATE TABLE IF NOT EXISTS backup_imagenes_producto AS 
SELECT id_imagen, id_producto, ruta FROM imagenes_producto;

-- ============================================================
-- PASO 2: ACTUALIZAR productos.imagen
-- Añade el origin (https://proyectobasededatos-2kqt.onrender.com)
-- a todas las rutas que empiezan con /uploads/
-- ============================================================
UPDATE productos
SET imagen = CONCAT('https://proyectobasededatos-2kqt.onrender.com', imagen)
WHERE imagen IS NOT NULL 
  AND (imagen LIKE '/uploads/%' OR imagen LIKE 'uploads/%')
  AND imagen NOT LIKE 'http%';

-- ============================================================
-- PASO 3: ACTUALIZAR imagenes_producto.ruta
-- Añade el origin a todas las rutas que empiezan con /uploads/
-- ============================================================
UPDATE imagenes_producto
SET ruta = CONCAT('https://proyectobasededatos-2kqt.onrender.com', ruta)
WHERE ruta IS NOT NULL 
  AND (ruta LIKE '/uploads/%' OR ruta LIKE 'uploads/%')
  AND ruta NOT LIKE 'http%';

-- ============================================================
-- PASO 4: VERIFICACION (ejecuta esto para confirmar que funciono)
-- Deberia mostrar:
-- - uploads_images: 0 (todas las rutas con /uploads/ ya tienen origin)
-- - http_images: >= 3 (todas las imagenes ahora tienen https://...)
-- ============================================================
SELECT 
  'Productos: rutas con /uploads/' AS tipo,
  COUNT(*) as uploads_images 
FROM productos 
WHERE imagen IS NOT NULL AND (imagen LIKE '/uploads/%' OR imagen LIKE 'uploads/%');

SELECT 
  'Productos: rutas con http' AS tipo,
  COUNT(*) as http_images 
FROM productos 
WHERE imagen IS NOT NULL AND (imagen LIKE 'https://%' OR imagen LIKE 'http://%');

SELECT 
  'imagenes_producto: rutas con /uploads/' AS tipo,
  COUNT(*) as uploads_images 
FROM imagenes_producto 
WHERE ruta IS NOT NULL AND (ruta LIKE '/uploads/%' OR ruta LIKE 'uploads/%');

SELECT 
  'imagenes_producto: rutas con http' AS tipo,
  COUNT(*) as http_images 
FROM imagenes_producto 
WHERE ruta IS NOT NULL AND (ruta LIKE 'https://%' OR ruta LIKE 'http://%');

-- ============================================================
-- ROLLBACK (si algo sale mal, ejecuta esto para restaurar)
-- ============================================================
-- UPDATE productos p 
-- JOIN backup_productos_imagen b ON p.id_producto = b.id_producto
-- SET p.imagen = b.imagen;

-- DELETE FROM imagenes_producto 
-- WHERE id_imagen NOT IN (SELECT id_imagen FROM backup_imagenes_producto);
-- 
-- UPDATE imagenes_producto ip
-- JOIN backup_imagenes_producto bip ON ip.id_imagen = bip.id_imagen
-- SET ip.ruta = bip.ruta;
