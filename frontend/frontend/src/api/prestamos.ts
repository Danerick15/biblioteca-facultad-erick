import axios from "axios";

const API_URL = "/Prestamos";

export interface PrestamoDTO {
    prestamoID: number;
    fechaPrestamo: string;
    fechaVencimiento: string;
    fechaDevolucion?: string;
    estado: string;
    renovaciones: number;
    observaciones?: string;
    usuarioNombre: string;
    usuarioCodigo: string;
    libroTitulo: string;
    libroISBN: string;
    numeroEjemplar: number;
    codigoBarras: string;
    estadoCalculado: string;
    diasAtraso?: number;
}

export interface CrearPrestamoRequest {
    ejemplarID: number;
    usuarioID: number;
    diasPrestamo?: number;
}

export const obtenerPrestamosActivos = async (): Promise<PrestamoDTO[]> => {
    const res = await axios.get(`${API_URL}/activos`);
    return res.data;
};

export const obtenerMisPrestamos = async (): Promise<PrestamoDTO[]> => {
    const res = await axios.get(`${API_URL}/mis-prestamos`);
    return res.data;
};

export const obtenerPrestamosAtrasados = async (): Promise<PrestamoDTO[]> => {
    const res = await axios.get(`${API_URL}/atrasados`);
    return res.data;
};

export const crearPrestamo = async (request: CrearPrestamoRequest): Promise<{ mensaje: string; prestamo: PrestamoDTO }> => {
    const res = await axios.post(API_URL, request);
    return res.data;
};

export const procesarDevolucion = async (prestamoId: number, observaciones?: string): Promise<{ mensaje: string; prestamo: PrestamoDTO }> => {
    const res = await axios.put(`${API_URL}/${prestamoId}/devolucion`, 
        { observaciones }
    );
    return res.data;
};

export const renovarPrestamo = async (prestamoId: number, diasAdicionales?: number): Promise<{ mensaje: string; prestamo: PrestamoDTO }> => {
    const res = await axios.put(`${API_URL}/${prestamoId}/renovar`, 
        { diasAdicionales }
    );
    return res.data;
};

// ===== ENDPOINTS ADICIONALES PARA PERFIL =====

export const obtenerMiHistorial = async (): Promise<PrestamoDTO[]> => {
    const res = await axios.get(`${API_URL}/mi-historial`);
    return res.data;
};

export const obtenerMisPrestamosActivos = async (): Promise<PrestamoDTO[]> => {
    const res = await axios.get(`${API_URL}/mis-prestamos-activos`);
    return res.data;
};

// ===== ENDPOINTS PARA ADMINISTRADORES =====

export const obtenerTodosPrestamos = async (): Promise<PrestamoDTO[]> => {
    const res = await axios.get(`${API_URL}/todos`);
    return res.data;
};
