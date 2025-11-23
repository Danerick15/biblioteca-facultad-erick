import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import {
    obtenerConfiguracion,
    actualizarConfiguracion,
    resetearConfiguracion,
    validarConfiguracion,
    type ConfiguracionCompleta
} from '../../../../../api/configuracion';
import { useConfiguracion } from '../../../../../contexts/ConfiguracionContext';
import { 
    Settings, 
    Save, 
    RefreshCw, 
    Database,
    Bell,
    Shield,
    BookOpen,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    Globe
} from 'lucide-react';
import './SystemConfig.css';

// La interfaz ConfiguracionCompleta ya está importada desde la API

const SystemConfig: React.FC = () => {
    // SEO
    useSEO({
        title: 'Configuración del Sistema - Biblioteca FISI',
        description: 'Configura parámetros y ajustes del sistema bibliotecario',
        keywords: 'configuración, sistema, ajustes, biblioteca'
    });
    
    const { goBack } = useNavigation();
    const { actualizarConfiguracion: actualizarContexto } = useConfiguracion();
    const [configuracion, setConfiguracion] = useState<ConfiguracionCompleta | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);
    const [seccionActiva, setSeccionActiva] = useState('general');

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            setCargando(true);
            setError(null);
            
            // Cargar configuración real desde la API
            const configuracionReal = await obtenerConfiguracion();
            
            // Asegurar que la sección de reportes existe (para compatibilidad con configuraciones antiguas)
            if (!configuracionReal.reportes) {
                configuracionReal.reportes = {
                    periodoPorDefecto: 6,
                    topNLibros: 10,
                    topNUsuarios: 10,
                    añoPorDefecto: new Date().getFullYear()
                };
            }
            
            // Asegurar que la sección de interfaz existe (para compatibilidad con configuraciones antiguas)
            if (!configuracionReal.interfaz) {
                configuracionReal.interfaz = {
                    tema: 'oscuro',
                    elementosPorPagina: 20,
                    mostrarImagenes: true,
                    animaciones: true
                };
            }
            
            setConfiguracion(configuracionReal);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al cargar la configuración');
            console.error('Error al cargar configuración:', err);
        } finally {
            setCargando(false);
        }
    };

    const guardarConfiguracion = async () => {
        if (!configuracion) return;

        try {
            setGuardando(true);
            setError(null);
            setExito(null);
            
            // Validar configuración antes de guardar
            const validacion = await validarConfiguracion(configuracion);
            if (!validacion.esValida) {
                setError(`Configuración inválida: ${validacion.errores.join(', ')}`);
                return;
            }
            
            // Guardar configuración en el backend
            await actualizarConfiguracion(configuracion);
            
            // Actualizar el contexto de configuración para aplicar cambios inmediatamente
            await actualizarContexto();
            
            setExito('Configuración guardada exitosamente');
            console.log('Configuración guardada:', configuracion);
            
            // Limpiar mensaje de éxito después de 3 segundos
            setTimeout(() => setExito(null), 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al guardar la configuración');
            console.error('Error al guardar configuración:', err);
        } finally {
            setGuardando(false);
        }
    };

    // Pedir confirmación antes de guardar los cambios
    const confirmarYGuardar = async () => {
        if (!configuracion) return;
        const confirmar = window.confirm('¿Desea guardar los cambios de configuración?');
        if (!confirmar) return;
        await guardarConfiguracion();
    };

    const manejarCambio = (seccion: keyof ConfiguracionCompleta, campo: string, valor: string | number | boolean) => {
        if (!configuracion) return;
        
        setConfiguracion(prev => ({
            ...prev!,
            [seccion]: {
                ...prev![seccion],
                [campo]: valor
            }
        }));
    };

    const manejarResetearConfiguracion = async () => {
        if (!window.confirm('¿Estás seguro de que deseas resetear la configuración a los valores por defecto?')) return;

        try {
            setGuardando(true);
            setError(null);

            await resetearConfiguracion();
            await cargarConfiguracion();

            setExito('Configuración reseteada a valores por defecto');
            setTimeout(() => setExito(null), 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al resetear la configuración');
            console.error('Error al resetear configuración:', err);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <PageLoader />;
    }

    if (error && !configuracion) {
        return (
            <div className="page-content">
                <div className="error-state">
                    <h2>Error al cargar configuración</h2>
                    <p>{error}</p>
                    <button onClick={cargarConfiguracion} className="btn-primary">
                        <RefreshCw size={20} />
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!configuracion) {
        return (
            <div className="page-content">
                <div className="empty-state">
                    <h2>No hay configuración disponible</h2>
                    <p>No se pudo cargar la configuración del sistema</p>
                </div>
            </div>
        );
    }

    // Asegurar que la sección de reportes existe antes de renderizar
    if (!configuracion.reportes) {
        configuracion.reportes = {
            periodoPorDefecto: 6,
            topNLibros: 10,
            topNUsuarios: 10,
            añoPorDefecto: new Date().getFullYear()
        };
    }

    // Asegurar que la sección de interfaz existe antes de renderizar
    if (!configuracion.interfaz) {
        configuracion.interfaz = {
            tema: 'oscuro',
            elementosPorPagina: 20,
            mostrarImagenes: true,
            animaciones: true
        };
    }

    const secciones = [
        { id: 'general', nombre: 'General', icono: Settings },
        { id: 'prestamos', nombre: 'Préstamos', icono: BookOpen },
        { id: 'multas', nombre: 'Multas', icono: AlertTriangle },
        { id: 'notificaciones', nombre: 'Notificaciones', icono: Bell },
        { id: 'seguridad', nombre: 'Seguridad', icono: Shield },
        { id: 'respaldo', nombre: 'Respaldo', icono: Database },
        { id: 'reportes', nombre: 'Reportes', icono: BarChart3 },
        { id: 'interfaz', nombre: 'Interfaz', icono: Globe }
    ];

    return (
        <div className="page-content">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <button className="btn-back" onClick={goBack}>
                        ← Volver
                    </button>
                    <div className="admin-title-section">
                        <h1>Configuración del Sistema</h1>
                        <p>Configura parámetros y ajustes del sistema bibliotecario</p>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="admin-content">
                {/* Mensajes */}
                {error && (
                    <div className="error-message">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                {exito && (
                    <div className="success-message">
                        <CheckCircle size={20} />
                        {exito}
                    </div>
                )}

                <div className="config-container">
                    {/* Navegación lateral */}
                    <div className="config-sidebar">
                        <div className="sidebar-header">
                            <h3>Configuraciones</h3>
                        </div>
                        <nav className="sidebar-nav">
                            {secciones.map((seccion) => {
                                const Icono = seccion.icono;
                                return (
                                    <button
                                        key={seccion.id}
                                        className={`nav-item ${seccionActiva === seccion.id ? 'active' : ''}`}
                                        onClick={() => setSeccionActiva(seccion.id)}
                                    >
                                        <Icono size={20} />
                                        {seccion.nombre}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Contenido de configuración */}
                    <div className="config-content">
                        {/* Acciones arriba */}
                        <div className="config-actions config-actions-top">
                            <button 
                                className="btn-secondary"
                                onClick={manejarResetearConfiguracion}
                                disabled={guardando}
                            >
                                <RefreshCw size={20} />
                                Resetear
                            </button>
                            
                            <button 
                                className="btn-primary"
                                onClick={confirmarYGuardar}
                                disabled={guardando}
                            >
                                {guardando ? (
                                    <>
                                        <RefreshCw size={20} className="spinning" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Guardar Configuración
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="config-section">
                            {/* Sección General */}
                            {seccionActiva === 'general' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <Settings size={24} />
                                        <h2>Configuración General</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="nombreBiblioteca">Nombre de la Biblioteca</label>
                                            <input
                                                type="text"
                                                id="nombreBiblioteca"
                                                value={configuracion.general.nombreBiblioteca}
                                                onChange={(e) => manejarCambio('general', 'nombreBiblioteca', e.target.value)}
                                                placeholder="Nombre de la biblioteca"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="direccion">Dirección</label>
                                            <input
                                                type="text"
                                                id="direccion"
                                                value={configuracion.general.direccion}
                                                onChange={(e) => manejarCambio('general', 'direccion', e.target.value)}
                                                placeholder="Dirección completa"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="telefono">Teléfono</label>
                                            <input
                                                type="tel"
                                                id="telefono"
                                                value={configuracion.general.telefono}
                                                onChange={(e) => manejarCambio('general', 'telefono', e.target.value)}
                                                placeholder="Número de teléfono"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={configuracion.general.email}
                                                onChange={(e) => manejarCambio('general', 'email', e.target.value)}
                                                placeholder="Correo electrónico"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="sitioWeb">Sitio Web</label>
                                            <input
                                                type="url"
                                                id="sitioWeb"
                                                value={configuracion.general.sitioWeb}
                                                onChange={(e) => manejarCambio('general', 'sitioWeb', e.target.value)}
                                                placeholder="URL del sitio web"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="moneda">Moneda</label>
                                            <select
                                                id="moneda"
                                                value={configuracion.general.moneda}
                                                onChange={(e) => manejarCambio('general', 'moneda', e.target.value)}
                                            >
                                                <option value="PEN">Soles (PEN)</option>
                                                <option value="USD">Dólares (USD)</option>
                                                <option value="EUR">Euros (EUR)</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="idioma">Idioma</label>
                                            <select
                                                id="idioma"
                                                value={configuracion.general.idioma}
                                                onChange={(e) => manejarCambio('general', 'idioma', e.target.value)}
                                            >
                                                <option value="es">Español</option>
                                                <option value="en">English</option>
                                                <option value="pt">Português</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="zonaHoraria">Zona Horaria</label>
                                            <select
                                                id="zonaHoraria"
                                                value={configuracion.general.zonaHoraria}
                                                onChange={(e) => manejarCambio('general', 'zonaHoraria', e.target.value)}
                                            >
                                                <option value="America/Lima">Lima (GMT-5)</option>
                                                <option value="America/New_York">Nueva York (GMT-5)</option>
                                                <option value="Europe/Madrid">Madrid (GMT+1)</option>
                                                <option value="UTC">UTC (GMT+0)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Préstamos */}
                            {seccionActiva === 'prestamos' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <BookOpen size={24} />
                                        <h2>Configuración de Préstamos</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="diasPrestamoEstudiante">Días de Préstamo - Estudiantes</label>
                                            <input
                                                type="number"
                                                id="diasPrestamoEstudiante"
                                                value={configuracion.prestamos.diasPrestamoEstudiante}
                                                onChange={(e) => manejarCambio('prestamos', 'diasPrestamoEstudiante', parseInt(e.target.value))}
                                                min="1"
                                                max="30"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="diasPrestamoProfesor">Días de Préstamo - Profesores</label>
                                            <input
                                                type="number"
                                                id="diasPrestamoProfesor"
                                                value={configuracion.prestamos.diasPrestamoProfesor}
                                                onChange={(e) => manejarCambio('prestamos', 'diasPrestamoProfesor', parseInt(e.target.value))}
                                                min="1"
                                                max="60"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="maxPrestamosEstudiante">Máximo Préstamos - Estudiantes</label>
                                            <input
                                                type="number"
                                                id="maxPrestamosEstudiante"
                                                value={configuracion.prestamos.maxPrestamosEstudiante}
                                                onChange={(e) => manejarCambio('prestamos', 'maxPrestamosEstudiante', parseInt(e.target.value))}
                                                min="1"
                                                max="10"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="maxPrestamosProfesor">Máximo Préstamos - Profesores</label>
                                            <input
                                                type="number"
                                                id="maxPrestamosProfesor"
                                                value={configuracion.prestamos.maxPrestamosProfesor}
                                                onChange={(e) => manejarCambio('prestamos', 'maxPrestamosProfesor', parseInt(e.target.value))}
                                                min="1"
                                                max="15"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="maxRenovaciones">Máximo Renovaciones</label>
                                            <input
                                                type="number"
                                                id="maxRenovaciones"
                                                value={configuracion.prestamos.maxRenovaciones}
                                                onChange={(e) => manejarCambio('prestamos', 'maxRenovaciones', parseInt(e.target.value))}
                                                min="0"
                                                max="5"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="diasGracia">Días de Gracia</label>
                                            <input
                                                type="number"
                                                id="diasGracia"
                                                value={configuracion.prestamos.diasGracia}
                                                onChange={(e) => manejarCambio('prestamos', 'diasGracia', parseInt(e.target.value))}
                                                min="0"
                                                max="7"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Multas */}
                            {seccionActiva === 'multas' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <AlertTriangle size={24} />
                                        <h2>Configuración de Multas</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="montoMultaPorDia">Monto de Multa por Día</label>
                                            <input
                                                type="number"
                                                id="montoMultaPorDia"
                                                value={configuracion.multas.montoMultaPorDia}
                                                onChange={(e) => manejarCambio('multas', 'montoMultaPorDia', parseFloat(e.target.value))}
                                                min="0"
                                                step="0.01"
                                            />
                                            <span className="input-suffix">{configuracion.general.moneda}</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="multaMaxima">Multa Máxima</label>
                                            <input
                                                type="number"
                                                id="multaMaxima"
                                                value={configuracion.multas.multaMaxima}
                                                onChange={(e) => manejarCambio('multas', 'multaMaxima', parseFloat(e.target.value))}
                                                min="0"
                                                step="0.01"
                                            />
                                            <span className="input-suffix">{configuracion.general.moneda}</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="descuentoMulta">Descuento por Pago Temprano (%)</label>
                                            <input
                                                type="number"
                                                id="descuentoMulta"
                                                value={configuracion.multas.descuentoMulta}
                                                onChange={(e) => manejarCambio('multas', 'descuentoMulta', parseInt(e.target.value))}
                                                min="0"
                                                max="100"
                                            />
                                            <span className="input-suffix">%</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="diasDescuento">Días para Descuento</label>
                                            <input
                                                type="number"
                                                id="diasDescuento"
                                                value={configuracion.multas.diasDescuento}
                                                onChange={(e) => manejarCambio('multas', 'diasDescuento', parseInt(e.target.value))}
                                                min="1"
                                                max="30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Notificaciones */}
                            {seccionActiva === 'notificaciones' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <Bell size={24} />
                                        <h2>Configuración de Notificaciones</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.notificaciones.notificacionesEmail}
                                                    onChange={(e) => manejarCambio('notificaciones', 'notificacionesEmail', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Notificaciones por Email
                                            </label>
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.notificaciones.notificacionesSMS}
                                                    onChange={(e) => manejarCambio('notificaciones', 'notificacionesSMS', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Notificaciones por SMS
                                            </label>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="recordatorioVencimiento">Días de Anticipación - Recordatorio Vencimiento</label>
                                            <input
                                                type="number"
                                                id="recordatorioVencimiento"
                                                value={configuracion.notificaciones.recordatorioVencimiento}
                                                onChange={(e) => manejarCambio('notificaciones', 'recordatorioVencimiento', parseInt(e.target.value))}
                                                min="0"
                                                max="7"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="recordatorioMulta">Días de Anticipación - Recordatorio Multa</label>
                                            <input
                                                type="number"
                                                id="recordatorioMulta"
                                                value={configuracion.notificaciones.recordatorioMulta}
                                                onChange={(e) => manejarCambio('notificaciones', 'recordatorioMulta', parseInt(e.target.value))}
                                                min="0"
                                                max="7"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Seguridad */}
                            {seccionActiva === 'seguridad' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <Shield size={24} />
                                        <h2>Configuración de Seguridad</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="sesionTimeout">Timeout de Sesión (minutos)</label>
                                            <input
                                                type="number"
                                                id="sesionTimeout"
                                                value={configuracion.seguridad.sesionTimeout}
                                                onChange={(e) => manejarCambio('seguridad', 'sesionTimeout', parseInt(e.target.value))}
                                                min="5"
                                                max="480"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="intentosLogin">Intentos de Login Máximos</label>
                                            <input
                                                type="number"
                                                id="intentosLogin"
                                                value={configuracion.seguridad.intentosLogin}
                                                onChange={(e) => manejarCambio('seguridad', 'intentosLogin', parseInt(e.target.value))}
                                                min="3"
                                                max="10"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</label>
                                            <input
                                                type="number"
                                                id="passwordMinLength"
                                                value={configuracion.seguridad.passwordMinLength}
                                                onChange={(e) => manejarCambio('seguridad', 'passwordMinLength', parseInt(e.target.value))}
                                                min="6"
                                                max="20"
                                            />
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.seguridad.requiereMayuscula}
                                                    onChange={(e) => manejarCambio('seguridad', 'requiereMayuscula', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Requerir Mayúscula
                                            </label>
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.seguridad.requiereNumero}
                                                    onChange={(e) => manejarCambio('seguridad', 'requiereNumero', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Requerir Número
                                            </label>
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.seguridad.requiereSimbolo}
                                                    onChange={(e) => manejarCambio('seguridad', 'requiereSimbolo', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Requerir Símbolo
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Respaldo */}
                            {seccionActiva === 'respaldo' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <Database size={24} />
                                        <h2>Configuración de Respaldo</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.respaldo.backupAutomatico}
                                                    onChange={(e) => manejarCambio('respaldo', 'backupAutomatico', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Respaldo Automático
                                            </label>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="frecuenciaBackup">Frecuencia de Respaldo</label>
                                            <select
                                                id="frecuenciaBackup"
                                                value={configuracion.respaldo.frecuenciaBackup}
                                                onChange={(e) => manejarCambio('respaldo', 'frecuenciaBackup', e.target.value)}
                                            >
                                                <option value="diario">Diario</option>
                                                <option value="semanal">Semanal</option>
                                                <option value="mensual">Mensual</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="diasRetencion">Días de Retención</label>
                                            <input
                                                type="number"
                                                id="diasRetencion"
                                                value={configuracion.respaldo.diasRetencion}
                                                onChange={(e) => manejarCambio('respaldo', 'diasRetencion', parseInt(e.target.value))}
                                                min="7"
                                                max="365"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Reportes */}
                            {seccionActiva === 'reportes' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <BarChart3 size={24} />
                                        <h2>Configuración de Reportes</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="periodoPorDefecto">Período por Defecto (meses)</label>
                                            <input
                                                type="number"
                                                id="periodoPorDefecto"
                                                value={configuracion.reportes.periodoPorDefecto}
                                                onChange={(e) => manejarCambio('reportes', 'periodoPorDefecto', parseInt(e.target.value))}
                                                min="1"
                                                max="24"
                                            />
                                            <span className="input-hint">Período de tiempo por defecto para reportes de rendimiento (1-24 meses)</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="topNLibros">Top N Libros</label>
                                            <input
                                                type="number"
                                                id="topNLibros"
                                                value={configuracion.reportes.topNLibros}
                                                onChange={(e) => manejarCambio('reportes', 'topNLibros', parseInt(e.target.value))}
                                                min="5"
                                                max="50"
                                            />
                                            <span className="input-hint">Cantidad de libros a mostrar en el ranking de más prestados (5-50)</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="topNUsuarios">Top N Usuarios</label>
                                            <input
                                                type="number"
                                                id="topNUsuarios"
                                                value={configuracion.reportes.topNUsuarios}
                                                onChange={(e) => manejarCambio('reportes', 'topNUsuarios', parseInt(e.target.value))}
                                                min="5"
                                                max="50"
                                            />
                                            <span className="input-hint">Cantidad de usuarios a mostrar en el ranking de más activos (5-50)</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="añoPorDefecto">Año por Defecto</label>
                                            <input
                                                type="number"
                                                id="añoPorDefecto"
                                                value={configuracion.reportes.añoPorDefecto}
                                                onChange={(e) => manejarCambio('reportes', 'añoPorDefecto', parseInt(e.target.value))}
                                                min="2020"
                                                max={new Date().getFullYear() + 1}
                                            />
                                            <span className="input-hint">Año por defecto para reportes mensuales de préstamos</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección Interfaz */}
                            {seccionActiva === 'interfaz' && (
                                <div className="section-content">
                                    <div className="section-header">
                                        <Globe size={24} />
                                        <h2>Configuración de Interfaz</h2>
                                    </div>
                                    
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="tema">Tema</label>
                                            <select
                                                id="tema"
                                                value={configuracion.interfaz.tema}
                                                onChange={(e) => manejarCambio('interfaz', 'tema', e.target.value)}
                                            >
                                                <option value="claro">Claro</option>
                                                <option value="oscuro">Oscuro</option>
                                                <option value="auto">Automático</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="elementosPorPagina">Elementos por Página</label>
                                            <input
                                                type="number"
                                                id="elementosPorPagina"
                                                value={configuracion.interfaz.elementosPorPagina}
                                                onChange={(e) => manejarCambio('interfaz', 'elementosPorPagina', parseInt(e.target.value))}
                                                min="5"
                                                max="100"
                                            />
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.interfaz.mostrarImagenes}
                                                    onChange={(e) => manejarCambio('interfaz', 'mostrarImagenes', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Mostrar Imágenes
                                            </label>
                                        </div>

                                        <div className="form-group checkbox-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={configuracion.interfaz.animaciones}
                                                    onChange={(e) => manejarCambio('interfaz', 'animaciones', e.target.checked)}
                                                />
                                                <span className="checkmark"></span>
                                                Habilitar Animaciones
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                
            </div>
        </div>
    );
};

export default SystemConfig;
