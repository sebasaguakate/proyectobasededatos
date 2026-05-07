const express = require("express");
const router = express.Router();
const pool = require("../db");

// Obtener empleados
router.get("/", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM Empleados");
    res.json(rows);
});

module.exports = router;
