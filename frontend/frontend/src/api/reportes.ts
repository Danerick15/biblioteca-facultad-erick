import axios from 'axios';

const API_BASE_URL = 'http://localhost:5180/api';

// Interfaces para los tipos de datos
export interface EstadisticasGenerales {
    totalUsuarios: number;
    totalLibros: number;
    totalEjemplares: number;
    prestamosActivos: number;
    prestamosVencidos: number;
    multasPendientes: number;
    montoTotalMultas: number;
}

export interface PrestamoPorMes {
    mes: string;
    cantidad: number;
}

export interface LibroMasPrestado {
    libroID: number;
    titulo: string;
    prestamos: number;
}

export interface UsuarioMasActivo {
    usuarioID: number;
    nombre: string;
    prestamos: number;
}

export interface EstadisticaPorRol {
    rol: string;
    cantidad: number;
}

export interface ActividadDiaria {
    fecha: string;
    prestamosHoy: number;
    devolucionesHoy: number;
    multasGeneradasHoy: number;
    multasPagadasHoy: number;
}

export interface RendimientoBiblioteca {
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
    totalPrestamos: number;
    prestamosCompletados: number;
    prestamosVencidos: number;
    tasaDevolucion: number;
    totalMultas: number;
    montoTotalMultas: number;
    multasPagadas: number;
    tasaPagoMultas: number;
}

// Funciones de la API
export const obtenerEstadisticasGenerales = async (): Promise<EstadisticasGenerales> => {
    const response = await axios.get(`${API_BASE_URL}/Reportes/estadisticas-generales`);
    return response.data;
};

export const obtenerPrestamosPorMes = async (año?: number): Promise<PrestamoPorMes[]> => {
    const params = año ? { año } : {};
    const response = await axios.get(`${API_BASE_URL}/Reportes/prestamos-por-mes`, { params });
    return response.data;
};

export const obtenerLibrosMasPrestados = async (limite: number = 10): Promise<LibroMasPrestado[]> => {
    const response = await axios.get(`${API_BASE_URL}/Reportes/libros-mas-prestados`, {
        params: { limite }
    });
    return response.data;
};

export const obtenerUsuariosMasActivos = async (limite: number = 10): Promise<UsuarioMasActivo[]> => {
    const response = await axios.get(`${API_BASE_URL}/Reportes/usuarios-mas-activos`, {
        params: { limite }
    });
    return response.data;
};

export const obtenerEstadisticasPorRol = async (): Promise<EstadisticaPorRol[]> => {
    const response = await axios.get(`${API_BASE_URL}/Reportes/estadisticas-por-rol`);
    return response.data;
};

export const obtenerActividadDiaria = async (fecha?: Date): Promise<ActividadDiaria> => {
    const params = fecha ? { fecha: fecha.toISOString().split('T')[0] } : {};
    const response = await axios.get(`${API_BASE_URL}/Reportes/actividad-diaria`, { params });
    return response.data;
};

export const obtenerRendimientoBiblioteca = async (meses: number = 6): Promise<RendimientoBiblioteca> => {
    const response = await axios.get(`${API_BASE_URL}/Reportes/rendimiento-biblioteca`, {
        params: { meses }
    });
    return response.data;
};

// Función para exportar reportes (simulada)
export const exportarReporte = async (formato: 'pdf' | 'excel', tipoReporte: string): Promise<Blob> => {
    // En un sistema real, esto haría una llamada al backend para generar el archivo
    // Por ahora, simulamos la respuesta
    const response = await axios.get(`${API_BASE_URL}/Reportes/exportar`, {
        params: { formato, tipoReporte },
        responseType: 'blob'
    });
    return response.data;
};
