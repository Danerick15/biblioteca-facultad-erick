import axios from "axios";

const API_URL = "/Ejemplares";

export interface Ejemplar {
    ejemplarID: number;
    libroID: number;
    numeroEjemplar: number;
    codigoBarras: string;
    ubicacion?: string;
    estado: string;
    fechaAlta: string;
    observaciones?: string;
}

export const obtenerEjemplares = async (): Promise<Ejemplar[]> => {
    const res = await axios.get(API_URL, { withCredentials: true });
    return res.data;
};

export const obtenerEjemplaresPorLibro = async (libroId: number): Promise<Ejemplar[]> => {
    const res = await axios.get(`${API_URL}/libro/${libroId}`, { withCredentials: true });
    return res.data;
};

export const obtenerEjemplarPorId = async (id: number): Promise<Ejemplar> => {
    const res = await axios.get(`${API_URL}/${id}`, { withCredentials: true });
    return res.data;
};

export const obtenerEjemplarPorCodigoBarras = async (codigoBarras: string): Promise<Ejemplar> => {
    const res = await axios.get(`${API_URL}/codigo/${codigoBarras}`, { withCredentials: true });
    return res.data;
};

export const obtenerEjemplaresDisponibles = async (libroId: number): Promise<Ejemplar[]> => {
    const res = await axios.get(`${API_URL}/libro/${libroId}/disponibles`, { withCredentials: true });
    return res.data;
};

export const obtenerContadoresEjemplares = async (libroId: number): Promise<{
    totales: number;
    disponibles: number;
    prestados: number;
}> => {
    const res = await axios.get(`${API_URL}/libro/${libroId}/contadores`, { withCredentials: true });
    return res.data;
};

export const cambiarEstadoEjemplar = async (id: number, nuevoEstado: string): Promise<{ mensaje: string; ejemplar: Ejemplar }> => {
    const res = await axios.put(`${API_URL}/${id}/estado`, { estado: nuevoEstado }, { withCredentials: true });
    return res.data;
};

export const crearEjemplar = async (ejemplar: Omit<Ejemplar, 'ejemplarID' | 'fechaAlta'>): Promise<Ejemplar> => {
    const res = await axios.post(API_URL, ejemplar, { withCredentials: true });
    return res.data;
};

export const modificarEjemplar = async (ejemplar: Ejemplar): Promise<Ejemplar> => {
    const res = await axios.put(`${API_URL}/${ejemplar.ejemplarID}`, ejemplar, { withCredentials: true });
    return res.data;
};

export const eliminarEjemplar = async (id: number): Promise<{ mensaje: string }> => {
    const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return res.data;
};
