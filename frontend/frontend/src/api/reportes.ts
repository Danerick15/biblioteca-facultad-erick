import axios from 'axios';

// axios.defaults.baseURL ya está configurado en auth.ts como '/api'
// Por lo tanto, solo usamos rutas relativas sin el prefijo /api

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
    const response = await axios.get('/Reportes/estadisticas-generales');
    return response.data;
};

export const obtenerPrestamosPorMes = async (año?: number): Promise<PrestamoPorMes[]> => {
    const params = año ? { año } : {};
    const response = await axios.get('/Reportes/prestamos-por-mes', { params });
    return response.data;
};

export const obtenerLibrosMasPrestados = async (limite: number = 10): Promise<LibroMasPrestado[]> => {
    const response = await axios.get('/Reportes/libros-mas-prestados', {
        params: { limite }
    });
    return response.data;
};

export const obtenerUsuariosMasActivos = async (limite: number = 10): Promise<UsuarioMasActivo[]> => {
    const response = await axios.get('/Reportes/usuarios-mas-activos', {
        params: { limite }
    });
    return response.data;
};

export const obtenerEstadisticasPorRol = async (): Promise<EstadisticaPorRol[]> => {
    const response = await axios.get('/Reportes/estadisticas-por-rol');
    return response.data;
};

export const obtenerActividadDiaria = async (fecha?: Date): Promise<ActividadDiaria> => {
    const params = fecha ? { fecha: fecha.toISOString().split('T')[0] } : {};
    const response = await axios.get('/Reportes/actividad-diaria', { params });
    return response.data;
};

export const obtenerRendimientoBiblioteca = async (meses: number = 6): Promise<RendimientoBiblioteca> => {
    const response = await axios.get('/Reportes/rendimiento-biblioteca', {
        params: { meses }
    });
    return response.data;
};

// Función para exportar reportes
export const exportarReporte = async (formato: 'pdf' | 'excel', tipoReporte: string = 'general'): Promise<Blob> => {
    try {
        const url = '/Reportes/exportar';
        console.log('Exportando reporte:', { formato, tipoReporte, url });
        const response = await axios.get(url, {
            params: { formato, tipoReporte },
            responseType: 'blob'
        });
        console.log('Respuesta recibida:', response.status, response.headers);
        return response.data;
    } catch (error: any) {
        console.error('Error en exportarReporte:', error);
        console.error('URL intentada:', error.config?.url);
        console.error('Status:', error.response?.status);
        console.error('Status text:', error.response?.statusText);
        throw error;
    }
};
