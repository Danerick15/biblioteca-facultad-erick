import axios from "axios";

const API_URL = "/Multas";

export interface Multa {
    multaID: number;
    prestamoID: number;
    usuarioID: number;
    monto: number;
    estado: string;
    diasAtraso?: number;
    motivo?: string;
    fechaCobro?: string;
    prestamo?: {
        prestamoID: number;
        fechaPrestamo: string;
        fechaVencimiento: string;
        fechaDevolucion?: string;
        estado: string;
        renovaciones: number;
        observaciones?: string;
        ejemplar?: {
            ejemplarID: number;
            libroID: number;
            codigoEjemplar: string;
            estado: string;
            libro?: {
                libroID: number;
                titulo: string;
                autor: string;
                isbn: string;
            };
        };
    };
}

export interface ResumenMultasDTO {
    totalMultas: number;
    multasPendientes: number;
    multasPagadas: number;
    montoTotalPendiente: number;
    montoTotalPagado: number;
    montoTotalGeneral: number;
}

export const obtenerMisMultas = async (): Promise<Multa[]> => {
    const res = await axios.get(`${API_URL}/mis-multas`);
    return res.data;
};

export const obtenerMisMultasPendientes = async (): Promise<Multa[]> => {
    const res = await axios.get(`${API_URL}/mis-multas-pendientes`);
    return res.data;
};

export const obtenerMiResumenMultas = async (): Promise<ResumenMultasDTO> => {
    const res = await axios.get(`${API_URL}/mi-resumen-multas`);
    return res.data;
};

export const generarMultasAutomaticas = async (): Promise<{ mensaje: string; multasGeneradas: number }> => {
    const res = await axios.post(`${API_URL}/generar-automaticas`);
    return res.data;
};
