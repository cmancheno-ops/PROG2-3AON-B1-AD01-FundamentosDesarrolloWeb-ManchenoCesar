/* ==========================================================================
   MotorPro - Portal de mantenimiento automotriz
   Programación II - AD01 Fundamentos de desarrollo web
   Autor: César Mancheno

   Contenido del archivo:
     1. Datos base (diccionarios y arrays de objetos)
     2. Persistencia en localStorage / sessionStorage
     3. Utilidades
     4. Módulo 1 - Catálogo de servicios
     5. Login, sesión y control de roles
     6. Módulo 2 - Formulario y validaciones
     7. Módulo 3 - Vistas del cliente (perfil y mis mantenimientos)
     8. Módulo 3 - Administración (CRUD, estados y cuentas)
     9. Eventos e inicialización
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. DATOS BASE
   -------------------------------------------------------------------------- */

// Diccionario de servicios: la clave es el código y el valor un objeto con sus datos.
const SERVICIOS = {
  "aceite":      { nombre: "Cambio de aceite y filtros", precio: 45,  duracion: "1 h",   icono: "bi-droplet-half" },
  "frenos":      { nombre: "Revisión de frenos",         precio: 60,  duracion: "2 h",   icono: "bi-disc" },
  "afinamiento": { nombre: "Afinamiento de motor",       precio: 90,  duracion: "3 h",   icono: "bi-gear" },
  "alineacion":  { nombre: "Alineación y balanceo",      precio: 35,  duracion: "1 h",   icono: "bi-bullseye" },
  "electrico":   { nombre: "Diagnóstico eléctrico",      precio: 40,  duracion: "1.5 h", icono: "bi-lightning-charge" },
  "preventivo":  { nombre: "Mantenimiento preventivo por kilometraje", precio: 120, duracion: "4 h", icono: "bi-speedometer2" }
};

// Diccionario de estados: estado -> color de Bootstrap para el badge.
const ESTADOS = {
  "Pendiente":   "secondary",
  "En revisión": "info",
  "En proceso":  "primary",
  "Finalizado":  "success",
  "Cancelado":   "danger"
};

const MARCAS = ["Chevrolet", "Kia", "Hyundai", "Toyota", "Nissan", "Mazda", "Renault", "Ford", "Volkswagen", "Great Wall", "Otra"];

const ADICIONALES = ["Lavado exterior", "Revisión de llantas", "Recarga de aire acondicionado", "Revisión de luces"];

// Horario de atención: lunes a viernes 08:00-17:00 (último turno 16:00), sábado 08:00-12:00 (último turno 11:00).
const HORAS_DISPONIBLES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const ULTIMA_HORA_SABADO = "11:00";

// Usuarios de prueba (tres o más usuarios y dos roles).
// NOTA: guardar contraseñas en el frontend NO es seguro; se hace solo porque la práctica no tiene backend.
const USUARIOS_INICIALES = [
  { id: 1, usuario: "admin",    clave: "Admin2026*",   rol: "Administrador", nombre: "Diego Andrade",  telefono: "0991112233", email: "admin@motorpro.ec",    activo: true },
  { id: 2, usuario: "mlopez",   clave: "Cliente2026*", rol: "Cliente",       nombre: "María López",    telefono: "0987654321", email: "maria.lopez@mail.com", activo: true },
  { id: 3, usuario: "jvera",    clave: "Cliente2026*", rol: "Cliente",       nombre: "Jorge Vera",     telefono: "0976543210", email: "jorge.vera@mail.com",  activo: true },
  { id: 4, usuario: "atorres",  clave: "Cliente2026*", rol: "Cliente",       nombre: "Ana Torres",     telefono: "0965432109", email: "ana.torres@mail.com",  activo: false } // cuenta deshabilitada
];

// Solicitudes de ejemplo para que los listados no aparezcan vacíos.
const SOLICITUDES_INICIALES = [
  {
    id: "SOL-0001", usuarioId: 2,
    cliente:  { nombre: "María López", telefono: "0987654321", email: "maria.lopez@mail.com" },
    vehiculo: { placa: "PBA-1234", marca: "Kia", modelo: "Rio", anio: 2019, kilometraje: 45000, combustible: "Gasolina" },
    servicio: "aceite", adicionales: ["Lavado exterior"], fecha: "2026-11-03", hora: "09:00",
    observaciones: "Cambio de aceite sintético.", estado: "Finalizado", creadoEn: "2026-10-28T10:15:00"
  },
  {
    id: "SOL-0002", usuarioId: 2,
    cliente:  { nombre: "María López", telefono: "0987654321", email: "maria.lopez@mail.com" },
    vehiculo: { placa: "PBA-1234", marca: "Kia", modelo: "Rio", anio: 2019, kilometraje: 46200, combustible: "Gasolina" },
    servicio: "frenos", adicionales: [], fecha: "2026-11-20", hora: "10:00",
    observaciones: "Chirrido al frenar.", estado: "Pendiente", creadoEn: "2026-11-05T18:40:00"
  },
  {
    id: "SOL-0003", usuarioId: 3,
    cliente:  { nombre: "Jorge Vera", telefono: "0976543210", email: "jorge.vera@mail.com" },
    vehiculo: { placa: "GSD-987", marca: "Toyota", modelo: "Hilux", anio: 2015, kilometraje: 182000, combustible: "Diésel" },
    servicio: "preventivo", adicionales: ["Revisión de llantas", "Revisión de luces"], fecha: "2026-11-18", hora: "08:00",
    observaciones: "", estado: "En revisión", creadoEn: "2026-11-06T09:05:00"
  }
];

