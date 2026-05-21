const usuario = JSON.parse(localStorage.getItem('usuario')) || null;
const perfilStorage = JSON.parse(localStorage.getItem('perfilTienda')) || {};

const usuarioInfo = document.getElementById('usuarioInfo');
const logoutBtn = document.getElementById('logoutBtn');
const perfilForm = document.getElementById('perfilForm');
const resetPerfilBtn = document.getElementById('resetPerfilBtn');
const perfilError = document.getElementById('perfilError');
const perfilSuccess = document.getElementById('perfilSuccess');

const fields = {
    nombreTienda: document.getElementById('nombreTienda'),
    descripcion: document.getElementById('descripcion'),
    direccion: document.getElementById('direccion'),
    telefono: document.getElementById('telefono'),
    email: document.getElementById('email'),
    horario: document.getElementById('horario'),
    whatsapp: document.getElementById('whatsapp'),
    redes: document.getElementById('redes'),
    nombrePropietario: document.getElementById('nombrePropietario'),
    documento: document.getElementById('documento')
};

const preview = {
    nombre: document.getElementById('previewNombre'),
    descripcion: document.getElementById('previewDescripcion'),
    direccion: document.getElementById('previewDireccion'),
    telefono: document.getElementById('previewTelefono'),
    email: document.getElementById('previewEmail'),
    horario: document.getElementById('previewHorario'),
    whatsapp: document.getElementById('previewWhatsapp'),
    redes: document.getElementById('previewRedes'),
    propietario: document.getElementById('previewPropietario'),
    documento: document.getElementById('previewDocumento'),
    usuario: document.getElementById('previewUser')
};

function mostrarUsuario() {
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    if (usuarioInfo) {
        usuarioInfo.textContent = `Hola, ${usuario.nombre}`;
    }

    if (preview.usuario) {
        preview.usuario.textContent = `${usuario.nombre} (${usuario.correo || 'sin correo'})`;
    }
}

function validarPerfil(data) {
    const errors = [];

    if (!data.nombreTienda || data.nombreTienda.trim().length < 3) {
        errors.push('El nombre de la tienda debe tener al menos 3 caracteres.');
    }
    if (!data.descripcion || data.descripcion.trim().length < 20) {
        errors.push('La descripción debe tener al menos 20 caracteres.');
    }
    if (!data.direccion || data.direccion.trim().length < 5) {
        errors.push('La dirección es obligatoria.');
    }
    if (!data.telefono || data.telefono.trim().length < 7) {
        errors.push('El teléfono debe ser válido.');
    }
    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email.trim())) {
        errors.push('El correo de contacto no es válido.');
    }
    if (!data.horario || data.horario.trim().length < 5) {
        errors.push('El horario de atención es obligatorio.');
    }
    if (!data.nombrePropietario || data.nombrePropietario.trim().length < 3) {
        errors.push('El nombre del propietario debe tener al menos 3 caracteres.');
    }
    if (!data.documento || data.documento.trim().length < 5) {
        errors.push('El documento o NIT es obligatorio.');
    }

    return errors;
}

function cargarPerfil() {
    const data = {
        nombreTienda: perfilStorage.nombreTienda || '',
        descripcion: perfilStorage.descripcion || '',
        direccion: perfilStorage.direccion || '',
        telefono: perfilStorage.telefono || '',
        email: perfilStorage.email || usuario?.correo || '',
        horario: perfilStorage.horario || 'Lun a Vie 9:00 a 18:00',
        whatsapp: perfilStorage.whatsapp || '',
        redes: perfilStorage.redes || '',
        nombrePropietario: perfilStorage.nombrePropietario || usuario?.nombre || '',
        documento: perfilStorage.documento || ''
    };

    Object.entries(data).forEach(([key, value]) => {
        if (fields[key]) {
            fields[key].value = value;
        }
    });

    renderPreview(data);
}

function renderPreview(data) {
    preview.nombre.textContent = data.nombreTienda || 'Nombre de tienda aún no guardado';
    preview.descripcion.textContent = data.descripcion || 'Agrega una descripción real y atractiva de tu negocio.';
    preview.direccion.textContent = data.direccion || '-';
    preview.telefono.textContent = data.telefono || '-';
    preview.email.textContent = data.email || '-';
    preview.horario.textContent = data.horario || '-';
    preview.whatsapp.textContent = data.whatsapp || '-';
    preview.redes.textContent = data.redes || '-';
    preview.propietario.textContent = data.nombrePropietario || '-';
    preview.documento.textContent = data.documento || '-';
}

function guardarPerfil(data) {
    localStorage.setItem('perfilTienda', JSON.stringify(data));
}

perfilForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const nuevoPerfil = {
        nombreTienda: fields.nombreTienda.value.trim(),
        descripcion: fields.descripcion.value.trim(),
        direccion: fields.direccion.value.trim(),
        telefono: fields.telefono.value.trim(),
        email: fields.email.value.trim(),
        horario: fields.horario.value.trim(),
        whatsapp: fields.whatsapp.value.trim(),
        redes: fields.redes.value.trim(),
        nombrePropietario: fields.nombrePropietario.value.trim(),
        documento: fields.documento.value.trim()
    };

    const errores = validarPerfil(nuevoPerfil);
    if (errores.length) {
        perfilError.textContent = errores.join(' ');
        perfilError.classList.remove('d-none');
        perfilSuccess.classList.add('d-none');
        return;
    }

    perfilError.classList.add('d-none');
    guardarPerfil(nuevoPerfil);
    renderPreview(nuevoPerfil);
    perfilSuccess.classList.remove('d-none');
    window.setTimeout(() => perfilSuccess.classList.add('d-none'), 4000);
});

resetPerfilBtn.addEventListener('click', () => {
    localStorage.removeItem('perfilTienda');
    Object.values(fields).forEach(input => { if (input) input.value = ''; });
    renderPreview({});
    perfilSuccess.classList.remove('d-none');
    perfilSuccess.textContent = 'Perfil restablecido.';
    setTimeout(() => {
        perfilSuccess.classList.add('d-none');
        perfilSuccess.textContent = 'Perfil guardado correctamente.';
    }, 3000);
});

mostrarUsuario();
cargarPerfil();

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('usuario');
        localStorage.removeItem('carrito');
        window.location.href = 'login.html';
    });
}
