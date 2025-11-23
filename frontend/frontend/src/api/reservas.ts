import axios from "axios";

const API_URL = "/Reservas";

export interface ReservaDTO {
    reservaID: number;
    usuarioID: number;
    libroID: number;
    libroTitulo: string;
    libroISBN?: string;
    fechaReserva: string;
    estado: string;
}

export interface AdminReservaDTO {
    reservaID: number;
    usuarioID?: number;
    usuarioNombre?: string;
    codigoUsuario?: string;
    libroID?: number;
    libroTitulo?: string;
    fechaReserva?: string;
    tipoReserva?: string;
    estado?: string;
    posicionCola?: number | null;
    numeroEjemplar?: number | null;
    codigoBarras?: string | null;
}

export const crearReserva = async (libroID: number, usuarioID?: number, ejemplarID?: number): Promise<{ mensaje: string }> => {
    const body: any = { 
        libroID, 
        usuarioID,
        tipoReserva: "ColaEspera" // Siempre intentamos crear como cola de espera primero
    };
    if (ejemplarID !== undefined) body.ejemplarID = ejemplarID;
    console.log('Enviando petición crear reserva:', body);
    const res = await axios.post(API_URL, body);
    console.log('Respuesta del servidor:', res.data);
    return res.data;
};

export const obtenerMisReservas = async (): Promise<ReservaDTO[]> => {
    const res = await axios.get(`${API_URL}/mis-reservas`);
    return res.data;
};

export const cancelarReserva = async (reservaId: number): Promise<{ mensaje: string }> => {
    const res = await axios.delete(`${API_URL}/${reservaId}/cancelar`);
    return res.data;
};

// Admin endpoints
export const obtenerReservasParaRetiro = async (): Promise<AdminReservaDTO[]> => {
    const res = await axios.get(`${API_URL}/para-retiro`);
    return res.data;
};

export const obtenerReservasEnEspera = async (): Promise<AdminReservaDTO[]> => {
    const res = await axios.get(`${API_URL}/en-espera`);
    return res.data;
};

export interface AprobarReservaResponse {
    mensaje: string;
    prestamoID?: number;
}

export const aprobarReserva = async (reservaId: number): Promise<AprobarReservaResponse> => {
    const res = await axios.post(`${API_URL}/${reservaId}/aprobar`);
    return res.data;
};

export const rechazarReserva = async (reservaId: number): Promise<{ mensaje: string }> => {
    const res = await axios.post(`${API_URL}/${reservaId}/rechazar`);
    return res.data;
};

export const expirarReserva = async (reservaId: number): Promise<{ mensaje: string }> => {
    const res = await axios.post(`${API_URL}/${reservaId}/expirar`);
    return res.data;
};


