// AD01 - Programacion II
// Portal de mantenimiento automotriz "MotorPro"
// Estudiante: Cesar Mancheno - 3AON

// ======================= DATOS =======================

// diccionario de servicios (codigo -> datos)
const SERVICIOS = {
  aceite: { nombre: "Cambio de aceite y filtros", precio: 45, duracion: "1 h" },
  frenos: { nombre: "Revisión de frenos", precio: 60, duracion: "2 h" },
  afinamiento: { nombre: "Afinamiento de motor", precio: 90, duracion: "3 h" },
  alineacion: { nombre: "Alineación y balanceo", precio: 35, duracion: "1 h" },
  electrico: { nombre: "Diagnóstico eléctrico", precio: 40, duracion: "1.5 h" },
  preventivo: { nombre: "Mantenimiento preventivo por kilometraje", precio: 120, duracion: "4 h" }
};

// diccionario de estados (estado -> color del badge de bootstrap)
const ESTADOS = {
  "Pendiente": "secondary",
  "En revisión": "info",
  "En proceso": "primary",
  "Finalizado": "success",
  "Cancelado": "danger"
};

const MARCAS = ["Chevrolet", "Kia", "Hyundai", "Toyota", "Nissan", "Mazda", "Renault", "Ford", "Volkswagen", "Otra"];
const ADICIONALES = ["Lavado exterior", "Revisión de llantas", "Recarga de aire acondicionado", "Revisión de luces"];
const HORAS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

// usuarios de prueba
// OJO: las claves estan en el codigo solo porque la practica no tiene backend.
// En un sistema real esto no se debe hacer (las claves van cifradas en el servidor).
const USUARIOS_PRUEBA = [
  { id: 1, usuario: "admin", clave: "Admin2026*", rol: "Administrador", nombre: "Diego Andrade", telefono: "0991112233", email: "admin@motorpro.ec", activo: true },
  { id: 2, usuario: "mlopez", clave: "Cliente2026*", rol: "Cliente", nombre: "María López", telefono: "0987654321", email: "maria.lopez@mail.com", activo: true },
  { id: 3, usuario: "jvera", clave: "Cliente2026*", rol: "Cliente", nombre: "Jorge Vera", telefono: "0976543210", email: "jorge.vera@mail.com", activo: true },
  { id: 4, usuario: "atorres", clave: "Cliente2026*", rol: "Cliente", nombre: "Ana Torres", telefono: "0965432109", email: "ana.torres@mail.com", activo: false }
];

// solicitudes de ejemplo
const SOLICITUDES_PRUEBA = [
  {
    id: "SOL-0001", usuarioId: 2,
    cliente: { nombre: "María López", telefono: "0987654321", email: "maria.lopez@mail.com" },
    vehiculo: { placa: "PBA-1234", marca: "Kia", modelo: "Rio", anio: 2019, kilometraje: 45000, combustible: "Gasolina" },
    servicio: "aceite", adicionales: ["Lavado exterior"], fecha: "2026-11-03", hora: "09:00",
    observaciones: "Cambio de aceite sintético.", estado: "Finalizado"
  },
  {
    id: "SOL-0002", usuarioId: 2,
    cliente: { nombre: "María López", telefono: "0987654321", email: "maria.lopez@mail.com" },
    vehiculo: { placa: "PBA-1234", marca: "Kia", modelo: "Rio", anio: 2019, kilometraje: 46200, combustible: "Gasolina" },
    servicio: "frenos", adicionales: [], fecha: "2026-11-20", hora: "10:00",
    observaciones: "Chirrido al frenar.", estado: "Pendiente"
  },
  {
    id: "SOL-0003", usuarioId: 3,
    cliente: { nombre: "Jorge Vera", telefono: "0976543210", email: "jorge.vera@mail.com" },
    vehiculo: { placa: "GSD-987", marca: "Toyota", modelo: "Hilux", anio: 2015, kilometraje: 182000, combustible: "Diésel" },
    servicio: "preventivo", adicionales: ["Revisión de llantas"], fecha: "2026-11-18", hora: "08:00",
    observaciones: "", estado: "En revisión"
  }
];

// arrays con los que trabaja la aplicacion
let usuarios = [];
let solicitudes = [];
let usuarioActual = null; // usuario que inicio sesion


// ======================= LOCALSTORAGE =======================

function cargarDatos() {
  let datosSolicitudes = localStorage.getItem("solicitudes");
  let datosUsuarios = localStorage.getItem("usuarios");

  if (datosSolicitudes) {
    solicitudes = JSON.parse(datosSolicitudes);
  } else {
    // copia de los datos de prueba para no modificar los originales
    solicitudes = JSON.parse(JSON.stringify(SOLICITUDES_PRUEBA));
  }

  if (datosUsuarios) {
    usuarios = JSON.parse(datosUsuarios);
  } else {
    usuarios = JSON.parse(JSON.stringify(USUARIOS_PRUEBA));
  }
  guardarDatos();
}

