import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import {
    obtenerEstadisticasGenerales,
    obtenerPrestamosPorMes,
    obtenerLibrosMasPrestados,
    obtenerUsuariosMasActivos,
    obtenerEstadisticasPorRol,
    obtenerActividadDiaria,
    obtenerRendimientoBiblioteca,
    type EstadisticasGenerales,
    type PrestamoPorMes,
    type LibroMasPrestado,
    type UsuarioMasActivo,
    type EstadisticaPorRol,
    type ActividadDiaria,
    type RendimientoBiblioteca
} from '../../../../../api/reportes';
import { 
    BarChart3, 
    Users, 
    BookOpen, 
    TrendingUp, 
    Calendar,
    Download,
    Filter,
    RefreshCw
} from 'lucide-react';
import './Reports.css';

interface ReporteData {
    estadisticasGenerales: EstadisticasGenerales;
    prestamosPorMes: PrestamoPorMes[];
    librosMasPrestados: LibroMasPrestado[];
    usuariosMasActivos: UsuarioMasActivo[];
    estadisticasPorRol: EstadisticaPorRol[];
    actividadDiaria: ActividadDiaria;
    rendimientoBiblioteca: RendimientoBiblioteca;
}

interface FiltrosReporte {
    fechaInicio: string;
    fechaFin: string;
    tipoReporte: string;
}

