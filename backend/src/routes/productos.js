const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Crear carpeta de uploads si no existe (necesario en algunos entornos como Render)
const uploadsDir = path.join(__dirname, '../../../frontend/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../frontend/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// =========================
// OBTENER PRODUCTOS
// =========================
router.get("/", async (req, res) => {

    const { search, tipo } = req.query;

    try {

        let sql = `
            SELECT
                productos.*,
                usuarios.nombre,
                IFNULL(AVG(r.rating), 0) as avg_rating,
                COUNT(r.id_rating) as rating_count
            FROM productos
            JOIN usuarios
            ON productos.id_usuario = usuarios.id_usuario
            LEFT JOIN ratings r ON r.id_producto = productos.id_producto
        `;

        const params = [];
        const conditions = [];

        if (search) {
            conditions.push(` (
                productos.nombre_producto LIKE ? OR
                productos.marca LIKE ? OR
                productos.modelo LIKE ? OR
                usuarios.nombre LIKE ?
            )`);

            const like = `%${search}%`;
            params.push(like, like, like, like);
        }

        if (tipo) {
            conditions.push(" productos.tipo_producto = ?");
            params.push(tipo);
        }

        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }

        // soporte de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        // contar total con misma condición (sin LIMIT)
        let countSql = `SELECT COUNT(*) as total FROM productos JOIN usuarios ON productos.id_usuario = usuarios.id_usuario`;
        const countParams = params.slice();

        if (conditions.length > 0) {
            countSql += " WHERE " + conditions.join(" AND ");
        }

        const [countRows] = await pool.query(countSql, countParams);
        const total = countRows && countRows[0] ? countRows[0].total : 0;

        // agrupar para que AVG/COUNT funcionen
        sql += ` GROUP BY productos.id_producto`;

        // añadir paginación a la consulta principal
        const paramsForRows = params.slice();
        sql += ` LIMIT ? OFFSET ?`;
        paramsForRows.push(limit, offset);

        const [rows] = await pool.query(sql, paramsForRows);

        const productIds = rows.map(r => r.id_producto);
        if (productIds.length > 0) {
            const [imagesRows] = await pool.query(
                `SELECT id_producto, ruta FROM imagenes_producto WHERE id_producto IN (?)`,
                [productIds]
            );

            const imagenesMap = imagesRows.reduce((acc, image) => {
                if (!acc[image.id_producto]) acc[image.id_producto] = [];
                acc[image.id_producto].push(image.ruta);
                return acc;
            }, {});

            rows.forEach(row => {
                row.imagenes = imagenesMap[row.id_producto] || [];
                if (!row.imagen && row.imagenes.length > 0) {
                    row.imagen = row.imagenes[0];
                }
            });
        } else {
            rows.forEach(row => {
                row.imagenes = [];
            });
        }

        res.json({ rows, total });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });
    }
});

// =========================
// MIS PRODUCTOS
// =========================
router.get("/mis-productos/:id_usuario", async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await pool.query(
            `
            SELECT
                productos.*,
                usuarios.nombre,
                IFNULL(AVG(r.rating), 0) as avg_rating,
                COUNT(r.id_rating) as rating_count
            FROM productos
            JOIN usuarios ON productos.id_usuario = usuarios.id_usuario
            LEFT JOIN ratings r ON r.id_producto = productos.id_producto
            WHERE productos.id_usuario = ?
            GROUP BY productos.id_producto
            ORDER BY productos.id_producto DESC
            `,
            [id_usuario]
        );

        const productIds = rows.map(r => r.id_producto);
        if (productIds.length > 0) {
            const [imagesRows] = await pool.query(
                `SELECT id_producto, ruta FROM imagenes_producto WHERE id_producto IN (?)`,
                [productIds]
            );

            const imagenesMap = imagesRows.reduce((acc, image) => {
                if (!acc[image.id_producto]) acc[image.id_producto] = [];
                acc[image.id_producto].push(image.ruta);
                return acc;
            }, {});

            rows.forEach(row => {
                row.imagenes = imagenesMap[row.id_producto] || [];
                if (!row.imagen && row.imagenes.length > 0) {
                    row.imagen = row.imagenes[0];
                }
            });
        } else {
            rows.forEach(row => {
                row.imagenes = [];
            });
        }

        res.json({ rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error obteniendo tus productos' });
    }
});

