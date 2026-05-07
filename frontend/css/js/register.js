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

    try {
        const res = await fetch("http://localhost:3000/auth/register", {
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
        } else {
            alert(data.message || "Error registrando usuario");
        }
    } catch (error) {
        console.error(error);
        alert("Error del servidor");
    }
});