const usuarioLogeado = JSON.parse(localStorage.getItem("usuario"));

if (usuarioLogeado) {
    window.location.href = "index.html";
}

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        correo: document.getElementById("correo").value,
        contraseña: document.getElementById("contraseña").value
    };

    const errorBox = document.getElementById("loginError");
    errorBox.classList.add("d-none");
    errorBox.textContent = "";

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