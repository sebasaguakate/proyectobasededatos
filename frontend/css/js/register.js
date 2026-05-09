const usuarioLogeado = JSON.parse(localStorage.getItem("usuario"));

if (usuarioLogeado) {
    window.location.href = "index.html";
}

const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        correo: document.getElementById("correo").value,
        contraseña: document.getElementById("contraseña").value
    };

    const errorBox = document.getElementById("registerError");
    errorBox.classList.add("d-none");
    errorBox.textContent = "";

    try {
        const url = window.location.origin + "/auth/register";
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Registro exitoso. Ahora inicia sesión.");
            window.location.href = "login.html";
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