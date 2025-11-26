import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { useNavigation } from '../../../../hooks/useNavigation';
import { type Usuario } from '../../../../contexts/AuthContextTypes';
import { 
    BookOpen, 
    Clock, 
    AlertTriangle, 
    Users, 
    Library,
    Calendar,
    BarChart3,
    CheckCircle
} from 'lucide-react';
import { 
    obtenerMiPerfil
} from '../../../../api/auth';
import { useSEO, SEOConfigs } from '../../../../hooks/useSEO';
import PageLoader from '../../../../components/PageLoader';
import QuickActions from '../../../../components/QuickActions';
import { 
    obtenerMisPrestamos,
    type PrestamoDTO 
} from '../../../../api/prestamos';
import { 
    obtenerMisMultas, 
    obtenerMiResumenMultas,
    type Multa,
    type ResumenMultasDTO
} from '../../../../api/multas';
import './Dashboard.css';

interface DashboardProps {
    usuario: Usuario;
}

const Dashboard: React.FC<DashboardProps> = ({ usuario }) => {
    const { esAdmin, esProfesor } = useAuth();
    const { navigate } = useNavigation();
    const [prestamos, setPrestamos] = useState<PrestamoDTO[]>([]);
    const [multas, setMultas] = useState<Multa[]>([]);
    const [resumenMultas, setResumenMultas] = useState<ResumenMultasDTO | null>(null);
    const [perfilCompleto, setPerfilCompleto] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    // SEO
    useSEO(SEOConfigs.dashboard);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarDatosDashboard();
    }, []);

    // Manejar el efecto de fade entre video (arriba) y PNG (abajo) según scroll
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateElements = () => {
            const videoEl = document.querySelector<HTMLVideoElement>('.dashboard-video');
            const imgEl = document.querySelector<HTMLImageElement>('.dashboard-media-bottom img');

            const scrollY = window.scrollY || window.pageYOffset || 0;
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const p = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

            // video fades out as user reaches bottom; image fades in
            if (videoEl) {
                videoEl.style.opacity = String(1 - p);
                videoEl.style.transform = `scale(${1 - p * 0.02})`;
            }
            if (imgEl) {
                imgEl.style.opacity = String(p);
            }
        };

        let rafId: number | null = null;
        const onScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateElements);
        };

        // Init call
        updateElements();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    const cargarDatosDashboard = async () => {
        try {
            setCargando(true);
            setError(null);

            // Cargar datos básicos del perfil (incluye estadísticas)
            try {
                const perfilData = await obtenerMiPerfil();
                setPerfilCompleto(perfilData);
            } catch {
                console.warn('No se pudo cargar el perfil completo');
            }

            // Cargar préstamos - usar el mismo endpoint que MyLoans
            try {
                // Intentar primero con mis-prestamos (como MyLoans)
                const prestamosData = await obtenerMisPrestamos();
                console.log('Préstamos cargados en Dashboard:', prestamosData);
                console.log('Total préstamos:', prestamosData.length);
                if (prestamosData && prestamosData.length > 0) {
                    console.log('Primer préstamo:', prestamosData[0]);
                }
                setPrestamos(prestamosData);
            } catch (error) {
                console.error('Error cargando préstamos:', error);
                console.warn('No se pudieron cargar los préstamos');
            }

            // Cargar multas
            try {
                const multasData = await obtenerMisMultas();
                setMultas(multasData);
                
                const resumenData = await obtenerMiResumenMultas();
                setResumenMultas(resumenData);
            } catch {
                console.warn('No se pudieron cargar las multas');
            }

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setCargando(false);
        }
    };

    // Préstamos activos: estado 'Prestado' y que aún no hayan vencido
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const prestamosActivos = prestamos.filter(p => {
        console.log('Revisando préstamo:', {
            id: p.prestamoID,
            estado: p.estado,
            estadoCalculado: p.estadoCalculado,
            fechaVencimiento: p.fechaVencimiento,
            libroTitulo: p.libroTitulo
        });
        
        if (p.estado !== 'Prestado') {
            console.log('  - No es Prestado, estado:', p.estado);
            return false;
        }
        
        const fechaVencimiento = new Date(p.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        const noVencido = fechaVencimiento >= hoy;
        
        console.log('  - Fecha vencimiento:', fechaVencimiento, 'Hoy:', hoy, 'No vencido:', noVencido);
        
        return noVencido;
    });
    
    console.log('Préstamos activos encontrados:', prestamosActivos.length);
    
    // Préstamos vencidos: estado 'Prestado' pero que ya vencieron
    const prestamosVencidos = prestamos.filter(p => {
        if (p.estado !== 'Prestado') return false;
        const fechaVencimiento = new Date(p.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        return fechaVencimiento < hoy;
    });
    const multasPendientes = multas.filter(m => m.estado === 'Pendiente');

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (cargando) {
        return <PageLoader type="dashboard" message="Cargando tu dashboard personalizado..." />;
    }

    // Video y PNG como fondos (se renderizan en portal al body para evitar constraints)
    const videoNode = (typeof document !== 'undefined') ? createPortal(
        <div className="dashboard-media-top" aria-hidden>
            <video
                className="dashboard-video"
                src="/videos/hand-reading.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
            />
        </div>, document.body
    ) : null;

    const bottomNode = (typeof document !== 'undefined') ? createPortal(
        <div className="dashboard-media-bottom" aria-hidden>
            <img src="/images/bg_luis5.png" alt="fondo inferior" />
        </div>, document.body
    ) : null;

    

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertTriangle size={48} />
                <h2>Error al cargar el dashboard</h2>
                <p>{error}</p>
                <button onClick={cargarDatosDashboard} className="btn-retry">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="page-content">
            {videoNode}
            {bottomNode}
            {/* Header del Dashboard */}
            <div className="dashboard-header">
                <div className="welcome-section">
                    <h1>¡Bienvenido, {usuario.nombre}!</h1>
                    <p className="welcome-subtitle">
                        {esAdmin() ? 'Panel de administración de la biblioteca' :
                         esProfesor() ? 'Panel de profesor - Gestión académica' :
                         'Tu espacio personal en la biblioteca'}
                    </p>
                </div>
                <div className="user-info-card">
                    <div className="user-avatar">
                        <Users size={24} />
                    </div>
                    <div className="user-details">
                        <span className="user-name">{usuario.nombre}</span>
                        <span className="user-role">{usuario.rol}</span>
                        <span className="user-code">{usuario.codigoUniversitario}</span>
                    </div>
                </div>
            </div>

            {/* Métricas principales */}
            <div className="metrics-grid">
                {esAdmin() ? (
                    // Métricas para Administradores
                    <>
                        <div className="metric-card metric-primary">
                            <div className="metric-icon">
                                <Library size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>1,247</h3>
                                <p>Libros en catálogo</p>
                                <span className="metric-trend">+23 este mes</span>
                            </div>
                        </div>

                        <div className="metric-card metric-success">
                            <div className="metric-icon">
                                <BookOpen size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>89</h3>
                                <p>Préstamos activos</p>
                                <span className="metric-trend">+12% vs ayer</span>
                            </div>
                        </div>

                        <div className="metric-card metric-warning">
                            <div className="metric-icon">
                                <Clock size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>15</h3>
                                <p>Préstamos vencidos</p>
                                <span className="metric-trend">-3 vs ayer</span>
                            </div>
                        </div>

                        <div className="metric-card metric-danger">
                            <div className="metric-icon">
                                <AlertTriangle size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>7</h3>
                                <p>Multas pendientes</p>
                                <span className="metric-trend">$245 total</span>
                            </div>
                        </div>
                    </>
                ) : (
                    // Métricas para Estudiantes/Profesores
                    <>
                        <div className="metric-card metric-primary">
                            <div className="metric-icon">
                                <BookOpen size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>{prestamosActivos.length}</h3>
                                <p>Préstamos activos</p>
                                <span className="metric-trend">En tu poder</span>
                            </div>
                        </div>

                        <div className="metric-card metric-warning">
                            <div className="metric-icon">
                                <Clock size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>{prestamosVencidos.length}</h3>
                                <p>Préstamos vencidos</p>
                                <span className="metric-trend">Requieren atención</span>
                            </div>
                        </div>

                        <div className="metric-card metric-danger">
                            <div className="metric-icon">
                                <AlertTriangle size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>{multasPendientes.length}</h3>
                                <p>Multas pendientes</p>
                                <span className="metric-trend">
                                    ${resumenMultas?.montoTotalPendiente || 0}
                                </span>
                            </div>
                        </div>

                        <div className="metric-card metric-success">
                            <div className="metric-icon">
                                <CheckCircle size={28} />
                            </div>
                            <div className="metric-content">
                                <h3>{perfilCompleto?.prestamosCompletados || 0}</h3>
                                <p>Préstamos completados</p>
                                <span className="metric-trend">Este año</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Secciones específicas por rol */}
            <div className="dashboard-sections">
                {esAdmin() ? (
                    // Sección de administración
                    <div className="admin-section">
                        <h2>Panel de Administración</h2>
                        <div className="admin-grid">
                            <div 
                                className="admin-card clickable"
                                onClick={() => navigate('/admin/reportes')}
                            >
                                <BarChart3 size={24} />
                                <h3>Reportes y Estadísticas</h3>
                                <p>Ver reportes y métricas de la biblioteca</p>
                            </div>
                            <div 
                                className="admin-card clickable"
                                onClick={() => navigate('/admin/usuarios')}
                            >
                                <Users size={24} />
                                <h3>Gestión de Usuarios</h3>
                                <p>Administrar cuentas y permisos</p>
                            </div>
                            <div 
                                className="admin-card clickable"
                                onClick={() => navigate('/admin/configuracion')}
                            >
                                <Calendar size={24} />
                                <h3>Configuración del Sistema</h3>
                                <p>Ajustes y parámetros del sistema</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Sección para estudiantes/profesores
                    <div className="user-section">
                        <h2>Tu Actividad Reciente</h2>
                        
                        {/* Préstamos activos */}
                        {prestamosActivos.length > 0 && (
                            <div className="activity-card">
                                <h3>Préstamos Activos</h3>
                                <div className="prestamos-list">
                                    {prestamosActivos.slice(0, 3).map((prestamo) => (
                                        <div key={prestamo.prestamoID} className="prestamo-item">
                                            <BookOpen size={20} />
                                            <div className="prestamo-info">
                                                <span className="prestamo-titulo">{prestamo.libroTitulo}</span>
                                                <span className="prestamo-fecha">
                                                    Vence: {formatearFecha(prestamo.fechaVencimiento)}
                                                </span>
                                            </div>
                                            <span className={`prestamo-estado ${prestamo.estado.toLowerCase()}`}>
                                                {prestamo.estado}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Multas pendientes */}
                        {multasPendientes.length > 0 && (
                            <div className="activity-card">
                                <h3>Multas Pendientes</h3>
                                <div className="multas-list">
                                    {multasPendientes.slice(0, 3).map((multa) => (
                                        <div key={multa.multaID} className="multa-item">
                                            <AlertTriangle size={20} />
                                            <div className="multa-info">
                                                <span className="multa-descripcion">{multa.motivo || 'Multa por retraso'}</span>
                                                <span className="multa-fecha">
                                                    {multa.diasAtraso ? `${multa.diasAtraso} días de atraso` : 'Fecha no disponible'}
                                                </span>
                                            </div>
                                            <span className="multa-monto">${multa.monto}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Acciones rápidas */}
            <QuickActions />
        </div>
    );
};

export default Dashboard;
