import axios from 'axios';

const API_URL = "/Categorias";

export interface Categoria {
  categoriaID: number;
  nombre: string;
}

export interface CrearCategoriaRequest {
  nombre: string;
}

export interface ActualizarCategoriaRequest {
  categoriaID: number;
  nombre: string;
}

// Obtener todas las categorías
export const obtenerCategorias = async (): Promise<Categoria[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

// Obtener categoría por ID
export const obtenerCategoriaPorId = async (id: number): Promise<Categoria> => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    throw error;
  }
};

// Crear nueva categoría
export const crearCategoria = async (categoria: CrearCategoriaRequest): Promise<Categoria> => {
  try {
    const response = await axios.post(API_URL, categoria);
    return response.data;
  } catch (error) {
    console.error('Error al crear categoría:', error);
    throw error;
  }
};

// Actualizar categoría existente
export const actualizarCategoria = async (id: number, categoria: ActualizarCategoriaRequest): Promise<Categoria> => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, categoria);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    throw error;
  }
};

// Eliminar categoría
export const eliminarCategoria = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    throw error;
  }
};

// Buscar categorías por nombre
export const buscarCategorias = async (termino: string): Promise<Categoria[]> => {
  try {
    const response = await axios.get(`${API_URL}?buscar=${encodeURIComponent(termino)}`);
    return response.data;
  } catch (error) {
    console.error('Error al buscar categorías:', error);
    throw error;
  }
};