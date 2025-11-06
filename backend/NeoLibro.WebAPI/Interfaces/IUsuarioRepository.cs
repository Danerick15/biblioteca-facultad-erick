using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de Usuarios
    /// Define el contrato para las operaciones de acceso a datos de usuarios
    /// </summary>
    public interface IUsuarioRepository
    {
        /// <summary>
        /// Obtiene un usuario por su email institucional
        /// </summary>
        /// <param name="email">Email institucional del usuario</param>
        /// <returns>Usuario encontrado o null si no existe</returns>
        Usuario? ObtenerPorEmailInstitucional(string email);

        /// <summary>
        /// Verifica si existe un usuario con el email o código universitario especificado
        /// </summary>
        /// <param name="email">Email institucional</param>
        /// <param name="codigoUniversitario">Código universitario</param>
        /// <returns>True si existe, False si no</returns>
        bool ExisteEmailOCodigoUniversitario(string email, string codigoUniversitario);

        /// <summary>
        /// Obtiene códigos universitarios similares al código base proporcionado
        /// </summary>
        /// <param name="codigoBase">Código base para buscar similares</param>
        /// <returns>Lista de códigos universitarios similares</returns>
        List<string> ObtenerCodigosUniversitariosSimilares(string codigoBase);

        /// <summary>
        /// Obtiene todos los usuarios ordenados por nombre
        /// </summary>
        /// <returns>Lista de todos los usuarios</returns>
        List<Usuario> Listar();

        /// <summary>
        /// Crea un nuevo usuario en la base de datos
        /// </summary>
        /// <param name="usuario">Usuario a crear</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Usuario usuario);

        /// <summary>
        /// Modifica un usuario existente
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
        /// Obtiene las estadísticas de un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Estadísticas del usuario</returns>
        EstadisticasUsuarioDTO ObtenerEstadisticasUsuario(int usuarioId);
    }
}
