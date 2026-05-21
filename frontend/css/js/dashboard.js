const usuario = JSON.parse(localStorage.getItem('usuario')) || null;
const usuarioInfo = document.getElementById('usuarioInfo');
const logoutBtn = document.getElementById('logoutBtn');
const btnProductos = document.getElementById('btnProductos');
const btnVentas = document.getElementById('btnVentas');
const btnCompras = document.getElementById('btnCompras');
const dashboardTitle = document.getElementById('dashboardTitle');
const dashboardSubtitle = document.getElementById('dashboardSubtitle');
const publishLink = document.getElementById('publishLink');
const sectionProductos = document.getElementById('sectionProductos');
const sectionVentas = document.getElementById('sectionVentas');
const sectionCompras = document.getElementById('sectionCompras');
let misProductos = [];

function normalizeFrontendImage(src) {
    if (!src || typeof src !== 'string') return src;
    const trimmed = src.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
    }
    if (trimmed.startsWith('uploads/')) {
        return '/' + trimmed;
    }
    return '/uploads/' + trimmed;
}

if (!usuario) {
    window.location.href = 'login.html';
}

if (usuarioInfo) {
    usuarioInfo.textContent = `Hola, ${usuario.nombre}`;
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    });
}

btnProductos?.addEventListener('click', () => showSection('productos'));
btnVentas?.addEventListener('click', () => showSection('ventas'));
btnCompras?.addEventListener('click', () => showSection('compras'));

publishLink?.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = 'producto.html';
});

function showSection(section) {
    btnProductos.classList.toggle('active', section === 'productos');
    btnVentas.classList.toggle('active', section === 'ventas');
    btnCompras.classList.toggle('active', section === 'compras');

    sectionProductos.classList.toggle('d-none', section !== 'productos');
    sectionVentas.classList.toggle('d-none', section !== 'ventas');
    sectionCompras.classList.toggle('d-none', section !== 'compras');

    if (section === 'productos') {
        dashboardTitle.textContent = 'Mis productos';
        dashboardSubtitle.textContent = 'Administra tus publicaciones activas.';
        loadMisProductos();
    } else if (section === 'ventas') {
        dashboardTitle.textContent = 'Mis ventas';
        dashboardSubtitle.textContent = 'Revisa los pedidos realizados a tus productos.';
        loadMisVentas();
    } else if (section === 'compras') {
        dashboardTitle.textContent = 'Mis compras';
        dashboardSubtitle.textContent = 'Consulta tus pedidos y detalles de compra.';
        loadMisCompras();
    }
}

async function loadMisProductos() {
    sectionProductos.innerHTML = '<div class="text-center py-5 text-muted">Cargando productos...</div>';

    try {
        const res = await fetch(`${window.location.origin}/productos/mis-productos/${usuario.id_usuario}`);
        const data = await res.json();
        const productos = data.rows || [];
        misProductos = productos;

        if (!productos.length) {
            sectionProductos.innerHTML = '<div class="alert alert-info">Aún no has publicado productos.</div>';
            return;
        }

        sectionProductos.innerHTML = productos.map(p => {
            const imageSrc = p.imagen ? normalizeFrontendImage(p.imagen) : 'https://via.placeholder.com/400';
            return ''
                + '<div class="card mb-3 shadow-sm">'
                + '<div class="row g-0 align-items-center">'
                + '<div class="col-md-4">'
                + `<img src="${imageSrc}" class="img-fluid rounded-start" style="height:180px; object-fit:cover;" alt="${p.nombre_producto}">`
                + '</div>'
                + '<div class="col-md-8">'
                + '<div class="card-body">'
                + '<div class="d-flex justify-content-between align-items-start">'
                + '<div>'
                + `<h5 class="card-title mb-1">${p.nombre_producto}</h5>`
                + `<p class="mb-1 text-muted">${p.marca} ${p.modelo}</p>`
                + `<p class="mb-1">$${p.precio} · Stock: ${p.stock}</p>`
                + `<small class="text-muted">Rating: ${Number(p.avg_rating || 0).toFixed(1)} (${p.rating_count || 0})</small>`
                + '</div>'
                + '<div class="btn-group" role="group">'
                + `<button class="btn btn-sm btn-outline-warning" onclick="editarProducto(${p.id_producto})">Editar</button>`
                + `<button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id_producto})">Eliminar</button>`
                + `<button class="btn btn-sm btn-outline-secondary" onclick="window.location.href='producto.html?id=${p.id_producto}'">Ver</button>`
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>';
        }).join('');
    } catch (error) {
        console.error(error);
        sectionProductos.innerHTML = '<div class="alert alert-danger">Error cargando tus productos.</div>';
    }
}