// Arrays de trabajo (se cargan desde localStorage en inicializar()).
let usuarios = [];
let solicitudes = [];
let usuarioActual = null;   // objeto del usuario con sesión iniciada

/* --------------------------------------------------------------------------
   2. PERSISTENCIA
   -------------------------------------------------------------------------- */

const CLAVE_SOLICITUDES = "motorpro_solicitudes";
const CLAVE_USUARIOS    = "motorpro_usuarios";
const CLAVE_SESION      = "motorpro_sesion";

function cargarDatos() {
  // JSON.parse convierte el texto guardado de vuelta en arrays de objetos.
  // structuredClone evita modificar las constantes iniciales.
  solicitudes = JSON.parse(localStorage.getItem(CLAVE_SOLICITUDES)) || structuredClone(SOLICITUDES_INICIALES);
  usuarios    = JSON.parse(localStorage.getItem(CLAVE_USUARIOS))    || structuredClone(USUARIOS_INICIALES);
  guardarDatos();
}

function guardarDatos() {
  localStorage.setItem(CLAVE_SOLICITUDES, JSON.stringify(solicitudes));
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

/* --------------------------------------------------------------------------
   3. UTILIDADES
   -------------------------------------------------------------------------- */

const $ = (id) => document.getElementById(id);

// Escapa caracteres HTML para evitar inyección de código (XSS) al usar innerHTML.
function escaparHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// Fecha local en formato AAAA-MM-DD (input type="date" usa este formato).
function fechaLocalISO(fecha = new Date()) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

function formatearFecha(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function badgeEstado(estado) {
  return `<span class="badge bg-${ESTADOS[estado] || "secondary"}">${escaparHTML(estado)}</span>`;
}

// Genera el siguiente ID con formato SOL-0001 a partir del número mayor existente.
function generarId() {
  let mayor = 0;
  for (const s of solicitudes) {
    const numero = parseInt(s.id.split("-")[1], 10);
    if (numero > mayor) mayor = numero;
  }
  return "SOL-" + String(mayor + 1).padStart(4, "0");
}

const esAdmin = () => usuarioActual !== null && usuarioActual.rol === "Administrador";

function toast(icono, titulo) {
  Swal.fire({ toast: true, position: "top-end", icon: icono, title: titulo, showConfirmButton: false, timer: 2200, timerProgressBar: true });
}

/* --------------------------------------------------------------------------
   4. MÓDULO 1 - CATÁLOGO DE SERVICIOS
   -------------------------------------------------------------------------- */

function renderizarCatalogo() {
  // Object.entries convierte el diccionario en pares [codigo, servicio]; map() genera el HTML de cada tarjeta.
  $("catalogoServicios").innerHTML = Object.entries(SERVICIOS).map(([codigo, s]) => `
    <div class="col-sm-6 col-lg-4">
      <article class="card h-100 tarjeta-servicio">
        <div class="card-body">
          <i class="bi ${s.icono} icono"></i>
          <h3 class="h5 card-title mt-2">${s.nombre}</h3>
          <p class="card-text text-muted mb-1"><i class="bi bi-clock"></i> Duración aprox.: ${s.duracion}</p>
          <p class="card-text fw-bold">Desde $${s.precio.toFixed(2)}</p>
        </div>
        <div class="card-footer bg-transparent border-0">
          <button class="btn btn-outline-itsco btn-sm btn-agendar" data-servicio="${codigo}">Agendar este servicio</button>
        </div>
      </article>
    </div>`).join("");
}

// Llena los select, radios y checkboxes del formulario a partir de los datos base.
function llenarOpcionesFormulario() {
  MARCAS.forEach(m => $("marca").insertAdjacentHTML("beforeend", `<option value="${m}">${m}</option>`));

  for (const codigo in SERVICIOS) {
    $("servicio").insertAdjacentHTML("beforeend", `<option value="${codigo}">${SERVICIOS[codigo].nombre}</option>`);
  }

  for (let i = 0; i < HORAS_DISPONIBLES.length; i++) {
    $("hora").insertAdjacentHTML("beforeend", `<option value="${HORAS_DISPONIBLES[i]}">${HORAS_DISPONIBLES[i]}</option>`);
  }

  $("grupoAdicionales").innerHTML = ADICIONALES.map((a, i) => `
    <div class="form-check form-check-inline">
      <input class="form-check-input" type="checkbox" name="adicionales" id="adic${i}" value="${a}">
      <label class="form-check-label" for="adic${i}">${a}</label>
    </div>`).join("");

  Object.keys(ESTADOS).forEach(e => $("filtroEstado").insertAdjacentHTML("beforeend", `<option value="${e}">${e}</option>`));

  // Restricciones de los inputs: fecha mínima hoy y año máximo el siguiente.
  $("fecha").min = fechaLocalISO();
  $("anio").max = new Date().getFullYear() + 1;
}

/* --------------------------------------------------------------------------
   5. LOGIN, SESIÓN Y CONTROL DE ROLES
   -------------------------------------------------------------------------- */

function iniciarSesion(evento) {
  evento.preventDefault();
  const nombreUsuario = $("loginUsuario").value.trim().toLowerCase();
  const clave = $("loginClave").value;

  // Validación de credenciales
  if (nombreUsuario === "" || clave === "") {
    Swal.fire("Datos incompletos", "Ingrese usuario y contraseña.", "warning");
    return;
  }

  const usuario = usuarios.find(u => u.usuario === nombreUsuario);

  // Se usa el mismo mensaje para usuario inexistente y clave incorrecta
  // para no revelar qué usuarios existen (buena práctica de seguridad).
  if (!usuario || usuario.clave !== clave) {
    Swal.fire("Acceso inválido", "Usuario o contraseña incorrectos.", "error");
    $("loginClave").value = "";
    return;
  }

  if (!usuario.activo) {
    Swal.fire("Cuenta deshabilitada", "Su cuenta está deshabilitada. Comuníquese con el taller.", "error");
    return;
  }

  usuarioActual = usuario;
  sessionStorage.setItem(CLAVE_SESION, usuario.id);
  bootstrap.Modal.getOrCreateInstance($("modalLogin")).hide();
  $("formLogin").reset();
  actualizarInterfaz();
  Swal.fire({ icon: "success", title: `Bienvenido/a, ${usuario.nombre}`, text: `Rol: ${usuario.rol}`, timer: 1800, showConfirmButton: false });
  location.hash = "#perfil";
}

function cerrarSesion() {
  Swal.fire({
    title: "¿Cerrar sesión?", icon: "question", showCancelButton: true,
    confirmButtonText: "Sí, salir", cancelButtonText: "Cancelar"
  }).then(r => {
    if (!r.isConfirmed) return;
    usuarioActual = null;
    sessionStorage.removeItem(CLAVE_SESION);
    limpiarFormulario();
    actualizarInterfaz();
    location.hash = "#inicio";
    toast("info", "Sesión cerrada");
  });
}

function restaurarSesion() {
  const id = Number(sessionStorage.getItem(CLAVE_SESION));
  const usuario = usuarios.find(u => u.id === id);
  // Si la cuenta fue deshabilitada mientras tanto, no se restaura la sesión.
  usuarioActual = (usuario && usuario.activo) ? usuario : null;
}

// Muestra u oculta elementos según haya sesión y según el rol.
function actualizarInterfaz() {
  const haySesion = usuarioActual !== null;

  document.querySelectorAll(".solo-sesion").forEach(el => el.classList.toggle("d-none", !haySesion));
  document.querySelectorAll(".sin-sesion").forEach(el => el.classList.toggle("d-none", haySesion));
  document.querySelectorAll(".solo-admin").forEach(el => el.classList.toggle("d-none", !esAdmin()));

  // Secciones privadas: perfil, solicitud y mis mantenimientos para cualquier rol; admin solo para Administrador.
  ["perfil", "solicitud", "mis-mantenimientos"].forEach(id => $(id).classList.toggle("d-none", !haySesion));
  $("admin").classList.toggle("d-none", !esAdmin());

  if (haySesion) {
    $("usuarioNavbar").textContent = usuarioActual.nombre;
    $("usuarioNavbar").title = usuarioActual.rol;
    renderizarPerfil();
    renderizarMisSolicitudes();
    prepararFormularioNuevo();
  }
  if (esAdmin()) {
    llenarSelectClientes();
    renderizarAdmin();
  }
}

// Control de acceso a la sección de administración (prueba 5).
function verificarAccesoAdmin() {
  if (usuarioActual === null) {
    Swal.fire("Inicie sesión", "Debe iniciar sesión como Administrador para acceder.", "info")
      .then(() => bootstrap.Modal.getOrCreateInstance($("modalLogin")).show());
    return false;
  }
  if (!esAdmin()) {
    Swal.fire("Acceso denegado", "Su rol (Cliente) no tiene permisos para la Administración.", "error");
    return false;
  }
  return true;
}

// Cualquier operación administrativa llama a esta función antes de ejecutarse,
// así no se puede ejecutar desde la interfaz de cliente aunque se invoque desde la consola.
function exigirAdmin() {
  if (!esAdmin()) {
    Swal.fire("Acceso denegado", "Operación permitida solo para el Administrador.", "error");
    return false;
  }
  return true;
}

/* --------------------------------------------------------------------------
   6. MÓDULO 2 - FORMULARIO Y VALIDACIONES
   -------------------------------------------------------------------------- */

// Expresiones regulares de validación
const REGEX = {
  placa:    /^[A-Z]{3}-\d{3,4}$/,          // Ecuador: ABC-123 o ABC-1234
  telefono: /^(09\d{8}|0[2-7]\d{7})$/,     // celular 09XXXXXXXX o fijo 0X XXXXXXX
  email:    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  nombre:   /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{3,60}$/
};

// Lee el formulario y devuelve un objeto con los datos.
function leerFormulario() {
  const combustible = document.querySelector('input[name="combustible"]:checked');
  // Array.from + filter + map: obtiene los valores de los checkbox marcados.
  const adicionales = Array.from(document.querySelectorAll('input[name="adicionales"]'))
    .filter(chk => chk.checked)
    .map(chk => chk.value);

  return {
    nombre: $("nombre").value.trim(),
    telefono: $("telefono").value.trim(),
    email: $("email").value.trim().toLowerCase(),
    placa: $("placa").value.trim().toUpperCase(),
    marca: $("marca").value,
    modelo: $("modelo").value.trim(),
    anio: $("anio").value,
    kilometraje: $("kilometraje").value,
    combustible: combustible ? combustible.value : "",
    servicio: $("servicio").value,
    adicionales,
    fecha: $("fecha").value,
    hora: $("hora").value,
    observaciones: $("observaciones").value.trim(),
    aceptaTerminos: $("aceptaTerminos").checked
  };
}

// Valida los datos y devuelve un diccionario { campo: mensaje } con los errores encontrados.
function validarSolicitud(d, idEdicion) {
  const errores = {};
  const anioActual = new Date().getFullYear();

  if (!REGEX.nombre.test(d.nombre)) errores.nombre = "Ingrese un nombre válido (solo letras, mínimo 3).";
  if (!REGEX.telefono.test(d.telefono)) errores.telefono = "Teléfono inválido. Use 09XXXXXXXX (celular) o 02XXXXXXX (fijo).";
  if (!REGEX.email.test(d.email)) errores.email = "Correo electrónico inválido.";

  if (!REGEX.placa.test(d.placa)) errores.placa = "Formato de placa inválido. Ejemplo: PBA-1234 o ABC-123.";
  if (d.marca === "") errores.marca = "Seleccione la marca.";
  if (d.modelo.length < 2) errores.modelo = "Ingrese el modelo.";

  const anio = Number(d.anio);
  if (d.anio === "" || !Number.isInteger(anio) || anio < 1980 || anio > anioActual + 1) {
    errores.anio = `El año debe estar entre 1980 y ${anioActual + 1}.`;
  }

  const km = Number(d.kilometraje);
  if (d.kilometraje === "" || !Number.isInteger(km) || km < 0 || km > 999999) {
    errores.kilometraje = "Kilometraje inválido (número entero entre 0 y 999999).";
  }

  if (d.combustible === "") errores.combustible = "Seleccione el tipo de combustible.";
  if (!(d.servicio in SERVICIOS)) errores.servicio = "Seleccione un servicio del catálogo.";

  // Validación de fecha: no pasada, no domingo, máximo 60 días de anticipación.
  const solicitudOriginal = solicitudes.find(s => s.id === idEdicion);
  const fechaSinCambios = solicitudOriginal && solicitudOriginal.fecha === d.fecha;
  if (d.fecha === "") {
    errores.fecha = "Seleccione la fecha.";
  } else if (!fechaSinCambios) {
    const hoy = fechaLocalISO();
    const limite = new Date(); limite.setDate(limite.getDate() + 60);
    const diaSemana = new Date(d.fecha + "T00:00:00").getDay(); // 0 = domingo, 6 = sábado
    if (d.fecha < hoy) errores.fecha = "La fecha no puede ser anterior a hoy.";
    else if (d.fecha > fechaLocalISO(limite)) errores.fecha = "Solo se agenda con máximo 60 días de anticipación.";
    else if (diaSemana === 0) errores.fecha = "Los domingos el taller está cerrado.";
  }

  // Validación de horario
  if (!HORAS_DISPONIBLES.includes(d.hora)) {
    errores.hora = "Seleccione una hora de atención.";
  } else if (d.fecha !== "" && !errores.fecha) {
    const diaSemana = new Date(d.fecha + "T00:00:00").getDay();
    if (diaSemana === 6 && d.hora > ULTIMA_HORA_SABADO) errores.hora = "Los sábados se atiende hasta las 12:00 (último turno 11:00).";
    if (d.fecha === fechaLocalISO() && !fechaSinCambios) {
      const ahora = new Date();
      const horaActual = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
      if (d.hora <= horaActual) errores.hora = "Esa hora ya pasó. Elija una hora posterior.";
    }
  }

  // Evita duplicados: el mismo vehículo no puede tener dos solicitudes activas el mismo día.
  const duplicada = solicitudes.some(s =>
    s.id !== idEdicion && s.vehiculo.placa === d.placa && s.fecha === d.fecha && s.estado !== "Cancelado");
  if (duplicada && !errores.placa && !errores.fecha) errores.placa = "Ese vehículo ya tiene una solicitud para esa fecha.";

  if (!d.aceptaTerminos) errores.aceptaTerminos = "Debe aceptar el tratamiento de datos.";

  return errores;
}

// Marca en rojo los campos con error y muestra el mensaje debajo de cada uno.
function mostrarErrores(errores) {
  const campos = ["nombre", "telefono", "email", "placa", "marca", "modelo", "anio", "kilometraje", "servicio", "fecha", "hora", "aceptaTerminos"];
  campos.forEach(campo => {
    const input = $(campo);
    const hayError = campo in errores;
    input.classList.toggle("is-invalid", hayError);
    const feedback = input.parentElement.querySelector(".invalid-feedback");
    if (feedback && hayError) feedback.textContent = errores[campo];
  });
  $("errorCombustible").textContent = errores.combustible || "";
  $("errorCombustible").classList.toggle("d-none", !errores.combustible);
}

function guardarSolicitud(evento) {
  evento.preventDefault();
  if (usuarioActual === null) {
    Swal.fire("Inicie sesión", "Debe iniciar sesión para registrar una solicitud.", "info");
    return;
  }

  const idEdicion = $("idEdicion").value;
  const datos = leerFormulario();
  const errores = validarSolicitud(datos, idEdicion);
  mostrarErrores(errores);

  if (Object.keys(errores).length > 0) {
    // Lista de errores para el mensaje de SweetAlert2 (map + join).
    const lista = Object.values(errores).map(e => `<li>${e}</li>`).join("");
    Swal.fire({ icon: "error", title: "No se guardó la solicitud", html: `<ul class="text-start">${lista}</ul>` });
    return;
  }

  // Determina a qué cliente pertenece la solicitud.
  // Un cliente solo puede registrar para sí mismo; el admin puede elegir a otro cliente.
  let usuarioId = usuarioActual.id;
  if (esAdmin()) usuarioId = Number($("clienteDestino").value);

  const vehiculo = {
    placa: datos.placa, marca: datos.marca, modelo: datos.modelo,
    anio: Number(datos.anio), kilometraje: Number(datos.kilometraje), combustible: datos.combustible
  };
  const cliente = { nombre: datos.nombre, telefono: datos.telefono, email: datos.email };

  if (idEdicion) {
    // ---- UPDATE (solo administrador) ----
    if (!exigirAdmin()) return;
    const solicitud = solicitudes.find(s => s.id === idEdicion);
    Object.assign(solicitud, {
      usuarioId, cliente, vehiculo,
      servicio: datos.servicio, adicionales: datos.adicionales,
      fecha: datos.fecha, hora: datos.hora, observaciones: datos.observaciones,
      actualizadoEn: new Date().toISOString()
    });
    guardarDatos();
    Swal.fire("Solicitud actualizada", `Se actualizó la solicitud ${idEdicion}.`, "success");
    limpiarFormulario();
    renderizarAdmin();
    location.hash = "#admin";
  } else {
    // ---- CREATE ----
    const nueva = {
      id: generarId(), usuarioId, cliente, vehiculo,
      servicio: datos.servicio, adicionales: datos.adicionales,
      fecha: datos.fecha, hora: datos.hora, observaciones: datos.observaciones,
      estado: "Pendiente", creadoEn: new Date().toISOString()
    };
    solicitudes.push(nueva);
    guardarDatos();
    Swal.fire({
      icon: "success", title: "Solicitud registrada",
      html: `Código: <b>${nueva.id}</b><br>${SERVICIOS[nueva.servicio].nombre}<br>${formatearFecha(nueva.fecha)} a las ${nueva.hora}`
    });
    limpiarFormulario();
    location.hash = "#mis-mantenimientos";
  }

  renderizarPerfil();
  renderizarMisSolicitudes();
  if (esAdmin()) renderizarAdmin();
}

function limpiarFormulario() {
  $("formSolicitud").reset();
  $("idEdicion").value = "";
  $("contadorObs").textContent = "0";
  mostrarErrores({});
  $("tituloFormulario").textContent = "Solicitud de mantenimiento";
  $("btnGuardar").innerHTML = '<i class="bi bi-save"></i> Registrar solicitud';
  $("btnCancelarEdicion").textContent = "Limpiar";
  document.querySelectorAll(".fila-editando").forEach(f => f.classList.remove("fila-editando"));
  prepararFormularioNuevo();
}

// Precarga los datos de contacto del usuario (o del cliente elegido por el admin).
function prepararFormularioNuevo() {
  if (usuarioActual === null || $("idEdicion").value) return;
  let usuario = usuarioActual;
  if (esAdmin() && $("clienteDestino").value) {
    usuario = usuarios.find(u => u.id === Number($("clienteDestino").value)) || usuarioActual;
  }
  $("nombre").value = usuario.nombre;
  $("telefono").value = usuario.telefono;
  $("email").value = usuario.email;
}

/* --------------------------------------------------------------------------
   7. VISTAS DEL CLIENTE
   -------------------------------------------------------------------------- */

// Cuenta solicitudes por estado. Devuelve un diccionario { estado: cantidad }.
function contarPorEstado(lista) {
  const conteo = {};
  for (const estado in ESTADOS) conteo[estado] = 0;
  lista.forEach(s => conteo[s.estado]++);
  return conteo;
}

function tarjetasResumen(conteo) {
  return Object.entries(conteo).map(([estado, cantidad]) => `
    <div class="col-6 col-lg">
      <div class="card resumen-estado border-${ESTADOS[estado]} shadow-sm h-100">
        <div class="card-body py-2">
          <div class="small text-muted">${estado}</div>
          <div class="fs-4 fw-bold">${cantidad}</div>
        </div>
      </div>
    </div>`).join("");
}

function renderizarPerfil() {
  const u = usuarioActual;
  $("datosPerfil").innerHTML = `
    <div class="d-flex align-items-center mb-3">
      <i class="bi bi-person-circle fs-1 text-itsco me-3"></i>
      <div>
        <h3 class="h5 mb-0">${escaparHTML(u.nombre)}</h3>
        <span class="badge bg-itsco-oscuro">${u.rol}</span>
      </div>
    </div>
    <dl class="row mb-0">
      <dt class="col-4">Usuario</dt><dd class="col-8">${escaparHTML(u.usuario)}</dd>
      <dt class="col-4">Teléfono</dt><dd class="col-8">${escaparHTML(u.telefono)}</dd>
      <dt class="col-4">Correo</dt><dd class="col-8">${escaparHTML(u.email)}</dd>
      <dt class="col-4">Cuenta</dt><dd class="col-8">${u.activo ? "Activa" : "Deshabilitada"}</dd>
    </dl>`;

  const propias = solicitudes.filter(s => s.usuarioId === u.id);
  $("resumenPerfil").innerHTML = `<div class="col-12"><h3 class="h6 text-muted">Mis solicitudes por estado (${propias.length} en total)</h3></div>`
    + tarjetasResumen(contarPorEstado(propias));
}

// Muestra SOLO las solicitudes del usuario en sesión (filter por usuarioId).
function renderizarMisSolicitudes() {
  const propias = solicitudes
    .filter(s => s.usuarioId === usuarioActual.id)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

  if (propias.length === 0) {
    $("tablaMisSolicitudes").innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Aún no tiene solicitudes registradas.</td></tr>`;
    return;
  }

  $("tablaMisSolicitudes").innerHTML = propias.map(s => `
    <tr>
      <td class="fw-semibold">${s.id}</td>
      <td>${escaparHTML(s.vehiculo.placa)}</td>
      <td>${escaparHTML(s.vehiculo.marca)} ${escaparHTML(s.vehiculo.modelo)} (${s.vehiculo.anio})</td>
      <td>${SERVICIOS[s.servicio].nombre}</td>
      <td>${formatearFecha(s.fecha)}</td>
      <td>${s.hora}</td>
      <td>${badgeEstado(s.estado)}</td>
    </tr>`).join("");
}

/* --------------------------------------------------------------------------
   8. ADMINISTRACIÓN (CRUD, ESTADOS Y CUENTAS)
   -------------------------------------------------------------------------- */

function llenarSelectClientes() {
  const activos = usuarios.filter(u => u.activo);
  const seleccionado = $("clienteDestino").value;
  $("clienteDestino").innerHTML = activos
    .map(u => `<option value="${u.id}">${escaparHTML(u.nombre)} (${u.usuario}${u.id === usuarioActual.id ? " - yo" : ""})</option>`)
    .join("");
  $("clienteDestino").value = seleccionado || usuarioActual.id;

  $("filtroCliente").innerHTML = `<option value="">Todos los clientes</option>` + usuarios
    .map(u => `<option value="${u.id}">${escaparHTML(u.nombre)}</option>`).join("");
}

// READ: lista general con filtros (filter) y renderizado (map).
function renderizarAdmin() {
  if (!esAdmin()) return;

  $("resumenAdmin").innerHTML = tarjetasResumen(contarPorEstado(solicitudes));

  const texto = $("filtroTexto").value.trim().toLowerCase();
  const estado = $("filtroEstado").value;
  const clienteId = $("filtroCliente").value;

  const filtradas = solicitudes.filter(s => {
    const coincideTexto = texto === "" ||
      s.id.toLowerCase().includes(texto) ||
      s.vehiculo.placa.toLowerCase().includes(texto) ||
      s.cliente.nombre.toLowerCase().includes(texto);
    const coincideEstado = estado === "" || s.estado === estado;
    const coincideCliente = clienteId === "" || s.usuarioId === Number(clienteId);
    return coincideTexto && coincideEstado && coincideCliente;
  });

  if (filtradas.length === 0) {
    $("tablaAdmin").innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No hay solicitudes que coincidan.</td></tr>`;
  } else {
    $("tablaAdmin").innerHTML = filtradas.map(s => `
      <tr data-id="${s.id}">
        <td class="fw-semibold">${s.id}</td>
        <td>${escaparHTML(s.cliente.nombre)}<br><small class="text-muted">${escaparHTML(s.cliente.telefono)}</small></td>
        <td>${escaparHTML(s.vehiculo.placa)}<br><small class="text-muted">${escaparHTML(s.vehiculo.marca)} ${escaparHTML(s.vehiculo.modelo)} · ${s.vehiculo.kilometraje.toLocaleString("es-EC")} km</small></td>
        <td>${SERVICIOS[s.servicio].nombre}</td>
        <td>${formatearFecha(s.fecha)}<br><small class="text-muted">${s.hora}</small></td>
        <td>
          <select class="form-select form-select-sm select-estado" data-id="${s.id}" aria-label="Estado de ${s.id}">
            ${Object.keys(ESTADOS).map(e => `<option value="${e}" ${e === s.estado ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${s.id}" >Editar</button>
          <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${s.id}" >Eliminar</button>
        </td>
      </tr>`).join("");
  }

  renderizarUsuarios();
}

// UPDATE de estado desde el select de la tabla.
function cambiarEstado(id, nuevoEstado) {
  if (!exigirAdmin()) return;
  if (!(nuevoEstado in ESTADOS)) return;
  const solicitud = solicitudes.find(s => s.id === id);
  if (!solicitud) return;
  const anterior = solicitud.estado;
  solicitud.estado = nuevoEstado;
  solicitud.actualizadoEn = new Date().toISOString();
  guardarDatos();
  renderizarAdmin();
  renderizarPerfil();
  renderizarMisSolicitudes();
  toast("success", `${id}: ${anterior} → ${nuevoEstado}`);
}

// UPDATE completo: carga la solicitud en el formulario.
function editarSolicitud(id) {
  if (!exigirAdmin()) return;
  const s = solicitudes.find(sol => sol.id === id);
  if (!s) return;

  $("idEdicion").value = s.id;
  $("clienteDestino").value = s.usuarioId;
  $("nombre").value = s.cliente.nombre;
  $("telefono").value = s.cliente.telefono;
  $("email").value = s.cliente.email;
  $("placa").value = s.vehiculo.placa;
  $("marca").value = s.vehiculo.marca;
  $("modelo").value = s.vehiculo.modelo;
  $("anio").value = s.vehiculo.anio;
  $("kilometraje").value = s.vehiculo.kilometraje;
  document.querySelectorAll('input[name="combustible"]').forEach(r => r.checked = (r.value === s.vehiculo.combustible));
  $("servicio").value = s.servicio;
  $("fecha").value = s.fecha;
  $("hora").value = s.hora;
  document.querySelectorAll('input[name="adicionales"]').forEach(chk => chk.checked = s.adicionales.includes(chk.value));
  $("observaciones").value = s.observaciones;
  $("contadorObs").textContent = s.observaciones.length;
  $("aceptaTerminos").checked = true;
  mostrarErrores({});

  $("tituloFormulario").textContent = `Editar solicitud ${s.id}`;
  $("btnGuardar").innerHTML = '<i class="bi bi-arrow-repeat"></i> Actualizar solicitud';
  $("btnCancelarEdicion").textContent = "Cancelar edición";
  location.hash = "#solicitud";
}

// DELETE con confirmación de SweetAlert2.
function eliminarSolicitud(id) {
  if (!exigirAdmin()) return;
  const s = solicitudes.find(sol => sol.id === id);
  if (!s) return;

  Swal.fire({
    title: `¿Eliminar ${s.id}?`,
    html: `${escaparHTML(s.cliente.nombre)} · ${escaparHTML(s.vehiculo.placa)}<br>Esta acción no se puede deshacer.`,
    icon: "warning", showCancelButton: true,
    confirmButtonColor: "#dc3545", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar"
  }).then(resultado => {
    if (!resultado.isConfirmed) return;
    solicitudes = solicitudes.filter(sol => sol.id !== id);
    guardarDatos();
    if ($("idEdicion").value === id) limpiarFormulario();
    renderizarAdmin();
    renderizarPerfil();
    renderizarMisSolicitudes();
    toast("success", `Solicitud ${id} eliminada`);
  });
}

// Control de registros de clientes: número de solicitudes y habilitar/deshabilitar cuenta.
function renderizarUsuarios() {
  $("tablaUsuarios").innerHTML = usuarios.map(u => {
    const total = solicitudes.filter(s => s.usuarioId === u.id).length;
    const esYo = u.id === usuarioActual.id;
    return `
      <tr>
        <td>${escaparHTML(u.usuario)}</td>
        <td>${escaparHTML(u.nombre)}</td>
        <td>${u.rol}</td>
        <td>${total}</td>
        <td>${u.activo ? '<span class="badge bg-success">Activa</span>' : '<span class="badge bg-danger">Deshabilitada</span>'}</td>
        <td class="text-end">
          ${esYo ? '<small class="text-muted">Cuenta en uso</small>' :
            `<button class="btn btn-sm ${u.activo ? "btn-outline-danger" : "btn-outline-success"} btn-cuenta" data-id="${u.id}">
               ${u.activo ? "Deshabilitar" : "Habilitar"}</button>`}
        </td>
      </tr>`;
  }).join("");
}

function alternarCuenta(id) {
  if (!exigirAdmin()) return;
  const usuario = usuarios.find(u => u.id === id);
  if (!usuario || usuario.id === usuarioActual.id) return;
  usuario.activo = !usuario.activo;
  guardarDatos();
  llenarSelectClientes();
  renderizarAdmin();
  toast("info", `Cuenta de ${usuario.nombre} ${usuario.activo ? "habilitada" : "deshabilitada"}`);
}

function restablecerDatos() {
  if (!exigirAdmin()) return;
  Swal.fire({
    title: "¿Restablecer datos de prueba?", text: "Se borrarán las solicitudes registradas y se cargarán los datos iniciales.",
    icon: "warning", showCancelButton: true, confirmButtonText: "Restablecer", cancelButtonText: "Cancelar", confirmButtonColor: "#dc3545"
  }).then(r => {
    if (!r.isConfirmed) return;
    solicitudes = structuredClone(SOLICITUDES_INICIALES);
    usuarios = structuredClone(USUARIOS_INICIALES);
    usuarioActual = usuarios.find(u => u.id === usuarioActual.id);
    guardarDatos();
    limpiarFormulario();
    actualizarInterfaz();
    toast("success", "Datos restablecidos");
  });
}

/* --------------------------------------------------------------------------
   9. EVENTOS E INICIALIZACIÓN
   -------------------------------------------------------------------------- */

function registrarEventos() {
  $("formLogin").addEventListener("submit", iniciarSesion);
  $("btnCerrarSesion").addEventListener("click", cerrarSesion);
  $("formSolicitud").addEventListener("submit", guardarSolicitud);
  $("btnCancelarEdicion").addEventListener("click", limpiarFormulario);

  // Placa en mayúsculas mientras se escribe
  $("placa").addEventListener("input", e => e.target.value = e.target.value.toUpperCase());
  // Teléfono: solo dígitos
  $("telefono").addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, ""));
  // Contador de caracteres del textarea
  $("observaciones").addEventListener("input", e => $("contadorObs").textContent = e.target.value.length);
  // Admin: al cambiar el cliente destino se precargan sus datos de contacto
  $("clienteDestino").addEventListener("change", prepararFormularioNuevo);

  // Botones "Agendar" del catálogo y de la portada
  $("catalogoServicios").addEventListener("click", e => {
    const boton = e.target.closest(".btn-agendar");
    if (!boton) return;
    irAFormulario(boton.dataset.servicio);
  });
  $("btnAgendarHero").addEventListener("click", () => irAFormulario(""));

  // Control de acceso al enlace de Administración (clic y cambio manual de URL)
  $("enlaceAdmin").addEventListener("click", e => {
    if (!verificarAccesoAdmin()) e.preventDefault();
  });
  window.addEventListener("hashchange", protegerRutas);

  // Filtros de administración
  ["filtroTexto", "filtroEstado", "filtroCliente"].forEach(id => $(id).addEventListener("input", renderizarAdmin));

  // Delegación de eventos en la tabla de administración
  $("tablaAdmin").addEventListener("click", e => {
    const editar = e.target.closest(".btn-editar");
    const eliminar = e.target.closest(".btn-eliminar");
    if (editar) {
      editarSolicitud(editar.dataset.id);
      editar.closest("tr").classList.add("fila-editando");
    }
    if (eliminar) eliminarSolicitud(eliminar.dataset.id);
  });
  $("tablaAdmin").addEventListener("change", e => {
    if (e.target.classList.contains("select-estado")) cambiarEstado(e.target.dataset.id, e.target.value);
  });
  $("tablaUsuarios").addEventListener("click", e => {
    const boton = e.target.closest(".btn-cuenta");
    if (boton) alternarCuenta(Number(boton.dataset.id));
  });
  $("btnRestablecer").addEventListener("click", restablecerDatos);

  // Cierra el menú colapsado en móviles al elegir una opción
  document.querySelectorAll("#menuPrincipal .nav-link").forEach(enlace =>
    enlace.addEventListener("click", () => {
      const menu = bootstrap.Collapse.getInstance($("menuPrincipal"));
      if (menu) menu.hide();
    }));
}

function irAFormulario(codigoServicio) {
  if (usuarioActual === null) {
    Swal.fire({ icon: "info", title: "Inicie sesión", text: "Para agendar un mantenimiento debe iniciar sesión.", confirmButtonText: "Iniciar sesión" })
      .then(r => { if (r.isConfirmed) bootstrap.Modal.getOrCreateInstance($("modalLogin")).show(); });
    return;
  }
  if (codigoServicio) $("servicio").value = codigoServicio;
  location.hash = "#solicitud";
  $("solicitud").scrollIntoView();
}

// Si alguien escribe #admin, #perfil, etc. en la URL sin permisos, se le redirige.
function protegerRutas() {
  const destino = location.hash;
  const privadas = ["#perfil", "#solicitud", "#mis-mantenimientos"];
  if (destino === "#admin" && !esAdmin()) {
    verificarAccesoAdmin();
    history.replaceState(null, "", "#inicio");
  } else if (privadas.includes(destino) && usuarioActual === null) {
    Swal.fire("Inicie sesión", "Esta sección requiere iniciar sesión.", "info");
    history.replaceState(null, "", "#inicio");
  }
}

function mostrarUsuariosPrueba() {
  $("listaUsuariosPrueba").innerHTML = USUARIOS_INICIALES
    .map(u => `<li><code>${u.usuario}</code> / <code>${u.clave}</code> - ${u.rol}${u.activo ? "" : " (deshabilitado)"}</li>`)
    .join("");
}

function inicializar() {
  cargarDatos();
  restaurarSesion();
  renderizarCatalogo();
  llenarOpcionesFormulario();
  mostrarUsuariosPrueba();
  registrarEventos();
  actualizarInterfaz();
  protegerRutas();
}

document.addEventListener("DOMContentLoaded", inicializar);
