// API de Notificaciones - Integración con backend

import axios from 'axios';

// Asegurar que axios esté configurado correctamente
// Importar auth.ts para que se ejecute la configuración global de axios
import './auth';

// Si por alguna razón no está configurado, configurarlo aquí
if (!axios.defaults.baseURL) {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = "/api";
}

// Interfaz del backend
interface NotificacionBackend {
    notificacionID: number;
    reservaID: number;
    usuarioID: number;
    tipo: string;
    mensaje: string;
    fechaCreacion: string;
    fechaLectura: string | null;
    estado: string;
    libroTitulo?: string | null;
    nombreUsuario?: string | null;
}

// Interfaz para el frontend (adaptada)
export interface Notificacion {
    id: number;
    tipo: 'prestamo' | 'devolucion' | 'multa' | 'reserva' | 'sistema';
    titulo: string;
    mensaje: string;
    fecha: string;
    leida: boolean;
}

// Función para mapear la respuesta del backend al formato del frontend
const mapearNotificacion = (notif: NotificacionBackend): Notificacion => {
    // Mapear el tipo del backend al tipo del frontend
    let tipoFrontend: 'prestamo' | 'devolucion' | 'multa' | 'reserva' | 'sistema' = 'sistema';
    
    const tipoLower = notif.tipo.toLowerCase();
    if (tipoLower.includes('prestamo') || tipoLower.includes('prestamo')) {
        tipoFrontend = 'prestamo';
    } else if (tipoLower.includes('devolucion') || tipoLower.includes('devolucion')) {
        tipoFrontend = 'devolucion';
    } else if (tipoLower.includes('multa')) {
        tipoFrontend = 'multa';
    } else if (tipoLower.includes('reserva') || tipoLower.includes('disponible') || tipoLower.includes('nuevareserva')) {
        tipoFrontend = 'reserva';
    }

    // Generar título basado en el tipo
    const titulos: Record<string, string> = {
        'prestamo': 'Préstamo registrado',
        'devolucion': 'Recordatorio de devolución',
        'multa': 'Multa generada',
        'reserva': 'Libro disponible',
        'sistema': 'Notificación del sistema'
    };

    return {
        id: notif.notificacionID,
        tipo: tipoFrontend,
        titulo: titulos[tipoFrontend] || notif.tipo,
        mensaje: notif.mensaje,
        fecha: notif.fechaCreacion,
        leida: notif.estado === 'Leida'
    };
};

const API_URL = "/Notificaciones";

/**
 * Obtener todas las notificaciones del usuario
 */
export const obtenerNotificaciones = async (): Promise<Notificacion[]> => {
    try {
        const url = `${axios.defaults.baseURL || '/api'}${API_URL}`;
        console.log('Obteniendo notificaciones desde:', url);
        const response = await axios.get<NotificacionBackend[]>(API_URL);
        const notificaciones = response.data.map(mapearNotificacion);
        return notificaciones.sort((a, b) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
    } catch (error: any) {
        console.error('Error obteniendo notificaciones:', error);
        console.error('URL intentada:', `${axios.defaults.baseURL || '/api'}${API_URL}`);
        console.error('Status:', error?.response?.status);
        console.error('Response data:', error?.response?.data);
        throw error;
    }
};

/**
 * Obtener solo las notificaciones no leídas
 */
export const obtenerNotificacionesNoLeidas = async (): Promise<Notificacion[]> => {
    const todas = await obtenerNotificaciones();
    return todas.filter(n => !n.leida);
};

/**
 * Obtener el conteo de notificaciones no leídas
 */
export const obtenerConteoNoLeidas = async (): Promise<number> => {
    const noLeidas = await obtenerNotificacionesNoLeidas();
    return noLeidas.length;
};

/**
 * Marcar una notificación como leída
 */
export const marcarComoLeida = async (id: number): Promise<void> => {
    try {
        await axios.post(`${API_URL}/${id}/marcar-leida`);
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        throw error;
    }
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const marcarTodasComoLeidas = async (): Promise<void> => {
    try {
        await axios.post(`${API_URL}/marcar-todas-leidas`);
    } catch (error) {
        console.error('Error marcando todas las notificaciones como leídas:', error);
        throw error;
    }
};

/**
 * Eliminar una notificación
 */
export const eliminarNotificacion = async (id: number): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error('Error eliminando notificación:', error);
        throw error;
    }
};

/**
 * Filtrar notificaciones por tipo
 */
export const filtrarPorTipo = async (tipo: Notificacion['tipo']): Promise<Notificacion[]> => {
    const todas = await obtenerNotificaciones();
    return todas.filter(n => n.tipo === tipo);
};

/**
 * Filtrar notificaciones por estado (leídas/no leídas)
 */
export const filtrarPorEstado = async (leida: boolean): Promise<Notificacion[]> => {
    const todas = await obtenerNotificaciones();
    return todas.filter(n => n.leida === leida);
};
