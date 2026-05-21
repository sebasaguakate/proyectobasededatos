const express = require("express");
const router = express.Router();
const pool = require("../db");

function parseNumber(value) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function validatePublicityPayload(body) {
    const errors = {};
    const { id_producto, id_usuario, precio_pago, dias } = body;

    const parsedProduct = parseNumber(id_producto);
    const parsedUser = parseNumber(id_usuario);
    const parsedDays = parseNumber(dias);
    const parsedPrice = parseNumber(precio_pago);

    if (!parsedProduct || !isPositiveInteger(parsedProduct)) {
        errors.id_producto = 'Producto inválido.';
    }
    if (!parsedUser || !isPositiveInteger(parsedUser)) {
        errors.id_usuario = 'Usuario inválido.';
    }
    if (parsedPrice === null || parsedPrice <= 0) {
        errors.precio_pago = 'Precio de publicidad inválido.';
    }
    if (!parsedDays || !isPositiveInteger(parsedDays)) {
        errors.dias = 'Ingresa un número de días válido.';
    }

    return { errors, values: { id_producto: parsedProduct, id_usuario: parsedUser, precio_pago: parsedPrice, dias: parsedDays } };
}

function normalizeImagePath(src) {
    if (!src || typeof src !== 'string') return src;
    const trimmed = src.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/uploads/')) return trimmed;
    if (trimmed.startsWith('uploads/')) return '/' + trimmed;
    return '/uploads/' + trimmed;
}

// =========================
// OBTENER PRODUCTOS DESTACADOS
// =========================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                u.nombre,
                pub.id_publicidad,
                pub.fecha_fin,
                IFNULL(AVG(r.rating), 0) as avg_rating,
                COUNT(r.id_rating) as rating_count
            FROM publicidades pub
            JOIN productos p ON pub.id_producto = p.id_producto
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            LEFT JOIN ratings r ON r.id_producto = p.id_producto
            WHERE pub.estado = 'activa' AND pub.fecha_fin >= CURDATE()
            GROUP BY p.id_producto
            LIMIT 3
        `);

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
                row.imagen = normalizeImagePath(row.imagen);
                row.imagenes = row.imagenes.map(normalizeImagePath);
            });
        }

        res.json({ rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error obteniendo productos destacados" });
    }
});

// =========================
// COMPRAR PUBLICIDAD
// =========================
router.post("/", async (req, res) => {
    const validation = validatePublicityPayload(req.body);
    if (Object.keys(validation.errors).length > 0) {
        return res.status(400).json({ success: false, message: 'Datos inválidos', errors: validation.errors });
    }

    const { id_producto, id_usuario, precio_pago, dias } = validation.values;

    try {
        const fecha_inicio = new Date();
        const fecha_fin = new Date(fecha_inicio);
        fecha_fin.setDate(fecha_fin.getDate() + dias);

        const [result] = await pool.query(`
            INSERT INTO publicidades (id_producto, id_usuario, precio_pago, fecha_inicio, fecha_fin, estado)
            VALUES (?, ?, ?, ?, ?, 'activa')
        `, [id_producto, id_usuario, precio_pago, fecha_inicio, fecha_fin]);

        res.json({ 
            success: true, 
            message: "Publicidad activada correctamente",
            id_publicidad: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al activar publicidad" });
    }
});

// =========================
// MIS PUBLICIDADES
// =========================
router.get("/mis-publicidades/:id_usuario", async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await pool.query(`
            SELECT 
                pub.*,
                p.nombre_producto,
                p.marca,
                p.modelo,
                p.imagen
            FROM publicidades pub
            JOIN productos p ON pub.id_producto = p.id_producto
            WHERE pub.id_usuario = ?
            ORDER BY pub.created_at DESC
        `, [id_usuario]);

        res.json({ rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error obteniendo tus publicidades" });
    }
});

module.exports = router;
