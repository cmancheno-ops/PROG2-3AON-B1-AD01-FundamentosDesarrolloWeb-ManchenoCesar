# MotorPro – Portal de mantenimiento automotriz

**Instituto Superior Tecnológico Cordillera** · Programación II (Online) · Unidad 1 – Práctica 1
**Actividad:** AD01 – Fundamentos de desarrollo web
**Estudiante:** César Mancheno · 3AON · Bimestre 1

Frontend de un sistema web para un taller de mantenimiento automotriz, hecho con HTML semántico, CSS/Bootstrap 5, SweetAlert2 y JavaScript. No usa backend ni base de datos: los registros se guardan en un **array de objetos** y se conservan en el navegador con `localStorage`.

## Cómo ejecutarlo

1. Clonar el repositorio.
2. Abrir `index.html` en el navegador (o con la extensión *Live Server* de VS Code).
3. Se requiere conexión a internet para cargar Bootstrap, Bootstrap Icons y SweetAlert2 desde el CDN.

## Estructura

```
├── index.html        → estructura semántica (header, nav, main, sections, footer) y modal de login
├── css/styles.css    → estilos propios que complementan a Bootstrap
└── js/script.js      → datos, validaciones, login, roles y CRUD
```

## Usuarios de prueba

| Usuario   | Contraseña     | Rol           | Estado        |
|-----------|----------------|---------------|---------------|
| `admin`   | `Admin2026*`   | Administrador | Activo        |
| `mlopez`  | `Cliente2026*` | Cliente       | Activo        |
| `jvera`   | `Cliente2026*` | Cliente       | Activo        |
| `atorres` | `Cliente2026*` | Cliente       | Deshabilitado |

## Módulos

| Módulo | Qué incluye |
|---|---|
| 1. Página institucional | Inicio, Acerca de, catálogo de servicios (generado con `for...in` desde un diccionario), Contacto, navegación funcional y diseño responsive. |
| 2. Solicitud de mantenimiento | Formulario con datos del cliente y del vehículo (placa, marca, modelo, año, kilometraje), servicio, fecha y hora. Usa inputs `text`, `number`, `email`, `date`, `select`, `radio`, `checkbox` y `textarea`. Cada solicitud se guarda como objeto en el array `solicitudes`. |
| 3. Login, roles y CRUD | Login con 4 usuarios y 2 roles. El cliente ve su perfil, registra solicitudes y consulta solo las suyas. El administrador además edita, elimina, cambia estados, filtra todas las solicitudes, registra para otro cliente y habilita/deshabilita cuentas. |

## Estructuras de datos

- **Diccionarios (objetos clave-valor):** `SERVICIOS` (código → datos del servicio) y `ESTADOS` (estado → color del badge).
- **Arrays de objetos:** `usuarios` y `solicitudes`.
- **Objeto solicitud:**

```js
{
  id: "SOL-0004", usuarioId: 2, estado: "Pendiente",
  cliente:  { nombre, telefono, email },
  vehiculo: { placa, marca, modelo, anio, kilometraje, combustible },
  servicio: "frenos", adicionales: ["Lavado exterior"],
  fecha: "2026-11-11", hora: "10:00", observaciones: "", creadoEn: "..."
}
```

- Métodos y ciclos usados: `for`, `for...of`, `for...in`, `forEach()`, `find()`, `filter()`, `map()`, `some()`, `includes()`, `Object.values()`.

## Validaciones

| Campo | Regla |
|---|---|
| Obligatorios | Todos los marcados con * |
| Teléfono | Celular `09XXXXXXXX` o fijo `0[2-7]XXXXXXX` |
| Placa | Formato ecuatoriano `ABC-123` o `ABC-1234` |
| Año | Entero entre 1980 y el año siguiente al actual |
| Kilometraje | Entero entre 0 y 999 999 |
| Servicio | Debe existir en el catálogo |
| Fecha | No anterior a hoy, no domingo, máximo 60 días de anticipación |
| Horario | L-V 08:00-16:00 (último turno); sábado hasta 11:00; si es hoy, una hora futura |
| Duplicados | Un vehículo no puede tener dos solicitudes activas el mismo día |
| Credenciales | Usuario y clave obligatorios, correctos y cuenta habilitada |

## Control por rol

- El enlace **Administración** es visible para todos, pero JavaScript verifica el rol antes de mostrarla (clic, escribir `#admin` en la URL).
- Todas las funciones administrativas (`cambiarEstado`, `editarSolicitud`, `eliminarSolicitud`, `cambiarCuenta`) empiezan llamando a `exigirAdmin()`, por lo que tampoco funcionan si un cliente las ejecuta desde la consola del navegador.
- La vista “Mis mantenimientos” usa `filter()` por `usuarioId`, así el cliente solo ve sus registros.
- Al eliminar se pide confirmación con SweetAlert2.

## Casos mínimos de prueba

| N.º | Prueba | Resultado obtenido |
|---|---|---|
| 1 | Iniciar sesión como Cliente (`mlopez`) | Muestra perfil y solo sus 2 solicitudes |
| 2 | Clave incorrecta / cuenta `atorres` | “Acceso inválido” / “Cuenta deshabilitada”; no inicia sesión |
| 3 | Placa `12AB`, kilometraje `-50`, fecha 2020 | No guarda; marca los campos y lista los errores |
| 4 | Registro válido | Se agrega al array con ID `SOL-000N` y aparece en Mis mantenimientos |
| 5 | Cliente entra a Administración | “Acceso denegado” (por menú, URL y consola) |
| 6 | Admin cambia estado y elimina | Cambios visibles en el listado general y en los contadores |

## Consideraciones de seguridad

Por ser una práctica solo de frontend, las contraseñas están en el código JavaScript y el control de roles se hace en el navegador. **En un sistema real esto no es seguro**: la autenticación, el hash de contraseñas y la autorización deben hacerse en el servidor. Como medida adicional, todo texto ingresado por el usuario se escapa con `escaparHTML()` antes de mostrarse con `innerHTML`, para evitar inyección de código (XSS).

## Recursos externos

- Bootstrap 5.3 – https://getbootstrap.com/
- Bootstrap Icons 1.11 – https://icons.getbootstrap.com/
- SweetAlert2 – https://sweetalert2.github.io/
- MDN Web Docs (DOM, eventos, métodos de Array) – https://developer.mozilla.org/es/
- Uso de IA: ver `Registro_uso_IA_AD01.pdf`
