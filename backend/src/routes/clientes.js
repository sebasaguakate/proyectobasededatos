const express = require("express");
const router = express.Router();
const pool = require("../db");

// Obtener clientes
router.get("/", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM Clientes");
    res.json(rows);
});

// Crear cliente
router.post("/", async (req, res) => {
    const { nombre, apellido, telefono, direccion, correo } = req.body;

    await pool.query(
        "INSERT INTO Clientes (nombre, apellido, telefono, direccion, correo) VALUES (?, ?, ?, ?, ?)",
        [nombre, apellido, telefono, direccion, correo]
    );

    res.json({ message: "Cliente agregado" });
});

module.exports = router;