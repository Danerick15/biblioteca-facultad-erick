import axios from 'axios';

// axios.defaults.baseURL ya está configurado en auth.ts como '/api'
// Por lo tanto, solo usamos rutas relativas sin el prefijo /api
const API_URL = '/Recomendaciones';

export interface RecomendacionDTO {
    recomendacionID: number;
    profesorID: number;
    nombreProfesor: string;
    curso: string;
    libroID?: number;
    tituloLibro?: string;
    isbn?: string;
    urlExterna?: string;
    fecha: string;
    libro?: any;
}

export interface CrearRecomendacionRequest {
    curso: string;
    libroID?: number;
    urlExterna?: string;
}

export interface ModificarRecomendacionRequest {
    curso: string;
    libroID?: number;
    urlExterna?: string;
}

// Obtener todas las recomendaciones públicas (para estudiantes)
export const obtenerRecomendacionesPublicas = async (): Promise<RecomendacionDTO[]> => {
    const res = await axios.get(`${API_URL}/publicas`);
    return res.data;
};

// Obtener las recomendaciones del profesor autenticado
export const obtenerMisRecomendaciones = async (): Promise<RecomendacionDTO[]> => {
    try {
        const res = await axios.get(`${API_URL}/mis-recomendaciones`);
        return res.data || [];
    } catch (err: any) {
        // Si es 404, significa que no hay recomendaciones (no es un error)
        if (err.response?.status === 404) {
            return [];
        }
        // Para otros errores, lanzar la excepción
        throw err;
    }
};

// Obtener una recomendación por ID
export const obtenerRecomendacionPorId = async (id: number): Promise<RecomendacionDTO> => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
};

// Crear una nueva recomendación
export const crearRecomendacion = async (request: CrearRecomendacionRequest): Promise<{ mensaje: string }> => {
    const res = await axios.post(API_URL, request);
    return res.data;
};

// Modificar una recomendación
export const modificarRecomendacion = async (id: number, request: ModificarRecomendacionRequest): Promise<{ mensaje: string }> => {
    const res = await axios.put(`${API_URL}/${id}`, request);
    return res.data;
};

// Eliminar una recomendación
export const eliminarRecomendacion = async (id: number): Promise<{ mensaje: string }> => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
};


