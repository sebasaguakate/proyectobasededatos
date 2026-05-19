// ==========================
// � NOTIFICACIONES
// ==========================
function showNotification(message) {
    const notif = document.getElementById('notification');
    const msg = document.getElementById('notificationMessage');
    msg.textContent = message;
    notif.classList.remove('d-none');
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notif = document.getElementById('notification');
    notif.classList.add('d-none');
}

// ==========================
// 🧠 VARIABLES GLOBALES
// ==========================
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let productosGlobal = [];
let usuario = JSON.parse(localStorage.getItem("usuario"));
let lastSearch = "";
let currentPage = 1;
let pageSize = 12;
let totalItems = 0;

// ==========================
// 📦 CARGAR PRODUCTOS
// ==========================
async function cargarProductos(search = "", page = 1, limit = pageSize) {
    lastSearch = search;
    currentPage = page;
    pageSize = limit;

    try {
        let url = window.location.origin + "/productos";
        const params = [];

        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (page) params.push(`page=${page}`);
        if (limit) params.push(`limit=${limit}`);
        if (params.length) url += `?${params.join('&')}`;

        const res = await fetch(url);
        const data = await res.json();
        const productos = Array.isArray(data) ? data : (data.rows || []);

        totalItems = data.total || (productos ? productos.length : 0);
        productosGlobal = productos;

        mostrarProductos(productos);
        renderPagination(totalItems, currentPage, pageSize);
    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}

// =========================
// 🖼️ MOSTRAR PRODUCTOS
// =========================
function mostrarProductos(productos) {
    const cont = document.getElementById("productos");
    cont.innerHTML = "";

    if (!productos || productos.length === 0) {
        cont.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">No se encontraron productos.</div>
            </div>
        `;
        return;
    }

    productos.filter(p => p.stock > 0).forEach(p => {
        const imagenSrc = p.imagen || (p.imagenes && p.imagenes.length ? p.imagenes[0] : 'https://via.placeholder.com/300');

        cont.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card shadow h-100">
                <a href="producto.html?id=${p.id_producto}" class="text-decoration-none text-dark">
                    <img
                        src="${imagenSrc}"
                        class="card-img-top"
                        style="height:250px; object-fit:cover;"
                        alt="Imagen de ${p.nombre_producto}"
                    >
                </a>
                <div class="card-body d-flex flex-column">
                    <h4 class="card-title">
                        <a href="producto.html?id=${p.id_producto}" class="text-decoration-none text-dark">
                            ${p.nombre_producto}
                        </a>
                    </h4>
                    <p><strong>Marca:</strong> ${p.marca}</p>
                    <p><strong>Modelo:</strong> ${p.modelo}</p>
                    <p><strong>Vendedor:</strong> ${p.nombre}</p>
                    <p class="fw-bold text-success">$${p.precio}</p>
                    <p><strong>Rating:</strong> ${p.avg_rating ? Number(p.avg_rating).toFixed(1) : '0.0'} (${p.rating_count || 0})</p>
                    <p class="text-muted">Stock: ${p.stock}</p>
                    <button class="btn btn-primary w-100 mb-2 mt-auto" onclick="verDetalle(${p.id_producto})">Ver detalles</button>
                    <button class="btn btn-success w-100" onclick="agregar(${p.id_producto}, ${p.precio})" ${p.stock === 0 ? "disabled" : ""}>Agregar al carrito</button>
                </div>
            </div>
        </div>
        `;
    });
}

function verDetalle(id) {
    window.location.href = `producto.html?id=${id}`;
}

// 🛒 AGREGAR AL CARRITO
// ==========================
function agregar(id, precio) {

    const producto = productosGlobal.find(p => p.id_producto === id);

    if (!producto) {
        return alert("Producto no encontrado");
    }

    if (producto.stock <= 0) {
        return alert("Este producto está agotado");
    }

    const existe = carrito.find(p => p.id === id);

    if (existe) {
        if (existe.cantidad >= producto.stock) {
            return alert("No hay más stock disponible para este producto");
        }

        existe.cantidad++;
    } else {
        carrito.push({
            id,
            nombre: producto.nombre_producto,
            precio,
            cantidad: 1
        });
    }

    guardarCarrito();

    renderCarrito();

    showNotification("Producto agregado al carrito");
}

// ==========================
// ❌ ELIMINAR DEL CARRITO
// ==========================
function eliminar(index) {

    carrito.splice(index, 1);

    guardarCarrito();

    renderCarrito();
}

// ==========================
// 🧹 VACIAR CARRITO
// ==========================
function vaciarCarrito() {

    carrito = [];

    guardarCarrito();

    renderCarrito();
}

// ==========================
// 💾 GUARDAR CARRITO
// ==========================
function guardarCarrito() {

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );
}