function guardarDatos() {
  localStorage.setItem("solicitudes", JSON.stringify(solicitudes));
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}


// ======================= FUNCIONES DE APOYO =======================

// evita que se ejecute codigo HTML/JS que el usuario escriba en el formulario (XSS)
function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// devuelve la fecha en formato 2026-11-08 (el mismo que usa el input date)
function fechaTexto(fecha) {
  let anio = fecha.getFullYear();
  let mes = String(fecha.getMonth() + 1).padStart(2, "0");
  let dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// 2026-11-08 -> 08/11/2026
function mostrarFecha(fecha) {
  let partes = fecha.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function badgeEstado(estado) {
  return '<span class="badge bg-' + ESTADOS[estado] + '">' + estado + '</span>';
}

// genera el siguiente id: SOL-0001, SOL-0002, ...
function generarId() {
  let mayor = 0;
  for (let s of solicitudes) {
    let numero = parseInt(s.id.replace("SOL-", ""));
    if (numero > mayor) {
      mayor = numero;
    }
  }
  return "SOL-" + String(mayor + 1).padStart(4, "0");
}

function esAdmin() {
  return usuarioActual != null && usuarioActual.rol == "Administrador";
}

function mensajeCorto(icono, texto) {
  Swal.fire({ toast: true, position: "top-end", icon: icono, title: texto, showConfirmButton: false, timer: 2000 });
}


// ======================= MODULO 1: CATALOGO =======================

function mostrarCatalogo() {
  let html = "";
  for (let codigo in SERVICIOS) {
    let s = SERVICIOS[codigo];
    html += `
      <div class="col-sm-6 col-lg-4">
        <div class="card h-100 tarjeta-servicio">
          <div class="card-body">
            <h3 class="h5">${s.nombre}</h3>
            <p class="text-muted mb-1">Duración aprox.: ${s.duracion}</p>
            <p class="fw-bold">Desde $${s.precio.toFixed(2)}</p>
            <button class="btn btn-sm btn-agendar" data-servicio="${codigo}">Agendar este servicio</button>
          </div>
        </div>
      </div>`;
  }
  document.getElementById("catalogoServicios").innerHTML = html;
}

// llena los select, radios y checkbox del formulario
function llenarFormulario() {
  let marca = document.getElementById("marca");
  MARCAS.forEach(function (m) {
    marca.innerHTML += `<option value="${m}">${m}</option>`;
  });

  let servicio = document.getElementById("servicio");
  for (let codigo in SERVICIOS) {
    servicio.innerHTML += `<option value="${codigo}">${SERVICIOS[codigo].nombre}</option>`;
  }

  let hora = document.getElementById("hora");
  for (let i = 0; i < HORAS.length; i++) {
    hora.innerHTML += `<option value="${HORAS[i]}">${HORAS[i]}</option>`;
  }

  let checks = "";
  for (let i = 0; i < ADICIONALES.length; i++) {
    checks += `
      <div class="form-check form-check-inline">
        <input class="form-check-input" type="checkbox" name="adicionales" id="adic${i}" value="${ADICIONALES[i]}">
        <label class="form-check-label" for="adic${i}">${ADICIONALES[i]}</label>
      </div>`;
  }
  document.getElementById("grupoAdicionales").innerHTML = checks;

  let filtroEstado = document.getElementById("filtroEstado");
  for (let estado in ESTADOS) {
    filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
  }

  document.getElementById("fecha").min = fechaTexto(new Date());
  document.getElementById("anio").max = new Date().getFullYear() + 1;
}


// ======================= LOGIN Y ROLES =======================

function iniciarSesion(e) {
  e.preventDefault();
  let usuarioIngresado = document.getElementById("loginUsuario").value.trim().toLowerCase();
  let claveIngresada = document.getElementById("loginClave").value;

  if (usuarioIngresado == "" || claveIngresada == "") {
    Swal.fire("Datos incompletos", "Ingrese usuario y contraseña.", "warning");
    return;
  }

  let usuario = usuarios.find(function (u) {
    return u.usuario == usuarioIngresado;
  });

  // mismo mensaje si no existe o si la clave esta mal, asi no se sabe que usuarios existen
  if (usuario == undefined || usuario.clave != claveIngresada) {
    Swal.fire("Acceso inválido", "Usuario o contraseña incorrectos.", "error");
    document.getElementById("loginClave").value = "";
    return;
  }

  if (usuario.activo == false) {
    Swal.fire("Cuenta deshabilitada", "Su cuenta está deshabilitada. Comuníquese con el taller.", "error");
    return;
  }

  usuarioActual = usuario;
  sessionStorage.setItem("sesion", usuario.id);
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLogin")).hide();
  document.getElementById("formLogin").reset();
  actualizarPantalla();
  Swal.fire({ icon: "success", title: "Bienvenido/a, " + usuario.nombre, text: "Rol: " + usuario.rol, timer: 1800, showConfirmButton: false });
  location.hash = "#perfil";
}

function cerrarSesion() {
  Swal.fire({
    title: "¿Cerrar sesión?", icon: "question",
    showCancelButton: true, confirmButtonText: "Sí, salir", cancelButtonText: "Cancelar"
  }).then(function (respuesta) {
    if (respuesta.isConfirmed) {
      usuarioActual = null;
      sessionStorage.removeItem("sesion");
      limpiarFormulario();
      actualizarPantalla();
      location.hash = "#inicio";
    }
  });
}

// si se recarga la pagina se mantiene la sesion (mientras no se cierre la pestaña)
function recuperarSesion() {
  let id = Number(sessionStorage.getItem("sesion"));
  let usuario = usuarios.find(function (u) {
    return u.id == id;
  });
  if (usuario && usuario.activo) {
    usuarioActual = usuario;
  }
}

// muestra u oculta las secciones segun el rol
function actualizarPantalla() {
  let haySesion = usuarioActual != null;

  document.querySelectorAll(".solo-sesion").forEach(function (el) {
    el.classList.toggle("d-none", !haySesion);
  });
  document.querySelectorAll(".sin-sesion").forEach(function (el) {
    el.classList.toggle("d-none", haySesion);
  });
  document.querySelectorAll(".solo-admin").forEach(function (el) {
    el.classList.toggle("d-none", !esAdmin());
  });

  document.getElementById("perfil").classList.toggle("d-none", !haySesion);
  document.getElementById("solicitud").classList.toggle("d-none", !haySesion);
  document.getElementById("mis-mantenimientos").classList.toggle("d-none", !haySesion);
  document.getElementById("admin").classList.toggle("d-none", !esAdmin());

  if (haySesion) {
    document.getElementById("usuarioNavbar").textContent = usuarioActual.nombre;
    mostrarPerfil();
    mostrarMisSolicitudes();
    if (esAdmin()) {
      llenarClientes();
      mostrarAdmin();
    }
    ponerDatosContacto();
  }
}

// control de acceso a la seccion de administracion
function verificarAccesoAdmin() {
  if (usuarioActual == null) {
    Swal.fire("Inicie sesión", "Debe iniciar sesión como Administrador.", "info");
    return false;
  }
  if (!esAdmin()) {
    Swal.fire("Acceso denegado", "Su rol (Cliente) no tiene permisos para la Administración.", "error");
    return false;
  }
  return true;
}

// todas las funciones del admin llaman a esta funcion primero,
// asi un cliente no puede usarlas ni desde la consola del navegador
function exigirAdmin() {
  if (!esAdmin()) {
    Swal.fire("Acceso denegado", "Operación permitida solo para el Administrador.", "error");
    return false;
  }
  return true;
}


// ======================= MODULO 2: FORMULARIO =======================

// expresiones regulares
const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;            // ABC-123 o ABC-1234
const regexTelefono = /^(09\d{8}|0[2-7]\d{7})$/;    // celular 09xxxxxxxx o fijo 02xxxxxxx
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,60}$/;

function leerFormulario() {
  let combustible = document.querySelector('input[name="combustible"]:checked');

  // checkbox marcados -> array con sus valores
  let marcados = document.querySelectorAll('input[name="adicionales"]:checked');
  let adicionales = Array.from(marcados).map(function (chk) {
    return chk.value;
  });

  return {
    nombre: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    email: document.getElementById("email").value.trim().toLowerCase(),
    placa: document.getElementById("placa").value.trim().toUpperCase(),
    marca: document.getElementById("marca").value,
    modelo: document.getElementById("modelo").value.trim(),
    anio: document.getElementById("anio").value,
    kilometraje: document.getElementById("kilometraje").value,
    combustible: combustible ? combustible.value : "",
    servicio: document.getElementById("servicio").value,
    adicionales: adicionales,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    observaciones: document.getElementById("observaciones").value.trim(),
    acepta: document.getElementById("aceptaTerminos").checked
  };
}

// devuelve un objeto con los errores { campo: "mensaje" }
function validarSolicitud(datos, idEdicion) {
  let errores = {};
  let anioActual = new Date().getFullYear();
  let hoy = fechaTexto(new Date());

  if (!regexNombre.test(datos.nombre)) errores.nombre = "Ingrese un nombre válido (solo letras).";
  if (!regexTelefono.test(datos.telefono)) errores.telefono = "Teléfono inválido. Ej: 0991234567 o 022345678.";
  if (!regexEmail.test(datos.email)) errores.email = "Correo electrónico inválido.";
  if (!regexPlaca.test(datos.placa)) errores.placa = "Placa inválida. Ej: PBA-1234 o ABC-123.";
  if (datos.marca == "") errores.marca = "Seleccione la marca.";
  if (datos.modelo.length < 2) errores.modelo = "Ingrese el modelo.";

  let anio = Number(datos.anio);
  if (datos.anio == "" || !Number.isInteger(anio) || anio < 1980 || anio > anioActual + 1) {
    errores.anio = "El año debe estar entre 1980 y " + (anioActual + 1) + ".";
  }

  let km = Number(datos.kilometraje);
  if (datos.kilometraje == "" || !Number.isInteger(km) || km < 0 || km > 999999) {
    errores.kilometraje = "Kilometraje inválido (entre 0 y 999999).";
  }

  if (datos.combustible == "") errores.combustible = "Seleccione el tipo de combustible.";
  if (SERVICIOS[datos.servicio] == undefined) errores.servicio = "Seleccione un servicio.";

  // si el admin edita y no cambia la fecha, no se valida otra vez (puede ser una fecha pasada)
  let original = solicitudes.find(function (s) { return s.id == idEdicion; });
  let mismaFecha = original != undefined && original.fecha == datos.fecha;

  // dia de la semana: 0 = domingo, 6 = sabado
  let dia = new Date(datos.fecha + "T00:00:00").getDay();
  let limite = new Date();
  limite.setDate(limite.getDate() + 60);

  if (datos.fecha == "") {
    errores.fecha = "Seleccione la fecha.";
  } else if (!mismaFecha) {
    if (datos.fecha < hoy) {
      errores.fecha = "La fecha no puede ser anterior a hoy.";
    } else if (datos.fecha > fechaTexto(limite)) {
      errores.fecha = "Solo se puede agendar hasta 60 días antes.";
    } else if (dia == 0) {
      errores.fecha = "Los domingos el taller está cerrado.";
    }
  }

  // horario: lunes a viernes hasta las 16:00, sabado hasta las 11:00
  if (!HORAS.includes(datos.hora)) {
    errores.hora = "Seleccione una hora.";
  } else if (errores.fecha == undefined && datos.fecha != "") {
    if (dia == 6 && datos.hora > "11:00") {
      errores.hora = "Los sábados se atiende hasta las 12:00 (último turno 11:00).";
    }
    if (datos.fecha == hoy && !mismaFecha) {
      let ahora = new Date();
      let horaActual = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
      if (datos.hora <= horaActual) {
        errores.hora = "Esa hora ya pasó.";
      }
    }
  }

  // un mismo vehiculo no puede tener 2 solicitudes el mismo dia
  let repetida = solicitudes.some(function (s) {
    return s.id != idEdicion && s.vehiculo.placa == datos.placa && s.fecha == datos.fecha && s.estado != "Cancelado";
  });
  if (repetida && errores.placa == undefined && errores.fecha == undefined) {
    errores.placa = "Ese vehículo ya tiene una solicitud para esa fecha.";
  }

  if (!datos.acepta) errores.aceptaTerminos = "Debe aceptar el tratamiento de datos.";

  return errores;
}

// pinta en rojo los campos con error
function mostrarErrores(errores) {
  let campos = ["nombre", "telefono", "email", "placa", "marca", "modelo", "anio", "kilometraje", "servicio", "fecha", "hora", "aceptaTerminos"];
  for (let campo of campos) {
    let input = document.getElementById(campo);
    let mensaje = input.parentElement.querySelector(".invalid-feedback");
    if (errores[campo]) {
      input.classList.add("is-invalid");
      if (mensaje) mensaje.textContent = errores[campo];
    } else {
      input.classList.remove("is-invalid");
    }
  }
  let errorComb = document.getElementById("errorCombustible");
  errorComb.textContent = errores.combustible || "";
  errorComb.classList.toggle("d-none", !errores.combustible);
}

function guardarSolicitud(e) {
  e.preventDefault();
  if (usuarioActual == null) {
    Swal.fire("Inicie sesión", "Debe iniciar sesión para registrar una solicitud.", "info");
    return;
  }

  let idEdicion = document.getElementById("idEdicion").value;
  let datos = leerFormulario();
  let errores = validarSolicitud(datos, idEdicion);
  mostrarErrores(errores);

  let mensajes = Object.values(errores);
  if (mensajes.length > 0) {
    let lista = mensajes.map(function (m) { return "<li>" + m + "</li>"; }).join("");
    Swal.fire({ icon: "error", title: "No se guardó la solicitud", html: '<ul class="text-start">' + lista + "</ul>" });
    return;
  }

  // el cliente registra para si mismo, el admin puede elegir otro cliente
  let usuarioId = usuarioActual.id;
  if (esAdmin()) {
    usuarioId = Number(document.getElementById("clienteDestino").value);
  }

  let cliente = { nombre: datos.nombre, telefono: datos.telefono, email: datos.email };
  let vehiculo = {
    placa: datos.placa, marca: datos.marca, modelo: datos.modelo,
    anio: Number(datos.anio), kilometraje: Number(datos.kilometraje), combustible: datos.combustible
  };

  if (idEdicion != "") {
    // ACTUALIZAR (solo admin)
    if (!exigirAdmin()) return;
    let s = solicitudes.find(function (sol) { return sol.id == idEdicion; });
    s.usuarioId = usuarioId;
    s.cliente = cliente;
    s.vehiculo = vehiculo;
    s.servicio = datos.servicio;
    s.adicionales = datos.adicionales;
    s.fecha = datos.fecha;
    s.hora = datos.hora;
    s.observaciones = datos.observaciones;
    guardarDatos();
    Swal.fire("Solicitud actualizada", "Se actualizó la solicitud " + idEdicion + ".", "success");
    limpiarFormulario();
    location.hash = "#admin";
  } else {
    // CREAR
    let nueva = {
      id: generarId(),
      usuarioId: usuarioId,
      cliente: cliente,
      vehiculo: vehiculo,
      servicio: datos.servicio,
      adicionales: datos.adicionales,
      fecha: datos.fecha,
      hora: datos.hora,
      observaciones: datos.observaciones,
      estado: "Pendiente"
    };
    solicitudes.push(nueva);
    guardarDatos();
    Swal.fire({
      icon: "success", title: "Solicitud registrada",
      html: "Código: <b>" + nueva.id + "</b><br>" + SERVICIOS[nueva.servicio].nombre + "<br>" + mostrarFecha(nueva.fecha) + " a las " + nueva.hora
    });
    limpiarFormulario();
    location.hash = "#mis-mantenimientos";
  }

  mostrarPerfil();
  mostrarMisSolicitudes();
  if (esAdmin()) mostrarAdmin();
}

function limpiarFormulario() {
  document.getElementById("formSolicitud").reset();
  document.getElementById("idEdicion").value = "";
  document.getElementById("contadorObs").textContent = "0";
  mostrarErrores({});
  document.getElementById("tituloFormulario").textContent = "Solicitud de mantenimiento";
  document.getElementById("btnGuardar").textContent = "Registrar solicitud";
  document.getElementById("btnCancelarEdicion").textContent = "Limpiar";
  ponerDatosContacto();
}

// pone nombre, telefono y correo del usuario (o del cliente que elige el admin)
function ponerDatosContacto() {
  if (usuarioActual == null) return;
  let usuario = usuarioActual;
  if (esAdmin()) {
    let idElegido = Number(document.getElementById("clienteDestino").value);
    let elegido = usuarios.find(function (u) { return u.id == idElegido; });
    if (elegido) usuario = elegido;
  }
  document.getElementById("nombre").value = usuario.nombre;
  document.getElementById("telefono").value = usuario.telefono;
  document.getElementById("email").value = usuario.email;
}


// ======================= MODULO 3: CLIENTE =======================

// cuenta cuantas solicitudes hay en cada estado
function contarPorEstado(lista) {
  let conteo = {};
  for (let estado in ESTADOS) {
    conteo[estado] = 0;
  }
  lista.forEach(function (s) {
    conteo[s.estado]++;
  });
  return conteo;
}

function tarjetasConteo(conteo) {
  let html = "";
  for (let estado in conteo) {
    html += `
      <div class="col-6 col-lg">
        <div class="card resumen-estado border-${ESTADOS[estado]}">
          <div class="card-body py-2">
            <div class="small text-muted">${estado}</div>
            <div class="fs-4 fw-bold">${conteo[estado]}</div>
          </div>
        </div>
      </div>`;
  }
  return html;
}

function mostrarPerfil() {
  let u = usuarioActual;
  document.getElementById("datosPerfil").innerHTML = `
    <h3 class="h5">${escaparHTML(u.nombre)}</h3>
    <p><span class="badge bg-secondary">${u.rol}</span></p>
    <p class="mb-1"><b>Usuario:</b> ${escaparHTML(u.usuario)}</p>
    <p class="mb-1"><b>Teléfono:</b> ${escaparHTML(u.telefono)}</p>
    <p class="mb-1"><b>Correo:</b> ${escaparHTML(u.email)}</p>
    <p class="mb-0"><b>Cuenta:</b> ${u.activo ? "Activa" : "Deshabilitada"}</p>`;

  let propias = solicitudes.filter(function (s) { return s.usuarioId == u.id; });
  document.getElementById("resumenPerfil").innerHTML =
    '<div class="col-12"><h3 class="h6 text-muted">Mis solicitudes por estado (' + propias.length + ')</h3></div>' +
    tarjetasConteo(contarPorEstado(propias));
}

// el cliente solo ve SUS solicitudes (filter por usuarioId)
function mostrarMisSolicitudes() {
  let propias = solicitudes.filter(function (s) {
    return s.usuarioId == usuarioActual.id;
  });
  let tabla = document.getElementById("tablaMisSolicitudes");

  if (propias.length == 0) {
    tabla.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Aún no tiene solicitudes registradas.</td></tr>';
    return;
  }

  let filas = "";
  for (let s of propias) {
    filas += `
      <tr>
        <td>${s.id}</td>
        <td>${escaparHTML(s.vehiculo.placa)}</td>
        <td>${escaparHTML(s.vehiculo.marca)} ${escaparHTML(s.vehiculo.modelo)} (${s.vehiculo.anio})</td>
        <td>${SERVICIOS[s.servicio].nombre}</td>
        <td>${mostrarFecha(s.fecha)}</td>
        <td>${s.hora}</td>
        <td>${badgeEstado(s.estado)}</td>
      </tr>`;
  }
  tabla.innerHTML = filas;
}


// ======================= MODULO 3: ADMINISTRADOR =======================

function llenarClientes() {
  let select = document.getElementById("clienteDestino");
  let anterior = select.value;
  let html = "";
  usuarios.forEach(function (u) {
    if (u.activo) {
      html += `<option value="${u.id}">${escaparHTML(u.nombre)} (${u.usuario})</option>`;
    }
  });
  select.innerHTML = html;
  select.value = anterior || usuarioActual.id;

  let filtro = document.getElementById("filtroCliente");
  let opciones = '<option value="">Todos los clientes</option>';
  usuarios.forEach(function (u) {
    opciones += `<option value="${u.id}">${escaparHTML(u.nombre)}</option>`;
  });
  filtro.innerHTML = opciones;
}

// LEER: tabla con todas las solicitudes y filtros
function mostrarAdmin() {
  if (!esAdmin()) return;

  document.getElementById("resumenAdmin").innerHTML = tarjetasConteo(contarPorEstado(solicitudes));

  let texto = document.getElementById("filtroTexto").value.trim().toLowerCase();
  let estado = document.getElementById("filtroEstado").value;
  let cliente = document.getElementById("filtroCliente").value;

  let lista = solicitudes.filter(function (s) {
    let okTexto = texto == "" ||
      s.id.toLowerCase().includes(texto) ||
      s.vehiculo.placa.toLowerCase().includes(texto) ||
      s.cliente.nombre.toLowerCase().includes(texto);
    let okEstado = estado == "" || s.estado == estado;
    let okCliente = cliente == "" || s.usuarioId == Number(cliente);
    return okTexto && okEstado && okCliente;
  });

  let tabla = document.getElementById("tablaAdmin");
  if (lista.length == 0) {
    tabla.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No hay solicitudes.</td></tr>';
  } else {
    tabla.innerHTML = lista.map(function (s) {
      // opciones del select de estado
      let opciones = "";
      for (let e in ESTADOS) {
        let marcado = e == s.estado ? "selected" : "";
        opciones += `<option value="${e}" ${marcado}>${e}</option>`;
      }
      return `
        <tr>
          <td>${s.id}</td>
          <td>${escaparHTML(s.cliente.nombre)}<br><small class="text-muted">${escaparHTML(s.cliente.telefono)}</small></td>
          <td>${escaparHTML(s.vehiculo.placa)}<br><small class="text-muted">${escaparHTML(s.vehiculo.marca)} ${escaparHTML(s.vehiculo.modelo)} - ${s.vehiculo.kilometraje} km</small></td>
          <td>${SERVICIOS[s.servicio].nombre}</td>
          <td>${mostrarFecha(s.fecha)}<br><small class="text-muted">${s.hora}</small></td>
          <td><select class="form-select form-select-sm select-estado" data-id="${s.id}">${opciones}</select></td>
          <td class="text-end">
            <button class="btn btn-sm btn-editar" data-id="${s.id}">Editar</button>
            <button class="btn btn-sm btn-eliminar texto-rojo" data-id="${s.id}">Eliminar</button>
          </td>
        </tr>`;
    }).join("");
  }

  mostrarUsuarios();
}

// ACTUALIZAR estado
function cambiarEstado(id, nuevoEstado) {
  if (!exigirAdmin()) return;
  let s = solicitudes.find(function (sol) { return sol.id == id; });
  if (s == undefined || ESTADOS[nuevoEstado] == undefined) return;

  s.estado = nuevoEstado;
  guardarDatos();
  mostrarAdmin();
  mostrarPerfil();
  mostrarMisSolicitudes();
  mensajeCorto("success", id + " ahora está " + nuevoEstado);
}

// ACTUALIZAR: carga la solicitud en el formulario
function editarSolicitud(id) {
  if (!exigirAdmin()) return;
  let s = solicitudes.find(function (sol) { return sol.id == id; });
  if (s == undefined) return;

  document.getElementById("idEdicion").value = s.id;
  document.getElementById("clienteDestino").value = s.usuarioId;
  document.getElementById("nombre").value = s.cliente.nombre;
  document.getElementById("telefono").value = s.cliente.telefono;
  document.getElementById("email").value = s.cliente.email;
  document.getElementById("placa").value = s.vehiculo.placa;
  document.getElementById("marca").value = s.vehiculo.marca;
  document.getElementById("modelo").value = s.vehiculo.modelo;
  document.getElementById("anio").value = s.vehiculo.anio;
  document.getElementById("kilometraje").value = s.vehiculo.kilometraje;
  document.getElementById("servicio").value = s.servicio;
  document.getElementById("fecha").value = s.fecha;
  document.getElementById("hora").value = s.hora;
  document.getElementById("observaciones").value = s.observaciones;
  document.getElementById("contadorObs").textContent = s.observaciones.length;
  document.getElementById("aceptaTerminos").checked = true;

  document.querySelectorAll('input[name="combustible"]').forEach(function (radio) {
    radio.checked = radio.value == s.vehiculo.combustible;
  });
  document.querySelectorAll('input[name="adicionales"]').forEach(function (chk) {
    chk.checked = s.adicionales.includes(chk.value);
  });

  mostrarErrores({});
  document.getElementById("tituloFormulario").textContent = "Editar solicitud " + s.id;
  document.getElementById("btnGuardar").textContent = "Actualizar solicitud";
  document.getElementById("btnCancelarEdicion").textContent = "Cancelar edición";
  location.hash = "#solicitud";
}

// ELIMINAR con confirmacion
function eliminarSolicitud(id) {
  if (!exigirAdmin()) return;
  let s = solicitudes.find(function (sol) { return sol.id == id; });
  if (s == undefined) return;

  Swal.fire({
    title: "¿Eliminar " + s.id + "?",
    text: s.cliente.nombre + " - " + s.vehiculo.placa + ". Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(function (respuesta) {
    if (respuesta.isConfirmed) {
      solicitudes = solicitudes.filter(function (sol) { return sol.id != id; });
      guardarDatos();
      if (document.getElementById("idEdicion").value == id) limpiarFormulario();
      mostrarAdmin();
      mostrarPerfil();
      mostrarMisSolicitudes();
      mensajeCorto("success", "Solicitud " + id + " eliminada");
    }
  });
}

// tabla de cuentas: cuantas solicitudes tiene cada uno y habilitar/deshabilitar
function mostrarUsuarios() {
  let html = "";
  for (let u of usuarios) {
    let total = solicitudes.filter(function (s) { return s.usuarioId == u.id; }).length;
    let estadoCuenta = u.activo ? '<span class="badge bg-success">Activa</span>' : '<span class="badge bg-danger">Deshabilitada</span>';
    let boton = "";
    if (u.id == usuarioActual.id) {
      boton = '<small class="text-muted">Cuenta en uso</small>';
    } else if (u.activo) {
      boton = `<button class="btn btn-sm btn-cuenta texto-rojo" data-id="${u.id}">Deshabilitar</button>`;
    } else {
      boton = `<button class="btn btn-sm btn-cuenta texto-verde" data-id="${u.id}">Habilitar</button>`;
    }
    html += `
      <tr>
        <td>${escaparHTML(u.usuario)}</td>
        <td>${escaparHTML(u.nombre)}</td>
        <td>${u.rol}</td>
        <td>${total}</td>
        <td>${estadoCuenta}</td>
        <td class="text-end">${boton}</td>
      </tr>`;
  }
  document.getElementById("tablaUsuarios").innerHTML = html;
}

function cambiarCuenta(id) {
  if (!exigirAdmin()) return;
  let u = usuarios.find(function (usu) { return usu.id == id; });
  if (u == undefined || u.id == usuarioActual.id) return;

  u.activo = !u.activo;
  guardarDatos();
  llenarClientes();
  mostrarAdmin();
  mensajeCorto("info", "Cuenta de " + u.nombre + (u.activo ? " habilitada" : " deshabilitada"));
}

function restablecerDatos() {
  if (!exigirAdmin()) return;
  Swal.fire({
    title: "¿Restablecer datos de prueba?",
    text: "Se borran las solicitudes registradas y se cargan las iniciales.",
    icon: "warning", showCancelButton: true,
    confirmButtonText: "Restablecer", cancelButtonText: "Cancelar"
  }).then(function (respuesta) {
    if (respuesta.isConfirmed) {
      solicitudes = JSON.parse(JSON.stringify(SOLICITUDES_PRUEBA));
      usuarios = JSON.parse(JSON.stringify(USUARIOS_PRUEBA));
      usuarioActual = usuarios.find(function (u) { return u.id == usuarioActual.id; });
      guardarDatos();
      limpiarFormulario();
      actualizarPantalla();
      mensajeCorto("success", "Datos restablecidos");
    }
  });
}


// ======================= NAVEGACION =======================

function irAlFormulario(servicio) {
  if (usuarioActual == null) {
    Swal.fire("Inicie sesión", "Para agendar un mantenimiento debe iniciar sesión.", "info");
    return;
  }
  if (servicio) {
    document.getElementById("servicio").value = servicio;
  }
  location.hash = "#solicitud";
}

// si alguien escribe #admin o #perfil en la URL sin permiso
function protegerRutas() {
  let destino = location.hash;
  if (destino == "#admin" && !esAdmin()) {
    verificarAccesoAdmin();
    history.replaceState(null, "", "#inicio");
  } else if ((destino == "#perfil" || destino == "#solicitud" || destino == "#mis-mantenimientos") && usuarioActual == null) {
    Swal.fire("Inicie sesión", "Esta sección requiere iniciar sesión.", "info");
    history.replaceState(null, "", "#inicio");
  }
}

function mostrarUsuariosPrueba() {
  let html = "";
  USUARIOS_PRUEBA.forEach(function (u) {
    html += `<li><code>${u.usuario}</code> / <code>${u.clave}</code> - ${u.rol}${u.activo ? "" : " (deshabilitado)"}</li>`;
  });
  document.getElementById("listaUsuariosPrueba").innerHTML = html;
}


// ======================= EVENTOS =======================

document.addEventListener("DOMContentLoaded", function () {
  cargarDatos();
  recuperarSesion();
  mostrarCatalogo();
  llenarFormulario();
  mostrarUsuariosPrueba();
  actualizarPantalla();
  protegerRutas();

  document.getElementById("formLogin").addEventListener("submit", iniciarSesion);
  document.getElementById("btnCerrarSesion").addEventListener("click", cerrarSesion);
  document.getElementById("formSolicitud").addEventListener("submit", guardarSolicitud);
  document.getElementById("btnCancelarEdicion").addEventListener("click", limpiarFormulario);
  document.getElementById("btnRestablecer").addEventListener("click", restablecerDatos);
  document.getElementById("clienteDestino").addEventListener("change", ponerDatosContacto);
  window.addEventListener("hashchange", protegerRutas);

  // placa en mayusculas y telefono solo numeros
  document.getElementById("placa").addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });
  document.getElementById("telefono").addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });

  // contador de caracteres de observaciones
  document.getElementById("observaciones").addEventListener("input", function () {
    document.getElementById("contadorObs").textContent = this.value.length;
  });

  // enlace de administracion: se revisa el rol antes de entrar
  document.getElementById("enlaceAdmin").addEventListener("click", function (e) {
    if (!verificarAccesoAdmin()) {
      e.preventDefault();
    }
  });

  // botones "Agendar"
  document.getElementById("btnAgendarHero").addEventListener("click", function () {
    irAlFormulario("");
  });
  document.getElementById("catalogoServicios").addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-agendar")) {
      irAlFormulario(e.target.dataset.servicio);
    }
  });

  // filtros del admin
  document.getElementById("filtroTexto").addEventListener("input", mostrarAdmin);
  document.getElementById("filtroEstado").addEventListener("change", mostrarAdmin);
  document.getElementById("filtroCliente").addEventListener("change", mostrarAdmin);

  // botones de la tabla del admin (se usa delegacion de eventos porque las filas se crean con JS)
  document.getElementById("tablaAdmin").addEventListener("click", function (e) {
    let id = e.target.dataset.id;
    if (e.target.classList.contains("btn-editar")) editarSolicitud(id);
    if (e.target.classList.contains("btn-eliminar")) eliminarSolicitud(id);
  });
  document.getElementById("tablaAdmin").addEventListener("change", function (e) {
    if (e.target.classList.contains("select-estado")) {
      cambiarEstado(e.target.dataset.id, e.target.value);
    }
  });
  document.getElementById("tablaUsuarios").addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-cuenta")) {
      cambiarCuenta(Number(e.target.dataset.id));
    }
  });
});
