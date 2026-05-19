const express = require("express");
const router = express.Router();
const pool = require("../db");


// REGISTRO
router.post("/register", async (req, res) => {
    const { nombre, apellido, correo, contraseña, password } = req.body;
    const passwordValue = password || contraseña;
    const errors = {};

    if (!nombre || !nombre.trim()) {
        errors.nombre = "El nombre es obligatorio";
    }
    if (!apellido || !apellido.trim()) {
        errors.apellido = "El apellido es obligatorio";
    }
    if (!correo || !correo.trim()) {
        errors.correo = "El correo es obligatorio";
    } else if (!/^\S+@\S+\.\S+$/.test(correo)) {
        errors.correo = "El correo no es válido";
    }
    if (!passwordValue || !passwordValue.trim()) {
        errors.password = "La contraseña es obligatoria";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Datos incompletos",
            errors
        });
    }

    try {
        const [existing] = await pool.query(
            `SELECT id_usuario FROM usuarios WHERE correo = ?`,
            [correo]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: "El correo ya está en uso",
                errors: {
                    correo: "Ya existe un usuario con este correo"
                }
            });
        }

        await pool.query(
            `INSERT INTO usuarios (nombre, apellido, correo, contraseña) VALUES (?, ?, ?, ?)`,
            [nombre, apellido, correo, passwordValue]
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
    const { correo, contraseña, password } = req.body;
    const passwordValue = password || contraseña;
    const errors = {};

    if (!correo || !correo.trim()) {
        errors.correo = "El correo es obligatorio";
    }
    if (!passwordValue || !passwordValue.trim()) {
        errors.password = "La contraseña es obligatoria";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Por favor, completa todos los campos",
            errors
        });
    }

    try {
        const [rows] = await pool.query(
            `SELECT * FROM usuarios WHERE correo = ? AND contraseña = ?`,
            [correo, passwordValue]
        );

        if (rows.length > 0) {
            res.json({
                success: true,
                usuario: rows[0]
            });
        } else {
            res.json({
                success: false,
                message: "Correo o contraseña incorrectos",
                errors: {
                    general: "Correo o contraseña incorrectos"
                }
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