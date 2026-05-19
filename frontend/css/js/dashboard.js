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

        if (!productos.length) {
            sectionProductos.innerHTML = '<div class="alert alert-info">Aún no has publicado productos.</div>';
            return;
        }

        sectionProductos.innerHTML = productos.map(p => `
            <div class="card mb-3 shadow-sm">
                <div class="row g-0 align-items-center">
                    <div class="col-md-4">
                        <img src="${p.imagen || 'https://via.placeholder.com/400'}" class="img-fluid rounded-start" style="height:180px; object-fit:cover;" alt="${p.nombre_producto}">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="card-title mb-1">${p.nombre_producto}</h5>
                                    <p class="mb-1 text-muted">${p.marca} ${p.modelo}</p>
                                    <p class="mb-1">$${p.precio} · Stock: ${p.stock}</p>
                                    <small class="text-muted">Rating: ${Number(p.avg_rating || 0).toFixed(1)} (${p.rating_count || 0})</small>
                                </div>
                                <button class="btn btn-sm btn-outline-secondary" onclick="window.location.href='producto.html?id=${p.id_producto}'">Ver</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
        sectionProductos.innerHTML = '<div class="alert alert-danger">Error cargando tus productos.</div>';
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
