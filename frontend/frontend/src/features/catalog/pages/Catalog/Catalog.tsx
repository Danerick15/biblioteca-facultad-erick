import React, { useState, useEffect, useMemo } from "react";
import "./Catalog.css";
import { useSEO, SEOConfigs } from "../../../../hooks/useSEO";
import PageLoader from "../../../../components/PageLoader";
import { useAuth } from "../../../../hooks/useAuth";
import { 
    BookOpen, 
    Search, 
    Filter, 
    Eye,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Calendar,
    Hash,
    AlertCircle
} from "lucide-react";
import { obtenerLibros } from "../../../../api/libros";
import { crearReserva } from "../../../../api/reservas";
import { obtenerEjemplaresPorLibro, type Ejemplar } from "../../../../api/ejemplares";
import type { LibroDTO } from "../../../../api/libros";
import type { Usuario } from "../../../../contexts/AuthContextTypes";

// ===== INTERFACES =====
// Props del componente (usuario opcional). El prop se recibe para mantener compatibilidad
// con `App.tsx` que le pasa `usuario`, pero no se usa aquí.
interface CatalogoProps {
    usuario?: Usuario;
}

interface Filtros {
    busqueda: string;
    autor: string;
    categoria: string;
    categoriaLCC: string;
    anio: string;
    disponibilidad: string;
}