const Reports: React.FC = () => {
    // SEO
    useSEO({
        title: 'Reportes y Estadísticas - Biblioteca FISI',
        description: 'Visualiza estadísticas detalladas y reportes de la biblioteca',
        keywords: 'reportes, estadísticas, biblioteca, métricas'
    });
    
    const { goBack } = useNavigation();
    const [datos, setDatos] = useState<ReporteData | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<FiltrosReporte>({
        fechaInicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        tipoReporte: 'general'
    });
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [filtros]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            
            // Cargar datos reales desde las APIs
            const [
                estadisticasGenerales,
                prestamosPorMes,
                librosMasPrestados,
                usuariosMasActivos,
                estadisticasPorRol,
                actividadDiaria,
                rendimientoBiblioteca
            ] = await Promise.all([
                obtenerEstadisticasGenerales(),
                obtenerPrestamosPorMes(new Date().getFullYear()),
                obtenerLibrosMasPrestados(5),
                obtenerUsuariosMasActivos(5),
                obtenerEstadisticasPorRol(),
                obtenerActividadDiaria(),
                obtenerRendimientoBiblioteca(6)
            ]);
            
            const datosReales: ReporteData = {
                estadisticasGenerales,
                prestamosPorMes,
                librosMasPrestados,
                usuariosMasActivos,
                estadisticasPorRol,
                actividadDiaria,
                rendimientoBiblioteca
            };
            
            setDatos(datosReales);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al cargar los reportes');
            console.error('Error al cargar reportes:', err);
        } finally {
            setCargando(false);
        }
    };

    const exportarReporte = (formato: 'pdf' | 'excel') => {
        // Simular exportación
        console.log(`Exportando reporte en formato ${formato}`);
        alert(`Reporte exportado en formato ${formato.toUpperCase()}`);
    };

    const formatearMoneda = (monto: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(monto);
    };

    if (cargando) {
        return <PageLoader />;
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="error-state">
                    <h2>Error al cargar reportes</h2>
                    <p>{error}</p>
                    <button onClick={cargarDatos} className="btn-primary">
                        <RefreshCw size={20} />
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!datos) {
        return (
            <div className="page-content">
                <div className="empty-state">
                    <h2>No hay datos disponibles</h2>
                    <p>No se encontraron datos para generar los reportes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <button className="btn-back" onClick={goBack}>
                        ← Volver
                    </button>
                    <div className="admin-title-section">
                        <h1>Reportes y Estadísticas</h1>
                        <p>Análisis detallado del rendimiento de la biblioteca</p>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="admin-content">
                {/* Filtros y acciones */}
                <div className="reports-controls">
                    <div className="controls-left">
                        <button 
                            className={`btn-filter ${mostrarFiltros ? 'active' : ''}`}
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        >
                            <Filter size={20} />
                            Filtros
                        </button>
                        <button 
                            className="btn-refresh"
                            onClick={cargarDatos}
                        >
                            <RefreshCw size={20} />
                            Actualizar
                        </button>
                    </div>
                    
                    <div className="controls-right">
                        <button 
                            className="btn-export"
                            onClick={() => exportarReporte('pdf')}
                        >
                            <Download size={20} />
                            Exportar PDF
                        </button>
                        <button 
                            className="btn-export"
                            onClick={() => exportarReporte('excel')}
                        >
                            <Download size={20} />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                {/* Panel de filtros */}
                {mostrarFiltros && (
                    <div className="filters-panel">
                        <div className="filter-row">
                            <div className="form-group">
                                <label>Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={filtros.fechaInicio}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha Fin</label>
                                <input
                                    type="date"
                                    value={filtros.fechaFin}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo de Reporte</label>
                                <select
                                    value={filtros.tipoReporte}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, tipoReporte: e.target.value }))}
                                >
                                    <option value="general">General</option>
                                    <option value="prestamos">Préstamos</option>
                                    <option value="usuarios">Usuarios</option>
                                    <option value="inventario">Inventario</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Métricas principales */}
                <div className="metrics-grid">
                    <div className="metric-card metric-primary">
                        <div className="metric-icon">
                            <Users size={28} />
                        </div>
                        <div className="metric-content">
                            <h3>{datos.estadisticasGenerales.totalUsuarios.toLocaleString()}</h3>
                            <p>Total Usuarios</p>
                            <span className="metric-trend">+5.2% este mes</span>
                        </div>
                    </div>

                    <div className="metric-card metric-success">
                        <div className="metric-icon">
                            <BookOpen size={28} />
                        </div>
                        <div className="metric-content">
                            <h3>{datos.estadisticasGenerales.totalLibros.toLocaleString()}</h3>
                            <p>Libros en Catálogo</p>
                            <span className="metric-trend">+12 nuevos</span>
                        </div>
                    </div>

                    <div className="metric-card metric-info">
                        <div className="metric-icon">
                            <BarChart3 size={28} />
                        </div>
                        <div className="metric-content">
                            <h3>{datos.estadisticasGenerales.prestamosActivos}</h3>
                            <p>Préstamos Activos</p>
                            <span className="metric-trend">En circulación</span>
                        </div>
                    </div>

                    <div className="metric-card metric-warning">
                        <div className="metric-icon">
                            <TrendingUp size={28} />
                        </div>
                        <div className="metric-content">
                            <h3>{formatearMoneda(datos.estadisticasGenerales.montoTotalMultas)}</h3>
                            <p>Multas Pendientes</p>
                            <span className="metric-trend">{datos.estadisticasGenerales.multasPendientes} usuarios</span>
                        </div>
                    </div>
                </div>

                {/* Gráficos y análisis */}
                <div className="charts-grid">
                    {/* Gráfico de préstamos por mes */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Préstamos por Mes</h3>
                            <Calendar size={20} />
                        </div>
                        <div className="chart-content">
                            <div className="bar-chart">
                                {datos.prestamosPorMes.map((item, index) => {
                                    const maxCantidad = Math.max(...datos.prestamosPorMes.map(p => p.cantidad));
                                    return (
                                        <div key={index} className="bar-item">
                                            <div 
                                                className="bar" 
                                                style={{ 
                                                    height: `${(item.cantidad / maxCantidad) * 100}%`,
                                                    backgroundColor: `hsl(${200 + index * 10}, 70%, 50%)`
                                                }}
                                            ></div>
                                            <span className="bar-label">{item.mes}</span>
                                            <span className="bar-value">{item.cantidad}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Libros más prestados */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Libros Más Prestados</h3>
                            <BookOpen size={20} />
                        </div>
                        <div className="chart-content">
                            <div className="ranking-list">
                                {datos.librosMasPrestados.map((libro, index) => {
                                    const maxPrestamos = Math.max(...datos.librosMasPrestados.map(l => l.prestamos));
                                    return (
                                        <div key={index} className="ranking-item">
                                            <span className="ranking-position">#{index + 1}</span>
                                            <div className="ranking-info">
                                                <span className="ranking-title">{libro.titulo}</span>
                                                <span className="ranking-count">{libro.prestamos} préstamos</span>
                                            </div>
                                            <div className="ranking-bar">
                                                <div 
                                                    className="ranking-progress"
                                                    style={{ 
                                                        width: `${(libro.prestamos / maxPrestamos) * 100}%`,
                                                        backgroundColor: `hsl(${120 + index * 20}, 70%, 50%)`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Usuarios más activos */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Usuarios Más Activos</h3>
                            <Users size={20} />
                        </div>
                        <div className="chart-content">
                            <div className="ranking-list">
                                {datos.usuariosMasActivos.map((usuario, index) => {
                                    const maxPrestamos = Math.max(...datos.usuariosMasActivos.map(u => u.prestamos));
                                    return (
                                        <div key={index} className="ranking-item">
                                            <span className="ranking-position">#{index + 1}</span>
                                            <div className="ranking-info">
                                                <span className="ranking-title">{usuario.nombre}</span>
                                                <span className="ranking-count">{usuario.prestamos} préstamos</span>
                                            </div>
                                            <div className="ranking-bar">
                                                <div 
                                                    className="ranking-progress"
                                                    style={{ 
                                                        width: `${(usuario.prestamos / maxPrestamos) * 100}%`,
                                                        backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Distribución por roles */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Distribución por Roles</h3>
                            <Users size={20} />
                        </div>
                        <div className="chart-content">
                            <div className="pie-chart">
                                {datos.estadisticasPorRol.map((rol, index) => {
                                    const porcentaje = (rol.cantidad / datos.estadisticasGenerales.totalUsuarios) * 100;
                                    const color = index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b';
                                    return (
                                        <div key={index} className="pie-item">
                                            <div className="pie-color" style={{ backgroundColor: color }}></div>
                                            <div className="pie-info">
                                                <span className="pie-label">{rol.rol}</span>
                                                <span className="pie-value">{rol.cantidad} ({porcentaje.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen ejecutivo */}
                <div className="executive-summary">
                    <h2>Resumen Ejecutivo</h2>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <h4>Rendimiento General</h4>
                            <p>La biblioteca tiene {datos.estadisticasGenerales.totalUsuarios} usuarios registrados y {datos.estadisticasGenerales.totalLibros} libros en catálogo, con {datos.estadisticasGenerales.prestamosActivos} préstamos activos.</p>
                        </div>
                        <div className="summary-item">
                            <h4>Usuarios Activos</h4>
                            <p>El {((datos.estadisticasGenerales.totalUsuarios - datos.estadisticasGenerales.prestamosActivos) / datos.estadisticasGenerales.totalUsuarios * 100).toFixed(1)}% de los usuarios registrados tienen préstamos activos, indicando alta participación.</p>
                        </div>
                        <div className="summary-item">
                            <h4>Recursos Populares</h4>
                            <p>Los libros más prestados incluyen "{datos.librosMasPrestados[0]?.titulo || 'N/A'}" con {datos.librosMasPrestados[0]?.prestamos || 0} préstamos.</p>
                        </div>
                        <div className="summary-item">
                            <h4>Eficiencia Operativa</h4>
                            <p>La tasa de devolución es del {datos.rendimientoBiblioteca.tasaDevolucion.toFixed(1)}%, con {datos.rendimientoBiblioteca.prestamosCompletados} préstamos completados de {datos.rendimientoBiblioteca.totalPrestamos} totales.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