// ==========================
// 🧾 RENDER CARRITO
// ==========================
function renderCarrito() {

    const cont = document.getElementById("carrito");

    const totalSpan = document.getElementById("total");

    const contador = document.getElementById("contador");

    if (!cont) return;

    cont.innerHTML = "";

    let total = 0;

    let cantidadTotal = 0;

    carrito.forEach((item, index) => {

        const producto = productosGlobal.find(p => p.id_producto === item.id);
        const stockInsuficiente = !producto || producto.stock < item.cantidad;
        const claseRoja = stockInsuficiente ? 'text-danger' : '';

        total += item.precio * item.cantidad;
        cantidadTotal += item.cantidad;

        cont.innerHTML += `

        <div class="d-flex justify-content-between align-items-center border p-2 mb-2 rounded ${claseRoja}">

            <div>
                ${item.nombre}
                x${item.cantidad}
                ${stockInsuficiente ? '(Sin stock disponible)' : ''}
            </div>

            <div>

                $${item.precio}

                <button
                    class="btn btn-sm btn-danger ms-2"
                    onclick="eliminar(${index})"
                >
                    X
                </button>

            </div>

        </div>
        `;
    });

    totalSpan.textContent = total;

    contador.textContent = cantidadTotal;
}

// ==========================
// 🔍 BUSCADOR
// ==========================
const buscador = document.getElementById("buscador");
const buscarBtn = document.getElementById("buscarBtn");

function realizarBusqueda(texto) {
    const q = (texto || "").trim();

    // delegado al backend para buscar entre productos de todos los usuarios
    cargarProductos(q);
}

if (buscador) {
    buscador.addEventListener("input", e => {
        // búsqueda instantánea al escribir
        realizarBusqueda(e.target.value);
    });

    // permitir buscar con Enter
    buscador.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            realizarBusqueda(buscador.value);
        }
    });
}

if (buscarBtn) {
    buscarBtn.addEventListener("click", () => {
        const texto = buscador ? buscador.value : "";
        realizarBusqueda(texto);
    });
}

function renderPagination(total, page, limit) {
    const nav = document.getElementById('paginationNav');
    if (!nav) return;

    const totalPages = Math.max(1, Math.ceil(total / limit));
    let html = `<ul class="pagination justify-content-center">`;

    const createPageItem = (p, label, disabled = false, active = false) => {
        return `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}"><button class="page-link" data-page="${p}" ${disabled ? 'disabled' : ''}>${label}</button></li>`;
    };

    html += createPageItem(1, '«', page === 1, page === 1);

    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    for (let p = start; p <= end; p++) {
        html += createPageItem(p, p, false, p === page);
    }

    html += createPageItem(totalPages, '»', page === totalPages, page === totalPages);

    html += `</ul>`;

    nav.innerHTML = html;

    // attach handlers
    nav.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = parseInt(btn.getAttribute('data-page'));
            cargarProductos(lastSearch, p, pageSize);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ==========================
// 🔽 ORDENAR
// ==========================
const ordenar = document.getElementById("ordenar");

if (ordenar) {

    ordenar.addEventListener("change", e => {

        let productos = [...productosGlobal];

        if (e.target.value === "menor") {

            productos.sort((a, b) => a.precio - b.precio);
        }

        if (e.target.value === "mayor") {

            productos.sort((a, b) => b.precio - a.precio);
        }

        mostrarProductos(productos);
    });
}

// ==========================
// ➕ CREAR PRODUCTO
// ==========================
const form = document.getElementById("formProducto");

if (form) {

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const formData = new FormData();
        formData.append('id_usuario', usuario.id_usuario);
        formData.append('nombre_producto', document.getElementById("nombre").value);
        formData.append('marca', document.getElementById("marca").value);
        formData.append('modelo', document.getElementById("modelo").value);
        formData.append('precio', Number(document.getElementById("precio").value));
        formData.append('stock', Number(document.getElementById("stock").value));
        const imagenInput = document.getElementById("imagen");
        if (imagenInput.files[0]) {
            formData.append('imagen', imagenInput.files[0]);
        }

        const imagenesInput = document.getElementById("imagenes");
        if (imagenesInput && imagenesInput.files.length > 0) {
            for (const file of imagenesInput.files) {
                formData.append('imagenes', file);
            }
        }

        // campos adicionales
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('condicion', document.getElementById('condicion').value);
        formData.append('color', document.getElementById('color').value);
        formData.append('almacenamiento', document.getElementById('almacenamiento').value);
        formData.append('categoria', document.getElementById('categoria').value);
        const ship = document.getElementById('shipping_cost').value;
        if (ship) formData.append('shipping_cost', ship);
        const back = document.getElementById('allow_backorder').checked;
        formData.append('allow_backorder', back ? 1 : 0);

        try {

            const response = await fetch(
                window.location.origin + "/productos",
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Error al publicar el producto');
            }

            const data = await response.json();

            showNotification("Producto publicado exitosamente");

            form.reset();
            cargarProductos();

            if (publishCard && publishToggleBtn) {
                publishCard.classList.add("d-none");
                publishToggleBtn.classList.remove("d-none");
            }
        } catch (error) {
            console.error(
                "Error agregando producto:",
                error
            );
            showNotification("Error al publicar el producto: " + error.message);
        }
    });
}