// ===== COMPONENTE PRINCIPAL =====
const Catalogo: React.FC<CatalogoProps> = (props) => {
    // Consumir props de forma explícita para evitar errores de "declared but never used"
    void props;
    // SEO
    useSEO(SEOConfigs.catalogo);
    
    // Verificar si es administrador
    const { esAdmin, esProfesor } = useAuth();
    const esAdminOBibliotecaria = esAdmin() || esProfesor();
    
    // Estados
    const [libros, setLibros] = useState<LibroDTO[]>([]);
    const [librosFiltrados, setLibrosFiltrados] = useState<LibroDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reservandoId, setReservandoId] = useState<number | null>(null);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [libroSeleccionado, setLibroSeleccionado] = useState<LibroDTO | null>(null);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [mostrarReservaModal, setMostrarReservaModal] = useState(false);
    const [ejemplaresParaReservar, setEjemplaresParaReservar] = useState<Ejemplar[]>([]);
    const [ejemplarParaReservarId, setEjemplarParaReservarId] = useState<number | null>(null);
    
    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [librosPorPagina] = useState(25);
    
    // Filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        autor: '',
        categoria: '',
        categoriaLCC: '',
        anio: '',
        disponibilidad: ''
    });

    // Ordenamiento
    const [ordenarPor, setOrdenarPor] = useState<keyof LibroDTO>('titulo');
    const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('asc');

    // ===== EFECTOS =====
    useEffect(() => {
        cargarLibros();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [libros, filtros, ordenarPor, direccionOrden]);

    // ===== FUNCIONES =====
    const cargarLibros = async () => {
            try {
                setCargando(true);
                setError(null);
            const datos = await obtenerLibros();
            setLibros(datos);
        } catch (err) {
            console.error('Error cargando libros:', err);
            setError('Error al cargar los libros. Por favor, intenta de nuevo.');
            } finally {
                setCargando(false);
            }
        };

    const aplicarFiltros = () => {
        let resultado = [...libros];

        // Filtro de búsqueda general
        if (filtros.busqueda.trim()) {
            const busqueda = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(libro =>
                libro.titulo.toLowerCase().includes(busqueda) ||
                libro.autores?.some(autor => autor.toLowerCase().includes(busqueda)) ||
                libro.categorias?.some(cat => cat.toLowerCase().includes(busqueda)) ||
                libro.editorial?.toLowerCase().includes(busqueda)
            );
        }

        // Filtro por autor
        if (filtros.autor.trim()) {
            resultado = resultado.filter(libro =>
                libro.autores?.some(autor => 
                    autor.toLowerCase().includes(filtros.autor.toLowerCase())
                )
            );
        }

        // Filtro por categoría
        if (filtros.categoria.trim()) {
            resultado = resultado.filter(libro =>
                libro.categorias?.some(cat => 
                    cat.toLowerCase().includes(filtros.categoria.toLowerCase())
                )
            );
        }

        // Filtro por categoría LCC
        if (filtros.categoriaLCC.trim()) {
            resultado = resultado.filter(libro =>
                libro.lccSeccion?.toLowerCase().includes(filtros.categoriaLCC.toLowerCase())
            );
        }

        // Filtro por año
        if (filtros.anio.trim()) {
            resultado = resultado.filter(libro =>
                libro.anioPublicacion?.toString().includes(filtros.anio)
            );
        }

        // Filtro por disponibilidad
        if (filtros.disponibilidad) {
            switch (filtros.disponibilidad) {
                case 'disponibles':
                    resultado = resultado.filter(libro => libro.ejemplaresDisponibles > 0);
                    break;
                case 'prestados':
                    resultado = resultado.filter(libro => libro.ejemplaresPrestados > 0);
                    break;
                case 'agotados':
                    resultado = resultado.filter(libro => libro.ejemplaresDisponibles === 0);
                    break;
            }
        }

        // Ordenamiento
        resultado.sort((a, b) => {
            const valorA = a[ordenarPor];
            const valorB = b[ordenarPor];
            
            if (valorA === null || valorA === undefined) return 1;
            if (valorB === null || valorB === undefined) return -1;
            
            if (typeof valorA === 'string' && typeof valorB === 'string') {
                return direccionOrden === 'asc' 
                    ? valorA.localeCompare(valorB)
                    : valorB.localeCompare(valorA);
            }
            
            if (typeof valorA === 'number' && typeof valorB === 'number') {
                return direccionOrden === 'asc' 
                    ? valorA - valorB 
                    : valorB - valorA;
            }
            
            return 0;
        });

        setLibrosFiltrados(resultado);
        setPaginaActual(1);
    };

    const manejarCambioFiltro = (campo: keyof Filtros, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            busqueda: '',
            autor: '',
            categoria: '',
            categoriaLCC: '',
            anio: '',
            disponibilidad: ''
        });
    };

    const manejarOrdenar = (campo: keyof LibroDTO) => {
        if (ordenarPor === campo) {
            setDireccionOrden(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenarPor(campo);
            setDireccionOrden('asc');
        }
    };

    const verDetalles = (libro: LibroDTO) => {
        setLibroSeleccionado(libro);
        setMostrarDetalles(true);
    };

    const cerrarDetalles = () => {
        setMostrarDetalles(false);
        setLibroSeleccionado(null);
    };

    const abrirReservaModal = async (libroId: number) => {
        try {
            setError(null);
            setReservandoId(libroId);
            // obtener todos los ejemplares del libro
            const lista = await obtenerEjemplaresPorLibro(libroId);
            setEjemplaresParaReservar(lista);
            // Seleccionar por defecto el primer ejemplar disponible, si no hay, el primer prestado
            const primerDisponible = lista.find(e => (e.estado || '').toString().trim().toLowerCase() === 'disponible');
            const primerEjemplar = primerDisponible || lista[0];
            setEjemplarParaReservarId(primerEjemplar?.ejemplarID || null);
            setMostrarReservaModal(true);
        } catch (e) {
            const mensaje = (e as any)?.response?.data?.mensaje || 'No se pudo cargar ejemplares para reservar';
            setError(mensaje);
            alert(mensaje);
            setReservandoId(null);
        }
    };

    const confirmarReserva = async (libroId: number) => {
        try {
            if (!ejemplarParaReservarId) {
                throw new Error('Debes seleccionar un ejemplar para reservar');
            }
            
            const ejemplar = ejemplaresParaReservar.find(e => e.ejemplarID === ejemplarParaReservarId);
            // Si el ejemplar está prestado, forzamos tipoReserva='ColaEspera'
            const isPrestado = ejemplar?.estado.toLowerCase() === 'prestado';
            const mensaje = isPrestado 
                ? 'Tu reserva se ha agregado a la cola de espera. Te notificaremos cuando el ejemplar esté disponible.'
                : 'Reserva creada correctamente. Puedes pasar a recoger el ejemplar en biblioteca.';
            
            console.log('Creando reserva:', {
                libroId,
                ejemplarId: ejemplarParaReservarId,
                tipoReserva: isPrestado ? 'ColaEspera' : 'Retiro',
                estadoEjemplar: ejemplar?.estado
            });
            
            const res = await crearReserva(libroId, undefined, ejemplarParaReservarId);
            console.log('Respuesta creación reserva:', res);
            
            alert(res.mensaje || mensaje);
            setMostrarReservaModal(false);
            setEjemplaresParaReservar([]);
            setEjemplarParaReservarId(null);
            cargarLibros();
        } catch (e: unknown) {
            console.error('Error al crear reserva:', e);
            const mensaje = (e as any)?.response?.data?.mensaje || 
                          (e instanceof Error ? e.message : 'No se pudo crear la reserva');
            setError(mensaje);
            alert(mensaje);
        } finally {
            setReservandoId(null);
        }
    };

    // Las funciones relacionadas con préstamos se han eliminado ya que ahora se manejan desde la interfaz de administración

    // ===== CÁLCULOS =====
    const totalPaginas = Math.ceil(librosFiltrados.length / librosPorPagina);
    const inicio = (paginaActual - 1) * librosPorPagina;
    const fin = inicio + librosPorPagina;
    const librosPagina = librosFiltrados.slice(inicio, fin);

    const estadisticas = useMemo(() => ({
        total: libros.length,
        disponibles: libros.filter(l => l.ejemplaresDisponibles > 0).length,
        prestados: libros.filter(l => l.ejemplaresPrestados > 0).length,
        filtrados: librosFiltrados.length
    }), [libros, librosFiltrados]);

    // ===== RENDERIZADO =====
    if (cargando) {
        return <PageLoader message="Cargando catálogo de libros..." />;
    }

    if (error) {
        return (
            <div className="catalog-error">
                <div className="error-content">
                    <AlertCircle className="error-icon" />
                    <h3>Error al cargar el catálogo</h3>
                <p>{error}</p>
                    <button onClick={cargarLibros} className="btn-primary">
                        Intentar de nuevo
                </button>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-container">
            {/* Header */}
            <div className="catalog-header">
                <div className="header-content">
                    <div className="header-title">
                        <BookOpen className="title-icon" />
                        <h1>Catálogo de Libros</h1>
                    </div>
                    <div className="header-stats">
                        <div className="stat">
                            <span className="stat-number">{estadisticas.total}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">{estadisticas.disponibles}</span>
                            <span className="stat-label">Disponibles</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">{estadisticas.filtrados}</span>
                            <span className="stat-label">Mostrando</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="catalog-filters">
                <div className="filters-header">
                    <button 
                        className={`filter-toggle ${mostrarFiltros ? 'active' : ''}`}
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    >
                        <Filter className="icon" />
                        Filtros
                    </button>
                    <div className="search-box">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por título, autor, categoría..."
                            value={filtros.busqueda}
                            onChange={(e) => manejarCambioFiltro('busqueda', e.target.value)}
                        />
                                    </div>
                </div>

                {mostrarFiltros && (
                    <div className="filters-content">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Autor</label>
                                <input
                                    type="text"
                                    placeholder="Filtrar por autor"
                                    value={filtros.autor}
                                    onChange={(e) => manejarCambioFiltro('autor', e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Categoría</label>
                                <input
                                    type="text"
                                    placeholder="Filtrar por categoría"
                                    value={filtros.categoria}
                                    onChange={(e) => manejarCambioFiltro('categoria', e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Categoría LCC</label>
                                <input
                                    type="text"
                                    placeholder="Ej: QA, TK, BC"
                                    value={filtros.categoriaLCC}
                                    onChange={(e) => manejarCambioFiltro('categoriaLCC', e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Año</label>
                                <input
                                    type="text"
                                    placeholder="Filtrar por año"
                                    value={filtros.anio}
                                    onChange={(e) => manejarCambioFiltro('anio', e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label>Disponibilidad</label>
                                <select 
                                    value={filtros.disponibilidad}
                                    onChange={(e) => manejarCambioFiltro('disponibilidad', e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="disponibles">Disponibles</option>
                                    <option value="prestados">Prestados</option>
                                    <option value="agotados">Agotados</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-actions">
                            <button onClick={limpiarFiltros} className="btn-secondary">
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabla de libros */}
            <div className="catalog-table-container">
                <table className="catalog-table">
                    <thead>
                        <tr>
                            <th 
                                className="sortable"
                                onClick={() => manejarOrdenar('titulo')}
                            >
                                Título
                                <ArrowUpDown className="sort-icon" />
                            </th>
                            <th 
                                className="sortable"
                                onClick={() => manejarOrdenar('autores')}
                            >
                                Autor(es)
                                <ArrowUpDown className="sort-icon" />
                            </th>
                            <th 
                                className="sortable"
                                onClick={() => manejarOrdenar('anioPublicacion')}
                            >
                                Año
                                <ArrowUpDown className="sort-icon" />
                            </th>
                            <th 
                                className="sortable"
                                onClick={() => manejarOrdenar('editorial')}
                            >
                                Editorial
                                <ArrowUpDown className="sort-icon" />
                            </th>
                            <th>LCC</th>
                            <th 
                                className="sortable"
                                onClick={() => manejarOrdenar('ejemplaresDisponibles')}
                            >
                                Disponibles
                                <ArrowUpDown className="sort-icon" />
                            </th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {librosPagina.map((libro) => (
                            <tr key={libro.libroID}>
                                <td className="titulo-cell">
                                    <div className="titulo-content">
                                        <strong>{libro.titulo}</strong>
                                        {libro.categorias && libro.categorias.length > 0 && (
                                            <div className="categorias">
                                                {libro.categorias.map((cat, idx) => (
                                                    <span key={idx} className="categoria-tag">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="autor-cell">
                                    {libro.autores && libro.autores.length > 0 ? (
                                        <div className="autores">
                                            {libro.autores.map((autor, idx) => (
                                                <span key={idx} className="autor">
                                                    {autor}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="no-data">No especificado</span>
                                    )}
                                </td>
                                <td className="anio-cell">
                                    {libro.anioPublicacion ? (
                                        <span className="anio">
                                            <Calendar className="icon" />
                                            {libro.anioPublicacion}
                                        </span>
                                    ) : (
                                        <span className="no-data">-</span>
                                    )}
                                </td>
                                <td className="editorial-cell">
                                    {libro.editorial || 'Sin editorial'}
                                </td>
                                <td className="lcc-cell">
                                    {libro.signaturaLCC ? (
                                        <span className="lcc">
                                            <Hash className="icon" />
                                            {libro.signaturaLCC}
                                        </span>
                                    ) : (
                                        <span className="no-data">-</span>
                                    )}
                                </td>
                                <td className="disponibilidad-cell">
                                    <div className="disponibilidad">
                                        <span className={`status ${libro.ejemplaresDisponibles > 0 ? 'disponible' : 'agotado'}`}>
                                            {libro.ejemplaresDisponibles > 0 
                                                ? `Disponible (${libro.ejemplaresDisponibles})` 
                                                : 'Agotado'
                                            }
                                        </span>
                                    </div>
                                </td>
                                <td className="acciones-cell">
                                    <div className="acciones-group">
                                        <div className="acciones-row horizontal">
                                            <button
                                                className="btn-icon"
                                                onClick={() => verDetalles(libro)}
                                                title="Ver detalles del libro"
                                            >
                                                <Eye className="icon" />
                                            </button>
                                            {!esAdminOBibliotecaria && (
                                                <button
                                                    className="btn-compact"
                                                    onClick={() => abrirReservaModal(libro.libroID)}
                                                    disabled={reservandoId === libro.libroID}
                                                    title="Solicitar reserva del libro"
                                                >
                                                    {reservandoId === libro.libroID ? 'Reservando...' : 'Reservar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {librosPagina.length === 0 && (
                    <div className="no-results">
                        <BookOpen className="no-results-icon" />
                        <h3>No se encontraron libros</h3>
                        <p>Intenta ajustar los filtros de búsqueda</p>
                    </div>
                )}
                    </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="catalog-pagination">
                    <div className="pagination-info">
                        Mostrando {inicio + 1} - {Math.min(fin, librosFiltrados.length)} de {librosFiltrados.length} libros
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="pagination-btn"
                            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                            disabled={paginaActual === 1}
                        >
                            <ChevronLeft className="icon" />
                            Anterior
                        </button>
                        
                        <div className="pagination-numbers">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                const numero = i + 1;
                                return (
                                    <button
                                        key={numero}
                                        className={`pagination-number ${paginaActual === numero ? 'active' : ''}`}
                                        onClick={() => setPaginaActual(numero)}
                                    >
                                        {numero}
                                    </button>
                                );
                            })}
                        </div>
                        
                                                    <button
                            className="pagination-btn"
                            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                            disabled={paginaActual === totalPaginas}
                        >
                            Siguiente
                            <ChevronRight className="icon" />
                                                    </button>
                                                </div>
                                            </div>
            )}

            {/* Modal de detalles */}
            {mostrarDetalles && libroSeleccionado && (
                <div className="modal-overlay" onClick={cerrarDetalles}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalles del Libro</h2>
                            <button className="modal-close" onClick={cerrarDetalles}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="libro-details">
                                <div className="detail-section">
                                    <h3>{libroSeleccionado.titulo}</h3>
                                    <div className="detail-info">
                                        <div className="info-row">
                                            <strong>Autor(es):</strong>
                                            <span>{libroSeleccionado.autores?.join(', ') || 'No especificado'}</span>
                                        </div>
                                        <div className="info-row">
                                            <strong>Editorial:</strong>
                                            <span>{libroSeleccionado.editorial || 'No especificado'}</span>
                                        </div>
                                        <div className="info-row">
                                            <strong>Año de publicación:</strong>
                                            <span>{libroSeleccionado.anioPublicacion || 'No especificado'}</span>
                            </div>
                                        <div className="info-row">
                                            <strong>Idioma:</strong>
                                            <span>{libroSeleccionado.idioma || 'No especificado'}</span>
                                </div>
                                        <div className="info-row">
                                            <strong>Páginas:</strong>
                                            <span>{libroSeleccionado.paginas || 'No especificado'}</span>
                                    </div>
                                        <div className="info-row">
                                            <strong>ISBN:</strong>
                                            <span>{libroSeleccionado.isbn || 'No especificado'}</span>
                                </div>
                                        <div className="info-row">
                                            <strong>Clasificación LCC:</strong>
                                            <span>{libroSeleccionado.signaturaLCC || 'No especificado'}</span>
                                        </div>
                                        {libroSeleccionado.lccSeccion && (
                                            <div className="info-row">
                                                <strong>Sección LCC:</strong>
                                                <span>{libroSeleccionado.lccSeccion} {libroSeleccionado.lccSeccion === 'QA' ? '(Matemáticas y Computación)' : 
                                                      libroSeleccionado.lccSeccion === 'TK' ? '(Tecnología)' :
                                                      libroSeleccionado.lccSeccion === 'BC' ? '(Lógica)' :
                                                      libroSeleccionado.lccSeccion === 'HB' ? '(Economía)' : ''}</span>
                                            </div>
                                        )}
                                        {libroSeleccionado.lccNumero && (
                                            <div className="info-row">
                                                <strong>Número LCC:</strong>
                                                <span>{libroSeleccionado.lccNumero}</span>
                                            </div>
                                        )}
                                        {libroSeleccionado.lccCutter && (
                                            <div className="info-row">
                                                <strong>Cutter LCC:</strong>
                                                <span>{libroSeleccionado.lccCutter}</span>
                                            </div>
                                        )}
                                        <div className="info-row">
                                            <strong>Categorías:</strong>
                                            <span>{libroSeleccionado.categorias?.join(', ') || 'No especificado'}</span>
                                    </div>
                                        <div className="info-row">
                                            <strong>Disponibilidad:</strong>
                                            <span className={`status ${libroSeleccionado.ejemplaresDisponibles > 0 ? 'disponible' : 'agotado'}`}>
                                                {libroSeleccionado.ejemplaresDisponibles > 0 
                                                    ? `${libroSeleccionado.ejemplaresDisponibles} disponibles de ${libroSeleccionado.totalEjemplares}`
                                                    : 'Agotado'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                    </div>
                                </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={cerrarDetalles}>
                                Cerrar
                            </button>
                        </div>
                            </div>
                        </div>
                    )}

            {/* El modal de préstamo se ha eliminado ya que los préstamos ahora se gestionan desde la interfaz de administración */}

            {/* Modal de reserva */}
            {mostrarReservaModal && reservandoId !== null && (
                <div className="modal-overlay" onClick={() => { setMostrarReservaModal(false); setReservandoId(null); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Reservar ejemplar</h2>
                            <button className="modal-close" onClick={() => { setMostrarReservaModal(false); setReservandoId(null); }}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="filter-group">
                                <label>Elegir ejemplar a reservar</label>
                                <div className="ejemplares-info">
                                    <p>Los ejemplares en rojo están actualmente prestados</p>
                                </div>
                                <select
                                    value={ejemplarParaReservarId ?? ''}
                                    onChange={(e) => setEjemplarParaReservarId(Number(e.target.value))}
                                    className="ejemplares-select"
                                    data-estado={(() => {
                                        if (!ejemplarParaReservarId) return 'disponible';
                                        const est = ejemplaresParaReservar.find(e => e.ejemplarID === ejemplarParaReservarId)?.estado || '';
                                        const estNorm = est.toString().trim().toLowerCase();
                                        return estNorm === 'disponible' ? 'disponible' : 'prestado';
                                    })()}
                                >
                                    {ejemplaresParaReservar.map(ej => {
                                        const estadoNorm = (ej.estado || '').toString().trim().toLowerCase();
                                        const isDisponible = estadoNorm === 'disponible';
                                        return (
                                            <option
                                                key={ej.ejemplarID}
                                                value={ej.ejemplarID}
                                                className={isDisponible ? 'ejemplar-disponible' : 'ejemplar-prestado'}
                                            >
                                                #{ej.numeroEjemplar} — {ej.codigoBarras} {ej.ubicacion ? `(${ej.ubicacion})` : ''}
                                                {isDisponible ? ' - Disponible' : ` - ${ej.estado}`}
                                            </option>
                                        );
                                    })}
                                </select>
                                <div className="ejemplar-info">
                                    {ejemplarParaReservarId && (
                                        (() => {
                                            const ej = ejemplaresParaReservar.find(e => e.ejemplarID === ejemplarParaReservarId);
                                            const estNorm = (ej?.estado || '').toString().trim().toLowerCase();
                                            if (estNorm === 'disponible') {
                                                return (
                                                    <div className="mensaje-disponible">
                                                        <p>Este ejemplar está disponible. Puedes recogerlo en biblioteca.</p>
                                                    </div>
                                                );
                                            }
                                            // Para cualquier otro estado (prestado, reservado, etc.) mostrar mensaje en rojo
                                            return (
                                                <div className="mensaje-prestado">
                                                    <p>Este ejemplar no está disponible actualmente. Se te notificará cuando esté disponible.</p>
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setMostrarReservaModal(false); setReservandoId(null); }}>Cancelar</button>
                            <button
                                className="btn-primary"
                                style={{ marginLeft: '0.5rem' }}
                                onClick={() => confirmarReserva(reservandoId!)}
                                disabled={reservandoId === null || !ejemplarParaReservarId}
                            >
                                {reservandoId === -1 ? 'Reservando...' : 'Confirmar reserva'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;