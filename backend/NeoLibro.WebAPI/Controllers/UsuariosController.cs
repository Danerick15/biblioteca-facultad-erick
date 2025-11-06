using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.Requests;
using NeoLibroAPI.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using System;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioBusiness _usuarioBusiness;

        public UsuariosController(IUsuarioBusiness usuarioBusiness)
        {
            _usuarioBusiness = usuarioBusiness;
        }

        // GET: api/Usuarios
        [HttpGet]
        public IActionResult Listar()
        {
            var lista = _usuarioBusiness.Listar();
            return Ok(lista);
        }

        // GET: api/Usuarios/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var usuario = _usuarioBusiness.ObtenerPorId(id);
            return usuario != null
                ? Ok(usuario)
                : NotFound(new { mensaje = "Usuario no encontrado" });
        }

        // PUT: api/Usuarios/{id}
        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] Usuario usuario)
        {
            if (id != usuario.UsuarioID)
                return BadRequest(new { mensaje = "El ID de la URL no coincide con el del cuerpo." });

            var resultado = _usuarioBusiness.Modificar(usuario);
            return resultado
                ? Ok(new { mensaje = "Usuario modificado correctamente" })
                : BadRequest(new { mensaje = "No se pudo modificar el usuario" });
        }

        // DELETE: api/Usuarios/{id}
        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            var resultado = _usuarioBusiness.Eliminar(id);
            return resultado
                ? Ok(new { mensaje = "Usuario eliminado correctamente" })
                : BadRequest(new { mensaje = "No se pudo eliminar el usuario" });
        }

        // LOGIN USUARIO: api/Usuarios/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = _usuarioBusiness.Login(request.EmailInstitucional, request.Contrasena);

            if (usuario == null)
                return Unauthorized(new { mensaje = "Credenciales incorrectas" });

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.UsuarioID.ToString()),
                new Claim(ClaimTypes.Name, usuario.Nombre),
                new Claim(ClaimTypes.Role, usuario.Rol) 
            };

            var identity = new ClaimsIdentity(claims, "MiCookieAuth");
            var principal = new ClaimsPrincipal(identity);

            await HttpContext.SignInAsync("MiCookieAuth", principal);

            return Ok(new
            {
                mensaje = "Login exitoso",
                usuarioID = usuario.UsuarioID,
                nombreUsuario = usuario.Nombre,
                codigoUniversitario = usuario.CodigoUniversitario,
                rol = usuario.Rol
            });
        }

        // REGISTRAR USUARIO: api/Usuarios/registrar
        [HttpPost("registrar")]
        public IActionResult Registrar([FromBody] UsuarioRegistroRequest dto)
        {
            try
            {
                // Validar que los datos no estén vacíos
                if (string.IsNullOrWhiteSpace(dto.EmailInstitucional))
                    return BadRequest(new { mensaje = "El email institucional es requerido." });

                if (string.IsNullOrWhiteSpace(dto.Contrasena))
                    return BadRequest(new { mensaje = "La contraseña es requerida." });

                if (dto.Contrasena != dto.ConfirmarContrasena)
                    return BadRequest(new { mensaje = "Las contraseñas no coinciden." });

                if (_usuarioBusiness.ExisteEmailOCodigoUniversitario(dto.EmailInstitucional, dto.CodigoUniversitario))
                    return BadRequest(new { mensaje = "El email institucional o código universitario ya está en uso." });

                var nuevoUsuario = new Usuario
                {
                    CodigoUniversitario = dto.CodigoUniversitario,
                    Nombre = dto.Nombre,
                    EmailInstitucional = dto.EmailInstitucional,
                    ContrasenaHash = dto.Contrasena,
                    Rol = dto.Rol,
                    Estado = true,
                    FechaRegistro = DateTime.Now,
                    FechaUltimaActualizacionContrasena = DateTime.Now
                };

                var resultado = _usuarioBusiness.Crear(nuevoUsuario);
                return resultado
                    ? Ok(new { mensaje = "Usuario registrado correctamente" })
                    : BadRequest(new { mensaje = "No se pudo registrar el usuario. Verifica los datos e intenta nuevamente." });
            }
            catch (Exception ex)
            {
                // Log del error (en producción usar un logger)
                Console.WriteLine($"Error al registrar usuario: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                
                return StatusCode(500, new { 
                    mensaje = "Error interno del servidor al registrar el usuario. Por favor, intenta más tarde o contacta al administrador.",
                    error = ex.Message 
                });
            }
        }

        //Verificar sesión activa
        [HttpGet("verificar-sesion")]
        public IActionResult VerificarSesion()
        {
            if (!User.Identity?.IsAuthenticated ?? true)
                return Unauthorized(new { autenticado = false, mensaje = "Sesión no activa" });

            return Ok(new
            {
                autenticado = true,
                usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                nombreUsuario = User.Identity?.Name,
                rol = User.FindFirst(ClaimTypes.Role)?.Value
            });
        }


        // Cerrar sesión
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("MiCookieAuth");
            return Ok(new { mensaje = "Sesión cerrada correctamente" });
        }

        // Ruta protegida para usuarios autenticados
        [Authorize]
        [HttpGet("solo-usuarios-logueados")]
        public IActionResult SoloUsuarios()
        {
            return Ok(new { mensaje = "Tienes acceso al contenido privado" });
        }

        // Ruta protegida solo para administradores
        [Authorize(Roles = "Administrador")]
        [HttpGet("solo-admins")]
        public IActionResult SoloAdmins()
        {
            return Ok(new { mensaje = "Bienvenido, administrador. Tienes acceso exclusivo." });
        }

        // SOLICITAR RECUPERACIÓN DE CONTRASEÑA: api/Usuarios/solicitar-recuperacion
        [HttpPost("solicitar-recuperacion")]
        public IActionResult SolicitarRecuperacion([FromBody] SolicitarRecuperacionRequest request)
        {
            var usuario = _usuarioBusiness.ObtenerPorEmailInstitucional(request.EmailInstitucional);
            
            if (usuario == null)
            {
                // Por seguridad, no revelamos si el email existe o no
                return Ok(new { mensaje = "Si el email existe, se enviará un enlace de recuperación." });
            }

            // En un sistema real, aquí se generaría un token y se enviaría por email
            // Por ahora, simulamos el proceso
            var tokenRecuperacion = Guid.NewGuid().ToString();
            
            // En un sistema real, guardarías el token en la base de datos con expiración
            // y enviarías un email con el enlace
            
            return Ok(new { 
                mensaje = "Si el email existe, se enviará un enlace de recuperación.",
                tokenSimulado = tokenRecuperacion // Solo para desarrollo
            });
        }

        // RESETEAR CONTRASEÑA: api/Usuarios/resetear-contrasena
        [HttpPost("resetear-contrasena")]
        public IActionResult ResetearContrasena([FromBody] ResetearContrasenaRequest request)
        {
            if (request.NuevaContrasena != request.ConfirmarContrasena)
                return BadRequest(new { mensaje = "Las contraseñas no coinciden." });

            // En un sistema real, aquí validarías el token de recuperación
            // Por ahora, simulamos la validación
            if (string.IsNullOrEmpty(request.TokenRecuperacion))
            {
                return BadRequest(new { mensaje = "Token de recuperación inválido o expirado." });
            }

            // Buscar usuario por email
            var usuario = _usuarioBusiness.ObtenerPorEmailInstitucional(request.EmailInstitucional);
            if (usuario == null)
            {
                return BadRequest(new { mensaje = "Usuario no encontrado." });
            }

            // Actualizar contraseña
            usuario.ContrasenaHash = request.NuevaContrasena;
            var resultado = _usuarioBusiness.Modificar(usuario);

            return resultado
                ? Ok(new { mensaje = "Contraseña actualizada correctamente." })
                : BadRequest(new { mensaje = "No se pudo actualizar la contraseña." });
        }

        // ===== ENDPOINTS DE PERFIL DE USUARIO =====

        // GET: api/Usuarios/mi-perfil
        [HttpGet("mi-perfil")]
        [Authorize]
        public IActionResult ObtenerMiPerfil()
        {
            var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var usuario = _usuarioBusiness.ObtenerPorId(id);
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado" });

            // Obtener estadísticas del usuario
            var estadisticas = _usuarioBusiness.ObtenerEstadisticasUsuario(id);

            var perfil = new PerfilUsuarioDTO
            {
                UsuarioID = usuario.UsuarioID,
                CodigoUniversitario = usuario.CodigoUniversitario,
                Nombre = usuario.Nombre,
                EmailInstitucional = usuario.EmailInstitucional,
                Rol = usuario.Rol,
                Estado = usuario.Estado,
                FechaRegistro = usuario.FechaRegistro,
                FechaUltimaActualizacionContrasena = usuario.FechaUltimaActualizacionContrasena,
                TotalPrestamos = estadisticas.TotalPrestamos,
                PrestamosActivos = estadisticas.PrestamosActivos,
                PrestamosCompletados = estadisticas.PrestamosCompletados,
                TotalMultas = estadisticas.TotalMultas,
                MultasPendientes = estadisticas.MultasPendientes,
                MontoMultasPendientes = estadisticas.MontoMultasPendientes
            };

            return Ok(perfil);
        }

        // PUT: api/Usuarios/mi-perfil
        [HttpPut("mi-perfil")]
        [Authorize]
        public IActionResult ActualizarMiPerfil([FromBody] ActualizarPerfilRequest request)
        {
            var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var usuario = _usuarioBusiness.ObtenerPorId(id);
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado" });

            // Validar que el email no esté en uso por otro usuario
            if (request.EmailInstitucional != usuario.EmailInstitucional)
            {
                var usuarioExistente = _usuarioBusiness.ObtenerPorEmailInstitucional(request.EmailInstitucional);
                if (usuarioExistente != null && usuarioExistente.UsuarioID != id)
                    return BadRequest(new { mensaje = "El email institucional ya está en uso por otro usuario." });
            }

            // Actualizar datos
            usuario.Nombre = request.Nombre;
            usuario.EmailInstitucional = request.EmailInstitucional;

            var resultado = _usuarioBusiness.Modificar(usuario);
            return resultado
                ? Ok(new { mensaje = "Perfil actualizado correctamente" })
                : BadRequest(new { mensaje = "No se pudo actualizar el perfil" });
        }

        // PUT: api/Usuarios/cambiar-contrasena
        [HttpPut("cambiar-contrasena")]
        [Authorize]
        public IActionResult CambiarContrasena([FromBody] CambiarContrasenaRequest request)
        {
            if (request.NuevaContrasena != request.ConfirmarContrasena)
                return BadRequest(new { mensaje = "Las contraseñas nuevas no coinciden." });

            var usuarioId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var usuario = _usuarioBusiness.ObtenerPorId(id);
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado" });

            // Verificar contraseña actual
            var contrasenaActualValida = _usuarioBusiness.VerificarContrasena(usuario.EmailInstitucional, request.ContrasenaActual);
            if (!contrasenaActualValida)
                return BadRequest(new { mensaje = "La contraseña actual es incorrecta." });

            // Actualizar contraseña
            usuario.ContrasenaHash = request.NuevaContrasena;
            var resultado = _usuarioBusiness.Modificar(usuario);

            return resultado
                ? Ok(new { mensaje = "Contraseña actualizada correctamente" })
                : BadRequest(new { mensaje = "No se pudo actualizar la contraseña" });
        }

        // ===== ENDPOINTS DE ADMINISTRACIÓN DE USUARIOS =====

        // GET: api/Usuarios/estadisticas
        [HttpGet("estadisticas")]
        [Authorize(Roles = "Administrador")]
        public IActionResult ObtenerEstadisticasUsuarios()
        {
            try
            {
                var usuarios = _usuarioBusiness.Listar();
                
                var estadisticas = new
                {
                    totalUsuarios = usuarios.Count,
                    usuariosActivos = usuarios.Count(u => u.Estado == true),
                    usuariosInactivos = usuarios.Count(u => u.Estado == false),
                    usuariosSuspendidos = 0, // No hay estado suspendido en el modelo actual
                    usuariosPorRol = usuarios.GroupBy(u => u.Rol)
                        .Select(g => new { rol = g.Key, cantidad = g.Count() })
                        .ToList(),
                    usuariosRegistradosEsteMes = usuarios.Count(u => u.FechaRegistro.Month == DateTime.Now.Month && 
                                                                   u.FechaRegistro.Year == DateTime.Now.Year)
                };

                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener estadísticas de usuarios", error = ex.Message });
            }
        }

        // PUT: api/Usuarios/{id}/estado
        [HttpPut("{id}/estado")]
        [Authorize(Roles = "Administrador")]
        public IActionResult CambiarEstadoUsuario(int id, [FromBody] CambiarEstadoRequest request)
        {
            try
            {
                var usuario = _usuarioBusiness.ObtenerPorId(id);
                if (usuario == null)
                    return NotFound(new { mensaje = "Usuario no encontrado" });

                if (!new[] { "Activo", "Inactivo" }.Contains(request.Estado))
                    return BadRequest(new { mensaje = "Estado no válido. Use: Activo o Inactivo" });

                usuario.Estado = request.Estado == "Activo";
                var resultado = _usuarioBusiness.Modificar(usuario);

                return resultado
                    ? Ok(new { mensaje = $"Estado del usuario cambiado a {request.Estado}" })
                    : BadRequest(new { mensaje = "No se pudo cambiar el estado del usuario" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al cambiar estado del usuario", error = ex.Message });
            }
        }

        // GET: api/Usuarios/buscar
        [HttpGet("buscar")]
        [Authorize(Roles = "Administrador")]
        public IActionResult BuscarUsuarios([FromQuery] string? termino = null, 
                                          [FromQuery] string? rol = null, 
                                          [FromQuery] string? estado = null,
                                          [FromQuery] string? ordenarPor = "nombre",
                                          [FromQuery] string? orden = "asc")
        {
            try
            {
                var usuarios = _usuarioBusiness.Listar().AsQueryable();

                // Filtrar por término de búsqueda
                if (!string.IsNullOrEmpty(termino))
                {
                    var terminoLower = termino.ToLower();
                    usuarios = usuarios.Where(u => 
                        u.Nombre.ToLower().Contains(terminoLower) ||
                        u.EmailInstitucional.ToLower().Contains(terminoLower) ||
                        u.CodigoUniversitario.ToLower().Contains(terminoLower));
                }

                // Filtrar por rol
                if (!string.IsNullOrEmpty(rol))
                {
                    usuarios = usuarios.Where(u => u.Rol == rol);
                }

                // Filtrar por estado
                if (!string.IsNullOrEmpty(estado))
                {
                    usuarios = usuarios.Where(u => (estado == "Activo" && u.Estado == true) || (estado == "Inactivo" && u.Estado == false));
                }

                // Ordenar
                switch (ordenarPor.ToLower())
                {
                    case "nombre":
                        usuarios = orden.ToLower() == "desc" 
                            ? usuarios.OrderByDescending(u => u.Nombre)
                            : usuarios.OrderBy(u => u.Nombre);
                        break;
                    case "email":
                        usuarios = orden.ToLower() == "desc" 
                            ? usuarios.OrderByDescending(u => u.EmailInstitucional)
                            : usuarios.OrderBy(u => u.EmailInstitucional);
                        break;
                    case "fecharegistro":
                        usuarios = orden.ToLower() == "desc" 
                            ? usuarios.OrderByDescending(u => u.FechaRegistro)
                            : usuarios.OrderBy(u => u.FechaRegistro);
                        break;
                    default:
                        usuarios = usuarios.OrderBy(u => u.UsuarioID);
                        break;
                }

                var resultado = usuarios.Select(u => new
                {
                    u.UsuarioID,
                    u.Nombre,
                    EmailInstitucional = u.EmailInstitucional,
                    CodigoUniversitario = u.CodigoUniversitario,
                    u.Rol,
                    Estado = u.Estado ? "Activo" : "Inactivo",
                    u.FechaRegistro
                }).ToList();

                return Ok(new { 
                    usuarios = resultado,
                    total = resultado.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al buscar usuarios", error = ex.Message });
            }
        }

        // GET: api/Usuarios/{id}/detalles
        [HttpGet("{id}/detalles")]
        [Authorize(Roles = "Administrador")]
        public IActionResult ObtenerDetallesUsuario(int id)
        {
            try
            {
                var usuario = _usuarioBusiness.ObtenerPorId(id);
                if (usuario == null)
                    return NotFound(new { mensaje = "Usuario no encontrado" });

                // Obtener estadísticas del usuario
                var estadisticas = _usuarioBusiness.ObtenerEstadisticasUsuario(id);

                var detalles = new
                {
                    usuario.UsuarioID,
                    usuario.Nombre,
                    EmailInstitucional = usuario.EmailInstitucional,
                    CodigoUniversitario = usuario.CodigoUniversitario,
                    usuario.Rol,
                    Estado = usuario.Estado ? "Activo" : "Inactivo",
                    usuario.FechaRegistro,
                    prestamosActivos = estadisticas.PrestamosActivos,
                    prestamosTotales = estadisticas.TotalPrestamos,
                    multasPendientes = estadisticas.TotalMultas,
                    montoMultas = estadisticas.MontoMultasPendientes
                };

                return Ok(detalles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener detalles del usuario", error = ex.Message });
            }
        }
    }

    // Clases para requests
    public class CambiarEstadoRequest
    {
        public string Estado { get; set; } = string.Empty;
    }
}