const publishToggleBtn = document.getElementById("publishToggleBtn");
const publishCard = document.getElementById("publishCard");
const cancelPublishBtn = document.getElementById("cancelPublishBtn");

if (publishToggleBtn && publishCard) {
    publishToggleBtn.addEventListener("click", () => {
        publishCard.classList.remove("d-none");
        publishToggleBtn.classList.add("d-none");
        document.getElementById("nombre").focus();
    });
}

if (cancelPublishBtn && publishCard && publishToggleBtn) {
    cancelPublishBtn.addEventListener("click", () => {
        publishCard.classList.add("d-none");
        publishToggleBtn.classList.remove("d-none");
    });
}

// ==========================
// ❌ ELIMINAR PRODUCTO
// ==========================
async function eliminarProducto(id) {

    try {

        await fetch(
            window.location.origin + `/productos/${id}`,
            {
                method: "DELETE"
            }
        );

        cargarProductos();

    } catch (error) {

        console.error(
            "Error eliminando producto:",
            error
        );
    }
}

// ==========================
// ✏️ EDITAR PRODUCTO
// ==========================
async function editarProducto(
    id,
    nombre,
    marca,
    modelo,
    precio,
    stock
) {

    const nuevoNombre =
        prompt("Nuevo nombre:", nombre);

    const nuevaMarca =
        prompt("Nueva marca:", marca);

    const nuevoModelo =
        prompt("Nuevo modelo:", modelo);

    const nuevoPrecio =
        prompt("Nuevo precio:", precio);

    const nuevoStock =
        prompt("Nuevo stock:", stock);

    const productoActualizado = {

        nombre_producto: nuevoNombre,

        marca: nuevaMarca,

        modelo: nuevoModelo,

        precio: nuevoPrecio,

        stock: nuevoStock
    };

    try {

        await fetch(
            window.location.origin + `/productos/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    productoActualizado
                )
            }
        );

        cargarProductos();

    } catch (error) {

        console.error(
            "Error editando producto:",
            error
        );
    }
}

// ==========================
// 👤 USUARIO LOGUEADO
// ==========================
const usuarioInfo =
    document.getElementById("usuarioInfo");

if (usuarioInfo && usuario) {

    usuarioInfo.innerHTML = `
        Bienvenido ${usuario.nombre}
    `;
}

// ==========================
// 🚪 LOGOUT
// ==========================
const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {
        console.log("Logout clicked");
        localStorage.removeItem("usuario");

        window.location.href =
            "login.html";
    });
}

// ==========================
// 💳 SIMULAR COMPRA
// ==========================
async function simularCompra() {

    if (!carrito.length) {
        return alert("El carrito está vacío");
    }

    try {
        const response = await fetch(window.location.origin + "/comprar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_cliente: usuario.id_usuario,
                id_empleado: null,
                carrito: carrito.map(item => ({
                    id: item.id,
                    cantidad: item.cantidad,
                    precio: item.precio
                }))
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return alert(data.message || "No se pudo completar la compra");
        }

        showNotification("Compra realizada correctamente");
        vaciarCarrito();
        cargarProductos();
    } catch (error) {
        console.error("Error realizando compra:", error);
        alert("Error al procesar la compra");
    }
}

// ==========================
// 🚀 INIT
// ==========================
if (!usuario) {
    window.location.href = "login.html";
} else {
    cargarProductos("", 1, pageSize);
    renderCarrito();
}

// ==========================
// 🏷️ CALIFICAR PRODUCTO
// ==========================
async function rateProduct(id) {
    if (!usuario || !usuario.id_usuario) {
        return alert('Debes iniciar sesión para calificar');
    }

    const rating = parseInt(prompt('Calificación (1-5):'));
    if (!rating || rating < 1 || rating > 5) return alert('Calificación inválida');

    const comentario = prompt('Comentario (opcional):');

    try {
        const res = await fetch(window.location.origin + `/productos/${id}/ratings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: usuario.id_usuario, rating, comentario })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al calificar');

        showNotification('Gracias por tu calificación');
        cargarProductos(lastSearch, currentPage, pageSize);
    } catch (err) {
        console.error(err);
        alert('Error al enviar la calificación');
    }
}