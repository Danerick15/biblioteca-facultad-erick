import React, { useState, useEffect } from 'react';
import { Calendar, User, Book, CheckCircle } from 'lucide-react';
import { obtenerPrestamosActivos, procesarDevolucion, type PrestamoDTO } from '../../../../../api/prestamos';
import PageLoader from '../../../../../components/PageLoader';
import { useToast } from '../../../../../components/Toast';
import './AdminReturns.css';

const AdminReturns: React.FC = () => {
    const [prestamos, setPrestamos] = useState<PrestamoDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    // Fechas por defecto: mostrar todos los préstamos (sin filtro de fecha)
    const [filtros, setFiltros] = useState({
        usuario: '',
        libro: '',
        estado: 'todos',
        fechaInicio: '',
        fechaFin: ''
    });
    const [pageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [observacion, setObservacion] = useState('');
    const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<number | null>(null);
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await obtenerPrestamosActivos();
            setPrestamos(data);
        } catch (err: any) {
            console.error('Error al cargar préstamos:', err);
            const msg = err?.response?.data?.mensaje || 'No se pudieron cargar los préstamos';
            setError(msg);
            showToast(msg);
        } finally {
            setCargando(false);
        }
    };

    const filtrarPrestamos = () => {
        return prestamos.filter(p => {
            const matchUsuario = filtros.usuario === '' || 
                p.usuarioNombre.toLowerCase().includes(filtros.usuario.toLowerCase()) ||
                p.usuarioCodigo.toLowerCase().includes(filtros.usuario.toLowerCase());
            const matchLibro = filtros.libro === '' ||
                p.libroTitulo.toLowerCase().includes(filtros.libro.toLowerCase()) ||
                p.libroISBN.toLowerCase().includes(filtros.libro.toLowerCase());
            const matchEstado = filtros.estado === 'todos' || 
                (filtros.estado === 'activo' && p.estado === 'Prestado' && p.estadoCalculado !== 'Atrasado') ||
                (filtros.estado === 'vencido' && p.estadoCalculado === 'Atrasado') ||
                (filtros.estado === 'devuelto' && p.estado === 'Devuelto');
            let matchFecha = true;
            // Solo filtrar por fecha si ambas fechas están especificadas
            if (filtros.fechaInicio && filtros.fechaFin) {
                const fecha = new Date(p.fechaPrestamo);
                fecha.setHours(0, 0, 0, 0);
                const inicio = new Date(filtros.fechaInicio);
                inicio.setHours(0, 0, 0, 0);
                const fin = new Date(filtros.fechaFin);
                fin.setHours(23, 59, 59, 999);
                matchFecha = fecha >= inicio && fecha <= fin;
            }
            return matchUsuario && matchLibro && matchEstado && matchFecha;
        });
    };

    const prestamosFiltrados = filtrarPrestamos();
    const totalPages = Math.ceil(prestamosFiltrados.length / pageSize);
    const currentPrestamos = prestamosFiltrados.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (cargando) return <PageLoader message="Cargando préstamos..." />;

    return (
        <div className="page-content admin-returns-page">
            <div className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-title-section">
                        <h1>Gestionar Devoluciones</h1>
                        <p>Procesa y registra las devoluciones de libros</p>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {prestamos.length === 0 && !cargando && (
                <div className="no-loans-message">
                    <Book size={48} />
                    <p>No hay préstamos activos registrados en el sistema</p>
                </div>
            )}

            {prestamos.length > 0 && (
                <>
                    <div className="filters-section">
                <input
                    type="text"
                    placeholder="Buscar por usuario..."
                    value={filtros.usuario}
                    onChange={(e) => setFiltros({...filtros, usuario: e.target.value})}
                    className="filter-input"
                />
                <input
                    type="text"
                    placeholder="Buscar por libro..."
                    value={filtros.libro}
                    onChange={(e) => setFiltros({...filtros, libro: e.target.value})}
                    className="filter-input"
                />
                <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                    className="filter-select"
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="devuelto">Devuelto</option>
                    <option value="vencido">Vencido</option>
                </select>
                <div className="date-filters">
                    <input
                        type="date"
                        value={filtros.fechaInicio}
                        onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                        className="filter-date"
                    />
                    <span>hasta</span>
                    <input
                        type="date"
                        value={filtros.fechaFin}
                        onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                        className="filter-date"
                    />
                </div>
            </div>

            <div className="loans-grid">
                {currentPrestamos.map(p => (
                    <div key={p.prestamoID} className="loan-card">
                        <div className="loan-header">
                            <span className="loan-id">#{p.prestamoID}</span>
                            <span className={`status-badge ${p.estadoCalculado.toLowerCase()}`}>
                                {p.estadoCalculado}
                            </span>
                        </div>
                        <div className="loan-body">
                            <div className="loan-info">
                                <User size={16} />
                                <span>{p.usuarioNombre} ({p.usuarioCodigo})</span>
                            </div>
                            <div className="loan-info">
                                <Book size={16} />
                                <span>{p.libroTitulo} - {p.codigoBarras}</span>
                            </div>
                            <div className="loan-info">
                                <Calendar size={16} />
                                <span>Prestado: {new Date(p.fechaPrestamo).toLocaleDateString()}</span>
                            </div>
                            <div className="loan-info">
                                <Calendar size={16} />
                                <span>Vencimiento: {new Date(p.fechaVencimiento).toLocaleDateString()}</span>
                            </div>
                            {p.fechaDevolucion && (
                                <div className="loan-info">
                                    <Calendar size={16} />
                                    <span>Devuelto: {new Date(p.fechaDevolucion).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        {/* Botón para procesar devolución si no está devuelto */}
                        {!p.fechaDevolucion && (
                            <div className="loan-actions">
                                {prestamoSeleccionado === p.prestamoID ? (
                                    <div className="devolucion-form">
                                        <textarea
                                            placeholder="Observaciones (opcional)..."
                                            value={observacion}
                                            onChange={(e) => setObservacion(e.target.value)}
                                            className="observacion-input"
                                        />
                                        <div className="devolucion-buttons">
                                            <button 
                                                className="btn-confirm"
                                                onClick={() => handleDevolucion(p.prestamoID)}
                                                disabled={procesando}
                                            >
                                                <CheckCircle size={16} />
                                                <span>Confirmar Devolución</span>
                                            </button>
                                            <button 
                                                className="btn-cancel"
                                                onClick={() => {
                                                    setPrestamoSeleccionado(null);
                                                    setObservacion('');
                                                }}
                                                disabled={procesando}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="btn-return"
                                        onClick={() => setPrestamoSeleccionado(p.prestamoID)}
                                    >
                                        <CheckCircle size={16} />
                                        <span>Procesar Devolución</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {prestamosFiltrados.length > pageSize && (
                <div className="pagination">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        Anterior
                    </button>
                    <span className="page-info">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {prestamosFiltrados.length === 0 && prestamos.length > 0 && (
                <div className="no-results-message">
                    <p>No se encontraron préstamos con los filtros seleccionados</p>
                    <button 
                        className="btn-clear-filters"
                        onClick={() => setFiltros({
                            usuario: '',
                            libro: '',
                            estado: 'todos',
                            fechaInicio: '',
                            fechaFin: ''
                        })}
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}
                </>
            )}
        </div>
    );

    async function handleDevolucion(prestamoId: number) {
        try {
            setProcesando(true);
                // Las observaciones son opcionales, enviar undefined si está vacío
                const observacionesEnviar = observacion.trim() || undefined;
                console.log('Enviando request de devolución', { prestamoId, observaciones: observacionesEnviar });
                const resultado = await procesarDevolucion(prestamoId, observacionesEnviar);
                console.log('Respuesta devolución:', resultado);
                showToast(resultado?.mensaje || 'Devolución procesada exitosamente');
            setObservacion('');
            setPrestamoSeleccionado(null);
            await cargarDatos();
        } catch (err: any) {
                console.error('Error al procesar devolución:', err);
                // Intentar leer mensaje estructurado
                let msg = 'Error al procesar la devolución';
                if (err?.response) {
                    console.log('Response error data:', err.response.data);
                    const data = err.response.data;
                    if (data && typeof data === 'object' && data.mensaje) msg = data.mensaje;
                    else if (typeof data === 'string' && data.trim().length > 0) msg = `Respuesta del servidor: ${data}`;
                    else msg = `Error ${err.response.status} en el servidor`;
                } else if (err?.message) {
                    msg = err.message;
                }
                showToast(msg);
        } finally {
            setProcesando(false);
        }
    }
};

export default AdminReturns;