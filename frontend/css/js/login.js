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

const usuarioLogeado = JSON.parse(localStorage.getItem("usuario"));

if (usuarioLogeado) {
    window.location.href = "index.html";
}

const form = document.getElementById("loginForm");

function isValidEmail(value) {
    return /^\S+@\S+\.\S+$/.test(value);
}

function validateLoginData(datos) {
    const errors = [];
    if (!datos.correo || !datos.correo.trim()) {
        errors.push('El correo es obligatorio.');
    } else if (!isValidEmail(datos.correo.trim())) {
        errors.push('El correo no tiene un formato válido.');
    }
    if (!datos.password || !datos.password.trim()) {
        errors.push('La contraseña es obligatoria.');
    }
    return errors;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        correo: document.getElementById("correo").value,
        password: document.getElementById("contraseña").value
    };

    const errorBox = document.getElementById("loginError");
    errorBox.classList.add("d-none");
    errorBox.textContent = "";

    const validationErrors = validateLoginData(datos);
    if (validationErrors.length > 0) {
        errorBox.textContent = validationErrors.join(' ');
        errorBox.classList.remove('d-none');
        return;
    }

    try {
        const url = window.location.origin + "/auth/login";
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        if (data.success) {
            showNotification("Sesión iniciada correctamente");
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);
            return;
        }

        const messages = [];
        if (data.errors) {
            Object.values(data.errors).forEach((msg) => {
                if (msg) messages.push(msg);
            });
        }
        if (data.message) {
            messages.push(data.message);
        }

        errorBox.textContent = messages.join(" \n");
        errorBox.classList.remove("d-none");
    } catch (error) {
        console.error(error);
        errorBox.textContent = "Error del servidor. Intenta nuevamente.";
        errorBox.classList.remove("d-none");
    }
});