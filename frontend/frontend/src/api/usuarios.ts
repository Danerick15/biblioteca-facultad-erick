import axios from 'axios';

const API_BASE_URL = 'http://localhost:5180/api';

// Interfaces para los tipos de datos
export interface Usuario {
    usuarioID: number;
    nombre: string;
    apellido?: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: 'Administrador' | 'Profesor' | 'Estudiante';
    estado: 'Activo' | 'Inactivo' | 'Suspendido';
    fechaRegistro: string;
    telefono?: string;
    prestamosActivos?: number;
    prestamosTotales?: number;
    multasPendientes?: number;
    montoMultas?: number;
    ultimoAcceso?: string;
}

export interface UsuarioDetalles extends Omit<Usuario, 'prestamosActivos' | 'prestamosTotales' | 'multasPendientes' | 'montoMultas'> {
    prestamosActivos: number;
    prestamosTotales: number;
    multasPendientes: number;
    montoMultas: number;
}

export interface EstadisticasUsuarios {
    totalUsuarios: number;
    usuariosActivos: number;
    usuariosInactivos: number;
    usuariosSuspendidos: number;
    usuariosPorRol: Array<{ rol: string; cantidad: number }>;
    usuariosRegistradosEsteMes: number;
}

export interface BusquedaUsuariosParams {
    termino?: string;
    rol?: string;
    estado?: string;
    ordenarPor?: string;
    orden?: 'asc' | 'desc';
}

export interface BusquedaUsuariosResultado {
    usuarios: Usuario[];
    total: number;
}

export interface CambiarEstadoRequest {
    estado: string;
}

// Funciones de la API
export const obtenerUsuarios = async (): Promise<Usuario[]> => {
    const response = await axios.get(`${API_BASE_URL}/Usuarios`);
    return response.data;
};

export const obtenerUsuarioPorId = async (id: number): Promise<Usuario> => {
    const response = await axios.get(`${API_BASE_URL}/Usuarios/${id}`);
    return response.data;
};

export const obtenerDetallesUsuario = async (id: number): Promise<UsuarioDetalles> => {
    const response = await axios.get(`${API_BASE_URL}/Usuarios/${id}/detalles`);
    return response.data;
};

export const buscarUsuarios = async (params: BusquedaUsuariosParams): Promise<BusquedaUsuariosResultado> => {
    const response = await axios.get(`${API_BASE_URL}/Usuarios/buscar`, { params });
    return response.data;
};

export const crearUsuario = async (usuario: Omit<Usuario, 'usuarioID' | 'fechaRegistro'>): Promise<Usuario> => {
    const response = await axios.post(`${API_BASE_URL}/Usuarios`, usuario);
    return response.data;
};

export const modificarUsuario = async (id: number, usuario: Partial<Usuario>): Promise<void> => {
    await axios.put(`${API_BASE_URL}/Usuarios/${id}`, usuario);
};

export const eliminarUsuario = async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/Usuarios/${id}`);
};

export const cambiarEstadoUsuario = async (id: number, estado: string): Promise<void> => {
    await axios.put(`${API_BASE_URL}/Usuarios/${id}/estado`, { estado });
};

export const obtenerEstadisticasUsuarios = async (): Promise<EstadisticasUsuarios> => {
    const response = await axios.get(`${API_BASE_URL}/Usuarios/estadisticas`);
    return response.data;
};

// Funciones auxiliares
export const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(monto);
};

export const obtenerColorEstado = (estado: string): string => {
    switch (estado) {
        case 'Activo': return 'activo';
        case 'Inactivo': return 'inactivo';
        case 'Suspendido': return 'suspendido';
        default: return 'activo';
    }
};

export const obtenerColorRol = (rol: string): string => {
    switch (rol) {
        case 'Administrador': return 'admin';
        case 'Profesor': return 'profesor';
        case 'Estudiante': return 'estudiante';
        default: return 'estudiante';
    }
};

export const obtenerEstadosDisponibles = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'Activo', label: 'Activo' },
        { value: 'Inactivo', label: 'Inactivo' },
        { value: 'Suspendido', label: 'Suspendido' }
    ];
};

export const obtenerRolesDisponibles = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Profesor', label: 'Profesor' },
        { value: 'Estudiante', label: 'Estudiante' }
    ];
};

export const obtenerOpcionesOrdenamiento = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'nombre', label: 'Nombre' },
        { value: 'email', label: 'Email' },
        { value: 'fecharegistro', label: 'Fecha de Registro' },
        { value: 'rol', label: 'Rol' },
        { value: 'estado', label: 'Estado' }
    ];
};

// Función para validar email
export const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Función para validar código universitario
export const validarCodigoUniversitario = (codigo: string): boolean => {
    // Asumiendo que el código universitario tiene un formato específico
    // Ajustar según las reglas de tu universidad
    const codigoRegex = /^[A-Z0-9]{6,12}$/;
    return codigoRegex.test(codigo);
};

// Función para validar teléfono
export const validarTelefono = (telefono: string): boolean => {
    const telefonoRegex = /^[+]?[0-9\s\-()]{7,15}$/;
    return telefonoRegex.test(telefono);
};
