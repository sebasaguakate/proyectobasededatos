const express = require("express");
const router = express.Router();
const pool = require("../db");


// REGISTRO
router.post("/register", async (req, res) => {
    const { nombre, apellido, correo, contraseña } = req.body;

    try {
        await pool.query(
            `INSERT INTO usuarios (nombre, apellido, correo, contraseña) VALUES (?, ?, ?, ?)`,
            [nombre, apellido, correo, contraseña]
        );

        res.json({
            success: true,
            message: "Usuario registrado"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error registrando usuario"
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        const [rows] = await pool.query(
            `SELECT * FROM usuarios WHERE correo = ? AND contraseña = ?`,
            [correo, contraseña]
        );

        if (rows.length > 0) {
            res.json({
                success: true,
                usuario: rows[0]
            });
        } else {
            res.json({
                success: false,
                message: "Credenciales incorrectas"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error del servidor"
        });
    }
});

module.exports = router;