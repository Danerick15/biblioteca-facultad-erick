import axios from 'axios';

const API_URL = "/Autores";

export interface Autor {
  autorID: number;
  nombre: string;
  biografia?: string;
  orcid?: string;
}

export interface CrearAutorRequest {
  nombre: string;
  biografia?: string;
  orcid?: string;
}

export interface ActualizarAutorRequest {
  autorID: number;
  nombre: string;
  biografia?: string;
  orcid?: string;
}

// Obtener todos los autores
export const obtenerAutores = async (): Promise<Autor[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener autores:', error);
    throw error;
  }
};

// Obtener autor por ID
export const obtenerAutorPorId = async (id: number): Promise<Autor> => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener autor:', error);
    throw error;
  }
};

// Crear nuevo autor
export const crearAutor = async (autor: CrearAutorRequest): Promise<Autor> => {
  try {
    const response = await axios.post(API_URL, autor);
    return response.data;
  } catch (error) {
    console.error('Error al crear autor:', error);
    throw error;
  }
};

// Actualizar autor existente
export const actualizarAutor = async (id: number, autor: ActualizarAutorRequest): Promise<Autor> => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, autor);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar autor:', error);
    throw error;
  }
};

// Eliminar autor
export const eliminarAutor = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('Error al eliminar autor:', error);
    throw error;
  }
};

// Buscar autores por nombre
export const buscarAutores = async (termino: string): Promise<Autor[]> => {
  try {
    const response = await axios.get(`${API_URL}?buscar=${encodeURIComponent(termino)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar autores:', error);
    throw error;
  }
};