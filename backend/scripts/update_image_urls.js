// Script to update image paths in DB by prefixing a public origin
// Usage:
// 1) Set env var PUBLIC_ORIGIN (e.g. https://midominio.com)
// 2) Optionally set APPLY_IMAGE_UPDATE=1 to perform changes (otherwise it only previews)
// 3) Run: node scripts/update_image_urls.js

const pool = require('../src/db');

async function previewAndApply() {
    const publicOrigin = process.env.PUBLIC_ORIGIN;
    if (!publicOrigin) {
        console.error('ERROR: debes definir PUBLIC_ORIGIN, por ejemplo: https://midominio.com');
        process.exit(1);
    }

    try {
        // Preview affected rows
        const [prodRows] = await pool.query("SELECT id_producto, imagen FROM productos WHERE imagen IS NOT NULL AND (imagen LIKE '/uploads/%' OR imagen LIKE 'uploads/%')");
        const [imgRows] = await pool.query("SELECT id_imagen, id_producto, ruta FROM imagenes_producto WHERE ruta IS NOT NULL AND (ruta LIKE '/uploads/%' OR ruta LIKE 'uploads/%')");

        console.log(`Productos afectados: ${prodRows.length}`);
        console.log(`Imagenes_producto afectadas: ${imgRows.length}`);

        if (prodRows.length > 0) {
            console.log('Ejemplo producto previo -> despues:');
            console.log(prodRows.slice(0,5).map(r => `${r.id_producto}: ${r.imagen} -> ${publicOrigin}${r.imagen.startsWith('/') ? r.imagen : '/' + r.imagen}`).join('\n'));
        }

        if (imgRows.length > 0) {
            console.log('Ejemplo imagen_producto previo -> despues:');
            console.log(imgRows.slice(0,5).map(r => `${r.id_imagen}: ${r.ruta} -> ${publicOrigin}${r.ruta.startsWith('/') ? r.ruta : '/' + r.ruta}`).join('\n'));
        }

        if (process.env.APPLY_IMAGE_UPDATE === '1') {
            console.log('\nAplicando cambios...');
            // Update productos.imagen
            await pool.query(
                `UPDATE productos SET imagen = CONCAT(?, imagen) WHERE imagen IS NOT NULL AND (imagen LIKE '/uploads/%' OR imagen LIKE 'uploads/%')`,
                [publicOrigin]
            );

            // Update imagenes_producto.ruta
            await pool.query(
                `UPDATE imagenes_producto SET ruta = CONCAT(?, ruta) WHERE ruta IS NOT NULL AND (ruta LIKE '/uploads/%' OR ruta LIKE 'uploads/%')`,
                [publicOrigin]
            );

            console.log('Actualización completada. Recomendado validar en la app en producción.');
        } else {
            console.log('\nModo preview. Para aplicar los cambios exporta APPLY_IMAGE_UPDATE=1 y vuelve a ejecutar el script.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error ejecutando script:', err);
        process.exit(1);
    }
}

previewAndApply();