// =========================
// MIS COMPRAS
// =========================
router.get("/mis-compras/:id_usuario", async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await pool.query(
            `
            SELECT
                v.id_venta,
                v.fecha,
                d.id_producto,
                p.nombre_producto,
                p.marca,
                p.modelo,
                p.imagen,
                d.cantidad,
                d.precio_unitario,
                prodUser.nombre AS vendedor_nombre,
                prodUser.apellido AS vendedor_apellido
            FROM ventas v
            JOIN detalles d ON d.id_venta = v.id_venta
            JOIN productos p ON d.id_producto = p.id_producto
            JOIN usuarios prodUser ON p.id_usuario = prodUser.id_usuario
            WHERE v.id_cliente = ?
            ORDER BY v.fecha DESC, v.id_venta DESC
            `,
            [id_usuario]
        );

        res.json({ rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error obteniendo tus compras' });
    }
});

// =========================
// MIS VENTAS
// =========================
router.get("/mis-ventas/:id_usuario", async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await pool.query(
            `
            SELECT
                v.id_venta,
                v.fecha,
                d.id_producto,
                p.nombre_producto,
                p.marca,
                p.modelo,
                p.imagen,
                d.cantidad,
                d.precio_unitario,
                buyer.nombre AS cliente_nombre,
                buyer.apellido AS cliente_apellido
            FROM ventas v
            JOIN detalles d ON d.id_venta = v.id_venta
            JOIN productos p ON d.id_producto = p.id_producto
            JOIN usuarios buyer ON v.id_cliente = buyer.id_usuario
            WHERE p.id_usuario = ?
            ORDER BY v.fecha DESC, v.id_venta DESC
            `,
            [id_usuario]
        );

        res.json({ rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error obteniendo tus ventas' });
    }
});


