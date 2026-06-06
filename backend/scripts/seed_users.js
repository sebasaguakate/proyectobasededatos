const pool = require('../src/db');

const nombres = [
    'Ana', 'Luis', 'Carmen', 'Diego', 'María', 'Pablo', 'Lucía', 'Javier', 'Sofía', 'Andrés',
    'Elena', 'Carlos', 'Marta', 'Raúl', 'Laura', 'Sergio', 'Isabel', 'Fernando', 'Patricia', 'Óscar'
];

const apellidos = [
    'García', 'Martínez', 'López', 'Pérez', 'Gómez', 'Sánchez', 'Romero', 'Díaz', 'Fernández', 'Torres',
    'Ramírez', 'Alonso', 'Ruiz', 'Jiménez', 'Sosa', 'Castro', 'Vargas', 'Núñez', 'Ortega', 'Vega'
];

function getRandomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function generarUsuarios(cantidad) {
    const usuarios = [];
    const timestamp = Date.now();

    for (let i = 1; i <= cantidad; i++) {
        const nombre = getRandomItem(nombres);
        const apellido = getRandomItem(apellidos);
        const correo = `usuario${timestamp}_${i}@example.com`;
        const password = `Password123!`;
        usuarios.push([nombre, apellido, correo, password]);
    }

    return usuarios;
}

async function seedUsers() {
    try {
        const usuarios = generarUsuarios(1000);
        const chunkSize = 100;
        let inserted = 0;

        for (let i = 0; i < usuarios.length; i += chunkSize) {
            const chunk = usuarios.slice(i, i + chunkSize);
            const [result] = await pool.query(
                'INSERT IGNORE INTO usuarios (nombre, apellido, correo, password) VALUES ?',
                [chunk]
            );
            inserted += result.affectedRows;
            console.log(`Insertados ${inserted} / ${usuarios.length} usuarios...`);
        }

        console.log(`✅ Seed completado. Usuarios insertados: ${inserted}`);
    } catch (error) {
        console.error('❌ Error al insertar usuarios:', error);
    } finally {
        await pool.end();
    }
}

seedUsers();
