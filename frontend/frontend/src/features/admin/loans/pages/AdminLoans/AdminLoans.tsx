import React, { useEffect, useState } from 'react';
import { Calendar, User, Book } from 'lucide-react';
import { obtenerPrestamosActivos, type PrestamoDTO } from '../../../../../api/prestamos';
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

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await obtenerPrestamosActivos();
            console.log('Préstamos cargados:', data);
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
                        <h1>Gestión de Devoluciones</h1>
                        <p>Procesa y registra las devoluciones de libros</p>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

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