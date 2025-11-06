import React, { useState, useEffect } from "react";
import { obtenerMisPrestamos } from "../../../../api/prestamos";
import type { PrestamoDTO } from "../../../../api/prestamos";
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";
import { useNavigation } from "../../../../hooks/useNavigation";
import { useSEO, SEOConfigs } from "../../../../hooks/useSEO";
import PageLoader from "../../../../components/PageLoader";
import "./MyLoans.css";

interface Usuario {
    usuarioID: number;
    nombre: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: string;
}

interface MyLoansProps {
    usuario: Usuario;
}

const MyLoans: React.FC<MyLoansProps> = ({ usuario }) => {
    // SEO
    useSEO(SEOConfigs.prestamos);
    
    const { goBack } = useNavigation();
    const [prestamos, setPrestamos] = useState<PrestamoDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarPrestamos();
    }, []);

    const cargarPrestamos = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await obtenerMisPrestamos();
            setPrestamos(data);
        } catch (err: unknown) {
            console.error('Error cargando préstamos:', err);
            setError('Error al cargar los préstamos. Por favor, inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calcularDiasRestantes = (fechaVencimiento: string) => {
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diffTime = vencimiento.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getEstadoColor = (prestamo: PrestamoDTO) => {
        if (prestamo.estado === 'Devuelto') return 'devuelto';
        if (prestamo.estadoCalculado === 'Atrasado') return 'atrasado';
        if (prestamo.estado === 'Prestado') return 'prestado';
        return 'default';
    };

    if (cargando) {
        return <PageLoader type="list" message="Cargando tu historial de préstamos..." />;
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="error-message">
                    <AlertCircle size={48} />
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={cargarPrestamos}>Reintentar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <header className="prestamos-header">
                <button className="btn-back" onClick={goBack}>
                    ← Volver al catálogo
                </button>
                <h1>Mis Préstamos</h1>
                <p>Gestiona tus préstamos activos y revisa tu historial</p>
                <p className="user-info">Usuario: {usuario.nombre} ({usuario.codigoUniversitario})</p>
            </header>

            {prestamos.length === 0 ? (
                <div className="no-prestamos">
                    <BookOpen size={64} />
                    <h3>No tienes préstamos</h3>
                    <p>Cuando solicites un préstamo, aparecerá aquí.</p>
                </div>
            ) : (
                <div className="prestamos-grid">
                    {prestamos.map((prestamo) => {
                        const diasRestantes = calcularDiasRestantes(prestamo.fechaVencimiento);
                        const estadoColor = getEstadoColor(prestamo);

                        return (
                            <div key={prestamo.prestamoID} className={`prestamo-card ${estadoColor}`}>
                                <div className="prestamo-header">
                                    <div className="libro-info">
                                        <BookOpen size={24} />
                                        <div>
                                            <h3>{prestamo.libroTitulo || 'Sin título'}</h3>
                                            <p>ISBN: {prestamo.libroISBN || 'N/D'}</p>
                                            <p>Ejemplar #{prestamo.numeroEjemplar || 'N/D'}</p>
                                        </div>
                                    </div>
                                    <div className={`estado-badge ${estadoColor}`}>
                                        {prestamo.estadoCalculado || prestamo.estado || 'Pendiente'}
                                    </div>
                                </div>

                                <div className="prestamo-details">
                                    <div className="detail-item">
                                        <Calendar size={16} />
                                        <span>
                                            <strong>Prestado:</strong> {formatearFecha(prestamo.fechaPrestamo)}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <Clock size={16} />
                                        <span>
                                            <strong>Vence:</strong> {formatearFecha(prestamo.fechaVencimiento)}
                                        </span>
                                    </div>
                                    {prestamo.fechaDevolucion && (
                                        <div className="detail-item">
                                            <Calendar size={16} />
                                            <span>
                                                <strong>Devuelto:</strong> {formatearFecha(prestamo.fechaDevolucion)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {prestamo.estado === 'Prestado' && (
                                    <div className="prestamo-actions">
                                        {prestamo.estadoCalculado === 'Atrasado' ? (
                                            <div className="atraso-warning">
                                                <AlertCircle size={16} />
                                                <span>¡Atrasado por {prestamo.diasAtraso} días!</span>
                                            </div>
                                        ) : (
                                            <div className="dias-restantes">
                                                <Clock size={16} />
                                                <span>
                                                    {diasRestantes > 0 
                                                        ? `${diasRestantes} días restantes`
                                                        : 'Vence hoy'
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {prestamo.observaciones && (
                                    <div className="observaciones">
                                        <strong>Observaciones:</strong> {prestamo.observaciones}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="prestamos-stats">
                <div className="stat-item">
                    <h4>Total de préstamos</h4>
                    <span>{prestamos.length}</span>
                </div>
                <div className="stat-item">
                    <h4>Activos</h4>
                    <span>{prestamos.filter(p => p.estado === 'Prestado').length}</span>
                </div>
                <div className="stat-item">
                    <h4>Devueltos</h4>
                    <span>{prestamos.filter(p => p.estado === 'Devuelto').length}</span>
                </div>
                <div className="stat-item">
                    <h4>Atrasados</h4>
                    <span>{prestamos.filter(p => p.estadoCalculado === 'Atrasado').length}</span>
                </div>
            </div>
        </div>
    );
};

export default MyLoans;
