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
async function cargarProductos(search = "", page = 1, limit = pageSize, tipo = "" ) {
    lastSearch = search;
    currentPage = page;
    pageSize = limit;

    try {
        let url = window.location.origin + "/productos";
        const params = [];

        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (page) params.push(`page=${page}`);
        if (limit) params.push(`limit=${limit}`);
        if (tipo) params.push(`tipo=${encodeURIComponent(tipo)}`);
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

async function cargarPublicidadDestacada() {
    const container = document.getElementById('adsContainer');
    if (!container) return;

    try {
        const res = await fetch(window.location.origin + '/publicidades');
        const data = await res.json();
        const rows = data.rows || [];

        if (!rows.length) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-secondary text-center">Aún no hay productos destacados.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = rows.map(p => `
            <div class="col-md-4">
                <div class="ad-card h-100">
                    <img src="${p.imagen || 'https://via.placeholder.com/800x500'}" alt="${p.nombre_producto}" class="img-fluid rounded-4 mb-3">
                    <h5>${p.nombre_producto}</h5>
                    <p class="text-muted">${p.marca} ${p.modelo}</p>
                    <p class="text-success mb-3">$${p.precio}</p>
                    <button class="btn btn-sm btn-outline-light" onclick="window.location.href='producto.html?id=${p.id_producto}'">Ver producto</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando publicidad destacada:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">No se pudo cargar la publicidad destacada.</div>
            </div>
        `;
    }
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

        if (!usuario || !usuario.id_usuario) {
            showNotification('Debes iniciar sesión para publicar un producto');
            return;
        }

        const formData = new FormData();
        formData.append('id_usuario', usuario.id_usuario);
        formData.append('nombre_producto', document.getElementById("nombre").value);
        formData.append('marca', document.getElementById("marca").value);
        formData.append('modelo', document.getElementById("modelo").value);
        formData.append('precio', Number(document.getElementById("precio").value));
        formData.append('stock', Number(document.getElementById("stock").value));
        formData.append('tipo_producto', document.getElementById("tipoProducto").value);
        
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

        if (document.getElementById('tipoProducto').value === 'accesorio') {
            const tipoAccesorio = document.getElementById('tipoAccesorio').value;
            const parentDeviceValue = document.getElementById('parentDevice').value;
            formData.append('tipo_accesorio', tipoAccesorio);
            if (parentDeviceValue) {
                formData.append('parent_device_name', parentDeviceValue);
            }
        }

        try {

            const response = await fetch(
                window.location.origin + "/productos",
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                const text = await response.text();
                console.error("Publicar producto response error:", response.status, text);

                let message = `Error al publicar el producto (${response.status})`;
                try {
                    const errorData = JSON.parse(text);
                    if (errorData?.message) {
                        message = errorData.message;
                    } else if (text) {
                        message = `Error al publicar el producto: ${text}`;
                    }
                } catch (parseError) {
                    if (text) {
                        message = `Error al publicar el producto: ${text}`;
                    }
                }

                throw new Error(message);
            }

            const data = await response.json();

            showNotification("Producto publicado exitosamente");

            form.reset();
            document.getElementById("tipoProducto").value = "celular";
            cargarProductos();

            if (publishCard && publishPhoneBtn) {
                publishCard.classList.add("d-none");
                publishPhoneBtn.classList.remove("d-none");
                publishAccessoryBtn.classList.remove("d-none");
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

const publishPhoneBtn = document.getElementById("publishPhoneBtn");
const publishAccessoryBtn = document.getElementById("publishAccessoryBtn");
const publishCard = document.getElementById("publishCard");
const cancelPublishBtn = document.getElementById("cancelPublishBtn");
const tipoProductoInput = document.getElementById("tipoProducto");
const parentDeviceContainer = document.getElementById("parentDeviceContainer");
const accessoryTypeContainer = document.getElementById("accessoryTypeContainer");
const formTitle = document.getElementById("formTitle");

function showPublishForm(tipo) {
    if (publishCard) {
        publishCard.classList.remove("d-none");
        publishPhoneBtn.classList.add("d-none");
        publishAccessoryBtn.classList.add("d-none");
    }
    if (tipoProductoInput) {
        tipoProductoInput.value = tipo;
    }
    if (formTitle) {
        formTitle.textContent = tipo === "accesorio" ? "Publicar accesorio" : "Publicar celular";
    }
    if (parentDeviceContainer) {
        parentDeviceContainer.style.display = tipo === "accesorio" ? "block" : "none";
        if (tipo === "accesorio") {
            cargarCelularesDisponibles();
        }
    }
    if (accessoryTypeContainer) {
        accessoryTypeContainer.style.display = tipo === "accesorio" ? "block" : "none";
    }
    const nombreInput = document.getElementById("nombre");
    if (nombreInput) {
        nombreInput.placeholder = tipo === "accesorio" ? "Ej: Cable USB-C, Vidrio templado" : "Ej: iPhone 15 Pro";
        nombreInput.focus();
    }

    // Mostrar/ocultar campos específicos para celulares vs accesorios
    const phoneOnlyEls = document.querySelectorAll('.phone-only');
    phoneOnlyEls.forEach(el => {
        el.style.display = tipo === 'celular' ? 'block' : 'none';
        el.querySelectorAll('input, select, textarea').forEach(i => {
            try { i.required = tipo === 'celular'; } catch(e) {}
        });
    });

    const accessoryOnlyEls = document.querySelectorAll('.accessory-only');
    accessoryOnlyEls.forEach(el => {
        el.style.display = tipo === 'accesorio' ? 'block' : 'none';
        el.querySelectorAll('input, select, textarea').forEach(i => {
            try { i.required = tipo === 'accesorio'; } catch(e) {}
        });
    });
}

async function cargarCelularesDisponibles() {
    try {
        const res = await fetch(window.location.origin + "/productos?tipo=celular&limit=999");
        const data = await res.json();
        const celulares = Array.isArray(data) ? data : (data.rows || []);
        
        const select = document.getElementById("parentDevice");
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Seleccionar un celular...</option>';
            celulares.forEach(cel => {
                const option = document.createElement("option");
                option.value = cel.nombre_producto;
                option.textContent = `${cel.nombre_producto} (${cel.marca} ${cel.modelo})`;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    } catch (error) {
        console.error("Error cargando celulares:", error);
    }
}

if (publishPhoneBtn && publishCard) {
    publishPhoneBtn.addEventListener("click", () => {
        showPublishForm("celular");
    });
}

if (publishAccessoryBtn && publishCard) {
    publishAccessoryBtn.addEventListener("click", () => {
        showPublishForm("accesorio");
    });
}

if (cancelPublishBtn && publishCard && publishPhoneBtn) {
    cancelPublishBtn.addEventListener("click", () => {
        publishCard.classList.add("d-none");
        publishPhoneBtn.classList.remove("d-none");
        publishAccessoryBtn.classList.remove("d-none");
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
    cargarPublicidadDestacada();
    cargarModelosCelulares();
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

// =========================
// CARGAR MODELOS DE CELULARES
// =========================
async function cargarModelosCelulares() {
    const container = document.getElementById('modelsContainer');
    if (!container) return;

    try {
        const res = await fetch(window.location.origin + '/productos?tipo=celular&limit=999');
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.rows || []);

        // obtener combinaciones únicas Marca Modelo
        const seen = new Map();
        rows.forEach(p => {
            const key = `${p.marca || ''} ${p.modelo || ''}`.trim();
            if (!key) return;
            if (!seen.has(key)) seen.set(key, { marca: p.marca, modelo: p.modelo });
        });

        container.innerHTML = '';
        if (seen.size === 0) {
            container.innerHTML = '<div class="text-muted">No hay modelos disponibles.</div>';
            return;
        }

        seen.forEach((val, key) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'model-chip';
            btn.textContent = key;
            btn.dataset.modelo = val.modelo || key;
            btn.addEventListener('click', () => {
                // toggle active
                document.querySelectorAll('.model-chip').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                // buscar por modelo (nombre semejante)
                const query = val.modelo || key;
                lastSearch = query;
                cargarProductos(query, 1, pageSize);
                const productosSection = document.getElementById('productos');
                if (productosSection) productosSection.scrollIntoView({ behavior: 'smooth' });
            });
            container.appendChild(btn);
        });

    } catch (error) {
        console.error('Error cargando modelos:', error);
        container.innerHTML = '<div class="text-muted">Error cargando modelos</div>';
    }
}