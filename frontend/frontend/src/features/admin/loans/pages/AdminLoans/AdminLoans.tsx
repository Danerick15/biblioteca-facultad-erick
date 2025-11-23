import React, { useEffect, useState, useRef } from 'react';
import { Calendar, User, Book, Scan } from 'lucide-react';
import { obtenerPrestamosActivos, crearPrestamo, type PrestamoDTO, type CrearPrestamoRequest } from '../../../../../api/prestamos';
import { obtenerEjemplarPorCodigoBarras, type Ejemplar } from '../../../../../api/ejemplares';
import { buscarUsuarios, type Usuario } from '../../../../../api/usuarios';
import PageLoader from '../../../../../components/PageLoader';
import { useToast } from '../../../../../components/Toast';
import './AdminLoans.css';

const AdminLoans: React.FC = () => {
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
    
    // Estados para creación de préstamos con escáner (HU-12)
    const [codigoBarrasEjemplar, setCodigoBarrasEjemplar] = useState('');
    const [codigoUsuario, setCodigoUsuario] = useState('');
    const [ejemplarEncontrado, setEjemplarEncontrado] = useState<Ejemplar | null>(null);
    const [usuarioEncontrado, setUsuarioEncontrado] = useState<Usuario | null>(null);
    const [procesandoPrestamo, setProcesandoPrestamo] = useState(false);
    const ejemplarInputRef = useRef<HTMLInputElement>(null);
    const usuarioInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    // Tarea 1: Foco automático en el campo de búsqueda de ejemplar al cargar
    useEffect(() => {
        if (ejemplarInputRef.current) {
            ejemplarInputRef.current.focus();
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
            showToast(msg, 'error');
        } finally {
            setCargando(false);
        }
    };

    const filtrarPrestamos = () => {
        return prestamos.filter(p => {
            const matchUsuario = p.usuarioNombre.toLowerCase().includes(filtros.usuario.toLowerCase()) ||
                               p.usuarioCodigo.toLowerCase().includes(filtros.usuario.toLowerCase());
            const matchLibro = p.libroTitulo.toLowerCase().includes(filtros.libro.toLowerCase()) ||
                             p.libroISBN.toLowerCase().includes(filtros.libro.toLowerCase());
            const matchEstado = filtros.estado === 'todos' || p.estadoCalculado.toLowerCase() === filtros.estado.toLowerCase();
            
            let matchFecha = true;
            if (filtros.fechaInicio && filtros.fechaFin) {
                const fecha = new Date(p.fechaPrestamo);
                const inicio = new Date(filtros.fechaInicio);
                const fin = new Date(filtros.fechaFin);
                matchFecha = fecha >= inicio && fecha <= fin;
            }

            return matchUsuario && matchLibro && matchEstado && matchFecha;
        });
    };

    // Tarea 2: Buscar ejemplar por código de barras
    const buscarEjemplar = async (codigoBarras: string) => {
        if (!codigoBarras.trim()) return;
        
        try {
            setError(null);
            const ejemplar = await obtenerEjemplarPorCodigoBarras(codigoBarras.trim());
            setEjemplarEncontrado(ejemplar);
            showToast(`Ejemplar encontrado: ${ejemplar.codigoBarras}`, 'success');
            
            // Si ya tenemos usuario, crear préstamo automáticamente
            if (usuarioEncontrado) {
                await crearPrestamoCompleto(ejemplar, usuarioEncontrado);
            } else {
                // Mover foco al campo de usuario
                setTimeout(() => {
                    usuarioInputRef.current?.focus();
                }, 100);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Ejemplar no encontrado';
            setError(msg);
            showToast(msg, 'error');
            setEjemplarEncontrado(null);
        }
    };

    // Buscar usuario por código universitario o nombre
    const buscarUsuario = async (termino: string) => {
        if (!termino.trim()) return;
        
        try {
            setError(null);
            const resultado = await buscarUsuarios({ termino: termino.trim() });
            
            if (resultado.usuarios.length === 0) {
                showToast('Usuario no encontrado', 'error');
                setUsuarioEncontrado(null);
                return;
            }
            
            // Si hay múltiples resultados, tomar el primero
            const usuario = resultado.usuarios[0];
            setUsuarioEncontrado(usuario);
            showToast(`Usuario encontrado: ${usuario.nombre} (${usuario.codigoUniversitario})`, 'success');
            
            // Si ya tenemos ejemplar, crear préstamo automáticamente
            if (ejemplarEncontrado) {
                await crearPrestamoCompleto(ejemplarEncontrado, usuario);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al buscar usuario';
            setError(msg);
            showToast(msg, 'error');
            setUsuarioEncontrado(null);
        }
    };

    // Tarea 2: Crear préstamo completo automáticamente
    const crearPrestamoCompleto = async (ejemplar: Ejemplar, usuario: Usuario) => {
        if (procesandoPrestamo) return;
        
        try {
            setProcesandoPrestamo(true);
            setError(null);
            
            // Validar que el ejemplar esté disponible
            if (ejemplar.estado !== 'Disponible') {
                showToast(`El ejemplar no está disponible. Estado: ${ejemplar.estado}`, 'error');
                // Limpiar y volver a enfocar
                setCodigoBarrasEjemplar('');
                setEjemplarEncontrado(null);
                setTimeout(() => ejemplarInputRef.current?.focus(), 100);
                return;
            }
            
            const request: CrearPrestamoRequest = {
                ejemplarID: ejemplar.ejemplarID,
                usuarioID: usuario.usuarioID
            };
            
            const resultado = await crearPrestamo(request);
            showToast(resultado.mensaje || 'Préstamo creado exitosamente', 'success');
            
            // Limpiar formulario
            setCodigoBarrasEjemplar('');
            setCodigoUsuario('');
            setEjemplarEncontrado(null);
            setUsuarioEncontrado(null);
            
            // Recargar datos
            await cargarDatos();
            
            // Volver a enfocar el campo de ejemplar para siguiente préstamo
            setTimeout(() => {
                ejemplarInputRef.current?.focus();
            }, 100);
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al crear el préstamo';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setProcesandoPrestamo(false);
        }
    };

    // Tarea 2: Manejar Enter en campo de ejemplar (del escáner)
    const handleEjemplarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarEjemplar(codigoBarrasEjemplar);
        }
    };

    // Manejar Enter en campo de usuario
    const handleUsuarioKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarUsuario(codigoUsuario);
        }
    };

    const prestamosFiltrados = filtrarPrestamos();
    const totalPages = Math.ceil(prestamosFiltrados.length / pageSize);
    const currentPrestamos = prestamosFiltrados.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (cargando) return <PageLoader message="Cargando préstamos..." />;

    return (
        <div className="page-content admin-loans-page">
            <div className="admin-header">
                <div className="admin-header-content">
                    <div className="admin-title-section">
                        <h1>Gestión de Préstamos</h1>
                        <p>Registra nuevos préstamos usando el escáner de código de barras</p>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Sección de creación de préstamos con escáner (HU-12) */}
            <div className="loan-creation-section">
                <h2 className="section-title">
                    <Scan size={20} />
                    Nuevo Préstamo
                </h2>
                <div className="loan-creation-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="codigoBarrasEjemplar">
                                <Book size={16} />
                                Código de Barras del Ejemplar *
                            </label>
                            <input
                                ref={ejemplarInputRef}
                                type="text"
                                id="codigoBarrasEjemplar"
                                value={codigoBarrasEjemplar}
                                onChange={(e) => setCodigoBarrasEjemplar(e.target.value)}
                                onKeyDown={handleEjemplarKeyDown}
                                placeholder="Escanee o ingrese el código de barras"
                                className="scanner-input"
                                disabled={procesandoPrestamo}
                                autoFocus
                            />
                            {ejemplarEncontrado && (
                                <div className="found-item">
                                    <span className="found-label">Ejemplar:</span>
                                    <span className="found-value">
                                        {ejemplarEncontrado.codigoBarras} - Estado: {ejemplarEncontrado.estado}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="codigoUsuario">
                                <User size={16} />
                                Código Universitario o Nombre *
                            </label>
                            <input
                                ref={usuarioInputRef}
                                type="text"
                                id="codigoUsuario"
                                value={codigoUsuario}
                                onChange={(e) => setCodigoUsuario(e.target.value)}
                                onKeyDown={handleUsuarioKeyDown}
                                placeholder="Escanee o ingrese código universitario"
                                className="scanner-input"
                                disabled={procesandoPrestamo}
                            />
                            {usuarioEncontrado && (
                                <div className="found-item">
                                    <span className="found-label">Usuario:</span>
                                    <span className="found-value">
                                        {usuarioEncontrado.nombre} ({usuarioEncontrado.codigoUniversitario})
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {procesandoPrestamo && (
                        <div className="processing-message">
                            Procesando préstamo...
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de préstamos */}
            <div className="loans-list-section">
                <h2 className="section-title">Préstamos Activos</h2>
            </div>

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
        </div>
    );
};

export default AdminLoans;
