using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using System.Security.Claims;
using Google.Apis.Auth;

namespace NeoLibroAPI.Controllers
{
    /// <summary>
    /// Controller para autenticación SSO (OAuth2)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioBusiness _usuarioBusiness;
        private readonly IConfiguration _configuration;

        public AuthController(IUsuarioBusiness usuarioBusiness, IConfiguration configuration)
        {
            _usuarioBusiness = usuarioBusiness;
            _configuration = configuration;
        }

        /// <summary>
        /// Login con Google OAuth2 (SSO)
        /// Recibe el token de Google y crea/autentica al usuario
        /// </summary>
        [HttpPost("sso/google")]
        public async Task<IActionResult> LoginGoogle([FromBody] GoogleLoginRequest request)
        {
            try
            {
                // Validar token de Google requerido
                if (string.IsNullOrEmpty(request.IdToken))
                {
                    return BadRequest(new { mensaje = "Token de Google requerido" });
                }

                // Obtener Client ID desde configuración
                var googleClientId = _configuration["GoogleOAuth:ClientId"];
                if (string.IsNullOrEmpty(googleClientId))
                {
                    return StatusCode(500, new { mensaje = "Configuración de Google OAuth no encontrada" });
                }

                // Validar el token de Google usando la API de Google
                GoogleJsonWebSignature.Payload? payload = null;
                try
                {
                    var settings = new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { googleClientId }
                    };
                    
                    payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
                }
                catch (InvalidJwtException ex)
                {
                    return Unauthorized(new { mensaje = "Token de Google inválido o expirado", error = ex.Message });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { mensaje = "Error al validar token de Google", error = ex.Message });
                }

                // Extraer información del token validado
                var email = payload.Email;
                var nombre = payload.Name;
                var googleId = payload.Subject;

                // Verificar que el email sea institucional
                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { mensaje = "Email de Google no encontrado en el token" });
                }

                // Verificar que el email sea institucional ANTES de crear/autenticar usuario
                if (!email.EndsWith("@unmsm.edu.pe", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { mensaje = "Solo se permiten emails institucionales (@unmsm.edu.pe)" });
                }

                // Verificar si el usuario ya existe
                var usuario = _usuarioBusiness.ObtenerPorEmailInstitucional(email);

                // Si no existe, crear usuario con rol Estudiante por defecto
                if (usuario == null)
                {
                    // El código universitario no se puede obtener de Google OAuth
                    // Se deja vacío para que el usuario lo complete después en su perfil
                    usuario = new Usuario
                    {
                        CodigoUniversitario = string.Empty, // Vacío - el usuario lo completará después
                        Nombre = nombre ?? email.Split('@')[0],
                        EmailInstitucional = email,
                        ContrasenaHash = "SSO_USER", // Marcador especial para usuarios SSO
                        Rol = "Estudiante", // Rol por defecto
                        Estado = true,
                        FechaRegistro = DateTime.Now,
                        FechaUltimaActualizacionContrasena = DateTime.Now
                    };

                    if (!_usuarioBusiness.Crear(usuario))
                    {
                        return BadRequest(new { mensaje = "No se pudo crear el usuario" });
                    }

                    // Obtener el usuario recién creado
                    usuario = _usuarioBusiness.ObtenerPorEmailInstitucional(email);
                    if (usuario == null)
                    {
                        return StatusCode(500, new { mensaje = "Error al crear usuario" });
                    }
                }

                // Crear claims y autenticar
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.UsuarioID.ToString()),
                    new Claim(ClaimTypes.Name, usuario.Nombre),
                    new Claim(ClaimTypes.Role, usuario.Rol),
                    new Claim("AuthMethod", "SSO_Google")
                };

                var identity = new ClaimsIdentity(claims, "MiCookieAuth");
                var principal = new ClaimsPrincipal(identity);

                await HttpContext.SignInAsync("MiCookieAuth", principal);

                return Ok(new
                {
                    mensaje = "Login SSO exitoso",
                    usuarioID = usuario.UsuarioID,
                    nombreUsuario = usuario.Nombre,
                    codigoUniversitario = usuario.CodigoUniversitario,
                    rol = usuario.Rol,
                    metodoAutenticacion = "SSO_Google"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error en autenticación SSO", error = ex.Message });
            }
        }
    }

    public class GoogleLoginRequest
    {
        public string IdToken { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? GoogleId { get; set; }
    }
}


