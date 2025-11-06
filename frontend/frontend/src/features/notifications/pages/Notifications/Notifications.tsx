import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    BookOpen, 
    CheckCircle, 
    AlertTriangle, 
    Calendar,
    Info,
    Filter,
    Check,
    Trash2
} from 'lucide-react';
import {
    obtenerNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    type Notificacion
} from '../../../../api/notificaciones';
import { useSEO, SEOConfigs } from '../../../../hooks/useSEO';
import PageLoader from '../../../../components/PageLoader';
import './Notifications.css';

interface Usuario {
    usuarioID: number;
    nombre: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: string;
}

interface NotificationsProps {
    usuario: Usuario;
}

const Notifications: React.FC<NotificationsProps> = () => {
    // SEO
    useSEO(SEOConfigs.notificaciones);
    
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [notificacionesFiltradas, setNotificacionesFiltradas] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroTipo, setFiltroTipo] = useState<string>('todas');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    useEffect(() => {
        cargarNotificaciones();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [notificaciones, filtroTipo, filtroEstado]);

    const cargarNotificaciones = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await obtenerNotificaciones();
            setNotificaciones(data);
        } catch (err) {
            console.error('Error cargando notificaciones:', err);
            setError('Error al cargar las notificaciones');
        } finally {
            setCargando(false);
        }
    };

    const aplicarFiltros = () => {
        let filtradas = [...notificaciones];

        // Filtrar por tipo
        if (filtroTipo !== 'todas') {
            filtradas = filtradas.filter(n => n.tipo === filtroTipo);
        }

        // Filtrar por estado
        if (filtroEstado === 'leidas') {
            filtradas = filtradas.filter(n => n.leida);
        } else if (filtroEstado === 'no-leidas') {
            filtradas = filtradas.filter(n => !n.leida);
        }

        setNotificacionesFiltradas(filtradas);
    };

    const handleMarcarComoLeida = async (id: number) => {
        try {
            await marcarComoLeida(id);
            setNotificaciones(prev => 
                prev.map(n => n.id === id ? { ...n, leida: true } : n)
            );
        } catch (err) {
            console.error('Error marcando notificación como leída:', err);
        }
    };

    const handleMarcarTodasComoLeidas = async () => {
        try {
            await marcarTodasComoLeidas();
            setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        } catch (err) {
            console.error('Error marcando todas como leídas:', err);
        }
    };

    const handleEliminar = async (id: number) => {
        try {
            await eliminarNotificacion(id);
            setNotificaciones(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error eliminando notificación:', err);
        }
    };

    const getIconoTipo = (tipo: Notificacion['tipo']) => {
        switch (tipo) {
            case 'prestamo':
                return <BookOpen size={24} />;
            case 'devolucion':
                return <Calendar size={24} />;
            case 'multa':
                return <AlertTriangle size={24} />;
            case 'reserva':
                return <CheckCircle size={24} />;
            case 'sistema':
                return <Info size={24} />;
            default:
                return <Bell size={24} />;
        }
    };

    const getColorTipo = (tipo: Notificacion['tipo']) => {
        switch (tipo) {
            case 'prestamo':
                return 'primary';
            case 'devolucion':
                return 'success';
            case 'multa':
                return 'danger';
            case 'reserva':
                return 'warning';
            case 'sistema':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        const ahora = new Date();
        const diff = ahora.getTime() - date.getTime();
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(diff / 3600000);
        const dias = Math.floor(diff / 86400000);

        if (minutos < 1) return 'Hace un momento';
        if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
        if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
        
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const noLeidas = notificaciones.filter(n => !n.leida).length;

    if (cargando) {
        return <PageLoader type="list" message="Cargando tus notificaciones..." />;
    }

    if (error) {
        return (
            <div className="page-content">
                <AlertTriangle size={48} />
                <h2>Error al cargar notificaciones</h2>
                <p>{error}</p>
                <button onClick={cargarNotificaciones} className="btn-retry">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div className="notificaciones-header">
                <div className="header-content">
                    <div className="header-title">
                        <Bell size={32} />
                        <div>
                            <h1>Notificaciones</h1>
                            <p>Mantente al día con las novedades de la biblioteca</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <div className="stat-badge">
                            <span className="stat-number">{notificaciones.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        <div className="stat-badge unread">
                            <span className="stat-number">{noLeidas}</span>
                            <span className="stat-label">No leídas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de acciones */}
            <div className="notificaciones-actions">
                <button 
                    className="btn-filter"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                    <Filter size={18} />
                    <span>Filtros</span>
                </button>

                {noLeidas > 0 && (
                    <button 
                        className="btn-mark-all"
                        onClick={handleMarcarTodasComoLeidas}
                    >
                        <Check size={18} />
                        <span>Marcar todas como leídas</span>
                    </button>
                )}
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
                <div className="filtros-panel">
                    <div className="filtro-group">
                        <label>Tipo:</label>
                        <select 
                            value={filtroTipo} 
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="prestamo">Préstamos</option>
                            <option value="devolucion">Devoluciones</option>
                            <option value="multa">Multas</option>
                            <option value="reserva">Reservas</option>
                            <option value="sistema">Sistema</option>
                        </select>
                    </div>
                    <div className="filtro-group">
                        <label>Estado:</label>
                        <select 
                            value={filtroEstado} 
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="no-leidas">No leídas</option>
                            <option value="leidas">Leídas</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Lista de notificaciones */}
            <div className="notificaciones-list">
                {notificacionesFiltradas.length === 0 ? (
                    <div className="notificaciones-empty">
                        <Bell size={64} />
                        <h3>No hay notificaciones</h3>
                        <p>
                            {filtroTipo !== 'todas' || filtroEstado !== 'todas'
                                ? 'No se encontraron notificaciones con los filtros seleccionados'
                                : 'No tienes notificaciones en este momento'}
                        </p>
                    </div>
                ) : (
                    notificacionesFiltradas.map((notificacion) => (
                        <div 
                            key={notificacion.id} 
                            className={`notificacion-card ${!notificacion.leida ? 'unread' : ''} ${getColorTipo(notificacion.tipo)}`}
                        >
                            <div className="notificacion-icon">
                                {getIconoTipo(notificacion.tipo)}
                            </div>
                            <div className="notificacion-content">
                                <div className="notificacion-header">
                                    <h3>{notificacion.titulo}</h3>
                                    <span className="notificacion-fecha">
                                        {formatearFecha(notificacion.fecha)}
                                    </span>
                                </div>
                                <p className="notificacion-mensaje">{notificacion.mensaje}</p>
                                <div className="notificacion-tipo">
                                    <span className={`tipo-badge ${notificacion.tipo}`}>
                                        {notificacion.tipo.charAt(0).toUpperCase() + notificacion.tipo.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="notificacion-actions">
                                {!notificacion.leida && (
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleMarcarComoLeida(notificacion.id)}
                                        title="Marcar como leída"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                                <button
                                    className="btn-icon btn-delete"
                                    onClick={() => handleEliminar(notificacion.id)}
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
