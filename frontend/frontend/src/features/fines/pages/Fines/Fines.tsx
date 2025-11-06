import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, 
    DollarSign, 
    Calendar,
    Clock,
    BookOpen,
    CheckCircle,
    XCircle,
    Filter,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import {
    obtenerMisMultas,
    obtenerMiResumenMultas,
    type Multa,
    type ResumenMultasDTO
} from '../../../../api/multas';
import { useSEO, SEOConfigs } from '../../../../hooks/useSEO';
import PageLoader from '../../../../components/PageLoader';
import './Fines.css';

interface Usuario {
    usuarioID: number;
    nombre: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: string;
}

interface FinesProps {
    usuario: Usuario;
}

const Fines: React.FC<FinesProps> = () => {
    // SEO
    useSEO(SEOConfigs.multas);
    
    const [multas, setMultas] = useState<Multa[]>([]);
    const [multasFiltradas, setMultasFiltradas] = useState<Multa[]>([]);
    const [resumen, setResumen] = useState<ResumenMultasDTO | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    useEffect(() => {
        cargarMultas();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [multas, filtroEstado]);

    const cargarMultas = async () => {
        try {
            setCargando(true);
            setError(null);
            
            const [multasData, resumenData] = await Promise.all([
                obtenerMisMultas(),
                obtenerMiResumenMultas()
            ]);
            
            setMultas(multasData);
            setResumen(resumenData);
        } catch (err) {
            console.error('Error cargando multas:', err);
            setError('Error al cargar las multas');
        } finally {
            setCargando(false);
        }
    };

    const aplicarFiltros = () => {
        let filtradas = [...multas];

        if (filtroEstado === 'pendientes') {
            filtradas = filtradas.filter(m => m.estado === 'Pendiente');
        } else if (filtroEstado === 'pagadas') {
            filtradas = filtradas.filter(m => m.estado === 'Pagada');
        }

        setMultasFiltradas(filtradas);
    };

    const formatearFecha = (fecha?: string) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatearMonto = (monto: number) => {
        return `$${monto.toFixed(2)}`;
    };

    if (cargando) {
        return <PageLoader type="list" message="Cargando tus multas..." />;
    }

    if (error) {
        return (
            <div className="page-content">
                <AlertTriangle size={48} />
                <h2>Error al cargar multas</h2>
                <p>{error}</p>
                <button onClick={cargarMultas} className="btn-retry">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div className="multas-header">
                <div className="header-content">
                    <div className="header-title">
                        <AlertTriangle size={32} />
                        <div>
                            <h1>Mis Multas</h1>
                            <p>Gestiona tus multas y mantén tu historial al día</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen financiero */}
            {resumen && (
                <div className="resumen-grid">
                    <div className="resumen-card total">
                        <div className="resumen-icon">
                            <DollarSign size={28} />
                        </div>
                        <div className="resumen-content">
                            <h3>{formatearMonto(resumen.montoTotalGeneral)}</h3>
                            <p>Total General</p>
                            <span className="resumen-detail">
                                {resumen.totalMultas} multa{resumen.totalMultas !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="resumen-card pendiente">
                        <div className="resumen-icon">
                            <Clock size={28} />
                        </div>
                        <div className="resumen-content">
                            <h3>{formatearMonto(resumen.montoTotalPendiente)}</h3>
                            <p>Pendiente de Pago</p>
                            <span className="resumen-detail">
                                {resumen.multasPendientes} pendiente{resumen.multasPendientes !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="resumen-card pagada">
                        <div className="resumen-icon">
                            <CheckCircle size={28} />
                        </div>
                        <div className="resumen-content">
                            <h3>{formatearMonto(resumen.montoTotalPagado)}</h3>
                            <p>Total Pagado</p>
                            <span className="resumen-detail">
                                {resumen.multasPagadas} pagada{resumen.multasPagadas !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="resumen-card ratio">
                        <div className="resumen-icon">
                            {resumen.multasPendientes > resumen.multasPagadas ? (
                                <TrendingUp size={28} />
                            ) : (
                                <TrendingDown size={28} />
                            )}
                        </div>
                        <div className="resumen-content">
                            <h3>
                                {resumen.totalMultas > 0 
                                    ? Math.round((resumen.multasPagadas / resumen.totalMultas) * 100)
                                    : 0}%
                            </h3>
                            <p>Tasa de Pago</p>
                            <span className="resumen-detail">
                                {resumen.multasPagadas} de {resumen.totalMultas}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra de acciones */}
            <div className="multas-actions">
                <button 
                    className="btn-filter"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                >
                    <Filter size={18} />
                    <span>Filtros</span>
                </button>
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
                <div className="filtros-panel">
                    <div className="filtro-group">
                        <label>Estado:</label>
                        <select 
                            value={filtroEstado} 
                            onChange={(e) => setFiltroEstado(e.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="pendientes">Pendientes</option>
                            <option value="pagadas">Pagadas</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Lista de multas */}
            <div className="multas-list">
                {multasFiltradas.length === 0 ? (
                    <div className="multas-empty">
                        <CheckCircle size={64} />
                        <h3>
                            {filtroEstado !== 'todas' 
                                ? 'No hay multas con este filtro'
                                : '¡Excelente! No tienes multas'}
                        </h3>
                        <p>
                            {filtroEstado !== 'todas'
                                ? 'Intenta cambiar los filtros para ver otras multas'
                                : 'Mantén un buen historial devolviendo los libros a tiempo'}
                        </p>
                    </div>
                ) : (
                    multasFiltradas.map((multa) => (
                        <div 
                            key={multa.multaID} 
                            className={`multa-card ${multa.estado.toLowerCase()}`}
                        >
                            <div className="multa-header">
                                <div className="multa-id">
                                    <span className="label">Multa #</span>
                                    <span className="value">{multa.multaID}</span>
                                </div>
                                <div className={`multa-estado ${multa.estado.toLowerCase()}`}>
                                    {multa.estado === 'Pendiente' ? (
                                        <XCircle size={18} />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    <span>{multa.estado}</span>
                                </div>
                            </div>

                            <div className="multa-body">
                                <div className="multa-info-grid">
                                    <div className="info-item">
                                        <DollarSign size={20} />
                                        <div>
                                            <span className="info-label">Monto</span>
                                            <span className="info-value monto">
                                                {formatearMonto(multa.monto)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <Clock size={20} />
                                        <div>
                                            <span className="info-label">Días de Atraso</span>
                                            <span className="info-value">
                                                {multa.diasAtraso || 'N/A'} día{multa.diasAtraso !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <BookOpen size={20} />
                                        <div>
                                            <span className="info-label">Préstamo ID</span>
                                            <span className="info-value">#{multa.prestamoID}</span>
                                        </div>
                                    </div>

                                    {multa.fechaCobro && (
                                        <div className="info-item">
                                            <Calendar size={20} />
                                            <div>
                                                <span className="info-label">Fecha de Cobro</span>
                                                <span className="info-value">
                                                    {formatearFecha(multa.fechaCobro)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {multa.motivo && (
                                    <div className="multa-motivo">
                                        <span className="motivo-label">Motivo:</span>
                                        <span className="motivo-text">{multa.motivo}</span>
                                    </div>
                                )}

                                {multa.prestamo?.ejemplar?.libro && (
                                    <div className="multa-libro">
                                        <BookOpen size={18} />
                                        <div>
                                            <span className="libro-titulo">
                                                {multa.prestamo.ejemplar.libro.titulo}
                                            </span>
                                            <span className="libro-autor">
                                                {multa.prestamo.ejemplar.libro.autor}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {multa.estado === 'Pendiente' && (
                                <div className="multa-footer">
                                    <button className="btn-pagar">
                                        <DollarSign size={18} />
                                        <span>Pagar Multa</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Fines;
