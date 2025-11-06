import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import {
    buscarUsuarios,
    cambiarEstadoUsuario,
    eliminarUsuario,
    type Usuario,
    type BusquedaUsuariosParams
} from '../../../../../api/usuarios';
import { 
    UserPlus, 
    Edit,
    Trash2,
    Eye,
    Shield,
    Mail,
    Phone,
    Calendar,
    BookOpen,
    AlertTriangle
} from 'lucide-react';
import './UserManagement.css';

// La interfaz Usuario ya está importada desde la API

interface Filtros {
    busqueda: string;
    rol: string;
    estado: string;
    ordenarPor: string;
    orden: 'asc' | 'desc';
}

const UserManagement: React.FC = () => {
    // SEO
    useSEO({
        title: 'Gestión de Usuarios - Biblioteca FISI',
        description: 'Administra usuarios, roles y permisos del sistema',
        keywords: 'usuarios, administración, roles, permisos, biblioteca'
    });
    
    const { goBack } = useNavigation();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        rol: '',
        estado: '',
        ordenarPor: 'nombre',
        orden: 'asc'
    });
    
    // Estados de UI
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
    const [procesando, setProcesando] = useState(false);

    const cargarUsuarios = useCallback(async () => {
        try {
            setCargando(true);
            setError(null);
            
            // Cargar usuarios reales desde la API
            const params: BusquedaUsuariosParams = {
                termino: filtros.busqueda || undefined,
                rol: filtros.rol || undefined,
                estado: filtros.estado || undefined,
                ordenarPor: filtros.ordenarPor,
                orden: filtros.orden
            };
            
            const resultado = await buscarUsuarios(params);
            setUsuarios(resultado.usuarios);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al cargar los usuarios');
            console.error('Error al cargar usuarios:', err);
        } finally {
            setCargando(false);
        }
    }, [filtros]);

    useEffect(() => {
        cargarUsuarios();
    }, [cargarUsuarios]);

    // Filtrar usuarios
    const usuariosFiltrados = useMemo(() => {
        let resultado = usuarios;

        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(usuario =>
                usuario.nombre.toLowerCase().includes(termino) ||
                (usuario.apellido && usuario.apellido.toLowerCase().includes(termino)) ||
                usuario.emailInstitucional.toLowerCase().includes(termino) ||
                `${usuario.nombre} ${usuario.apellido || ''}`.toLowerCase().includes(termino)
            );
        }

        if (filtros.rol) {
            resultado = resultado.filter(usuario => usuario.rol === filtros.rol);
        }

        if (filtros.estado) {
            resultado = resultado.filter(usuario => usuario.estado === filtros.estado);
        }

        // Ordenar
        resultado.sort((a, b) => {
            let valorA: string | number | Date | undefined, valorB: string | number | Date | undefined;
            
            switch (filtros.ordenarPor) {
                case 'nombre':
                    valorA = `${a.nombre} ${a.apellido || ''}`;
                    valorB = `${b.nombre} ${b.apellido || ''}`;
                    break;
                case 'email':
                    valorA = a.emailInstitucional;
                    valorB = b.emailInstitucional;
                    break;
                case 'fechaRegistro':
                    valorA = new Date(a.fechaRegistro);
                    valorB = new Date(b.fechaRegistro);
                    break;
                case 'prestamosActivos':
                    valorA = a.prestamosActivos;
                    valorB = b.prestamosActivos;
                    break;
                default:
                    valorA = a.usuarioID;
                    valorB = b.usuarioID;
            }

            // Manejar valores undefined
            if (valorA === undefined && valorB === undefined) return 0;
            if (valorA === undefined) return 1;
            if (valorB === undefined) return -1;

            if (filtros.orden === 'asc') {
                return valorA > valorB ? 1 : -1;
            } else {
                return valorA < valorB ? 1 : -1;
            }
        });

        return resultado;
    }, [usuarios, filtros]);

    const obtenerColorEstado = (estado: string) => {
        switch (estado) {
            case 'Activo': return 'activo';
            case 'Inactivo': return 'inactivo';
            case 'Suspendido': return 'suspendido';
            default: return 'activo';
        }
    };

    const obtenerColorRol = (rol: string) => {
        switch (rol) {
            case 'Administrador': return 'admin';
            case 'Profesor': return 'profesor';
            case 'Estudiante': return 'estudiante';
            default: return 'estudiante';
        }
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatearMoneda = (monto: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(monto);
    };

    const manejarCambioEstadoUsuario = async (usuario: Usuario, nuevoEstado: string) => {
        try {
            setProcesando(true);
            setError(null);
            
            // Cambiar estado en el backend
            await cambiarEstadoUsuario(usuario.usuarioID, nuevoEstado);
            
            // Actualizar estado local
            setUsuarios(prev => prev.map(u => 
                u.usuarioID === usuario.usuarioID 
                    ? { ...u, estado: nuevoEstado as 'Activo' | 'Inactivo' | 'Suspendido' }
                    : u
            ));
            
            console.log(`Estado de usuario ${usuario.nombre} cambiado a ${nuevoEstado}`);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al cambiar el estado del usuario');
            console.error('Error al cambiar estado:', err);
        } finally {
            setProcesando(false);
        }
    };

    const confirmarEliminacion = (usuario: Usuario) => {
        setUsuarioAEliminar(usuario);
        setMostrarConfirmacion(true);
    };

    const eliminarUsuarioConfirmado = async () => {
        if (!usuarioAEliminar) return;

        try {
            setProcesando(true);
            setError(null);
            
            // Eliminar usuario en el backend
            await eliminarUsuario(usuarioAEliminar.usuarioID);
            
            // Actualizar estado local
            setUsuarios(prev => prev.filter(u => u.usuarioID !== usuarioAEliminar.usuarioID));
            setMostrarConfirmacion(false);
            setUsuarioAEliminar(null);
            
            console.log(`Usuario ${usuarioAEliminar.nombre} eliminado`);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al eliminar el usuario');
            console.error('Error al eliminar usuario:', err);
        } finally {
            setProcesando(false);
        }
    };

    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setUsuarioAEliminar(null);
    };

    if (cargando) {
        return <PageLoader />;
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
                        <h1>Gestión de Usuarios</h1>
                        <p>Administra usuarios, roles y permisos del sistema</p>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="admin-content">
                {/* Filtros y acciones */}
                <div className="admin-filters">
                    <div className="filters-container">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido o email..."
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                                className="search-input"
                            />
                        </div>
                        
                        <div className="filter-row">
                            <select
                                value={filtros.rol}
                                onChange={(e) => setFiltros(prev => ({ ...prev, rol: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">Todos los roles</option>
                                <option value="Administrador">Administradores</option>
                                <option value="Profesor">Profesores</option>
                                <option value="Estudiante">Estudiantes</option>
                            </select>

                            <select
                                value={filtros.estado}
                                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">Todos los estados</option>
                                <option value="Activo">Activos</option>
                                <option value="Inactivo">Inactivos</option>
                                <option value="Suspendido">Suspendidos</option>
                            </select>

                            <select
                                value={filtros.ordenarPor}
                                onChange={(e) => setFiltros(prev => ({ ...prev, ordenarPor: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="nombre">Ordenar por nombre</option>
                                <option value="email">Ordenar por email</option>
                                <option value="fechaRegistro">Ordenar por fecha</option>
                                <option value="prestamosActivos">Ordenar por préstamos</option>
                            </select>

                            <button
                                className="btn-sort"
                                onClick={() => setFiltros(prev => ({ 
                                    ...prev, 
                                    orden: prev.orden === 'asc' ? 'desc' : 'asc' 
                                }))}
                            >
                                {filtros.orden === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        className="btn-primary"
                        onClick={() => setMostrarFormulario(true)}
                    >
                        <UserPlus size={20} />
                        Nuevo Usuario
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Lista de usuarios */}
                <div className="admin-table-container">
                    {usuariosFiltrados.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron usuarios</p>
                            {Object.values(filtros).some(f => f.trim()) && (
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setFiltros({
                                        busqueda: '',
                                        rol: '',
                                        estado: '',
                                        ordenarPor: 'nombre',
                                        orden: 'asc'
                                    })}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="usuarios-grid">
                            {usuariosFiltrados.map((usuario) => (
                                <div key={usuario.usuarioID} className="usuario-card">
                                    <div className="usuario-header">
                                        <div className="usuario-info-principal">
                                            <h3 className="usuario-nombre">
                                                {usuario.nombre} {usuario.apellido || ''}
                                            </h3>
                                            <p className="usuario-email">{usuario.emailInstitucional}</p>
                                        </div>
                                        <div className="usuario-actions">
                                            <button
                                                className="btn-view"
                                                onClick={() => {
                                                    setUsuarioSeleccionado(usuario);
                                                    setMostrarDetalles(true);
                                                }}
                                                title="Ver detalles"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="btn-edit"
                                                onClick={() => {
                                                    setUsuarioSeleccionado(usuario);
                                                    setMostrarFormulario(true);
                                                }}
                                                title="Editar usuario"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => confirmarEliminacion(usuario)}
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="usuario-details">
                                        <div className="usuario-meta">
                                            <div className="meta-item">
                                                <Shield size={16} />
                                                <span className={`rol-badge ${obtenerColorRol(usuario.rol)}`}>
                                                    {usuario.rol}
                                                </span>
                                            </div>
                                            <div className="meta-item">
                                                <span className={`estado-badge ${obtenerColorEstado(usuario.estado)}`}>
                                                    {usuario.estado}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="usuario-stats">
                                            <div className="stat-item">
                                                <BookOpen size={16} />
                                                <span>{usuario.prestamosActivos} activos</span>
                                            </div>
                                            <div className="stat-item">
                                                <Calendar size={16} />
                                                <span>{usuario.prestamosTotales} total</span>
                                            </div>
                                            {(usuario.multasPendientes || 0) > 0 && (
                                                <div className="stat-item warning">
                                                    <AlertTriangle size={16} />
                                                    <span>{formatearMoneda(usuario.montoMultas || 0)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="usuario-dates">
                                            <p className="fecha-registro">
                                                <strong>Registrado:</strong> {formatearFecha(usuario.fechaRegistro)}
                                            </p>
                                        </div>

                                        {/* Cambio de estado rápido */}
                                        <div className="estado-actions">
                                            <select
                                                value={usuario.estado}
                                                onChange={(e) => manejarCambioEstadoUsuario(usuario, e.target.value)}
                                                className="estado-select"
                                                disabled={procesando}
                                            >
                                                <option value="Activo">Activo</option>
                                                <option value="Inactivo">Inactivo</option>
                                                <option value="Suspendido">Suspendido</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contador de resultados */}
                <div className="results-count">
                    Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                </div>
            </div>

            {/* Modal de detalles */}
            {mostrarDetalles && usuarioSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <div className="modal-header">
                            <h2>Detalles del Usuario</h2>
                            <button 
                                className="btn-close"
                                onClick={() => {
                                    setMostrarDetalles(false);
                                    setUsuarioSeleccionado(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="user-details-grid">
                                <div className="detail-section">
                                    <h3>Información Personal</h3>
                                    <div className="detail-item">
                                        <strong>Nombre completo:</strong> {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido || ''}
                                    </div>
                                    <div className="detail-item">
                                        <Mail size={16} />
                                        <strong>Email:</strong> {usuarioSeleccionado.emailInstitucional}
                                    </div>
                                    {usuarioSeleccionado.telefono && (
                                        <div className="detail-item">
                                            <Phone size={16} />
                                            <strong>Teléfono:</strong> {usuarioSeleccionado.telefono}
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <Shield size={16} />
                                        <strong>Rol:</strong> 
                                        <span className={`rol-badge ${obtenerColorRol(usuarioSeleccionado.rol)}`}>
                                            {usuarioSeleccionado.rol}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Estado:</strong> 
                                        <span className={`estado-badge ${obtenerColorEstado(usuarioSeleccionado.estado)}`}>
                                            {usuarioSeleccionado.estado}
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Actividad en la Biblioteca</h3>
                                    <div className="detail-item">
                                        <BookOpen size={16} />
                                        <strong>Préstamos activos:</strong> {usuarioSeleccionado.prestamosActivos}
                                    </div>
                                    <div className="detail-item">
                                        <Calendar size={16} />
                                        <strong>Total de préstamos:</strong> {usuarioSeleccionado.prestamosTotales}
                                    </div>
                                    <div className="detail-item">
                                        <AlertTriangle size={16} />
                                        <strong>Multas pendientes:</strong> {usuarioSeleccionado.multasPendientes}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Monto de multas:</strong> {formatearMoneda(usuarioSeleccionado.montoMultas || 0)}
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h3>Información del Sistema</h3>
                                    <div className="detail-item">
                                        <Calendar size={16} />
                                        <strong>Fecha de registro:</strong> {formatearFecha(usuarioSeleccionado.fechaRegistro)}
                                    </div>
                                    {usuarioSeleccionado.ultimoAcceso && (
                                        <div className="detail-item">
                                            <strong>Último acceso:</strong> {formatearFecha(usuarioSeleccionado.ultimoAcceso)}
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <strong>ID de usuario:</strong> {usuarioSeleccionado.usuarioID}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setMostrarDetalles(false);
                                    setUsuarioSeleccionado(null);
                                }}
                            >
                                Cerrar
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={() => {
                                    setMostrarDetalles(false);
                                    setMostrarFormulario(true);
                                }}
                            >
                                Editar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {mostrarConfirmacion && usuarioAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Confirmar Eliminación</h2>
                        </div>
                        
                        <div className="modal-body">
                            <p>¿Estás seguro de que deseas eliminar al usuario <strong>{usuarioAEliminar.nombre} {usuarioAEliminar.apellido || ''}</strong>?</p>
                            <p className="warning-text">Esta acción no se puede deshacer y eliminará todos los datos asociados al usuario.</p>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={cancelarEliminacion}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={eliminarUsuarioConfirmado}
                                disabled={procesando}
                            >
                                {procesando ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de formulario (placeholder) */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <div className="modal-header">
                            <h2>{usuarioSeleccionado ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                            <button 
                                className="btn-close"
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setUsuarioSeleccionado(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-placeholder">
                                <p>Formulario de usuario en desarrollo...</p>
                                <p>Aquí se implementaría el formulario completo para crear/editar usuarios.</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setUsuarioSeleccionado(null);
                                }}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-primary"
                                disabled
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
