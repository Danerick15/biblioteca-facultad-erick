using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class ReportesController : ControllerBase
    {
        private readonly IUsuarioBusiness _usuarioBusiness;
        private readonly ILibroBusiness _libroBusiness;
        private readonly IEjemplarBusiness _ejemplarBusiness;
        private readonly IPrestamoBusiness _prestamoBusiness;
        private readonly IMultaBusiness _multaBusiness;

        public ReportesController(
            IUsuarioBusiness usuarioBusiness,
            ILibroBusiness libroBusiness,
            IEjemplarBusiness ejemplarBusiness,
            IPrestamoBusiness prestamoBusiness,
            IMultaBusiness multaBusiness)
        {
            _usuarioBusiness = usuarioBusiness;
            _libroBusiness = libroBusiness;
            _ejemplarBusiness = ejemplarBusiness;
            _prestamoBusiness = prestamoBusiness;
            _multaBusiness = multaBusiness;
        }

        // GET: api/Reportes/estadisticas-generales
        [HttpGet("estadisticas-generales")]
        public IActionResult ObtenerEstadisticasGenerales()
        {
            try
            {
                var usuarios = _usuarioBusiness.Listar();
                var libros = _libroBusiness.Listar();
                var ejemplares = _ejemplarBusiness.Listar();
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var multas = _multaBusiness.ListarMultasPendientes();

                var estadisticas = new
                {
                    totalUsuarios = usuarios.Count,
                    totalLibros = libros.Count,
                    totalEjemplares = ejemplares.Count,
                    prestamosActivos = prestamos.Count,
                    prestamosVencidos = prestamos.Count(p => p.Estado == "VENCIDO"),
                    multasPendientes = multas.Count,
                    montoTotalMultas = multas.Sum(m => m.Monto)
                };

                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener estadísticas", error = ex.Message });
            }
        }

        // GET: api/Reportes/prestamos-por-mes
        [HttpGet("prestamos-por-mes")]
        public IActionResult ObtenerPrestamosPorMes([FromQuery] int año = 0)
        {
            try
            {
                if (año == 0) año = DateTime.Now.Year;

                var prestamos = _prestamoBusiness.ListarPrestamosActivos()
                    .Where(p => p.FechaPrestamo.Year == año)
                    .ToList();

                var prestamosPorMes = new List<object>();
                var meses = new[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                                  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };

                for (int i = 1; i <= 12; i++)
                {
                    var cantidad = prestamos.Count(p => p.FechaPrestamo.Month == i);
                    prestamosPorMes.Add(new
                    {
                        mes = meses[i - 1],
                        cantidad = cantidad
                    });
                }

                return Ok(prestamosPorMes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener préstamos por mes", error = ex.Message });
            }
        }

        // GET: api/Reportes/libros-mas-prestados
        [HttpGet("libros-mas-prestados")]
        public IActionResult ObtenerLibrosMasPrestados([FromQuery] int limite = 10)
        {
            try
            {
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var libros = _libroBusiness.Listar();

                var librosMasPrestados = prestamos
                    .GroupBy(p => p.LibroTitulo)
                    .Select(g => new
                    {
                        titulo = g.Key,
                        prestamos = g.Count()
                    })
                    .OrderByDescending(x => x.prestamos)
                    .Take(limite)
                    .ToList();

                return Ok(librosMasPrestados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener libros más prestados", error = ex.Message });
            }
        }

        // GET: api/Reportes/usuarios-mas-activos
        [HttpGet("usuarios-mas-activos")]
        public IActionResult ObtenerUsuariosMasActivos([FromQuery] int limite = 10)
        {
            try
            {
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var usuarios = _usuarioBusiness.Listar();

                var usuariosMasActivos = prestamos
                    .GroupBy(p => p.UsuarioNombre)
                    .Select(g => new
                    {
                        nombre = g.Key,
                        prestamos = g.Count()
                    })
                    .OrderByDescending(x => x.prestamos)
                    .Take(limite)
                    .ToList();

                return Ok(usuariosMasActivos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener usuarios más activos", error = ex.Message });
            }
        }

        // GET: api/Reportes/estadisticas-por-rol
        [HttpGet("estadisticas-por-rol")]
        public IActionResult ObtenerEstadisticasPorRol()
        {
            try
            {
                var usuarios = _usuarioBusiness.Listar();

                var estadisticasPorRol = usuarios
                    .GroupBy(u => u.Rol)
                    .Select(g => new
                    {
                        rol = g.Key,
                        cantidad = g.Count()
                    })
                    .ToList();

                return Ok(estadisticasPorRol);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener estadísticas por rol", error = ex.Message });
            }
        }

        // GET: api/Reportes/actividad-diaria
        [HttpGet("actividad-diaria")]
        public IActionResult ObtenerActividadDiaria([FromQuery] DateTime? fecha = null)
        {
            try
            {
                var fechaConsulta = fecha ?? DateTime.Today;
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var multas = _multaBusiness.ListarMultasPendientes();

                var actividad = new
                {
                    fecha = fechaConsulta.ToString("yyyy-MM-dd"),
                    prestamosHoy = prestamos.Count(p => p.FechaPrestamo.Date == fechaConsulta),
                    devolucionesHoy = prestamos.Count(p => p.FechaDevolucion?.Date == fechaConsulta),
                    multasGeneradasHoy = multas.Count(m => m.FechaCobro?.Date == fechaConsulta),
                    multasPagadasHoy = multas.Count(m => m.Estado == "Pagada")
                };

                return Ok(actividad);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener actividad diaria", error = ex.Message });
            }
        }

        // GET: api/Reportes/rendimiento-biblioteca
        [HttpGet("rendimiento-biblioteca")]
        public IActionResult ObtenerRendimientoBiblioteca([FromQuery] int meses = 6)
        {
            try
            {
                var fechaInicio = DateTime.Now.AddMonths(-meses);
                var prestamos = _prestamoBusiness.ListarPrestamosActivos()
                    .Where(p => p.FechaPrestamo >= fechaInicio)
                    .ToList();
                var multas = _multaBusiness.ListarMultasPendientes()
                    .Where(m => m.FechaCobro >= fechaInicio)
                    .ToList();

                var rendimiento = new
                {
                    periodo = $"{meses} meses",
                    fechaInicio = fechaInicio.ToString("yyyy-MM-dd"),
                    fechaFin = DateTime.Now.ToString("yyyy-MM-dd"),
                    totalPrestamos = prestamos.Count,
                    prestamosCompletados = prestamos.Count(p => p.Estado == "DEVUELTO"),
                    prestamosVencidos = prestamos.Count(p => p.Estado == "VENCIDO"),
                    tasaDevolucion = prestamos.Count > 0 ? 
                        (double)prestamos.Count(p => p.Estado == "DEVUELTO") / prestamos.Count * 100 : 0,
                    totalMultas = multas.Count,
                    montoTotalMultas = multas.Sum(m => m.Monto),
                    multasPagadas = multas.Count(m => m.Estado == "PAGADA"),
                    tasaPagoMultas = multas.Count > 0 ? 
                        (double)multas.Count(m => m.Estado == "PAGADA") / multas.Count * 100 : 0
                };

                return Ok(rendimiento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener rendimiento de biblioteca", error = ex.Message });
            }
        }
    }
}