// =========================
// CREAR PRODUCTO
// =========================
router.post("/", upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'imagenes', maxCount: 8 }]), async (req, res) => {

    const {
        id_usuario,
        nombre_producto,
        marca,
        modelo,
        precio,
        stock,
        descripcion,
        condicion,
        color,
        almacenamiento,
        categoria,
        shipping_cost,
        allow_backorder,
        tipo_producto,
        tipo_accesorio,
        parent_device_name
    } = req.body;

    const parsedIdUsuario = parseInt(id_usuario, 10);
    const precioValue = parseFloat(precio);
    const stockValue = parseInt(stock, 10);
    const shippingCostValue = shipping_cost ? parseFloat(shipping_cost) : 0;
    const allowBackorderValue = allow_backorder === '1' || allow_backorder === 'true' || allow_backorder === 1 || allow_backorder === true ? 1 : 0;

    if (!parsedIdUsuario || !nombre_producto || !marca || !modelo || Number.isNaN(precioValue) || Number.isNaN(stockValue)) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios o valores inválidos' });
    }

    const mainImageFile = req.files?.imagen?.[0] || null;
    const extraFiles = req.files?.imagenes || [];
    const imagen = mainImageFile
        ? '/uploads/' + mainImageFile.filename
        : extraFiles.length > 0
            ? '/uploads/' + extraFiles[0].filename
            : null;

    try {
        const [result] = await pool.query(
            `
            INSERT INTO productos
            (
                id_usuario,
                nombre_producto,
                marca,
                modelo,
                precio,
                stock,
                descripcion,
                condicion,
                color,
                almacenamiento,
                categoria,
                shipping_cost,
                allow_backorder,
                imagen,
                tipo_producto,
                tipo_accesorio,
                parent_device_name
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                parsedIdUsuario,
                nombre_producto,
                marca,
                modelo,
                precioValue,
                stockValue,
                descripcion || null,
                condicion || null,
                color || null,
                almacenamiento || null,
                categoria || null,
                shippingCostValue,
                allowBackorderValue,
                imagen,
                tipo_producto || 'celular',
                tipo_accesorio || null,
                parent_device_name || null
            ]
        );

        const id_producto = result.insertId;
        const imageRows = [];

        if (mainImageFile) {
            imageRows.push([id_producto, '/uploads/' + mainImageFile.filename]);
        }

        extraFiles.forEach(file => {
            imageRows.push([id_producto, '/uploads/' + file.filename]);
        });

        if (imageRows.length > 0) {
            await pool.query(
                `INSERT INTO imagenes_producto (id_producto, ruta) VALUES ?`,
                [imageRows]
            );
        }

        res.json({
            message: "Producto agregado"
        });

    } catch (error) {

        console.error("Error creando producto:", error);
        console.error("Request body:", req.body);
        console.error("Request files:", req.files);

        res.status(500).json({
            success: false,
            message: error.message || 'Error interno al crear el producto'
        });
    }
});

// =========================
// DETALLE DE PRODUCTO
// =========================
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `
            SELECT
                productos.*,
                u.nombre AS vendedor_nombre,
                u.apellido AS vendedor_apellido,
                u.correo AS vendedor_correo
            FROM productos
            JOIN usuarios u ON productos.id_usuario = u.id_usuario
            WHERE productos.id_producto = ?
            `,
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }

        const product = rows[0];
        const [imagesRows] = await pool.query(
            `SELECT ruta FROM imagenes_producto WHERE id_producto = ?`,
            [id]
        );

        product.imagenes = imagesRows.map(image => image.ruta);
        if (!product.imagen && product.imagenes.length > 0) {
            product.imagen = product.imagenes[0];
        }

        // Registrar una visita a este producto
        try {
            let source = 'organic';
            if (req.query.source === 'publicidad' || (req.get('referer') && req.get('referer').includes('/publicidad'))) {
                source = 'publicidad';
            }
            const ip = req.ip || req.headers['x-forwarded-for'] || null;
            await pool.query(
                `INSERT INTO visitas_producto (id_producto, fuente, ip) VALUES (?, ?, ?)`,
                [id, source, ip]
            );
        } catch (err) {
            console.error('Error registrando visita:', err.message || err);
        }

        res.json({ product });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error obteniendo producto" });
    }
});


// =========================
// ACTUALIZAR PRODUCTO
// =========================
router.put("/:id", async (req, res) => {

    const { id } = req.params;

    const {
        nombre_producto,
        marca,
        modelo,
        precio,
        stock,
        descripcion,
        condicion,
        color,
        almacenamiento,
        categoria,
        shipping_cost,
        allow_backorder
    } = req.body;

    try {

        await pool.query(
            `
            UPDATE productos
            SET
                nombre_producto=?,
                marca=?,
                modelo=?,
                precio=?,
                stock=?,
                descripcion=?,
                condicion=?,
                color=?,
                almacenamiento=?,
                categoria=?,
                shipping_cost=?,
                allow_backorder=?
            WHERE id_producto=?
            `,
            [
                nombre_producto,
                marca,
                modelo,
                precio,
                stock,
                descripcion || null,
                condicion || null,
                color || null,
                almacenamiento || null,
                categoria || null,
                shipping_cost || 0,
                allow_backorder ? 1 : 0,
                id
            ]
        );

        res.json({
            message: "Producto actualizado"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });
    }
});


// =========================
// ELIMINAR PRODUCTO
// =========================
router.delete("/:id", async (req, res) => {

    const { id } = req.params;

    try {

        await pool.query(
            "DELETE FROM productos WHERE id_producto= ?",
            [id]
        );

        res.json({
            message: "Producto eliminado"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });
    }
});


// =========================
// CALIFICACIONES
// =========================

// Obtener calificaciones de un producto
router.get("/:id/ratings", async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT r.*, u.nombre FROM ratings r JOIN usuarios u ON r.id_usuario = u.id_usuario WHERE r.id_producto = ? ORDER BY r.created_at DESC`,
            [id]
        );

        const [agg] = await pool.query(
            `SELECT IFNULL(AVG(rating),0) as avg_rating, COUNT(*) as count FROM ratings WHERE id_producto = ?`,
            [id]
        );

        res.json({ ratings: rows, avg: agg[0].avg_rating, count: agg[0].count });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error obteniendo calificaciones' });
    }
});

