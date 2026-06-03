const productoId = new URLSearchParams(window.location.search).get('id');
const usuario = JSON.parse(localStorage.getItem('usuario')) || null;
const productoContainer = document.getElementById('productContent');
const usuarioInfo = document.getElementById('usuarioInfo');
const logoutBtn = document.getElementById('logoutBtn');

if (usuarioInfo && usuario) {
    usuarioInfo.textContent = `Bienvenido ${usuario.nombre}`;
} else if (usuarioInfo) {
    usuarioInfo.textContent = 'Invitado';
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    });
}

function showError(message) {
    productoContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">${message}</div>
        </div>
    `;
}

function cargarProducto() {
    if (!productoId) {
        showError('ID de producto inválido.');
        return;
    }

    fetch(`${window.location.origin}/productos/${productoId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.product) {
                showError(data.message || 'Producto no encontrado.');
                return;
            }
            renderProducto(data.product);
        })
        .catch(err => {
            console.error(err);
            showError('No se pudo cargar el producto.');
        });
}

function renderProducto(product) {
    function resolveImage(src) {
        if (!src) return 'https://via.placeholder.com/500';
        if (/^https?:\/\//i.test(src)) return src;
        if (src.startsWith('/')) return window.location.origin + src;
        return src;
    }

    const imagenes = product.imagenes && product.imagenes.length ? product.imagenes : (product.imagen ? [product.imagen] : []);
    const mainImage = resolveImage(imagenes[0]) || 'https://via.placeholder.com/500';

    productoContainer.innerHTML = `
        <div class="col-lg-6 mb-4">
            <div class="card shadow-sm">
                <img id="mainImage" src="${mainImage}" class="card-img-top" style="height:450px; object-fit:cover;" alt="${product.nombre_producto}">
                <div class="card-body">
                    <div class="row g-2" id="gallery"></div>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card shadow-sm p-4 mb-4 bg-glass">
                <h2>${product.nombre_producto}</h2>
                <p class="text-muted mb-1"><strong>Marca:</strong> ${product.marca}</p>
                <p class="text-muted mb-1"><strong>Modelo:</strong> ${product.modelo}</p>
                <h3 class="text-success mb-3">$${product.precio}</h3>
                <p>${product.descripcion || 'Sin descripción disponible.'}</p>
                <ul class="list-group list-group-flush mb-3">
                    <li class="list-group-item"><strong>Condición:</strong> ${product.condicion || 'No especificado'}</li>
                    <li class="list-group-item"><strong>Color:</strong> ${product.color || 'No especificado'}</li>
                    <li class="list-group-item"><strong>Almacenamiento:</strong> ${product.almacenamiento || 'No especificado'}</li>
                    <li class="list-group-item"><strong>Categoría:</strong> ${product.categoria || 'No especificado'}</li>
                    <li class="list-group-item"><strong>Stock:</strong> ${product.stock}</li>
                    <li class="list-group-item"><strong>Envío:</strong> $${product.shipping_cost || 0}</li>
                </ul>
                <div class="mb-3">
                    <h5>Vendedor</h5>
                    <p class="mb-1"><strong>${product.vendedor_nombre} ${product.vendedor_apellido}</strong></p>
                    <p class="mb-0">${product.vendedor_correo || ''}</p>
                </div>
                <button class="btn btn-success w-100" id="addToCartBtn">Agregar al carrito</button>
            </div>
        </div>
    `;

    const gallery = document.getElementById('gallery');
    if (imagenes.length > 0) {
        imagenes.forEach(srcRaw => {
            const src = resolveImage(srcRaw);
            gallery.innerHTML += `
                <div class="col-4">
                    <img src="${src}" class="img-fluid rounded cursor-pointer" style="height:90px; object-fit:cover;" alt="Imagen secundaria" onclick="document.getElementById('mainImage').src='${src}'">
                </div>
            `;
        });
    }

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => agregarAlCarrito(product));
    }
}

function agregarAlCarrito(producto) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const existing = carrito.find(item => item.id === producto.id_producto);

    if (existing) {
        existing.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id_producto,
            nombre: producto.nombre_producto,
            precio: Number(producto.precio),
            cantidad: 1
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert('Producto agregado al carrito');
}

cargarProducto();
