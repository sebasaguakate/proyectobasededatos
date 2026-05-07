const express = require("express");
const router = express.Router();
const pool = require("../db");

// Crear venta con detalles
router.post("/", async (req, res) => {
    const { id_cliente, id_empleado, productos } = req.body;
    // productos = [{id_producto, cantidad, precio_unitario}]

    try {
        // Insertar venta
        const [venta] = await pool.query(
            "INSERT INTO Ventas (fecha, id_cliente, id_empleado) VALUES (CURDATE(), ?, ?)",
            [id_cliente, id_empleado]
        );

        const id_venta = venta.insertId;

        // Insertar cada detalle
        for (let p of productos) {
            await pool.query(
                "INSERT INTO Detalles (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                [id_venta, p.id_producto, p.cantidad, p.precio_unitario]
            );

            // Actualiza stock
            await pool.query(
                "UPDATE Productos SET stock = stock - ? WHERE id_producto = ?",
                [p.cantidad, p.id_producto]
            );
        }

        res.json({ message: "Venta creada", id_venta });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error creando la venta" });
    }
});

// Obtener ventas
router.get("/", async (req, res) => {
    const [rows] = await pool.query(`
        SELECT v.id_venta, v.fecha,
               c.nombre AS cliente,
               e.nombre AS empleado
        FROM Ventas v
        JOIN Clientes c ON v.id_cliente = c.id_cliente
        JOIN Empleados e ON v.id_empleado = e.id_empleado
        ORDER BY v.id_venta DESC
    `);

    res.json(rows);
});

module.exports = router;