// Agregar o actualizar calificación
router.post("/:id/ratings", async (req, res) => {
    const { id } = req.params;
    const { id_usuario, rating, comentario } = req.body;

    if (!id_usuario || !rating) {
        return res.status(400).json({ success: false, message: 'Faltan datos' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating debe estar entre 1 y 5' });
    }

    try {
        // intentar update, si no existe hacer insert
        const [existing] = await pool.query(
            `SELECT id_rating FROM ratings WHERE id_producto = ? AND id_usuario = ?`,
            [id, id_usuario]
        );

        if (existing.length > 0) {
            await pool.query(
                `UPDATE ratings SET rating = ?, comentario = ?, created_at = NOW() WHERE id_rating = ?`,
                [rating, comentario || null, existing[0].id_rating]
            );
        } else {
            await pool.query(
                `INSERT INTO ratings (id_producto, id_usuario, rating, comentario) VALUES (?, ?, ?, ?)`,
                [id, id_usuario, rating, comentario || null]
            );
        }

        res.json({ success: true, message: 'Calificación registrada' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error guardando calificación' });
    }
});


// =========================
// ESTADÍSTICAS DEL VENDEDOR
// =========================
router.get('/estadisticas/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await pool.query(
            `
            SELECT
                p.id_producto,
                p.nombre_producto,
                p.marca,
                p.modelo,
                COALESCE(v.total_views, 0) AS total_views,
                COALESCE(v.ad_views, 0) AS views_publicidad,
                COALESCE(s.total_sold, 0) AS total_sold
            FROM productos p
            LEFT JOIN (
                SELECT id_producto, COUNT(*) AS total_views, SUM(CASE WHEN fuente = 'publicidad' THEN 1 ELSE 0 END) AS ad_views
                FROM visitas_producto
                GROUP BY id_producto
            ) v ON p.id_producto = v.id_producto
            LEFT JOIN (
                SELECT id_producto, SUM(cantidad) AS total_sold
                FROM detalles
                GROUP BY id_producto
            ) s ON p.id_producto = s.id_producto
            WHERE p.id_usuario = ?
            ORDER BY p.id_producto DESC
            `,
            [id_usuario]
        );

        res.json({ rows });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
    }
});

// =========================
// DEBUG: estado de las URLs de imagen
// =========================
router.get('/debug/image-status', async (req, res) => {
    try {
        const publicOrigin = process.env.PUBLIC_ORIGIN || (req.protocol + '://' + req.get('host'));

        const [[{ total_products }]] = await pool.query(`SELECT COUNT(*) AS total_products FROM productos`);

        const [[{ http_images }]] = await pool.query(`SELECT COUNT(*) AS http_images FROM productos WHERE imagen LIKE 'http%'`);
        const [[{ uploads_images }]] = await pool.query(`SELECT COUNT(*) AS uploads_images FROM productos WHERE imagen IS NOT NULL AND (imagen LIKE '/uploads/%' OR imagen LIKE 'uploads/%')`);
        const [[{ null_images }]] = await pool.query(`SELECT COUNT(*) AS null_images FROM productos WHERE imagen IS NULL`);

        const [[{ total_imgs_table }]] = await pool.query(`SELECT COUNT(*) AS total_imgs_table FROM imagenes_producto`);
        const [[{ http_imgs_table }]] = await pool.query(`SELECT COUNT(*) AS http_imgs_table FROM imagenes_producto WHERE ruta LIKE 'http%'`);
        const [[{ uploads_imgs_table }]] = await pool.query(`SELECT COUNT(*) AS uploads_imgs_table FROM imagenes_producto WHERE ruta IS NOT NULL AND (ruta LIKE '/uploads/%' OR ruta LIKE 'uploads/%')`);

        const [sampleProducts] = await pool.query(`SELECT id_producto, imagen FROM productos WHERE imagen IS NOT NULL LIMIT 20`);
        const [sampleImages] = await pool.query(`SELECT id_imagen, id_producto, ruta FROM imagenes_producto WHERE ruta IS NOT NULL LIMIT 50`);

        const normalize = (src) => {
            if (!src) return null;
            if (/^https?:\/\//i.test(src)) return src;
            if (src.startsWith('/')) return publicOrigin + src;
            return publicOrigin + '/' + src;
        };

        const sampleProductsNorm = sampleProducts.map(r => ({ id_producto: r.id_producto, raw: r.imagen, normalized: normalize(r.imagen) }));
        const sampleImagesNorm = sampleImages.map(r => ({ id_imagen: r.id_imagen, id_producto: r.id_producto, raw: r.ruta, normalized: normalize(r.ruta) }));

        res.json({
            publicOrigin,
            totals: {
                total_products,
                http_images,
                uploads_images,
                null_images,
                total_imgs_table,
                http_imgs_table,
                uploads_imgs_table
            },
            samples: {
                productos: sampleProductsNorm,
                imagenes_producto: sampleImagesNorm
            }
        });
    } catch (err) {
        console.error('Error debug image-status:', err);
        res.status(500).json({ success: false, message: err.message || 'error' });
    }
});

// =========================
// DEBUG: listar archivos en /uploads
// =========================
router.get('/debug/uploads-files', async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../../../frontend/uploads');
        let files = [];
        let exists = false;

        if (fs.existsSync(uploadsDir)) {
            exists = true;
            files = fs.readdirSync(uploadsDir);
        }

        res.json({
            uploadsDir,
            exists,
            files,
            count: files.length
        });
    } catch (err) {
        console.error('Error debug uploads-files:', err);
        res.status(500).json({ success: false, message: err.message || 'error' });
    }
});

module.exports = router;