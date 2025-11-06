import React, { useState, useEffect } from "react";
import "./Profile.css";
import { User, BookOpen, Clock, AlertTriangle, Settings, ArrowLeft, Award, TrendingUp, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { useNavigation } from "../../../../hooks/useNavigation";
import { useSEO, SEOConfigs } from "../../../../hooks/useSEO";
import PageLoader from "../../../../components/PageLoader";
import { 
    obtenerMiPerfil, 
    actualizarMiPerfil, 
    cambiarContrasena,
    type PerfilUsuarioDTO,
    type ActualizarPerfilRequest,
    type CambiarContrasenaRequest
} from "../../../../api/auth";
import { 
    obtenerMiHistorial,
    type PrestamoDTO 
} from "../../../../api/prestamos";
import { 
    obtenerMisMultas, 
    obtenerMiResumenMultas,
    type Multa,
    type ResumenMultasDTO
} from "../../../../api/multas";

interface Usuario {
    usuarioID: number;
    nombre: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: string;
}

interface PerfilProps {
    usuario: Usuario;
}

const Perfil: React.FC<PerfilProps> = ({ usuario }) => {
    // SEO
    useSEO(SEOConfigs.perfil);
    
    const { logout } = useAuth();
    const { goBack } = useNavigation();
    
    const handleLogout = async () => {
        await logout();
    };
    
    const handleBack = () => {
        goBack();
    };
    // Estado del perfil
    const [perfilCompleto, setPerfilCompleto] = useState<PerfilUsuarioDTO | null>(null);
    const [prestamos, setPrestamos] = useState<PrestamoDTO[]>([]);
    const [multas, setMultas] = useState<Multa[]>([]);
    const [resumenMultas, setResumenMultas] = useState<ResumenMultasDTO | null>(null);
    
    // Estado de carga y UI
    const [cargando, setCargando] = useState(true);
    const [editando, setEditando] = useState(false);
    const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    
    // Estado de formularios
    const [formData, setFormData] = useState({
        nombre: '',
        emailInstitucional: '',
        codigoUniversitario: ''
    });
    
    const [contrasenaData, setContrasenaData] = useState({
        contrasenaActual: "",
        nuevaContrasena: "",
        confirmarContrasena: ""
    });
    
    // Estado de modales
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mensajeModal, setMensajeModal] = useState("");
    const [tipoModal, setTipoModal] = useState<"success" | "error">("success");
    
    // Estado de navegación
    const [seccionActiva, setSeccionActiva] = useState("personal");

    // Cargar datos del perfil
    const cargarDatosPerfil = async () => {
        try {
            setCargando(true);
            const errores: string[] = [];

            // Cargar perfil completo
            try {
                const perfil = await obtenerMiPerfil();
                console.log('✅ Perfil cargado:', perfil);
                setPerfilCompleto(perfil);
                setFormData({
                    nombre: perfil.nombre,
                    emailInstitucional: perfil.emailInstitucional,
                    codigoUniversitario: perfil.codigoUniversitario
                });
                console.log('✅ FormData actualizado:', {
                    nombre: perfil.nombre,
                    emailInstitucional: perfil.emailInstitucional,
                    codigoUniversitario: perfil.codigoUniversitario
                });
            } catch (error) {
                console.error('❌ Error cargando perfil:', error);
                errores.push('No se pudo cargar el perfil completo');
            }

            // Cargar historial de préstamos
            try {
                const historial = await obtenerMiHistorial();
                setPrestamos(historial);
            } catch (error) {
                console.error('❌ Error cargando historial:', error);
                errores.push('No se pudo cargar el historial de préstamos');
            }

            // Cargar multas
            try {
                const multasData = await obtenerMisMultas();
                setMultas(multasData);
            } catch (error) {
                console.error('❌ Error cargando multas:', error);
                errores.push('No se pudo cargar las multas');
            }

            // Cargar resumen de multas
            try {
                const resumen = await obtenerMiResumenMultas();
                setResumenMultas(resumen);
            } catch (error) {
                console.error('❌ Error cargando resumen de multas:', error);
                errores.push('No se pudo cargar el resumen de multas');
            }

            // Solo mostrar modal si falla el servicio crítico (perfil básico)
            if (errores.length > 0) {
                console.warn('⚠️ Algunos servicios opcionales no están disponibles:', errores);
                // No mostrar modal para servicios opcionales, solo loggear
                // El perfil se carga parcialmente con los datos disponibles
            } else {
                console.log('✅ Todos los datos del perfil cargados correctamente');
            }
            
            console.log('📊 Estado final:', {
                perfilCompleto: perfilCompleto ? 'Cargado' : 'No cargado',
                prestamos: prestamos.length,
                multas: multas.length,
                resumenMultas: resumenMultas ? 'Cargado' : 'No cargado'
            });

        } catch (error) {
            console.error('❌ Error crítico cargando perfil:', error);
            setMensajeModal("Error crítico al cargar el perfil. Por favor, recarga la página.");
            setTipoModal("error");
            setMostrarModal(true);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatosPerfil();
    }, []);

    // Actualizar formData cuando perfilCompleto se cargue
    useEffect(() => {
        if (perfilCompleto) {
            setFormData({
                nombre: perfilCompleto.nombre,
                emailInstitucional: perfilCompleto.emailInstitucional,
                codigoUniversitario: perfilCompleto.codigoUniversitario
            });
        }
    }, [perfilCompleto]);

    // Funciones de edición
    const handleEditarPerfil = () => {
        setEditando(true);
    };

    const handleCancelarEdicion = () => {
        setEditando(false);
        if (perfilCompleto) {
            setFormData({
                nombre: perfilCompleto.nombre,
                emailInstitucional: perfilCompleto.emailInstitucional,
                codigoUniversitario: perfilCompleto.codigoUniversitario
            });
        }
    };

    const handleGuardarPerfil = async () => {
        try {
            const request: ActualizarPerfilRequest = {
                    nombre: formData.nombre,
                emailInstitucional: formData.emailInstitucional
            };

            await actualizarMiPerfil(request);
            
            // Actualizar usuario en localStorage
            const usuarioActualizado = { ...usuario, ...formData };
            localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
            
            setEditando(false);
                setMensajeModal("Perfil actualizado correctamente");
                setTipoModal("success");
                setMostrarModal(true);
            
            // Recargar datos
            await cargarDatosPerfil();
        } catch (error: unknown) {
            console.error('Error actualizando perfil:', error);
            const errorMessage = error instanceof Error && 'response' in error 
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
                : "Error al actualizar el perfil";
            setMensajeModal(errorMessage || "Error al actualizar el perfil");
            setTipoModal("error");
            setMostrarModal(true);
        }
    };

    const handleCambiarContrasena = async () => {
        if (contrasenaData.nuevaContrasena !== contrasenaData.confirmarContrasena) {
            setMensajeModal("Las contraseñas no coinciden");
            setTipoModal("error");
            setMostrarModal(true);
            return;
        }

        try {
            const request: CambiarContrasenaRequest = {
                contrasenaActual: contrasenaData.contrasenaActual,
                nuevaContrasena: contrasenaData.nuevaContrasena,
                confirmarContrasena: contrasenaData.confirmarContrasena
            };

            await cambiarContrasena(request);
            
            setCambiandoContrasena(false);
            setContrasenaData({
                contrasenaActual: "",
                nuevaContrasena: "",
                confirmarContrasena: ""
            });
            
            setMensajeModal("Contraseña cambiada correctamente");
            setTipoModal("success");
            setMostrarModal(true);
        } catch (error: unknown) {
            console.error('Error cambiando contraseña:', error);
            const errorMessage = error instanceof Error && 'response' in error 
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
                : "Error al cambiar la contraseña";
            setMensajeModal(errorMessage || "Error al cambiar la contraseña");
            setTipoModal("error");
            setMostrarModal(true);
        }
    };

    // Estadísticas calculadas
    const estadisticas = {
        prestamosActivos: prestamos.filter(p => p.estadoCalculado === 'Prestado').length,
        prestamosAtrasados: prestamos.filter(p => p.estadoCalculado === 'Atrasado').length,
        multasPendientes: resumenMultas?.multasPendientes || 0,
        totalPrestamos: prestamos.length
    };

    // Formatear fecha
    const formatearFecha = (fecha: string | Date) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Secciones de navegación
    const secciones = [
        { id: "personal", nombre: "Información Personal", icono: User },
        { id: "prestamos", nombre: "Mis Préstamos", icono: BookOpen },
        { id: "multas", nombre: "Mis Multas", icono: AlertTriangle },
        { id: "estadisticas", nombre: "Estadísticas", icono: TrendingUp },
        { id: "informacion", nombre: "Información", icono: Settings }
    ];

    if (cargando) {
        return <PageLoader type="profile" message="Cargando tu perfil personalizado..." />;
    }

    return (
        <div className="page-content">
            {/* Barra superior de navegación */}
            <div className="perfil-top-nav">
                <button 
                    className="btn-back"
                    onClick={() => {
                        console.log('🔄 Botón Volver clickeado');
                        handleBack();
                    }}
                >
                    <ArrowLeft size={18} />
                    Volver
                </button>
                <div className="breadcrumb">
                    <span>Inicio</span>
                    <span className="breadcrumb-separator">&gt;</span>
                    <span className="breadcrumb-current">Perfil</span>
                </div>
            </div>

            {/* Header Mejorado */}
            <div className="perfil-header">
                <div className="header-left">
                    <div className="header-info">
                        <h1>Mi Perfil</h1>
                        <p>Gestiona tu información y revisa tu actividad</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn btn--secondary" onClick={() => setSeccionActiva("personal")}>
                        <Settings size={18} />
                        Configurar
                    </button>
                    <button className="btn btn--danger" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Línea divisoria */}
            <div className="header-divider"></div>

            {/* Avatar y Información Principal */}
            <div className="perfil-hero">
                <div className="avatar-section">
                    <div className="avatar-container">
                    <div className="avatar">
                        <User size={40} />
                        </div>
                        <div className="avatar-overlay">
                            <span>Cambiar imagen</span>
                        </div>
                    </div>
                    <div className="user-info">
                        <h2>{perfilCompleto?.nombre || 'Cargando...'}</h2>
                        <p className="user-role">{perfilCompleto?.rol || 'Cargando...'}</p>
                        <p className="user-code">{perfilCompleto?.codigoUniversitario || 'Cargando...'}</p>
                    </div>
                </div>
                <div className="quick-stats">
                    <div className="quick-stat">
                        <BookOpen size={20} />
                        <span>{estadisticas.prestamosActivos} Activos</span>
                    </div>
                    <div className="quick-stat">
                        <Clock size={20} />
                        <span>{estadisticas.prestamosAtrasados} Atrasados</span>
                    </div>
                    <div className="quick-stat">
                            <AlertTriangle size={20} />
                            <span>{estadisticas.multasPendientes} Multas</span>
                        </div>
                </div>
            </div>

            {/* Navegación */}
            <div className="perfil-navigation">
                {secciones.map((seccion) => {
                    const IconComponent = seccion.icono;
                    return (
                        <button
                            key={seccion.id}
                            className={`nav-button ${seccionActiva === seccion.id ? 'active' : ''}`}
                            onClick={() => setSeccionActiva(seccion.id)}
                        >
                            <IconComponent size={18} />
                            {seccion.nombre}
                        </button>
                    );
                })}
            </div>

            <div className="perfil-content">
                {/* Información Personal */}
                {seccionActiva === "personal" && (
                    <div className="perfil-section">
                        <div className="section-header">
                            <h2>Información Personal</h2>
                            {!editando ? (
                                <button className="btn btn--primary" onClick={handleEditarPerfil}>
                                    <Settings size={18} />
                                    Editar
                                </button>
                            ) : (
                                <div className="edit-buttons">
                                    <button className="btn btn--success" onClick={handleGuardarPerfil}>
                                        Guardar
                                    </button>
                                    <button className="btn btn--secondary" onClick={handleCancelarEdicion}>
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Contenedor de dos columnas */}
                        <div className="personal-info-container">
                            {/* Columna izquierda: Datos personales */}
                            <div className="personal-data-column">
                                <div className="perfil-info">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Nombre Completo:</label>
                                            {editando ? (
                                                <input
                                                    type="text"
                                                    value={formData.nombre}
                                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                <span>{perfilCompleto?.nombre || 'Cargando...'}</span>
                                            )}
                                        </div>

                                        <div className="info-item">
                                            <label>Email Institucional:</label>
                                            {editando ? (
                                                <input
                                                    type="email"
                                                    value={formData.emailInstitucional}
                                                    onChange={(e) => setFormData({...formData, emailInstitucional: e.target.value})}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                <span>{perfilCompleto?.emailInstitucional || 'Cargando...'}</span>
                                            )}
                                        </div>

                                        <div className="info-item">
                                            <label>Código Universitario:</label>
                                            {editando ? (
                                                <input
                                                    type="text"
                                                    value={formData.codigoUniversitario}
                                                    onChange={(e) => setFormData({...formData, codigoUniversitario: e.target.value})}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                <span>{perfilCompleto?.codigoUniversitario || 'Cargando...'}</span>
                                            )}
                                        </div>

                                        <div className="info-item">
                                            <label>Fecha de Registro:</label>
                                            <span>{perfilCompleto ? formatearFecha(perfilCompleto.fechaRegistro) : 'Cargando...'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna derecha: Seguridad */}
                            <div className="security-column">
                                <div className="security-section">
                            <div className="section-header">
                                <h2>Seguridad</h2>
                            </div>
                            <div className="security-content">
                                {!cambiandoContrasena ? (
                                    <div className="security-info">
                                        <div className="security-icon">
                                            <Lock size={24} />
                                        </div>
                                        <div className="security-text">
                                            <h4>Contraseña</h4>
                                            <p>Última actualización: {perfilCompleto ? formatearFecha(perfilCompleto.fechaUltimaActualizacionContrasena) : 'Cargando...'}</p>
                                        </div>
                                        <button 
                                            className="btn btn--primary security-btn" 
                                            onClick={() => setCambiandoContrasena(true)}
                                        >
                                            <Lock size={18} />
                                            Cambiar Contraseña
                                        </button>
                                    </div>
                                ) : (
                                    <div className="password-form">
                                        <div className="edit-buttons">
                                            <button className="btn btn--success" onClick={handleCambiarContrasena}>
                                                Guardar
                                            </button>
                                            <button 
                                                className="btn btn--secondary" 
                                                onClick={() => {
                                                    setCambiandoContrasena(false);
                                                    setContrasenaData({
                                                        contrasenaActual: "",
                                                        nuevaContrasena: "",
                                                        confirmarContrasena: ""
                                                    });
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                        
                                        {cambiandoContrasena && (
                                            <div className="password-form">
                                                <div className="info-item">
                                                    <label>Contraseña Actual:</label>
                                                    <div className="password-input-container">
                                                        <input
                                                            type={mostrarContrasena ? "text" : "password"}
                                                            value={contrasenaData.contrasenaActual}
                                                            onChange={(e) => setContrasenaData({...contrasenaData, contrasenaActual: e.target.value})}
                                                            className="edit-input"
                                                            placeholder="Ingresa tu contraseña actual"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="password-toggle"
                                                            onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                                        >
                                                            {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="info-item">
                                                    <label>Nueva Contraseña:</label>
                                                    <input
                                                        type="password"
                                                        value={contrasenaData.nuevaContrasena}
                                                        onChange={(e) => setContrasenaData({...contrasenaData, nuevaContrasena: e.target.value})}
                                                        className="edit-input"
                                                        placeholder="Ingresa tu nueva contraseña"
                                                    />
                                                </div>

                                                <div className="info-item">
                                                    <label>Confirmar Contraseña:</label>
                                                    <input
                                                        type="password"
                                                        value={contrasenaData.confirmarContrasena}
                                                        onChange={(e) => setContrasenaData({...contrasenaData, confirmarContrasena: e.target.value})}
                                                        className="edit-input"
                                                        placeholder="Confirma tu nueva contraseña"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                )}

                {/* Historial de Préstamos */}
                {seccionActiva === "prestamos" && (
                    <div className="perfil-section">
                        <div className="section-header">
                            <h2>Historial de Préstamos</h2>
                        </div>
                        
                        <div className="prestamos-container">
                            {prestamos.length > 0 ? (
                                <div className="prestamos-grid">
                                    {prestamos.map((prestamo) => (
                                        <div key={prestamo.prestamoID} className="prestamo-card">
                                            <div className="prestamo-header">
                                                <h3>{prestamo.libroTitulo}</h3>
                                                <span className={`estado-badge ${prestamo.estadoCalculado.toLowerCase()}`}>
                                                    {prestamo.estadoCalculado}
                                                </span>
                                            </div>
                                            <div className="prestamo-details">
                                                <p><strong>ISBN:</strong> {prestamo.libroISBN}</p>
                                                <p><strong>Ejemplar:</strong> {prestamo.numeroEjemplar}</p>
                                                <p><strong>Código:</strong> {prestamo.codigoBarras}</p>
                                                <p><strong>Fecha Préstamo:</strong> {formatearFecha(prestamo.fechaPrestamo)}</p>
                                                <p><strong>Fecha Vencimiento:</strong> {formatearFecha(prestamo.fechaVencimiento)}</p>
                                                {prestamo.fechaDevolucion && (
                                                    <p><strong>Fecha Devolución:</strong> {formatearFecha(prestamo.fechaDevolucion)}</p>
                                                )}
                                                {prestamo.diasAtraso && (
                                                    <p><strong>Días de Atraso:</strong> {prestamo.diasAtraso}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="service-unavailable">
                                    <p>No hay préstamos registrados</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mis Multas */}
                {seccionActiva === "multas" && (
                    <div className="perfil-section">
                        <div className="section-header">
                            <h2>Mis Multas</h2>
                        </div>
                        
                        {resumenMultas ? (
                            <div className="multas-summary">
                                <div className="resumen-multas">
                                    <div className="resumen-item">
                                        <span className="resumen-label">Total Multas:</span>
                                        <span className="resumen-value">{resumenMultas.totalMultas}</span>
                                    </div>
                                    <div className="resumen-item">
                                        <span className="resumen-label">Pendientes:</span>
                                        <span className="resumen-value">{resumenMultas.multasPendientes}</span>
                                    </div>
                                    <div className="resumen-item">
                                        <span className="resumen-label">Pagadas:</span>
                                        <span className="resumen-value">{resumenMultas.multasPagadas}</span>
                                    </div>
                                    <div className="resumen-item">
                                        <span className="resumen-label">Monto Pendiente:</span>
                                        <span className="resumen-value">S/ {resumenMultas.montoTotalPendiente.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="service-unavailable">
                                <p>Servicio no disponible</p>
                            </div>
                        )}
                        
                        <div className="multas-container">
                            {multas.length > 0 ? (
                                <div className="multas-grid">
                                    {multas.map((multa) => (
                                        <div key={multa.multaID} className="multa-card">
                                            <div className="multa-header">
                                                <h3>Multa #{multa.multaID}</h3>
                                                <span className={`estado-badge ${multa.estado.toLowerCase()}`}>
                                                    {multa.estado}
                                                </span>
                                                    </div>
                                            <div className="multa-details">
                                                <p><strong>Monto:</strong> S/ {multa.monto.toFixed(2)}</p>
                                                <p><strong>Motivo:</strong> {multa.motivo || 'No especificado'}</p>
                                                {multa.diasAtraso && (
                                                    <p><strong>Días de Atraso:</strong> {multa.diasAtraso}</p>
                                                )}
                                                {multa.fechaCobro && (
                                                    <p><strong>Fecha de Pago:</strong> {formatearFecha(multa.fechaCobro)}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="service-unavailable">
                                    <p>No hay multas registradas</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Estadísticas */}
                {seccionActiva === "estadisticas" && (
                    <div className="perfil-section">
                        <div className="section-header">
                            <h2>Estadísticas</h2>
                        </div>
                        
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <BookOpen size={24} />
                                </div>
                                <div className="stat-content">
                                    <h3>{perfilCompleto?.totalPrestamos || 0}</h3>
                                    <p>Total Préstamos</p>
                                    <span className="stat-trend">+{prestamos.filter(p => p.estadoCalculado === 'Devuelto').length} completados</span>
                                </div>
                            </div>
                            
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Clock size={24} />
                                </div>
                                <div className="stat-content">
                                    <h3>{estadisticas.prestamosActivos}</h3>
                                    <p>Préstamos Activos</p>
                                    <span className="stat-trend">En curso</span>
                                </div>
                            </div>
                            
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="stat-content">
                                    <h3>{estadisticas.prestamosAtrasados}</h3>
                                    <p>Préstamos Atrasados</p>
                                    <span className="stat-trend">Requieren atención</span>
                                </div>
                            </div>
                            
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <Award size={24} />
                                </div>
                                <div className="stat-content">
                                    <h3>{resumenMultas?.multasPendientes || 0}</h3>
                                    <p>Multas Pendientes</p>
                                    <span className="stat-trend">S/ {resumenMultas?.montoTotalPendiente.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información Adicional */}
                {seccionActiva === "informacion" && (
                    <div className="perfil-section">
                        <div className="section-header">
                            <h2>Información del Sistema</h2>
                        </div>
                        
                        <div className="info-grid">
                            <div className="info-card">
                                <h3>Estado de la Cuenta</h3>
                                <p>Tu cuenta está activa y en buen estado</p>
                            </div>
                            
                            <div className="info-card">
                                <h3>Última Actividad</h3>
                                <p>Hace 2 horas</p>
                            </div>
                            
                            <div className="info-card">
                                <h3>Configuración</h3>
                                <p>Configuración por defecto aplicada</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Mensajes */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className={`modal-container ${tipoModal === "success" ? "modal-success" : "modal-error"}`}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {tipoModal === "success" ? "¡Éxito!" : "Error"}
                            </h3>
                        </div>
                        <div className="modal-body">
                                <p>{mensajeModal}</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className={`btn ${tipoModal === "success" ? "btn--success" : "btn--danger"}`}
                                onClick={() => setMostrarModal(false)}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Perfil;
