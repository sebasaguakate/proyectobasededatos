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

    try {
        const res = await fetch("http://localhost:3000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Login correcto");
            localStorage.setItem("usuario", JSON.stringify(data.usuario));
            window.location.href = "index.html";
        } else {
            alert(data.message || "Correo o contraseña incorrectos");
        }
    } catch (error) {
        console.error(error);
        alert("Error del servidor");
    }
});