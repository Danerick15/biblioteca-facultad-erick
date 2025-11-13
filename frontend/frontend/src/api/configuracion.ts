import axios from 'axios';

// axios.defaults.baseURL ya está configurado en auth.ts como '/api'
// Por lo tanto, solo usamos rutas relativas sin el prefijo /api

// Interfaces para la configuración
export interface ConfiguracionGeneral {
    nombreBiblioteca: string;
    direccion: string;
    telefono: string;
    email: string;
    sitioWeb: string;
    moneda: string;
    idioma: string;
    zonaHoraria: string;
}

export interface ConfiguracionPrestamos {
    diasPrestamoEstudiante: number;
    diasPrestamoProfesor: number;
    maxPrestamosEstudiante: number;
    maxPrestamosProfesor: number;
    maxRenovaciones: number;
    diasGracia: number;
}

export interface ConfiguracionMultas {
    montoMultaPorDia: number;
    multaMaxima: number;
    descuentoMulta: number;
    diasDescuento: number;
}

export interface ConfiguracionNotificaciones {
    notificacionesEmail: boolean;
    notificacionesSMS: boolean;
    recordatorioVencimiento: number;
    recordatorioMulta: number;
}

export interface ConfiguracionSeguridad {
    sesionTimeout: number;
    intentosLogin: number;
    passwordMinLength: number;
    requiereMayuscula: boolean;
    requiereNumero: boolean;
    requiereSimbolo: boolean;
}

export interface ConfiguracionRespaldo {
    backupAutomatico: boolean;
    frecuenciaBackup: string;
    diasRetencion: number;
}

export interface ConfiguracionInterfaz {
    tema: 'claro' | 'oscuro' | 'auto';
    elementosPorPagina: number;
    mostrarImagenes: boolean;
    animaciones: boolean;
}

export interface ConfiguracionReportes {
    periodoPorDefecto: number; // Meses para el período por defecto
    topNLibros: number; // Cantidad de libros en el ranking
    topNUsuarios: number; // Cantidad de usuarios en el ranking
    añoPorDefecto: number; // Año por defecto para reportes mensuales
}

export interface ConfiguracionCompleta {
    general: ConfiguracionGeneral;
    prestamos: ConfiguracionPrestamos;
    multas: ConfiguracionMultas;
    notificaciones: ConfiguracionNotificaciones;
    seguridad: ConfiguracionSeguridad;
    respaldo: ConfiguracionRespaldo;
    interfaz: ConfiguracionInterfaz;
    reportes: ConfiguracionReportes;
}

export interface ValidacionConfiguracion {
    esValida: boolean;
    errores: string[];
}

// Funciones de la API
export const obtenerConfiguracion = async (): Promise<ConfiguracionCompleta> => {
    const response = await axios.get('/Configuracion');
    return response.data;
};

export const actualizarConfiguracion = async (configuracion: ConfiguracionCompleta): Promise<void> => {
    await axios.put('/Configuracion', configuracion);
};

export const resetearConfiguracion = async (): Promise<void> => {
    await axios.post('/Configuracion/resetear');
};

export const validarConfiguracion = async (configuracion: ConfiguracionCompleta): Promise<ValidacionConfiguracion> => {
    try {
        // El endpoint devuelve 200 con { mensaje: 'Configuración válida' }
        // y 400 con { mensaje: 'Configuración inválida', errores: [...] }
        await axios.post('/Configuracion/validar', configuracion);
        return { esValida: true, errores: [] };
    } catch (err: unknown) {
        const error = err as { response?: { status?: number; data?: any } };
        if (error.response && error.response.status === 400 && Array.isArray(error.response.data?.errores)) {
            return { esValida: false, errores: error.response.data.errores };
        }
        // Re-lanzar para que el llamador maneje otros errores (500, network, etc.)
        throw err;
    }
};

// Funciones auxiliares para validación local
export const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validarURL = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const validarTelefono = (telefono: string): boolean => {
    const telefonoRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return telefonoRegex.test(telefono);
};

// Función para formatear moneda
export const formatearMoneda = (monto: number, moneda: string = 'PEN'): string => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: moneda
    }).format(monto);
};

// Función para obtener opciones de zona horaria
export const obtenerZonasHorarias = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'America/Lima', label: 'Lima (GMT-5)' },
        { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
        { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
        { value: 'UTC', label: 'UTC (GMT+0)' }
    ];
};

// Función para obtener opciones de idioma
export const obtenerIdiomas = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' },
        { value: 'pt', label: 'Português' }
    ];
};

// Función para obtener opciones de moneda
export const obtenerMonedas = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'PEN', label: 'Soles (PEN)' },
        { value: 'USD', label: 'Dólares (USD)' },
        { value: 'EUR', label: 'Euros (EUR)' }
    ];
};

// Función para obtener opciones de frecuencia de respaldo
export const obtenerFrecuenciasRespaldo = (): Array<{ value: string; label: string }> => {
    return [
        { value: 'diario', label: 'Diario' },
        { value: 'semanal', label: 'Semanal' },
        { value: 'mensual', label: 'Mensual' }
    ];
};
