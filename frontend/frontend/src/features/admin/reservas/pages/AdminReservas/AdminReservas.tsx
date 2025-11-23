import React, { useEffect, useState, useRef } from 'react';
import { Check, X, Clock, User, Scan, Book } from 'lucide-react';
import { obtenerReservasParaRetiro, obtenerReservasEnEspera, aprobarReserva, rechazarReserva, expirarReserva, type AdminReservaDTO } from '../../../../../api/reservas';
import { obtenerEjemplarPorCodigoBarras, type Ejemplar } from '../../../../../api/ejemplares';
// DropdownMenu removed for inline buttons (Aprobar/Rechazar visibles)
import PageLoader from '../../../../../components/PageLoader';
import { useToast } from '../../../../../components/Toast';
import { useNavigation } from '../../../../../hooks/useNavigation';
import './AdminReservas.css';

const AdminReservas: React.FC = () => {
    const { goBack } = useNavigation();
    const [paraRetiro, setParaRetiro] = useState<AdminReservaDTO[]>([]);
    const [enEspera, setEnEspera] = useState<AdminReservaDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [procesandoId, setProcesandoId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    // UI: search + pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [pageRetiro, setPageRetiro] = useState(1);
    const [pageEspera, setPageEspera] = useState(1);
    const pageSize = 8;
    
    // Estados para escaneo de código de barras (HU-12 para reservas)
    const [codigoBarrasReserva, setCodigoBarrasReserva] = useState('');
    const [ejemplarEncontrado, setEjemplarEncontrado] = useState<Ejemplar | null>(null);
    const [reservaEncontrada, setReservaEncontrada] = useState<AdminReservaDTO | null>(null);
    const [procesandoReserva, setProcesandoReserva] = useState(false);
    const codigoBarrasInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    // Foco automático en el campo de búsqueda de código de barras al cargar
    useEffect(() => {
        if (codigoBarrasInputRef.current) {
            codigoBarrasInputRef.current.focus();
        }
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            
            console.log('Cargando reservas...');
            
            // Cargar por separado para identificar mejor dónde está el problema
            const retiro = await obtenerReservasParaRetiro();
            console.log('Reservas para retiro cargadas:', retiro);
            
            const espera = await obtenerReservasEnEspera();
            console.log('Reservas en espera cargadas:', espera);
            
            if (!espera) {
                console.warn('obtenerReservasEnEspera devolvió null/undefined');
            } else if (!Array.isArray(espera)) {
                console.warn('obtenerReservasEnEspera no devolvió un array:', typeof espera);
            } else if (espera.length === 0) {
                console.log('No hay reservas en cola de espera');
            }
            
            // Asignar los datos asegurándonos de que son arrays
            setParaRetiro(Array.isArray(retiro) ? retiro : []);
            setEnEspera(Array.isArray(espera) ? espera : []);
            
            // Nota: evitar llamadas directas con fetch sin prefijo /api porque en dev el proxy espera /api
            // Si se necesita verificar manualmente, usar el helper obtenerReservasEnEspera() que usa axios y añade auth/proxy
            
        } catch (err: any) {
            console.error('Error al cargar reservas:', err);
            let msg = 'No se pudieron cargar las reservas';
            if (err?.response?.data?.mensaje) {
                msg = err.response.data.mensaje;
                console.log('Error del servidor:', msg);
            } else if (err?.message) {
                console.log('Error de red o cliente:', err.message);
            }
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setCargando(false);
        }
    };

    const handleAprobar = async (id: number) => {
        if (!confirm('Aprobar reserva y notificar al usuario?')) return;
        try {
            setProcesandoId(id);
            const res = await aprobarReserva(id);
            // Mostrar mensaje más informativo según la respuesta
            if (res.prestamoID && res.prestamoID > 0) {
                showToast('Reserva aprobada y préstamo creado (ID: ' + res.prestamoID + ')', 'success');
            } else {
                showToast(res.mensaje || 'Reserva aprobada', 'success');
            }
            await cargarDatos();
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al aprobar reserva';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setProcesandoId(null);
        }
    };

    const handleRechazar = async (id: number) => {
        if (!confirm('Rechazar/cancelar esta reserva?')) return;
        try {
            setProcesandoId(id);
            await rechazarReserva(id);
            showToast('Reserva cancelada', 'info');
            await cargarDatos();
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al rechazar reserva';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setProcesandoId(null);
        }
    };

    const handleExpirar = async (id: number) => {
        if (!confirm('Marcar como expirada esta reserva?')) return;
        try {
            setProcesandoId(id);
            await expirarReserva(id);
            showToast('Reserva marcada como expirada', 'info');
            await cargarDatos();
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al expirar reserva';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setProcesandoId(null);
        }
    };

    // Buscar reserva por código de barras y aprobar automáticamente (solo reservas "Por retirar")
    const buscarReservaPorCodigoBarras = async (codigoBarras: string) => {
        if (!codigoBarras.trim()) return;
        
        try {
            setError(null);
            setProcesandoReserva(true);
            
            // Buscar el ejemplar por código de barras
            const ejemplar = await obtenerEjemplarPorCodigoBarras(codigoBarras.trim());
            setEjemplarEncontrado(ejemplar);
            
            // Buscar una reserva "Por retirar" que corresponda a este libro
            const reserva = paraRetiro.find(r => {
                const esCola = (r.estado || '').toString().trim().toLowerCase().includes('cola');
                const mismoLibro = r.libroID === ejemplar.libroID;
                return !esCola && mismoLibro;
            });
            
            if (!reserva) {
                showToast('No se encontró una reserva "Por retirar" para este ejemplar', 'error');
                setReservaEncontrada(null);
                setCodigoBarrasReserva('');
                // Volver a enfocar para siguiente intento
                setTimeout(() => codigoBarrasInputRef.current?.focus(), 100);
                return;
            }
            
            setReservaEncontrada(reserva);
            showToast(`Reserva encontrada: ${reserva.libroTitulo} - Usuario: ${reserva.usuarioNombre}`, 'success');
            
            // Aprobar reserva automáticamente
            await aprobarReservaCompleta(reserva.reservaID);
        } catch (err: any) {
            console.error('Error al buscar reserva:', err);
            let msg = 'Error al buscar la reserva';
            if (err?.response?.data?.mensaje) {
                msg = err.response.data.mensaje;
            } else if (err?.message) {
                msg = err.message;
            }
            setError(msg);
            showToast(msg, 'error');
            setReservaEncontrada(null);
            setEjemplarEncontrado(null);
        } finally {
            setProcesandoReserva(false);
        }
    };

    // Aprobar reserva completa (sin confirmación ya que es automático)
    const aprobarReservaCompleta = async (id: number) => {
        try {
            setProcesandoReserva(true);
            const res = await aprobarReserva(id);
            // Mostrar mensaje más informativo según la respuesta
            if (res.prestamoID && res.prestamoID > 0) {
                showToast('Reserva aprobada y préstamo creado (ID: ' + res.prestamoID + ')', 'success');
            } else {
                showToast(res.mensaje || 'Reserva aprobada', 'success');
            }
            
            // Limpiar formulario de escaneo
            setCodigoBarrasReserva('');
            setReservaEncontrada(null);
            setEjemplarEncontrado(null);
            
            await cargarDatos();
            
            // Volver a enfocar el campo de código de barras para siguiente reserva
            setTimeout(() => {
                codigoBarrasInputRef.current?.focus();
            }, 100);
        } catch (err: any) {
            const msg = err?.response?.data?.mensaje || 'Error al aprobar reserva';
            setError(msg);
            showToast(msg, 'error');
            setReservaEncontrada(null);
        } finally {
            setProcesandoReserva(false);
        }
    };

    // Manejar Enter en campo de código de barras (del escáner)
    const handleCodigoBarrasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarReservaPorCodigoBarras(codigoBarrasReserva);
        }
    };

    if (cargando) return <PageLoader message="Cargando reservas..." />;

    return (
        <div className="page-content admin-reservas-page">
            <div className="admin-header">
                <div className="admin-header-content">
                    <button className="btn-back" onClick={goBack}>← Volver</button>
                    <div className="admin-title-section">
                        <h1>Gestión de Reservas</h1>
                        <p>Aprueba reservas por prioridad o gestiona la cola de espera</p>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Sección de aprobación por escaneo de código de barras */}
            <div className="reservation-scan-section">
                <h2 className="section-title">
                    <Scan size={20} />
                    Aprobación de Reservas por Escaneo
                </h2>
                <div className="reservation-scan-form">
                    <div className="form-group">
                        <label htmlFor="codigoBarrasReserva">
                            <Book size={16} />
                            Código de Barras del Ejemplar *
                        </label>
                        <input
                            ref={codigoBarrasInputRef}
                            type="text"
                            id="codigoBarrasReserva"
                            value={codigoBarrasReserva}
                            onChange={(e) => setCodigoBarrasReserva(e.target.value)}
                            onKeyDown={handleCodigoBarrasKeyDown}
                            placeholder="Escanee o ingrese el código de barras del ejemplar"
                            className="scanner-input"
                            disabled={procesandoReserva}
                            autoFocus
                        />
                        {ejemplarEncontrado && (
                            <div className="found-item">
                                <span className="found-label">Ejemplar encontrado:</span>
                                <span className="found-value">
                                    Ejemplar #{ejemplarEncontrado.numeroEjemplar} - Libro ID: {ejemplarEncontrado.libroID}
                                </span>
                            </div>
                        )}
                        {reservaEncontrada && (
                            <div className="found-item">
                                <span className="found-label">Reserva encontrada:</span>
                                <span className="found-value">
                                    {reservaEncontrada.libroTitulo} - {reservaEncontrada.usuarioNombre} ({reservaEncontrada.codigoUsuario || reservaEncontrada.usuarioID})
                                </span>
                            </div>
                        )}
                    </div>
                    {procesandoReserva && (
                        <div className="processing-message">
                            Procesando aprobación de reserva...
                        </div>
                    )}
                </div>
            </div>

            <div className="admin-controls">
                <input
                    type="text"
                    placeholder="Buscar por libro o usuario..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPageRetiro(1); setPageEspera(1); }}
                    className="admin-search"
                />
            </div>

            <div className="admin-content admin-reservas-content">
                <section className="panel">
                    <h2><span className="panel-title">Reserva por Retirar</span> <span className="count-badge">
                        {paraRetiro.filter(r => !(r.estado || '').toString().trim().toLowerCase().includes('cola')).length}
                    </span></h2>
                    <div className="cards-grid">
                        {(() => {
                            const normalize = (s?: string) => (s || '').toString().trim().toLowerCase();
                            const esCola = (s?: string) => normalize(s).includes('cola');
                            const matches = (r: AdminReservaDTO) => {
                                const q = searchTerm.trim().toLowerCase();
                                if (!q) return true;
                                return (r.libroTitulo || '').toLowerCase().includes(q) || (r.usuarioNombre || '').toLowerCase().includes(q) || (''+r.usuarioID).includes(q) || (''+r.reservaID).includes(q);
                            };
                            const filtered = (paraRetiro || []).filter(r => !esCola(r.estado) && matches(r));
                            const start = (pageRetiro - 1) * pageSize;
                            const page = filtered.slice(start, start + pageSize);
                            if (page.length === 0) return <div className="empty-state">No hay reservas para retiro</div>;
                            return page.map(r => {
                                const estadoNorm = (r.estado || '').toString().trim().toLowerCase();
                                const badgeClass = estadoNorm.includes('act') || estadoNorm.includes('por') || estadoNorm.includes('aprob') ? 'badge-success'
                                    : estadoNorm.includes('cola') ? 'badge-danger'
                                    : 'badge-warning';
                                
                                // Formatear fecha
                                const fechaFormateada = r.fechaReserva 
                                    ? new Date(r.fechaReserva).toLocaleString('es-ES', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })
                                    : '-';
                                
                                return (
                                    <div className="card reservation-card" key={r.reservaID}>
                                        <div className="card-header">
                                            <div className="card-title-main">{r.libroTitulo || 'Sin título'}</div>
                                        </div>
                                        <div className="card-body">
                                            {/* Nivel - placeholder por ahora */}
                                            <div className="reservation-level">Nivel básico</div>
                                            
                                            {/* Badge de Ejemplar */}
                                            {r.numeroEjemplar && (
                                                <div className="ejemplar-badge">Ejemplar #{r.numeroEjemplar}</div>
                                            )}
                                            
                                            <div className="reservation-info-item">
                                                <User size={16} className="info-icon" />
                                                <span>{r.usuarioNombre || 'Usuario'} {r.codigoUsuario ? `(${r.codigoUsuario})` : r.usuarioID ? `(${r.usuarioID})` : ''}</span>
                                            </div>
                                            
                                            <div className="reservation-info-item">
                                                <span className="info-label">Fecha:</span>
                                                <span className="info-value">{fechaFormateada}</span>
                                            </div>
                                            
                                            <div className="reservation-info-item">
                                                <span className="info-label">Tipo:</span>
                                                <span className="info-value">{r.tipoReserva || '-'}</span>
                                            </div>
                                            
                                            {/* Código de barras */}
                                            {r.codigoBarras && (
                                                <div className="reservation-info-item">
                                                    <Book size={16} className="info-icon" />
                                                    <span className="info-label">Código:</span>
                                                    <span className="info-value">{r.codigoBarras}</span>
                                                </div>
                                            )}
                                            
                                            <div className="card-state">
                                                <span className={`badge ${badgeClass}`}>{r.estado || 'Sin estado'}</span>
                                            </div>
                                        </div>
                                        <div className="card-actions">
                                            {/* Solo mostrar botón de aprobar si NO es una reserva en cola */}
                                            {!(r.estado || '').toLowerCase().includes('cola') && (
                                                <button className="btn-approve small" disabled={procesandoId === r.reservaID} onClick={() => handleAprobar(r.reservaID)}>
                                                    <Check className="btn-icon" size={16} />
                                                    <span>Aprobar</span>
                                                </button>
                                            )}
                                            <button className="btn-reject small" disabled={procesandoId === r.reservaID} onClick={() => handleRechazar(r.reservaID)}>
                                                <X className="btn-icon" size={16} />
                                                <span>Rechazar</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div className="panel-footer">
                        <div className="pagination">
                            <button disabled={pageRetiro === 1} onClick={() => setPageRetiro(p => Math.max(1, p-1))} className="pagination-btn">Anterior</button>
                            <span className="pagination-info">Página {pageRetiro}</span>
                            <button onClick={() => setPageRetiro(p => p+1)} className="pagination-btn">Siguiente</button>
                        </div>
                    </div>
                </section>

                <section className="panel">
                    <h2><span className="panel-title">Reserva en Cola</span> <span className="count-badge">{enEspera.length}</span></h2>
                    <div className="cards-grid">
                        {(() => {
                            // Primero depurar las reservas recibidas
                            console.log('Reservas en cola antes de filtrar:', enEspera);
                            
                            // Filtrar por búsqueda si hay término de búsqueda
                            const filtered = searchTerm.trim()
                                ? (enEspera || []).filter(r => {
                                    const q = searchTerm.trim().toLowerCase();
                                    return (r.libroTitulo || '').toLowerCase().includes(q) || 
                                           (r.usuarioNombre || '').toLowerCase().includes(q) || 
                                           (''+r.usuarioID).includes(q) || 
                                           (''+r.reservaID).includes(q);
                                  })
                                : (enEspera || []);
                            // Para depurar, mostrar las reservas en consola
                            console.log('Reservas en cola:', filtered);
                            const start = (pageEspera - 1) * pageSize;
                            const page = filtered.slice(start, start + pageSize);
                            if (page.length === 0) return <div className="empty-state">No hay reservas en espera</div>;
                            return page.map(r => {
                                const estadoNorm = (r.estado || '').toString().trim().toLowerCase();
                                const badgeClass = estadoNorm.includes('cola') ? 'badge-danger' : 'badge-warning';
                                
                                // Formatear fecha
                                const fechaFormateada = r.fechaReserva 
                                    ? new Date(r.fechaReserva).toLocaleString('es-ES', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })
                                    : '-';
                                
                                return (
                                    <div className="card reservation-card" key={r.reservaID}>
                                        <div className="card-header">
                                            <div className="card-title-main">{r.libroTitulo || 'Sin título'}</div>
                                        </div>
                                        <div className="card-body">
                                            {/* Nivel - placeholder por ahora */}
                                            <div className="reservation-level">Nivel básico</div>
                                            
                                            {/* Badge de Ejemplar */}
                                            {r.numeroEjemplar && (
                                                <div className="ejemplar-badge">Ejemplar #{r.numeroEjemplar}</div>
                                            )}
                                            
                                            <div className="reservation-info-item">
                                                <User size={16} className="info-icon" />
                                                <span>{r.usuarioNombre || 'Usuario'} {r.codigoUsuario ? `(${r.codigoUsuario})` : r.usuarioID ? `(${r.usuarioID})` : ''}</span>
                                            </div>
                                            
                                            <div className="reservation-info-item">
                                                <span className="info-label">Fecha:</span>
                                                <span className="info-value">{fechaFormateada}</span>
                                            </div>
                                            
                                            <div className="reservation-info-item">
                                                <span className="info-label">Posición:</span>
                                                <span className="info-value">{r.posicionCola ?? '-'}</span>
                                            </div>
                                            
                                            {/* Código de barras */}
                                            {r.codigoBarras && (
                                                <div className="reservation-info-item">
                                                    <Book size={16} className="info-icon" />
                                                    <span className="info-label">Código:</span>
                                                    <span className="info-value">{r.codigoBarras}</span>
                                                </div>
                                            )}
                                            
                                            <div className="card-state">
                                                <span className={`badge ${badgeClass}`}>{r.estado || 'Sin estado'}</span>
                                            </div>
                                        </div>
                                        <div className="card-actions">
                                            {/* Las reservas en cola NO deben tener botón Aprobar */}
                                            {/* Solo mostrar Rechazar y Expirar para reservas en cola */}
                                            <button className="btn-reject small" disabled={procesandoId === r.reservaID} onClick={() => handleRechazar(r.reservaID)}>
                                                <X className="btn-icon" size={16} />
                                                <span>Rechazar</span>
                                            </button>
                                            <button className="btn-secondary small" disabled={procesandoId === r.reservaID} onClick={() => handleExpirar(r.reservaID)}>
                                                <Clock className="btn-icon" size={16} />
                                                <span>Expirar</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div className="panel-footer">
                        <div className="pagination">
                            <button disabled={pageEspera === 1} onClick={() => setPageEspera(p => Math.max(1, p-1))} className="pagination-btn">Anterior</button>
                            <span className="pagination-info">Página {pageEspera}</span>
                            <button onClick={() => setPageEspera(p => p+1)} className="pagination-btn">Siguiente</button>
                        </div>
                    </div>
                </section>
            </div>
            {/* confirm dialog restored to native confirm() per request */}
        </div>
    );
};

export default AdminReservas;
