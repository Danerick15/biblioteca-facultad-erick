import React, { useState, useEffect, useMemo } from 'react';
import { obtenerLibros, crearLibro, modificarLibro, eliminarLibro } from '../../../../../api/libros';
import type { LibroDTO } from '../../../../../api/libros';
import { obtenerAutores } from '../../../../../api/autores';
import type { Autor } from '../../../../../api/autores';
import { obtenerCategorias } from '../../../../../api/categorias';
import type { Categoria } from '../../../../../api/categorias';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO, SEOConfigs } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import './AdminBooks.css';

interface FormularioLibro {
    isbn: string;
    titulo: string;
    editorial?: string;
    anioPublicacion?: number;
    idioma?: string;
    paginas?: number;
    lccSeccion?: string;
    lccNumero?: string;
    lccCutter?: string;
    autores: number[];
    categorias: number[];
}

interface Filtros {
    busqueda: string;
    editorial: string;
    disponibilidad: string;
}

const AdminBooks: React.FC = () => {
    // SEO
    useSEO(SEOConfigs.adminLibros);
    
    const { goBack } = useNavigation();
    const [libros, setLibros] = useState<LibroDTO[]>([]);
    const [autores, setAutores] = useState<Autor[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [libroEditando, setLibroEditando] = useState<LibroDTO | null>(null);
    const [formulario, setFormulario] = useState<FormularioLibro>({
        isbn: '',
        titulo: '',
        editorial: '',
        anioPublicacion: undefined,
        idioma: '',
        paginas: undefined,
        lccSeccion: '',
        lccNumero: '',
        lccCutter: '',
        autores: [],
        categorias: []
    });
    
    // Estados de filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        editorial: '',
        disponibilidad: ''
    });
    
    // Estados de UI
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [libroAEliminar, setLibroAEliminar] = useState<LibroDTO | null>(null);
    const [procesando, setProcesando] = useState(false);

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            
            const [librosData, autoresData, categoriasData] = await Promise.all([
                obtenerLibros(),
                obtenerAutores(),
                obtenerCategorias()
            ]);
            
            setLibros(librosData);
            setAutores(autoresData);
            setCategorias(categoriasData);
        } catch (err) {
            setError('Error al cargar los datos');
            console.error('Error al cargar datos:', err);
        } finally {
            setCargando(false);
        }
    };

    // Filtrar libros
    const librosFiltrados = useMemo(() => {
        let resultado = libros;

        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(libro =>
                libro.titulo.toLowerCase().includes(termino) ||
                libro.isbn.toLowerCase().includes(termino) ||
                libro.autores?.some(autor => autor.toLowerCase().includes(termino)) ||
                libro.categorias?.some(categoria => categoria.toLowerCase().includes(termino))
            );
        }

        if (filtros.editorial.trim()) {
            resultado = resultado.filter(libro =>
                libro.editorial?.toLowerCase().includes(filtros.editorial.toLowerCase())
            );
        }


        if (filtros.disponibilidad) {
            switch (filtros.disponibilidad) {
                case 'disponibles':
                    resultado = resultado.filter(libro => libro.ejemplaresDisponibles > 0);
                    break;
                case 'agotados':
                    resultado = resultado.filter(libro => libro.ejemplaresDisponibles === 0);
                    break;
                case 'con-prestamos':
                    resultado = resultado.filter(libro => libro.ejemplaresPrestados > 0);
                    break;
            }
        }

        return resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }, [libros, filtros]);

    // Manejar cambios en el formulario
    const manejarCambioFormulario = (campo: keyof FormularioLibro, valor: string | number | number[]) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setFormulario({
            isbn: '',
            titulo: '',
            editorial: '',
            anioPublicacion: undefined,
            idioma: '',
            paginas: undefined,
            lccSeccion: '',
            lccNumero: '',
            lccCutter: '',
            autores: [],
            categorias: []
        });
        setLibroEditando(null);
        setMostrarFormulario(false);
    };

    // Abrir formulario para crear
    const abrirFormularioCrear = () => {
        limpiarFormulario();
        setMostrarFormulario(true);
    };

    // Abrir formulario para editar
    const abrirFormularioEditar = (libro: LibroDTO) => {
        setFormulario({
            isbn: libro.isbn,
            titulo: libro.titulo,
            editorial: libro.editorial || '',
            anioPublicacion: libro.anioPublicacion,
            idioma: libro.idioma || '',
            paginas: libro.paginas,
            lccSeccion: libro.lccSeccion || '',
            lccNumero: libro.lccNumero,
            lccCutter: libro.lccCutter || '',
            autores: [], // Se llenará con los IDs de autores
            categorias: [] // Se llenará con los IDs de categorías
        });
        setLibroEditando(libro);
        setMostrarFormulario(true);
    };

    // Validar formulario
    const validarFormulario = (): boolean => {
        if (!formulario.isbn.trim()) {
            setError('El ISBN es obligatorio');
            return false;
        }

        if (!formulario.titulo.trim()) {
            setError('El título es obligatorio');
            return false;
        }

        if (formulario.autores.length === 0) {
            setError('Debe seleccionar al menos un autor');
            return false;
        }

        if (formulario.categorias.length === 0) {
            setError('Debe seleccionar al menos una categoría');
            return false;
        }

        return true;
    };

    // Guardar libro
    const guardarLibro = async () => {
        if (!validarFormulario()) {
            return;
        }

        try {
            setProcesando(true);
            setError(null);

            const datosLibro = {
                isbn: formulario.isbn.trim(),
                titulo: formulario.titulo.trim(),
                editorial: formulario.editorial?.trim() || undefined,
                anioPublicacion: formulario.anioPublicacion || undefined,
                idioma: formulario.idioma?.trim() || undefined,
                paginas: formulario.paginas || undefined,
                lccSeccion: formulario.lccSeccion?.trim() || undefined,
                lccNumero: formulario.lccNumero?.trim() || undefined,
                lccCutter: formulario.lccCutter?.trim() || undefined,
                autores: formulario.autores.map(id => autores.find(a => a.autorID === id)?.nombre || '').filter(Boolean),
                categorias: formulario.categorias.map(id => categorias.find(c => c.categoriaID === id)?.nombre || '').filter(Boolean)
            };

            if (libroEditando) {
                await modificarLibro({ ...libroEditando, ...datosLibro });
            } else {
                await crearLibro(datosLibro);
            }

            await cargarDatos();
            limpiarFormulario();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al guardar el libro');
            console.error('Error al guardar libro:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Confirmar eliminación
    const confirmarEliminacion = (libro: LibroDTO) => {
        setLibroAEliminar(libro);
        setMostrarConfirmacion(true);
    };

    // Eliminar libro
    const eliminarLibroConfirmado = async () => {
        if (!libroAEliminar) return;

        try {
            setProcesando(true);
            setError(null);
            await eliminarLibro(libroAEliminar.libroID);
            await cargarDatos();
            setMostrarConfirmacion(false);
            setLibroAEliminar(null);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al eliminar el libro');
            console.error('Error al eliminar libro:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Cancelar eliminación
    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setLibroAEliminar(null);
    };

    if (cargando) {
        return <PageLoader />;
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <button className="btn-back" onClick={goBack}>
                        ← Volver
                    </button>
                    <div className="admin-title-section">
                        <h1>Administración de Libros</h1>
                        <p>Gestiona el catálogo de libros de la biblioteca</p>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="admin-content">
                {/* Filtros y acciones */}
                <div className="admin-filters">
                    <div className="filters-container">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Buscar por título, ISBN, autor o categoría..."
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                                className="search-input"
                            />
                        </div>
                        
                        <div className="filter-row">
                            <select
                                value={filtros.editorial}
                                onChange={(e) => setFiltros(prev => ({ ...prev, editorial: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">Todas las editoriales</option>
                                {Array.from(new Set(libros.map(l => l.editorial).filter(Boolean))).map(editorial => (
                                    <option key={editorial} value={editorial}>{editorial}</option>
                                ))}
                            </select>

                            <select
                                value={filtros.disponibilidad}
                                onChange={(e) => setFiltros(prev => ({ ...prev, disponibilidad: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">Todos los estados</option>
                                <option value="disponibles">Disponibles</option>
                                <option value="agotados">Agotados</option>
                                <option value="con-prestamos">Con préstamos</option>
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        className="btn-primary"
                        onClick={abrirFormularioCrear}
                    >
                        + Nuevo Libro
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Lista de libros */}
                <div className="admin-table-container">
                    {librosFiltrados.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron libros</p>
                            {Object.values(filtros).some(f => f.trim()) && (
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setFiltros({
                                        busqueda: '',
                                        editorial: '',
                                        disponibilidad: ''
                                    })}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="libros-grid">
                            {librosFiltrados.map((libro) => (
                                <div key={libro.libroID} className="libro-card">
                                    <div className="libro-header">
                                        <h3 className="libro-titulo">{libro.titulo}</h3>
                                        <div className="libro-actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => abrirFormularioEditar(libro)}
                                                title="Editar libro"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => confirmarEliminacion(libro)}
                                                title="Eliminar libro"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="libro-info">
                                        <p className="libro-isbn">
                                            <strong>ISBN:</strong> {libro.isbn}
                                        </p>
                                        {libro.editorial && (
                                            <p className="libro-editorial">
                                                <strong>Editorial:</strong> {libro.editorial}
                                            </p>
                                        )}
                                        {libro.anioPublicacion && (
                                            <p className="libro-anio">
                                                <strong>Año:</strong> {libro.anioPublicacion}
                                            </p>
                                        )}
                                        
                                        <div className="libro-ejemplares">
                                            <span className={`ejemplar-badge ${libro.ejemplaresDisponibles > 0 ? 'disponible' : 'agotado'}`}>
                                                {libro.ejemplaresDisponibles} disponibles
                                            </span>
                                            {libro.ejemplaresPrestados > 0 && (
                                                <span className="ejemplar-badge prestado">
                                                    {libro.ejemplaresPrestados} prestados
                                                </span>
                                            )}
                                        </div>

                                        {libro.autores && libro.autores.length > 0 && (
                                            <div className="libro-autores">
                                                <strong>Autores:</strong> {libro.autores.join(', ')}
                                            </div>
                                        )}

                                        {libro.categorias && libro.categorias.length > 0 && (
                                            <div className="libro-categorias">
                                                <strong>Categorías:</strong> {libro.categorias.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contador de resultados */}
                <div className="results-count">
                    Mostrando {librosFiltrados.length} de {libros.length} libros
                </div>
            </div>

            {/* Modal de formulario */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <div className="modal-header">
                            <h2>{libroEditando ? 'Editar Libro' : 'Nuevo Libro'}</h2>
                            <button 
                                className="btn-close"
                                onClick={limpiarFormulario}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="isbn">ISBN *</label>
                                    <input
                                        type="text"
                                        id="isbn"
                                        value={formulario.isbn}
                                        onChange={(e) => manejarCambioFormulario('isbn', e.target.value)}
                                        placeholder="ISBN del libro"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="titulo">Título *</label>
                                    <input
                                        type="text"
                                        id="titulo"
                                        value={formulario.titulo}
                                        onChange={(e) => manejarCambioFormulario('titulo', e.target.value)}
                                        placeholder="Título del libro"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="editorial">Editorial</label>
                                    <input
                                        type="text"
                                        id="editorial"
                                        value={formulario.editorial}
                                        onChange={(e) => manejarCambioFormulario('editorial', e.target.value)}
                                        placeholder="Editorial"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="anioPublicacion">Año de Publicación</label>
                                    <input
                                        type="number"
                                        id="anioPublicacion"
                                        value={formulario.anioPublicacion || ''}
                                        onChange={(e) => manejarCambioFormulario('anioPublicacion', e.target.value ? parseInt(e.target.value) : 0)}
                                        placeholder="Año"
                                        min="1000"
                                        max="2100"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="idioma">Idioma</label>
                                    <input
                                        type="text"
                                        id="idioma"
                                        value={formulario.idioma}
                                        onChange={(e) => manejarCambioFormulario('idioma', e.target.value)}
                                        placeholder="Idioma"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="paginas">Páginas</label>
                                    <input
                                        type="number"
                                        id="paginas"
                                        value={formulario.paginas || ''}
                                        onChange={(e) => manejarCambioFormulario('paginas', e.target.value ? parseInt(e.target.value) : 0)}
                                        placeholder="Número de páginas"
                                        min="1"
                                    />
                                </div>
                            </div>


                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="lccSeccion">LCC Sección</label>
                                    <input
                                        type="text"
                                        id="lccSeccion"
                                        value={formulario.lccSeccion}
                                        onChange={(e) => manejarCambioFormulario('lccSeccion', e.target.value)}
                                        placeholder="Sección LCC"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lccNumero">LCC Número</label>
                                    <input
                                        type="text"
                                        id="lccNumero"
                                        value={formulario.lccNumero || ''}
                                        onChange={(e) => manejarCambioFormulario('lccNumero', e.target.value)}
                                        placeholder="Número LCC"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="lccCutter">LCC Cutter</label>
                                <input
                                    type="text"
                                    id="lccCutter"
                                    value={formulario.lccCutter}
                                    onChange={(e) => manejarCambioFormulario('lccCutter', e.target.value)}
                                    placeholder="Cutter LCC"
                                />
                            </div>

                            <div className="form-group">
                                <label>Autores *</label>
                                <div className="checkbox-group">
                                    {autores.map(autor => (
                                        <label key={autor.autorID} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formulario.autores.includes(autor.autorID)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        manejarCambioFormulario('autores', [...formulario.autores, autor.autorID]);
                                                    } else {
                                                        manejarCambioFormulario('autores', formulario.autores.filter(id => id !== autor.autorID));
                                                    }
                                                }}
                                            />
                                            <span>{autor.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Categorías *</label>
                                <div className="checkbox-group">
                                    {categorias.map(categoria => (
                                        <label key={categoria.categoriaID} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formulario.categorias.includes(categoria.categoriaID)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        manejarCambioFormulario('categorias', [...formulario.categorias, categoria.categoriaID]);
                                                    } else {
                                                        manejarCambioFormulario('categorias', formulario.categorias.filter(id => id !== categoria.categoriaID));
                                                    }
                                                }}
                                            />
                                            <span>{categoria.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={limpiarFormulario}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={guardarLibro}
                                disabled={procesando}
                            >
                                {procesando ? 'Guardando...' : (libroEditando ? 'Actualizar' : 'Crear')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {mostrarConfirmacion && libroAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Confirmar Eliminación</h2>
                        </div>
                        
                        <div className="modal-body">
                            <p>¿Estás seguro de que deseas eliminar el libro <strong>{libroAEliminar.titulo}</strong>?</p>
                            <p className="warning-text">Esta acción no se puede deshacer y eliminará todos los ejemplares asociados.</p>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={cancelarEliminacion}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-danger"
                                onClick={eliminarLibroConfirmado}
                                disabled={procesando}
                            >
                                {procesando ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBooks;