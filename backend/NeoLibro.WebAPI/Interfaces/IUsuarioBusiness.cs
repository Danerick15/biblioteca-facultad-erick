using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para la lógica de negocio de Usuarios
    /// Define el contrato para las operaciones de lógica de negocio de usuarios
    /// </summary>
    public interface IUsuarioBusiness
    {
        /// <summary>
        /// Obtiene todos los usuarios ordenados por nombre
        /// </summary>
        /// <returns>Lista de todos los usuarios</returns>
        List<Usuario> Listar();

        /// <summary>
        /// Crea un nuevo usuario con contraseña hasheada
        /// </summary>
        /// <param name="usuario">Usuario a crear</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Usuario usuario);

        /// <summary>
        /// Modifica un usuario existente, hasheando la contraseña si se proporciona
        /// </summary>
        /// <param name="usuario">Usuario con los datos actualizados</param>
        /// <returns>True si se modificó exitosamente, False si no</returns>
        bool Modificar(Usuario usuario);

        /// <summary>
        /// Elimina un usuario (cambio de estado a inactivo)
        /// </summary>
        /// <param name="id">ID del usuario a eliminar</param>
        /// <returns>True si se eliminó exitosamente, False si no</returns>
        bool Eliminar(int id);

        /// <summary>
        /// Obtiene un usuario por su ID
        /// </summary>
        /// <param name="id">ID del usuario</param>
        /// <returns>Usuario encontrado o null si no existe</returns>
        Usuario? ObtenerPorId(int id);

        /// <summary>
        /// Obtiene un usuario por su email institucional
        /// </summary>
        /// <param name="email">Email institucional del usuario</param>
        /// <returns>Usuario encontrado o null si no existe</returns>
        Usuario? ObtenerPorEmailInstitucional(string email);

        /// <summary>
        /// Autentica un usuario con email y contraseña
        /// </summary>
        /// <param name="email">Email institucional</param>
        /// <param name="contrasena">Contraseña en texto plano</param>
        /// <returns>Usuario autenticado o null si las credenciales son incorrectas</returns>
        Usuario? Login(string email, string contrasena);

        /// <summary>
        /// Verifica si existe un usuario con el email o código universitario especificado
        /// </summary>
        /// <param name="email">Email institucional</param>
        /// <param name="codigoUniversitario">Código universitario</param>
        /// <returns>True si existe, False si no</returns>
        bool ExisteEmailOCodigoUniversitario(string email, string codigoUniversitario);

        /// <summary>
        /// Genera un código universitario único basado en un código base
        /// </summary>
        /// <param name="codigoBase">Código base para generar el único</param>
        /// <returns>Código universitario único</returns>
        string GenerarCodigoUniversitarioUnico(string codigoBase);

        /// <summary>
        /// Verifica si una contraseña es correcta para un usuario
        /// </summary>
        /// <param name="email">Email institucional del usuario</param>
        /// <param name="contrasena">Contraseña a verificar</param>
        /// <returns>True si la contraseña es correcta, False si no</returns>
        bool VerificarContrasena(string email, string contrasena);

        /// <summary>
        /// Obtiene las estadísticas de un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Estadísticas del usuario</returns>
        EstadisticasUsuarioDTO ObtenerEstadisticasUsuario(int usuarioId);
    }
}
