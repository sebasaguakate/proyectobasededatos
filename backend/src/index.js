require("dotenv").config(); // Siempre en la línea 1

const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db"); 

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "../../frontend")));

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, "../../frontend/uploads")));

// Servir assets
app.use('/assets', express.static(path.join(__dirname, "../../frontend/assets")));

// Rutas
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const productosRoutes = require("./routes/productos");
app.use("/productos", productosRoutes);

// Endpoint de compra
app.post("/comprar", async (req, res) => {
    const { id_cliente, id_empleado, carrito } = req.body;
    if (!Array.isArray(carrito) || carrito.length === 0) {
        return res.status(400).json({ success: false, message: "El carrito está vacío" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [ventaResult] = await connection.query(
            "INSERT INTO ventas (fecha, id_cliente, id_empleado) VALUES (CURDATE(), ?, ?)",
            [id_cliente, id_empleado]
        );
        const idVenta = ventaResult.insertId;

        for (const item of carrito) {
            const [rows] = await connection.query(
                "SELECT stock FROM productos WHERE id_producto = ? FOR UPDATE",
                [item.id]
            );
            if (!rows.length || rows[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto ${item.id}`);
            }

            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE id_producto = ?",
                [item.cantidad, item.id]
            );
            await connection.query(
                "INSERT INTO detalles (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                [idVenta, item.id, item.cantidad, item.precio]
            )
        }
        await connection.commit();
        res.json({ success: true, message: "Compra realizada con éxito" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
});

// IMPORTANTE: Render requiere process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en puerto ${PORT}`);
});