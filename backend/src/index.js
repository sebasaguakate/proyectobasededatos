require("dotenv").config(); // <--- ESTO DEBE SER LA LÍNEA 1

const express = require("express");
const cors = require("cors");
const path = require("path");

// Ahora que dotenv ya cargó las variables, podemos importar el pool
const pool = require("./db"); 

const app = express();
app.use(cors());
app.use(express.json());

// =========================
//  RUTAS AUTH
// =========================
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// =========================
//  RUTAS PRODUCTOS
// =========================
const productosRoutes = require("./routes/productos");
app.use("/productos", productosRoutes);

// =========================
//  COMPRAR
// =========================
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

            if (!rows.length) {
                throw { status: 404, message: "Producto no encontrado" };
            }

            const stockDisponible = rows[0].stock;

            if (stockDisponible <= 0) {
                throw { status: 400, message: "El producto está agotado" };
            }

            if (item.cantidad > stockDisponible) {
                throw {
                    status: 400,
                    message: `No hay suficiente stock para ${item.cantidad} unidad(es)`
                };
            }

            await connection.query(
                "UPDATE productos SET stock = stock - ? WHERE id_producto = ?",
                [item.cantidad, item.id]
            );

            await connection.query(
                "INSERT INTO detalles (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
                [idVenta, item.id, item.cantidad, item.precio]
            );
        }

        await connection.commit();

        res.json({ success: true, message: "Compra realizada" });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        const status = error.status || 500;
        res.status(status).json({ success: false, message: error.message || "Error en la compra" });
    } finally {
        connection.release();
    }
});

// =========================
//  SERVIR FRONTEND
// =========================
app.use(express.static(path.join(__dirname, "../../frontend")));

// =========================
//  INICIAR SERVIDOR
// =========================
// Render asigna un puerto dinámico, usamos process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});