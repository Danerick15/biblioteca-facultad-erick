import axios from "axios";

// Configurar axios para enviar cookies siempre
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "/api";

const API_URL = "/Usuarios";

export const loginWithEmail = async (email: string, password: string) => {
    const res = await axios.post(
        `${API_URL}/login`,
        { EmailInstitucional: email, Contrasena: password }
    );
    return res.data;
};

export const verificarSesion = async () => {
    const res = await axios.get(`${API_URL}/verificar-sesion`);
    return res.data;
};

export const logout = async () => {
    const res = await axios.post(
        `${API_URL}/logout`,
        {}
    );
    return res.data;
};

export const registrarUsuario = async (datosRegistro: {
    codigoUniversitario: string;
    nombre: string;
    emailInstitucional: string;
    contrasena: string;
    confirmarContrasena: string;
    rol: string;
}) => {
    // Convertir camelCase a PascalCase para que coincida con el backend
    const datosParaBackend = {
        CodigoUniversitario: datosRegistro.codigoUniversitario,
        Nombre: datosRegistro.nombre,
        EmailInstitucional: datosRegistro.emailInstitucional,
        Contrasena: datosRegistro.contrasena,
        ConfirmarContrasena: datosRegistro.confirmarContrasena,
        Rol: datosRegistro.rol
    };
    
    const res = await axios.post(`${API_URL}/registrar`, datosParaBackend);
    return res.data;
};

// ===== ENDPOINTS DE PERFIL DE USUARIO =====

export interface PerfilUsuarioDTO {
    usuarioID: number;
    codigoUniversitario: string;
    nombre: string;
    emailInstitucional: string;
    rol: string;
    estado: boolean;
    fechaRegistro: string;
    fechaUltimaActualizacionContrasena: string;
    totalPrestamos: number;
    prestamosActivos: number;
    prestamosCompletados: number;
    totalMultas: number;
    multasPendientes: number;
    montoMultasPendientes: number;
}

export interface ActualizarPerfilRequest {
    nombre: string;
    emailInstitucional: string;
}

export interface CambiarContrasenaRequest {
    contrasenaActual: string;
    nuevaContrasena: string;
    confirmarContrasena: string;
}

export const obtenerMiPerfil = async (): Promise<PerfilUsuarioDTO> => {
    const res = await axios.get(`${API_URL}/mi-perfil`);
    return res.data;
};

export const actualizarMiPerfil = async (datos: ActualizarPerfilRequest): Promise<{ mensaje: string }> => {
    const res = await axios.put(`${API_URL}/mi-perfil`, datos);
    return res.data;
};

export const cambiarContrasena = async (datos: CambiarContrasenaRequest): Promise<{ mensaje: string }> => {
    const res = await axios.put(`${API_URL}/cambiar-contrasena`, datos);
    return res.data;
};