async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetch(`${window.location.origin}/productos/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            console.error('Eliminar producto falló:', res.status);
            alert('No se pudo eliminar el producto. Intenta de nuevo.');
            return;
        }

        await loadMisProductos();
    } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('Error eliminando el producto. Revisa la consola para más detalles.');
    }
}

async function editarProducto(id) {
    const producto = misProductos.find(p => p.id_producto === id);
    if (!producto) {
        alert('Producto no encontrado para editar.');
        return;
    }

    const nuevoNombre = prompt('Nombre del producto:', producto.nombre_producto);
    if (nuevoNombre === null) return;

    const nuevaMarca = prompt('Marca:', producto.marca);
    if (nuevaMarca === null) return;

    const nuevoModelo = prompt('Modelo:', producto.modelo);
    if (nuevoModelo === null) return;

    const nuevoPrecio = prompt('Precio:', producto.precio);
    if (nuevoPrecio === null) return;

    const nuevoStock = prompt('Stock:', producto.stock);
    if (nuevoStock === null) return;

    const nuevaCategoria = prompt('Categoría:', producto.categoria || 'Smartphones');
    if (nuevaCategoria === null) return;

    const nuevaDescripcion = prompt('Descripción:', producto.descripcion || '');
    if (nuevaDescripcion === null) return;

    const nuevaCondicion = prompt('Condición:', producto.condicion || 'Nuevo');
    if (nuevaCondicion === null) return;

    const nuevoColor = prompt('Color:', producto.color || '');
    if (nuevoColor === null) return;

    const nuevoAlmacenamiento = prompt('Almacenamiento:', producto.almacenamiento || '');
    if (nuevoAlmacenamiento === null) return;

    const nuevoShippingCost = prompt('Costo de envío:', producto.shipping_cost || '0');
    if (nuevoShippingCost === null) return;

    const allowBackorder = confirm('¿Permitir pedidos cuando no hay stock?');

    const actualizado = {
        id_usuario: usuario.id_usuario,
        nombre_producto: nuevoNombre,
        marca: nuevaMarca,
        modelo: nuevoModelo,
        precio: Number(nuevoPrecio),
        stock: Number(nuevoStock),
        descripcion: nuevaDescripcion,
        condicion: nuevaCondicion,
        color: nuevoColor,
        almacenamiento: nuevoAlmacenamiento,
        categoria: nuevaCategoria,
        shipping_cost: Number(nuevoShippingCost),
        allow_backorder: allowBackorder ? 1 : 0,
        tipo_producto: producto.tipo_producto || 'celular',
        tipo_accesorio: producto.tipo_accesorio || null,
        parent_device_name: producto.parent_device_name || null
    };

    try {
        const res = await fetch(`${window.location.origin}/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actualizado)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Editar producto falló:', res.status, errorText);
            alert('No se pudo actualizar el producto. Revisa la consola para más detalles.');
            return;
        }

        await loadMisProductos();
    } catch (error) {
        console.error('Error editando producto:', error);
        alert('Error editando el producto. Revisa la consola para más detalles.');
    }
}

async function loadMisVentas() {
    sectionVentas.innerHTML = '<div class="text-center py-5 text-muted">Cargando ventas...</div>';

    try {
        const res = await fetch(`${window.location.origin}/productos/mis-ventas/${usuario.id_usuario}`);
        const data = await res.json();
        const ventas = data.rows || [];

        if (!ventas.length) {
            sectionVentas.innerHTML = '<div class="alert alert-info">No tienes ventas registradas aún.</div>';
            return;
        }

        const grouped = groupBy(ventas, 'id_venta');
        sectionVentas.innerHTML = Object.keys(grouped).map(key => {
            const venta = grouped[key];
            const info = venta[0];
            const items = venta.map(item => `
                <li>${item.nombre_producto} (${item.marca} ${item.modelo}) x${item.cantidad} - $${item.precio_unitario}</li>
            `).join('');

            return `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <h5 class="card-title mb-1">Venta #${info.id_venta}</h5>
                                <small class="text-muted">Cliente: ${info.cliente_nombre} ${info.cliente_apellido}</small>
                            </div>
                            <span class="badge bg-success">${new Date(info.fecha).toLocaleDateString()}</span>
                        </div>
                        <ul class="mb-2">${items}</ul>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
        sectionVentas.innerHTML = '<div class="alert alert-danger">Error cargando tus ventas.</div>';
    }
}

async function loadMisCompras() {
    sectionCompras.innerHTML = '<div class="text-center py-5 text-muted">Cargando compras...</div>';

    try {
        const res = await fetch(`${window.location.origin}/productos/mis-compras/${usuario.id_usuario}`);
        const data = await res.json();
        const compras = data.rows || [];

        if (!compras.length) {
            sectionCompras.innerHTML = '<div class="alert alert-info">Todavía no has realizado compras.</div>';
            return;
        }

        const grouped = groupBy(compras, 'id_venta');
        sectionCompras.innerHTML = Object.keys(grouped).map(key => {
            const compra = grouped[key];
            const info = compra[0];
            const items = compra.map(item => `
                <li>${item.nombre_producto} (${item.marca} ${item.modelo}) x${item.cantidad} - $${item.precio_unitario}</li>
            `).join('');

            return `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <h5 class="card-title mb-1">Compra #${info.id_venta}</h5>
                                <small class="text-muted">Vendedor: ${info.vendedor_nombre} ${info.vendedor_apellido}</small>
                            </div>
                            <span class="badge bg-secondary">${new Date(info.fecha).toLocaleDateString()}</span>
                        </div>
                        <ul class="mb-2">${items}</ul>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
        sectionCompras.innerHTML = '<div class="alert alert-danger">Error cargando tus compras.</div>';
    }
}

function groupBy(array, key) {
    return array.reduce((result, item) => {
        (result[item[key]] = result[item[key]] || []).push(item);
        return result;
    }, {});
}

showSection('productos');
