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

// ==========================
// 📦 CARGAR PRODUCTOS
// ==========================
async function cargarProductos() {

    try {

        const res = await fetch(window.location.origin + "/productos");

        const productos = await res.json();

        productosGlobal = productos;

        mostrarProductos(productos);

    } catch (error) {

        console.error("Error cargando productos:", error);
    }
}

// ==========================
// 🖼️ MOSTRAR PRODUCTOS
// ==========================
function mostrarProductos(productos) {

    const cont = document.getElementById("productos");

    cont.innerHTML = "";

    productos.filter(p => p.stock > 0).forEach(p => {

        cont.innerHTML += `
        
        <div class="col-md-4 mb-4">

            <div class="card shadow h-100">

                <img
                    src="${p.imagen || 'https://via.placeholder.com/300'}"
                    class="card-img-top"
                    style="height:250px; object-fit:cover;"
                >

                <div class="card-body">

                    <h4 class="card-title">
                        ${p.nombre_producto}
                    </h4>

                    <p>
                        <strong>Marca:</strong>
                        ${p.marca}
                    </p>

                    <p>
                        <strong>Modelo:</strong>
                        ${p.modelo}
                    </p>

                    <p>
                        <strong>Vendedor:</strong>
                        ${p.nombre}
                    </p>

                    <p class="fw-bold text-success">
                        $${p.precio}
                    </p>

                    <p class="text-muted">
                        Stock: ${p.stock}
                    </p>

                    <button
                        class="btn btn-success w-100 mb-2"
                        onclick="agregar(${p.id_producto}, ${p.precio})"
                        ${p.stock === 0 ? "disabled" : ""}
                    >
                        ${p.stock === 0 ? "Agotado" : "Comprar"}
                    </button>

                    <button
                        class="btn btn-warning w-100 mb-2"
                        onclick="editarProducto(
                            ${p.id_producto},
                            '${p.nombre_producto}',
                            '${p.marca}',
                            '${p.modelo}',
                            ${p.precio},
                            ${p.stock}
                        )"
                    >
                        Editar
                    </button>

                    <button
                        class="btn btn-danger w-100"
                        onclick="eliminarProducto(${p.id_producto})"
                    >
                        Eliminar
                    </button>

                </div>

            </div>

        </div>
        `;
    });
}

// ==========================
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

if (buscador) {

    buscador.addEventListener("input", e => {

        const texto = e.target.value.toLowerCase();

        const filtrados = productosGlobal.filter(p =>

            p.nombre_producto.toLowerCase().includes(texto)

            ||

            p.marca.toLowerCase().includes(texto)
        );

        mostrarProductos(filtrados);
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

        try {

            await fetch(
                window.location.origin + "/productos",
                {
                    method: "POST",
                    body: formData
                }
            );

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
    return;
}

cargarProductos();

renderCarrito();