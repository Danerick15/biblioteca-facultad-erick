import axios from "axios";

const API_URL = "/Libros";

export interface LibroDTO {
    libroID: number;
    isbn: string;
    titulo: string;
    editorial?: string;
    anioPublicacion?: number;
    idioma?: string;
    paginas?: number;
    lccSeccion?: string;
    lccNumero?: string;
    lccCutter?: string;
    signaturaLCC?: string;
    totalEjemplares: number;
    ejemplaresDisponibles: number;
    ejemplaresPrestados: number;
    autores?: string[];
    categorias?: string[];
}

export const obtenerLibros = async (): Promise<LibroDTO[]> => {
    const res = await axios.get(API_URL);
    return res.data;
};

export const obtenerLibroPorId = async (id: number): Promise<LibroDTO> => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
};

export const crearLibro = async (libro: Omit<LibroDTO, 'libroID' | 'totalEjemplares' | 'ejemplaresDisponibles' | 'ejemplaresPrestados'>): Promise<LibroDTO> => {
    const res = await axios.post(API_URL, libro);
    return res.data;
};

export const modificarLibro = async (libro: LibroDTO): Promise<LibroDTO> => {
    const res = await axios.put(`${API_URL}/${libro.libroID}`, libro);
    return res.data;
};

export const eliminarLibro = async (id: number): Promise<{ mensaje: string }> => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
};

export const buscarLibros = async (autor?: string, titulo?: string): Promise<LibroDTO[]> => {
    const params = new URLSearchParams();
    if (autor) params.append('autor', autor);
    if (titulo) params.append('titulo', titulo);
    
    const res = await axios.get(`${API_URL}/buscar?${params}`);
    return res.data;
};
