const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "olvida",
    database: "tienda_celulares",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDatabase() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                correo VARCHAR(180) NOT NULL UNIQUE,
                contraseña VARCHAR(255) NOT NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id_producto INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario INT NOT NULL,
                nombre_producto VARCHAR(150) NOT NULL,
                marca VARCHAR(100) NOT NULL,
                modelo VARCHAR(100) NOT NULL,
                precio DECIMAL(10,2) NOT NULL,
                stock INT NOT NULL,
                imagen VARCHAR(255),
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ventas (
                id_venta INT PRIMARY KEY AUTO_INCREMENT,
                fecha DATE NOT NULL,
                id_cliente INT NULL,
                id_empleado INT NULL,
                FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS detalles (
                id_detalle INT PRIMARY KEY AUTO_INCREMENT,
                id_venta INT NOT NULL,
                id_producto INT NOT NULL,
                cantidad INT NOT NULL,
                precio_unitario DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
                FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
            )
        `);

        const [idUsuarioCol] = await connection.query(
            "SHOW COLUMNS FROM productos LIKE 'id_usuario'"
        );
        if (!idUsuarioCol.length) {
            await connection.query(
                "ALTER TABLE productos ADD COLUMN id_usuario INT NOT NULL AFTER id_producto"
            );
        }

        const [imagenCol] = await connection.query(
            "SHOW COLUMNS FROM productos LIKE 'imagen'"
        );
        if (!imagenCol.length) {
            await connection.query(
                "ALTER TABLE productos ADD COLUMN imagen VARCHAR(255) NULL AFTER stock"
            );
        }

        connection.release();
        console.log("Base de datos inicializada");
    } catch (err) {
        console.error("Error inicializando la base de datos:", err);
    }
}

initDatabase();

module.exports = pool;