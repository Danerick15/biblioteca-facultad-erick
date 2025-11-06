import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./HeroCarrusel.css";
import { obtenerLibros } from "../../../api/libros";
import type { LibroDTO } from "../../../api/libros";

interface Destacado {
    id: number;
    titulo: string;
    autor: string;
    descripcion: string;
    imagen: string;
    paginas?: number;
    anio?: number;
}

const HeroCarrusel: React.FC = () => {
    const [destacados, setDestacados] = useState<Destacado[]>([]);
    const [indice, setIndice] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar libros destacados desde la API
    useEffect(() => {
        const cargarLibrosDestacados = async () => {
            try {
                setCargando(true);
                setError(null);
                
                const libros = await obtenerLibros();
                
                // Seleccionar los primeros 3 libros como destacados
                // En el futuro, podrías implementar lógica para seleccionar libros realmente destacados
                const librosDestacados = libros.slice(0, 3).map((libro: LibroDTO) => ({
                    id: libro.libroID,
                    titulo: libro.titulo,
                    autor: libro.autores?.join(", ") || "Autor desconocido",
                    descripcion: libro.signaturaLCC || `Libro de ${libro.editorial || 'editorial desconocida'}`,
                    imagen: `https://picsum.photos/1200/500?random=${libro.libroID}`, // Imagen placeholder temporal
                    paginas: libro.paginas,
                    anio: libro.anioPublicacion
                }));
                
                setDestacados(librosDestacados);
                
                // Si no hay libros, usar datos de fallback
                if (librosDestacados.length === 0) {
                    setDestacados([
                        {
                            id: 1,
                            titulo: "No hay libros disponibles",
                            autor: "Biblioteca FISI",
                            descripcion: "El catálogo está vacío. Contacta al administrador.",
                            imagen: "https://picsum.photos/1200/500?random=1",
                            paginas: 0,
                            anio: new Date().getFullYear()
                        }
                    ]);
                }
                
            } catch (err: unknown) {
                console.error('Error cargando libros destacados:', err);
                setError('Error al cargar los libros destacados');
                
                // Datos de fallback en caso de error
                setDestacados([
                    {
                        id: 1,
                        titulo: "Error de conexión",
                        autor: "Biblioteca FISI",
                        descripcion: "No se pudieron cargar los libros. Verifica tu conexión.",
                        imagen: "https://picsum.photos/1200/500?random=1",
                        paginas: 0,
                        anio: new Date().getFullYear()
                    }
                ]);
            } finally {
                setCargando(false);
            }
        };

        cargarLibrosDestacados();
    }, []);

    // Preload image
    useEffect(() => {
        if (destacados.length > 0) {
            const actual = destacados[indice];
            const img = new Image();
            img.src = actual.imagen;
            img.onload = () => setIsLoaded(true);
        }
    }, [destacados, indice]);

    // No mostrar nada si está cargando y no hay datos
    if (cargando && destacados.length === 0) {
        return (
            <div className="hero-carrusel">
                <div className="hero-loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando libros destacados...</p>
                </div>
            </div>
        );
    }

    // No mostrar nada si hay error y no hay datos de fallback
    if (error && destacados.length === 0) {
        return (
            <div className="hero-carrusel">
                <div className="hero-error">
                    <p>Error al cargar los libros destacados</p>
                </div>
            </div>
        );
    }

    const actual = destacados[indice];

    const siguiente = () => setIndice((prev) => (prev + 1) % destacados.length);
    const anterior = () => setIndice((prev) => (prev - 1 + destacados.length) % destacados.length);

    return (
        <div className="hero-carrusel">
            <button className="flecha-hero izquierda" onClick={anterior}>‹</button>

            <AnimatePresence mode="wait">
                <motion.div
                    key={actual.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="hero-img-wrapper"
                >
                    {!isLoaded && <div className="hero-placeholder" />} {/* 🔹 blur placeholder */}
                    <img
                        src={actual.imagen}
                        alt={actual.titulo}
                        className={`hero-img ${isLoaded ? "visible" : "hidden"}`}
                        loading="eager"
                    />
                </motion.div>
            </AnimatePresence>

            <div className="hero-overlay">
                <h2>{actual.titulo}</h2>
                <h3 className="autor">por {actual.autor}</h3>
                <p>{actual.descripcion}</p>
                <div className="hero-actions">
                    <button className="btn-read">📖 Leer ahora</button>
                    <button className="btn-add">➕ Lista</button>
                    <button className="btn-fav">⭐ Favorito</button>
                </div>
                <span className="detalles">
                    {actual.anio ? `${actual.anio}` : 'Año N/D'} · {actual.paginas ? `${actual.paginas} páginas` : 'Páginas N/D'}
                </span>
            </div>

            <button className="flecha-hero derecha" onClick={siguiente}>›</button>
        </div>
    );
};

export default HeroCarrusel;