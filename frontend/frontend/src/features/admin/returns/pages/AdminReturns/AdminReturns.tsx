import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, Book, CheckCircle, Scan } from 'lucide-react';
import { obtenerPrestamosActivos, procesarDevolucion, type PrestamoDTO } from '../../../../../api/prestamos';
import PageLoader from '../../../../../components/PageLoader';
import { useToast } from '../../../../../components/Toast';
import './AdminReturns.css';

const AdminReturns: React.FC = () => {
    const [prestamos, setPrestamos] = useState<PrestamoDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
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
    
    // Tarea 3: Estados para escaneo de código de barras en devoluciones
    const [codigoBarrasDevolucion, setCodigoBarrasDevolucion] = useState('');
    const [prestamoEncontrado, setPrestamoEncontrado] = useState<PrestamoDTO | null>(null);
    const codigoBarrasInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    // Tarea 3: Foco automático en el campo de búsqueda de código de barras al cargar
    useEffect(() => {
        if (codigoBarrasInputRef.current) {
            codigoBarrasInputRef.current.focus();
        }
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

    // Tarea 3: Buscar préstamo por código de barras y procesar devolución automáticamente
    const buscarPrestamoPorCodigoBarras = async (codigoBarras: string) => {
        if (!codigoBarras.trim()) return;
        
        try {
            setError(null);
            // Buscar en la lista de préstamos activos
            const prestamo = prestamos.find(p => 
                p.codigoBarras.toLowerCase() === codigoBarras.trim().toLowerCase() && 
                !p.fechaDevolucion
            );
            
            if (!prestamo) {
                showToast('No se encontró un préstamo activo con ese código de barras', 'error');
                setPrestamoEncontrado(null);
                setCodigoBarrasDevolucion('');
                // Volver a enfocar para siguiente intento
                setTimeout(() => codigoBarrasInputRef.current?.focus(), 100);
                return;
            }
            
            setPrestamoEncontrado(prestamo);
            showToast(`Préstamo encontrado: ${prestamo.libroTitulo} - Usuario: ${prestamo.usuarioNombre}`, 'success');
            
            // Procesar devolución automáticamente
            await handleDevolucion(prestamo.prestamoID);
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al buscar el préstamo';
            setError(msg);
            showToast(msg, 'error');
            setPrestamoEncontrado(null);
        }
    };

    // Tarea 3: Manejar Enter en campo de código de barras (del escáner)
    const handleCodigoBarrasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarPrestamoPorCodigoBarras(codigoBarrasDevolucion);
        }
    };

    const prestamosFiltrados = filtrarPrestamos();
    const totalPages = Math.ceil(prestamosFiltrados.length / pageSize);
    const currentPrestamos = prestamosFiltrados.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    async function handleDevolucion(prestamoId: number) {
        try {
            setProcesando(true);
            const observacionesEnviar = observacion.trim() || undefined;
            const resultado = await procesarDevolucion(prestamoId, observacionesEnviar);
            showToast(resultado?.mensaje || 'Devolución procesada exitosamente', 'success');
            
            // Limpiar formulario de escaneo
            setCodigoBarrasDevolucion('');
            setPrestamoEncontrado(null);
            setObservacion('');
            setPrestamoSeleccionado(null);
            
            await cargarDatos();
            
            // Volver a enfocar el campo de código de barras para siguiente devolución
            setTimeout(() => {
                codigoBarrasInputRef.current?.focus();
            }, 100);
        } catch (err: any) {
            console.error('Error al procesar devolución:', err);
            let msg = 'Error al procesar la devolución';
            if (err?.response) {
                const data = err.response.data;
                if (data && typeof data === 'object' && data.mensaje) msg = data.mensaje;
                else if (typeof data === 'string' && data.trim().length > 0) msg = `Respuesta del servidor: ${data}`;
                else msg = `Error ${err.response.status} en el servidor`;
            } else if (err?.message) {
                msg = err.message;
            }
            showToast(msg, 'error');
        } finally {
            setProcesando(false);
        }
    }

    if (cargando) return <PageLoader message="Cargando préstamos..." />;

    return (
        <div className="page-content admin-returns-page">
            <div className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-title-section">
                        <h1>Gestionar Devoluciones</h1>
                        <p>Procesa y registra las devoluciones de libros usando el escáner de código de barras</p>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Tarea 3: Sección de devolución por escaneo */}
            <div className="return-scan-section">
                <h2 className="section-title">
                    <Scan size={20} />
                    Devolución por Escaneo
                </h2>
                <div className="return-scan-form">
                    <div className="form-group">
                        <label htmlFor="codigoBarrasDevolucion">
                            <Book size={16} />
                            Código de Barras del Ejemplar *
                        </label>
                        <input
                            ref={codigoBarrasInputRef}
                            type="text"
                            id="codigoBarrasDevolucion"
                            value={codigoBarrasDevolucion}
                            onChange={(e) => setCodigoBarrasDevolucion(e.target.value)}
                            onKeyDown={handleCodigoBarrasKeyDown}
                            placeholder="Escanee o ingrese el código de barras del ejemplar"
                            className="scanner-input"
                            disabled={procesando}
                            autoFocus
                        />
                        {prestamoEncontrado && (
                            <div className="found-item">
                                <span className="found-label">Préstamo encontrado:</span>
                                <span className="found-value">
                                    {prestamoEncontrado.libroTitulo} - {prestamoEncontrado.usuarioNombre} ({prestamoEncontrado.usuarioCodigo})
                                </span>
                            </div>
                        )}
                    </div>
                    {procesando && (
                        <div className="processing-message">
                            Procesando devolución...
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de préstamos */}
            <div className="returns-list-section">
                <h2 className="section-title">Préstamos Activos</h2>
            </div>

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
};

export default AdminReturns;
