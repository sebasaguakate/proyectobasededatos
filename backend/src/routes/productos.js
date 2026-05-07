const express = require("express");
const router = express.Router();
const pool = require("../db");


// =========================
// OBTENER PRODUCTOS
// =========================
router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                productos.*,
                usuarios.nombre
            FROM productos
            JOIN usuarios
            ON productos.id_usuario = usuarios.id_usuario
        `);

        res.json(rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });
    }
});


// =========================
// CREAR PRODUCTO
// =========================
router.post("/", async (req, res) => {

    const {

        id_usuario,

        nombre_producto,
        marca,
        modelo,
        precio,
        stock,
        imagen

    } = req.body;

    try {

        await pool.query(
            `
            INSERT INTO productos
            (
                id_usuario,
                nombre_producto,
                marca,
                modelo,
                precio,
                stock,
                imagen
            )
            VALUES (?, ?, ?, ?, ?, ?,?)
            `,
            [
                id_usuario,
                nombre_producto,
                marca,
                modelo,
                precio,
                stock,
                imagen
            ]
        );

        res.json({
            message: "Producto agregado"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });
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
        stock
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
                stock=?
            WHERE id_producto=?
            `,
            [
                nombre_producto,
                marca,
                modelo,
                precio,
                stock,
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


module.exports = router;