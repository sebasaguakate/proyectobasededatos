const mysql = require('mysql2/promise');
const path = require('path');

// Intentar cargar variables desde el archivo .env si existe localmente
require('dotenv').config();

const requiredEnv = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT'
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
    console.error(`❌ Faltan variables de entorno: ${missingEnv.join(', ')}`);
    console.error('Configura estas variables en Render Dashboard o en tu archivo .env local.');
    console.error('DB config actual:', {
        host: process.env.DB_HOST || null,
        user: process.env.DB_USER || null,
        database: process.env.DB_NAME || null,
        port: process.env.DB_PORT || null
    });
    throw new Error(`Faltan variables de entorno: ${missingEnv.join(', ')}`);
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('DB config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database
});

const pool = mysql.createPool(dbConfig);

async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log("🛰️ Intentando conectar a Railway...");

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
                descripcion TEXT,
                condicion VARCHAR(50),
                color VARCHAR(50),
                almacenamiento VARCHAR(50),
                categoria VARCHAR(100),
                shipping_cost DECIMAL(10,2) DEFAULT 0,
                allow_backorder TINYINT(1) DEFAULT 0,
                imagen VARCHAR(255),
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS imagenes_producto (
                id_imagen INT PRIMARY KEY AUTO_INCREMENT,
                id_producto INT NOT NULL,
                ruta VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ratings (
                id_rating INT PRIMARY KEY AUTO_INCREMENT,
                id_producto INT NOT NULL,
                id_usuario INT NOT NULL,
                rating TINYINT NOT NULL,
                comentario TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_product (id_producto, id_usuario),
                FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ventas (
                id_venta INT PRIMARY KEY AUTO_INCREMENT,
                fecha DATE NOT NULL,
                id_cliente INT NULL,
                id_empleado INT NULL
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
        `)

        connection.release();
        console.log("✅ Base de datos de Railway conectada e inicializada");
    } catch (err) {
        console.error("❌ Error crítico de conexión:", err.message);
    }
}

initDatabase();

module.exports = pool;