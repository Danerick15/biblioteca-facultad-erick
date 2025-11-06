import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./Register.css";
import { registrarUsuario } from "../../../../api/auth";

// Tipos para el modal
interface ModalConfig {
    titulo: string;
    icono: string;
    mensaje: string;
    tipo: "success" | "error" | "warning";
    botonTexto: string;
    onCerrar: () => void;
    onBotonClick?: () => void;
}

// Función para obtener etiquetas amigables de los campos
const getFieldLabel = (campo: string): string => {
    const labels: {[key: string]: string} = {
        codigoUniversitario: "Código Universitario",
        nombre: "Nombre Completo",
        emailInstitucional: "Email Institucional",
        contrasena: "Contraseña",
        confirmarContrasena: "Confirmar Contraseña",
        rol: "Rol"
    };
    return labels[campo] || campo;
};

// Componente Campo de Formulario reutilizable
const FormField = ({ 
    id, 
    name, 
    type = "text", 
    placeholder, 
    value, 
    onChange, 
    hasError,
    children 
}: {
    id: string;
    name: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    hasError: boolean;
    children?: React.ReactNode;
}) => (
    <div className="registro-form-group">
        <label htmlFor={id}>{getFieldLabel(name)}</label>
        <div className="registro-input">
            {children || (
                <input
                    type={type}
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={hasError ? "error" : ""}
                />
            )}
        </div>
    </div>
);

// Componente Modal reutilizable
const Modal = ({ config }: { config: ModalConfig }) => (
    <div className="registro-modal-overlay">
        <div className="registro-modal-container">
            <div className="registro-modal-header">
                <h3 className="registro-modal-title">{config.titulo}</h3>
                <button 
                    className="registro-modal-close-button"
                    onClick={config.onCerrar}
                >
                    ×
                </button>
            </div>
            <div className="registro-modal-content">
                <div className={`registro-modal-icon ${config.tipo}`}>{config.icono}</div>
                <div className="registro-modal-message">
                    <p dangerouslySetInnerHTML={{ __html: config.mensaje }} />
                </div>
            </div>
            <div className="registro-modal-footer">
                <button 
                    className={`registro-modal-button ${config.tipo === "success" ? "success" : config.tipo === "error" ? "danger" : "warning"}`}
                    onClick={config.onBotonClick || config.onCerrar}
                >
                    {config.botonTexto}
                </button>
            </div>
        </div>
    </div>
);


