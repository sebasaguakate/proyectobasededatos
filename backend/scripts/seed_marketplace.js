const pool = require('../src/db');

const nombres = [
    'Ana', 'Luis', 'Carmen', 'Diego', 'María', 'Pablo', 'Lucía', 'Javier', 'Sofía', 'Andrés',
    'Elena', 'Carlos', 'Marta', 'Raúl', 'Laura', 'Sergio', 'Isabel', 'Fernando', 'Patricia', 'Óscar'
];

const apellidos = [
    'García', 'Martínez', 'López', 'Pérez', 'Gómez', 'Sánchez', 'Romero', 'Díaz', 'Fernández', 'Torres',
    'Ramírez', 'Alonso', 'Ruiz', 'Jiménez', 'Sosa', 'Castro', 'Vargas', 'Núñez', 'Ortega', 'Vega'
];

const marcas = ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Motorola', 'Nokia', 'Sony', 'LG', 'OnePlus', 'Oppo'];
const colores = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Dorado', 'Plateado', 'Morado', 'Rosa'];
const almacenamientos = ['32GB', '64GB', '128GB', '256GB', '512GB'];
const categorias = ['celular', 'accesorio'];
const condiciones = ['nuevo', 'usado'];
const tiposAccesorios = ['Cargador', 'Auriculares', 'Protector', 'Funda', 'Cable USB', 'Power Bank'];
const parentDevices = ['Galaxy S23', 'iPhone 14', 'Redmi Note 12', 'P30 Pro', 'Moto G Power', 'Nokia 5.4'];

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomPrice(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function ensureUsers(minimumCount) {
    const [rows] = await pool.query('SELECT id_usuario, nombre, apellido, correo FROM usuarios ORDER BY id_usuario ASC');
    if (rows.length >= minimumCount) {
        return rows;
    }

    const missing = minimumCount - rows.length;
    const newUsers = [];
    const timestamp = Date.now();

    for (let i = 1; i <= missing; i++) {
        const nombre = getRandomItem(nombres);
        const apellido = getRandomItem(apellidos);
        const correo = `usuario${timestamp}_${i}@example.com`;
        const password = 'Password123!';
        newUsers.push([nombre, apellido, correo, password]);
    }

    await pool.query('INSERT IGNORE INTO usuarios (nombre, apellido, correo, password) VALUES ?', [newUsers]);
    const [updatedRows] = await pool.query('SELECT id_usuario, nombre, apellido, correo FROM usuarios ORDER BY id_usuario ASC');
    return updatedRows;
}

async function seedProducts(users) {
    const products = [];
    let productIndex = 1;

    for (const user of users.slice(0, 1000)) {
        const tipoProducto = getRandomItem(categorias);
        const nombreProducto = tipoProducto === 'celular'
            ? `${getRandomItem(marcas)} ${Math.floor(10 + Math.random() * 90)}`
            : `${getRandomItem(tiposAccesorios)} para ${getRandomItem(parentDevices)}`;
        const marca = getRandomItem(marcas);
        const modelo = `Modelo ${Math.floor(Math.random() * 1000)}`;
        const precio = getRandomPrice(45, 999);
        const stock = getRandomInt(1, 50);
        const descripcion = `Venta de ${nombreProducto} en excelente estado.`;
        const condicion = getRandomItem(condiciones);
        const color = getRandomItem(colores);
        const almacenamiento = getRandomItem(almacenamientos);
        const categoria = tipoProducto;
        const shippingCost = getRandomPrice(0, 20);
        const allowBackorder = getRandomInt(0, 1);
        const imagen = `producto_${productIndex}.jpg`;
        const tipoAccesorio = tipoProducto === 'accesorio' ? getRandomItem(tiposAccesorios) : null;
        const parentDeviceName = tipoProducto === 'accesorio' ? getRandomItem(parentDevices) : null;

        products.push([
            user.id_usuario,
            nombreProducto,
            marca,
            modelo,
            precio,
            stock,
            descripcion,
            condicion,
            color,
            almacenamiento,
            categoria,
            shippingCost,
            allowBackorder,
            imagen,
            tipoProducto,
            tipoAccesorio,
            parentDeviceName
        ]);

        productIndex += 1;
    }

    const chunkSize = 100;
    for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        await pool.query(
            'INSERT INTO productos (id_usuario, nombre_producto, marca, modelo, precio, stock, descripcion, condicion, color, almacenamiento, categoria, shipping_cost, allow_backorder, imagen, tipo_producto, tipo_accesorio, parent_device_name) VALUES ? ',
            [chunk]
        );
        console.log(`Productos publicados: ${Math.min(i + chunk.length, products.length)} / ${products.length}`);
    }

    const [insertedProducts] = await pool.query(
        'SELECT id_producto, id_usuario, precio, stock FROM productos ORDER BY id_producto DESC LIMIT ?'
        , [products.length]
    );

    return insertedProducts;
}

async function seedSales(users, products) {
    const userIds = users.map(user => user.id_usuario);
    const salesCount = 1000;
    let created = 0;

    for (let i = 0; i < salesCount; i++) {
        const buyerId = getRandomItem(userIds);
        let product = getRandomItem(products);

        if (product.id_usuario === buyerId) {
            const alternative = products.find(p => p.id_usuario !== buyerId);
            if (alternative) {
                product = alternative;
            }
        }

        const employeeCandidates = userIds.filter(id => id !== buyerId && id !== product.id_usuario);
        const idEmpleado = employeeCandidates.length > 0 ? getRandomItem(employeeCandidates) : null;
        const cantidad = getRandomInt(1, Math.min(3, product.stock || 1));

        const [ventaResult] = await pool.query(
            'INSERT INTO ventas (fecha, id_cliente, id_empleado) VALUES (CURDATE(), ?, ?)',
            [buyerId, idEmpleado]
        );

        await pool.query(
            'INSERT INTO detalles (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
            [ventaResult.insertId, product.id_producto, cantidad, product.precio]
        );

        created += 1;
        if (created % 100 === 0) {
            console.log(`Ventas generadas: ${created} / ${salesCount}`);
        }
    }

    console.log(`✅ Ventas generadas: ${created}`);
}

async function main() {
    try {
        const users = await ensureUsers(1000);
        console.log(`Usuarios disponibles: ${users.length}`);

        const products = await seedProducts(users);
        console.log(`Total productos creados: ${products.length}`);

        await seedSales(users, products);
        console.log('✅ Marketplace completo: usuarios publicaron y compraron productos.');
    } catch (error) {
        console.error('❌ Error en el seed del marketplace:', error);
    } finally {
        await pool.end();
    }
}

main();
