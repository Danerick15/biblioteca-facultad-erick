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
    // Campos de archivo digital (HU-10)
    tieneArchivoDigital?: boolean;
    tipoArchivoDigital?: string;
    tamañoArchivoDigital?: number;
    contadorVistas?: number;
    contadorDescargas?: number;
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

export const buscarLibros = async (autor?: string, titulo?: string, palabraClave?: string): Promise<LibroDTO[]> => {
    const params = new URLSearchParams();
    if (autor) params.append('autor', autor);
    if (titulo) params.append('titulo', titulo);
    if (palabraClave) params.append('palabraClave', palabraClave);
    
    const res = await axios.get(`${API_URL}/buscar?${params}`);
    return res.data;
};

// ========== FUNCIONES PARA ARCHIVOS DIGITALES (HU-10) ==========

export const subirArchivoDigital = async (libroID: number, archivo: File): Promise<{ mensaje: string; rutaArchivo: string; tamaño: string }> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    const res = await axios.post(`${API_URL}/${libroID}/archivo-digital`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
};

export const eliminarArchivoDigital = async (libroID: number): Promise<{ mensaje: string }> => {
    const res = await axios.delete(`${API_URL}/${libroID}/archivo-digital`);
    return res.data;
};

export const obtenerUrlVerArchivo = (libroID: number): string => {
    return `/api${API_URL}/${libroID}/archivo-digital/ver`;
};

export const obtenerUrlDescargarArchivo = (libroID: number): string => {
    return `/api${API_URL}/${libroID}/archivo-digital/descargar`;
};

// ========== FUNCIONES PARA CARGA MASIVA (HU-07) ==========

export interface ResultadoCargaMasiva {
    mensaje: string;
    totalFilas: number;
    exitosas: number;
    fallidas: number;
    resultados: Array<{
        numeroFila: number;
        exitoso: boolean;
        mensaje: string;
        titulo: string;
        isbn: string;
    }>;
}

export const cargaMasivaLibros = async (archivo: File): Promise<ResultadoCargaMasiva> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    const res = await axios.post(`${API_URL}/carga-masiva`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
};
