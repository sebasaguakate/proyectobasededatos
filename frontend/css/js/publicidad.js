const usuarioPub = JSON.parse(localStorage.getItem('usuario')) || null;
const usuarioInfoPub = document.getElementById('usuarioInfo');
const logoutBtnPub = document.getElementById('logoutBtn');
const productoSelect = document.getElementById('productoSelect');
const diasInput = document.getElementById('dias');
const precioEstimado = document.getElementById('precioEstimado');
const publicidadForm = document.getElementById('publicidadForm');
const publicidadMessage = document.getElementById('publicidadMessage');
const misPublicidades = document.getElementById('misPublicidades');

const COSTO_DIA = 30;

if (!usuarioPub) {
    window.location.href = 'login.html';
}

if (usuarioInfoPub) {
    usuarioInfoPub.textContent = `Hola, ${usuarioPub.nombre}`;
}

if (logoutBtnPub) {
    logoutBtnPub.addEventListener('click', () => {
        console.log('[Publicidad] Logout clicked');
        try {
            localStorage.removeItem('usuario');
            localStorage.removeItem('carrito');
            console.log('[Publicidad] LocalStorage limpiado, redirigiendo...');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('[Publicidad] Error en logout:', error);
            alert('Error al cerrar sesión');
        }
    });
}

function actualizarPrecio() {
    const dias = Number(diasInput.value) || 1;
    precioEstimado.textContent = `$${(dias * COSTO_DIA).toFixed(2)}`;
}

async function cargarProductosUsuario() {
    try {
        const res = await fetch(`${window.location.origin}/productos/mis-productos/${usuarioPub.id_usuario}`);
        const data = await res.json();
        const productos = data.rows || [];

        productoSelect.innerHTML = '<option value="">Selecciona un producto</option>';
        if (!productos.length) {
            productoSelect.innerHTML += '<option value="" disabled>No tienes productos publicados</option>';
            return;
        }

        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id_producto;
            option.textContent = `${producto.nombre_producto} (${producto.marca} ${producto.modelo})`;
            productoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando productos de usuario:', error);
        productoSelect.innerHTML = '<option value="" disabled>Error cargando productos</option>';
    }
}

async function cargarMisPublicidades() {
    try {
        const res = await fetch(`${window.location.origin}/publicidades/mis-publicidades/${usuarioPub.id_usuario}`);
        const data = await res.json();
        const rows = data.rows || [];

        if (!rows.length) {
            misPublicidades.innerHTML = '<div class="alert alert-info">No tienes publicidades activas.</div>';
            return;
        }

        misPublicidades.innerHTML = rows.map(pub => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${pub.nombre_producto}</h5>
                    <p class="card-text text-muted">${pub.marca} ${pub.modelo}</p>
                    <p class="mb-1">Precio pagado: $${pub.precio_pago}</p>
                    <p class="mb-1">Vence el: ${new Date(pub.fecha_fin).toLocaleDateString()}</p>
                    <a href="producto.html?id=${pub.id_producto}" class="btn btn-sm btn-outline-primary">Ver producto</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando mis publicidades:', error);
        misPublicidades.innerHTML = '<div class="alert alert-danger">Error cargando publicidades.</div>';
    }
}

publicidadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    publicidadMessage.classList.add('d-none');

    const id_producto = productoSelect.value;
    const dias = Number(diasInput.value);
    const precio_pago = dias * COSTO_DIA;

    if (!id_producto) {
        return alert('Selecciona un producto para promocionar.');
    }
    if (!dias || dias < 1) {
        return alert('Ingresa un número de días válido.');
    }

    try {
        const res = await fetch(`${window.location.origin}/publicidades`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_producto,
                id_usuario: usuarioPub.id_usuario,
                precio_pago,
                dias
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al comprar publicidad');

        publicidadMessage.textContent = 'Publicidad activada correctamente. Tu producto aparecerá destacado.';
        publicidadMessage.classList.remove('d-none');
        cargarMisPublicidades();
    } catch (error) {
        console.error('Error comprando publicidad:', error);
        alert(error.message || 'No se pudo comprar la publicidad.');
    }
});

if (diasInput) {
    diasInput.addEventListener('input', actualizarPrecio);
}

actualizarPrecio();
cargarProductosUsuario();
cargarMisPublicidades();