const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        codigoUniversitario: "",
        nombre: "",
        emailInstitucional: "",
        contrasena: "",
        confirmarContrasena: "",
        rol: "Estudiante"
    });
    
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
    const [errores, setErrores] = useState<{[key: string]: string}>({});
    const [cargando, setCargando] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrores: {[key: string]: string} = {};

        // Validar código universitario
        if (!formData.codigoUniversitario.trim()) {
            nuevosErrores.codigoUniversitario = "El código universitario es requerido";
        } else if (!/^\d{8}$/.test(formData.codigoUniversitario)) {
            nuevosErrores.codigoUniversitario = "Formato: 8 dígitos numéricos (ej: 22200196)";
        }

        // Validar nombre
        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = "El nombre es requerido";
        } else if (formData.nombre.trim().length < 2) {
            nuevosErrores.nombre = "El nombre debe tener al menos 2 caracteres";
        }

        // Validar email institucional
        if (!formData.emailInstitucional.trim()) {
            nuevosErrores.emailInstitucional = "El email institucional es requerido";
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.emailInstitucional)) {
            nuevosErrores.emailInstitucional = "Formato de email inválido";
        } else if (!formData.emailInstitucional.includes("@unmsm.edu.pe")) {
            nuevosErrores.emailInstitucional = "Debe ser un email institucional (@unmsm.edu.pe)";
        }

        // Validar contraseña
        if (!formData.contrasena) {
            nuevosErrores.contrasena = "La contraseña es requerida";
        } else if (formData.contrasena.length < 6) {
            nuevosErrores.contrasena = "La contraseña debe tener al menos 6 caracteres";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.contrasena)) {
            nuevosErrores.contrasena = "Debe contener al menos: 1 mayúscula, 1 minúscula y 1 número";
        }

        // Validar confirmación de contraseña
        if (!formData.confirmarContrasena) {
            nuevosErrores.confirmarContrasena = "Confirma tu contraseña";
        } else if (formData.contrasena !== formData.confirmarContrasena) {
            nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
        }

        setErrores(nuevosErrores);
        
        // Si hay errores, mostrar modal
        if (Object.keys(nuevosErrores).length > 0) {
            const erroresLista = Object.entries(nuevosErrores)
                .map(([campo, error]) => `<strong>${getFieldLabel(campo)}:</strong> ${error}`)
                .join('<br>');
            
            setModalConfig({
                titulo: "⚠️ Errores de Validación",
                icono: "⚠️",
                mensaje: `Por favor corrige los siguientes errores:<br><br>${erroresLista}`,
                tipo: "warning",
                botonTexto: "Entendido",
                onCerrar: () => setModalConfig(null)
            });
        }
        
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        setCargando(true);

        try {
            const data = await registrarUsuario(formData);
            setModalConfig({
                titulo: "¡Registro Exitoso!",
                icono: "✅",
                mensaje: `¡Registro exitoso! ${data.mensaje} Ahora puedes iniciar sesión con tus credenciales.`,
                tipo: "success",
                botonTexto: "Ir a Login",
                onCerrar: () => setModalConfig(null),
                onBotonClick: () => navigate('/login')
            });

        } catch (err: unknown) {
            console.error('Error en registro:', err);
            
            let mensajeError = "Error de conexión. Verifica tu conexión o contacta al administrador";
            let tituloError = "Error en el Registro";
            
            // Verificar si es un error de Axios
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { 
                    response?: { 
                        status?: number; 
                        data?: { mensaje?: string; error?: string } 
                    };
                    message?: string;
                    code?: string;
                };
                
                // Error con respuesta del servidor
                if (axiosError.response) {
                    const status = axiosError.response.status;
                    const data = axiosError.response.data;
                    
                    if (status === 400) {
                        tituloError = "Error de Validación";
                        mensajeError = data?.mensaje || data?.error || "Error en los datos ingresados. Verifica la información e intenta nuevamente.";
                    } else if (status === 409) {
                        tituloError = "Usuario ya Existe";
                        mensajeError = data?.mensaje || "El email o código universitario ya está registrado.";
                    } else if (status === 500) {
                        tituloError = "Error del Servidor";
                        mensajeError = data?.mensaje || "Error interno del servidor. Por favor, intenta más tarde o contacta al administrador.";
                    } else {
                        tituloError = "Error del Servidor";
                        mensajeError = data?.mensaje || `Error ${status}: No se pudo completar el registro.`;
                    }
                } else {
                    // Error de red (sin respuesta del servidor)
                    if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
                        tituloError = "Tiempo de Espera Agotado";
                        mensajeError = "El servidor tardó demasiado en responder. Verifica tu conexión a internet.";
                    } else if (axiosError.message?.includes('Network Error') || axiosError.code === 'ERR_NETWORK') {
                        tituloError = "Error de Conexión";
                        mensajeError = "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:5180";
                    } else {
                        tituloError = "Error de Conexión";
                        mensajeError = axiosError.message || "No se pudo conectar con el servidor. Verifica tu conexión o contacta al administrador.";
                    }
                }
            } else if (err && typeof err === 'object' && 'message' in err) {
                // Error genérico con mensaje
                mensajeError = (err as { message: string }).message;
            }
            
            setModalConfig({
                titulo: tituloError,
                icono: "❌",
                mensaje: mensajeError,
                tipo: "error",
                botonTexto: "Entendido",
                onCerrar: () => setModalConfig(null)
            });
        } finally {
            setCargando(false);
        }
    };


    return (
        <div className="registro-page registro-container">
            <main className="registro-main">
                <section className="hero-section">
                    <div className="hero-content">
                        <h1>Únete a la Biblioteca FISI</h1>
                        <p>Accede a miles de recursos académicos y gestiona tus préstamos de manera digital</p>
                        
                        <div className="features">
                            <div className="feature">
                                <div className="feature-icon">📚</div>
                                <span>Catálogo completo</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">🔍</div>
                                <span>Búsqueda avanzada</span>
                            </div>
                            <div className="feature">
                                <div className="feature-icon">📱</div>
                                <span>Acceso móvil</span>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="registro-card animate-slide-up">
                    <div className="registro-card-header">
                        <h2>Crear cuenta</h2>
                        <p>Completa tus datos para registrarte</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="registro-form-grid">
                            {/* Columna Izquierda */}
                            <div className="registro-form-column">
                                <FormField
                                    id="codigoUniversitario"
                                    name="codigoUniversitario"
                                    type="text"
                                    placeholder="22300156"
                                    value={formData.codigoUniversitario}
                                    onChange={handleInputChange}
                                    hasError={!!errores.codigoUniversitario}
                                />

                                <FormField
                                    id="emailInstitucional"
                                    name="emailInstitucional"
                                    type="email"
                                    placeholder="ejemplo@unmsm.edu.pe"
                                    value={formData.emailInstitucional}
                                    onChange={handleInputChange}
                                    hasError={!!errores.emailInstitucional}
                                />

                                <FormField
                                    id="contrasena"
                                    name="contrasena"
                                    type={mostrarPassword ? "text" : "password"}
                                    placeholder="Tu contraseña"
                                    value={formData.contrasena}
                                    onChange={handleInputChange}
                                    hasError={!!errores.contrasena}
                                >
                                    <div className="registro-input-password">
                                        <input
                                            type={mostrarPassword ? "text" : "password"}
                                            id="contrasena"
                                            name="contrasena"
                                            placeholder="Tu contraseña"
                                            value={formData.contrasena}
                                            onChange={handleInputChange}
                                            className={errores.contrasena ? "error" : ""}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-button"
                                            onClick={() => setMostrarPassword(!mostrarPassword)}
                                            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            {mostrarPassword ? (
                                                <EyeOff size={18} color="#6b7280" />
                                            ) : (
                                                <Eye size={18} color="#6b7280" />
                                            )}
                                        </button>
                                    </div>
                                </FormField>
                            </div>

                            {/* Columna Derecha */}
                            <div className="registro-form-column">
                                <FormField
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    placeholder="Juan Alvarez Pérez Gomez"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    hasError={!!errores.nombre}
                                />

                                <FormField
                                    id="rol"
                                    name="rol"
                                    placeholder=""
                                    value={formData.rol}
                                    onChange={handleInputChange}
                                    hasError={!!errores.rol}
                                >
                                    <select
                                        id="rol"
                                        name="rol"
                                        value={formData.rol}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Estudiante">Estudiante</option>
                                        <option value="Profesor">Profesor</option>
                                    </select>
                                </FormField>

                                <FormField
                                    id="confirmarContrasena"
                                    name="confirmarContrasena"
                                    type={mostrarConfirmarPassword ? "text" : "password"}
                                    placeholder="Confirma tu contraseña"
                                    value={formData.confirmarContrasena}
                                    onChange={handleInputChange}
                                    hasError={!!errores.confirmarContrasena}
                                >
                                    <div className="registro-input-password">
                                        <input
                                            type={mostrarConfirmarPassword ? "text" : "password"}
                                            id="confirmarContrasena"
                                            name="confirmarContrasena"
                                            placeholder="Confirma tu contraseña"
                                            value={formData.confirmarContrasena}
                                            onChange={handleInputChange}
                                            className={errores.confirmarContrasena ? "error" : ""}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-button"
                                            onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                                            aria-label={mostrarConfirmarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            {mostrarConfirmarPassword ? (
                                                <EyeOff size={18} color="#6b7280" />
                                            ) : (
                                                <Eye size={18} color="#6b7280" />
                                            )}
                                        </button>
                                    </div>
                                </FormField>
                            </div>
                        </div>

                        <button 
                            className="btn btn--primary" 
                            type="submit"
                            disabled={cargando}
                        >
                            {cargando ? "Registrando..." : "Crear cuenta"}
                        </button>

                    </form>

                    <div className="auth-links">
                        <p>¿Ya tienes cuenta?</p>
                        <button 
                            type="button" 
                            className="link-button"
                            onClick={() => navigate('/login')}
                        >
                            Inicia sesión aquí
                        </button>
                    </div>
                </aside>
            </main>

            {/* Modal Reutilizable */}
            {modalConfig && <Modal config={modalConfig} />}
        </div>
    );
};

export default Register;
