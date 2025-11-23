import React, { useState, useEffect, useMemo, useRef } from 'react';
import { obtenerLibros, crearLibro, modificarLibro, eliminarLibro, subirArchivoDigital, eliminarArchivoDigital, cargaMasivaLibros, type ResultadoCargaMasiva } from '../../../../../api/libros';
import type { LibroDTO } from '../../../../../api/libros';
import { Upload, FileText, Trash2, X, FileUp, Download } from 'lucide-react';
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
    
    // Estados para archivo digital (HU-10)
    const [mostrarModalArchivo, setMostrarModalArchivo] = useState(false);
    const [libroConArchivo, setLibroConArchivo] = useState<LibroDTO | null>(null);
    const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
    const [subiendoArchivo, setSubiendoArchivo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados para carga masiva (HU-07)
    const [mostrarModalCargaMasiva, setMostrarModalCargaMasiva] = useState(false);
    const [archivoCargaMasiva, setArchivoCargaMasiva] = useState<File | null>(null);
    const [procesandoCargaMasiva, setProcesandoCargaMasiva] = useState(false);
    const [resultadoCargaMasiva, setResultadoCargaMasiva] = useState<ResultadoCargaMasiva | null>(null);
    const cargaMasivaInputRef = useRef<HTMLInputElement>(null);

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

    // Funciones para carga masiva (HU-07)
    const abrirModalCargaMasiva = () => {
        setMostrarModalCargaMasiva(true);
        setArchivoCargaMasiva(null);
        setResultadoCargaMasiva(null);
    };

    const cerrarModalCargaMasiva = () => {
        setMostrarModalCargaMasiva(false);
        setArchivoCargaMasiva(null);
        setResultadoCargaMasiva(null);
        if (cargaMasivaInputRef.current) {
            cargaMasivaInputRef.current.value = '';
        }
    };

    const manejarSeleccionArchivoCargaMasiva = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            const extension = archivo.name.split('.').pop()?.toLowerCase();
            if (extension !== 'csv' && extension !== 'xlsx' && extension !== 'xls') {
                setError('Formato no válido. Solo se permiten archivos CSV o Excel (.xlsx, .xls)');
                return;
            }
            if (archivo.size > 10 * 1024 * 1024) { // 10 MB
                setError('El archivo es demasiado grande. Tamaño máximo: 10 MB');
                return;
            }
            setArchivoCargaMasiva(archivo);
            setError(null);
        }
    };

    const procesarCargaMasiva = async () => {
        if (!archivoCargaMasiva) {
            setError('Por favor selecciona un archivo');
            return;
        }

        try {
            setProcesandoCargaMasiva(true);
            setError(null);
            
            const resultado = await cargaMasivaLibros(archivoCargaMasiva);
            setResultadoCargaMasiva(resultado);
            
            // Recargar lista de libros
            await cargarDatos();
        } catch (err: any) {
            console.error('Error en carga masiva:', err);
            setError(err.response?.data?.mensaje || 'Error al procesar la carga masiva');
        } finally {
            setProcesandoCargaMasiva(false);
        }
    };

    const descargarPlantilla = () => {
        // Crear plantilla CSV
        const headers = ['ISBN', 'Titulo', 'Editorial', 'AñoPublicacion', 'Idioma', 'Paginas', 
                        'LCCSeccion', 'LCCNumero', 'LCCCutter', 'Autores', 'Categorias', 'CantidadEjemplares'];
        const ejemplo = ['978-1234567890', 'Ejemplo de Libro', 'Editorial Ejemplo', '2024', 'Español', '300',
                        'QA', '76', 'E96', 'Autor 1; Autor 2', 'Categoría 1; Categoría 2', '2'];
        
        const csv = [headers.join(','), ejemplo.join(',')].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_carga_masiva_libros.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    // Funciones para archivos digitales (HU-10)
    const abrirModalArchivo = (libro: LibroDTO) => {
        setLibroConArchivo(libro);
        setMostrarModalArchivo(true);
        setArchivoSeleccionado(null);
    };

    const cerrarModalArchivo = () => {
        setMostrarModalArchivo(false);
        setLibroConArchivo(null);
        setArchivoSeleccionado(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            // Validar tipo
            const extension = archivo.name.split('.').pop()?.toLowerCase();
            const tiposPermitidos = ['pdf', 'epub', 'txt', 'doc', 'docx'];
            if (!extension || !tiposPermitidos.includes(extension)) {
                setError('Tipo de archivo no permitido. Se permiten: PDF, EPUB, TXT, DOC, DOCX');
                return;
            }
            
            // Validar tamaño (100 MB)
            const tamañoMaximo = 100 * 1024 * 1024; // 100 MB
            if (archivo.size > tamañoMaximo) {
                setError('El archivo es demasiado grande. Tamaño máximo: 100 MB');
                return;
            }

            setArchivoSeleccionado(archivo);
            setError(null);
        }
    };

    const subirArchivo = async () => {
        if (!libroConArchivo || !archivoSeleccionado) return;

        try {
            setSubiendoArchivo(true);
            setError(null);
            
            await subirArchivoDigital(libroConArchivo.libroID, archivoSeleccionado);
            await cargarDatos();
            cerrarModalArchivo();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al subir el archivo');
            console.error('Error al subir archivo:', err);
        } finally {
            setSubiendoArchivo(false);
        }
    };

    const eliminarArchivo = async (libro: LibroDTO) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el archivo digital del libro "${libro.titulo}"?`)) {
            return;
        }

        try {
            setProcesando(true);
            setError(null);
            await eliminarArchivoDigital(libro.libroID);
            await cargarDatos();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al eliminar el archivo');
            console.error('Error al eliminar archivo:', err);
        } finally {
            setProcesando(false);
        }
    };

    const formatearTamañoArchivo = (bytes?: number) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
                    
                    <div className="action-buttons">
                        <button 
                            className="btn-primary"
                            onClick={abrirFormularioCrear}
                        >
                            + Nuevo Libro
                        </button>
                        <button 
                            className="btn-secondary"
                            onClick={abrirModalCargaMasiva}
                            title="Cargar múltiples libros desde CSV o Excel"
                        >
                            <FileUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Carga Masiva
                        </button>
                    </div>
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
                                            {libro.tieneArchivoDigital && (
                                                <span className="ejemplar-badge digital" title="Disponible en formato digital">
                                                    📱 Digital
                                                </span>
                                            )}
                                        </div>

                                        {/* Información de archivo digital */}
                                        {libro.tieneArchivoDigital && (
                                            <div className="archivo-digital-info" style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                                                <FileText size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                                <span>Tipo: {libro.tipoArchivoDigital?.toUpperCase()}</span>
                                                {libro.tamañoArchivoDigital && (
                                                    <span style={{ marginLeft: '10px' }}>Tamaño: {formatearTamañoArchivo(libro.tamañoArchivoDigital)}</span>
                                                )}
                                                {libro.contadorVistas && libro.contadorVistas > 0 && (
                                                    <span style={{ marginLeft: '10px' }}>👁️ {libro.contadorVistas} vistas</span>
                                                )}
                                                {libro.contadorDescargas && libro.contadorDescargas > 0 && (
                                                    <span style={{ marginLeft: '10px' }}>⬇️ {libro.contadorDescargas} descargas</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Botones de acción para archivo digital */}
                                        <div className="libro-acciones-archivo" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                            {!libro.tieneArchivoDigital ? (
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => abrirModalArchivo(libro)}
                                                    title="Subir archivo digital"
                                                >
                                                    <Upload size={16} />
                                                    Subir Archivo
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => abrirModalArchivo(libro)}
                                                        title="Reemplazar archivo digital"
                                                    >
                                                        <Upload size={16} />
                                                        Reemplazar
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-danger"
                                                        onClick={() => eliminarArchivo(libro)}
                                                        title="Eliminar archivo digital"
                                                        disabled={procesando}
                                                    >
                                                        <Trash2 size={16} />
                                                        Eliminar
                                                    </button>
                                                </>
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

            {/* Modal para subir archivo digital (HU-10) */}
            {mostrarModalArchivo && libroConArchivo && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Subir Archivo Digital</h2>
                            <button 
                                className="btn-close"
                                onClick={cerrarModalArchivo}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <p>
                                <strong>Libro:</strong> {libroConArchivo.titulo}
                            </p>
                            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
                                Tipos permitidos: PDF, EPUB, TXT, DOC, DOCX. Tamaño máximo: 100 MB
                            </p>

                            <div className="form-group">
                                <label htmlFor="archivoDigital">Seleccionar archivo</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="archivoDigital"
                                    accept=".pdf,.epub,.txt,.doc,.docx"
                                    onChange={manejarSeleccionArchivo}
                                    disabled={subiendoArchivo}
                                />
                            </div>

                            {archivoSeleccionado && (
                                <div className="archivo-info" style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#f0f0f0', 
                                    borderRadius: '5px', 
                                    marginTop: '10px' 
                                }}>
                                    <p><strong>Archivo seleccionado:</strong></p>
                                    <p>Nombre: {archivoSeleccionado.name}</p>
                                    <p>Tamaño: {formatearTamañoArchivo(archivoSeleccionado.size)}</p>
                                    <p>Tipo: {archivoSeleccionado.type || 'N/A'}</p>
                                </div>
                            )}

                            {error && (
                                <div className="error-message" style={{ marginTop: '10px' }}>
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="btn-secondary"
                                onClick={cerrarModalArchivo}
                                disabled={subiendoArchivo}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-primary"
                                onClick={subirArchivo}
                                disabled={!archivoSeleccionado || subiendoArchivo}
                            >
                                {subiendoArchivo ? 'Subiendo...' : (libroConArchivo.tieneArchivoDigital ? 'Reemplazar Archivo' : 'Subir Archivo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Carga Masiva (HU-07) */}
            {mostrarModalCargaMasiva && (
                <div className="modal-overlay" onClick={cerrarModalCargaMasiva}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Carga Masiva de Libros</h2>
                            <button className="modal-close" onClick={cerrarModalCargaMasiva}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            {!resultadoCargaMasiva ? (
                                <>
                                    <div className="info-box" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                        <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>📋 Instrucciones</h3>
                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                            <li>Formato soportado: CSV o Excel (.xlsx, .xls)</li>
                                            <li>Tamaño máximo: 10 MB</li>
                                            <li>Columnas requeridas: ISBN, Titulo</li>
                                            <li>Columnas opcionales: Editorial, AñoPublicacion, Idioma, Paginas, LCCSeccion, LCCNumero, LCCCutter, Autores, Categorias, CantidadEjemplares</li>
                                            <li>Autores y Categorías: separados por punto y coma (;)</li>
                                        </ul>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="archivoCargaMasiva">Seleccionar archivo</label>
                                        <input
                                            ref={cargaMasivaInputRef}
                                            type="file"
                                            id="archivoCargaMasiva"
                                            accept=".csv,.xlsx,.xls"
                                            onChange={manejarSeleccionArchivoCargaMasiva}
                                            disabled={procesandoCargaMasiva}
                                            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                                        />
                                        {archivoCargaMasiva && (
                                            <p style={{ marginTop: '8px', color: '#059669', fontSize: '14px' }}>
                                                ✓ Archivo seleccionado: {archivoCargaMasiva.name} ({(archivoCargaMasiva.size / 1024).toFixed(2)} KB)
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                                        <button
                                            className="btn-secondary"
                                            onClick={descargarPlantilla}
                                            disabled={procesandoCargaMasiva}
                                        >
                                            <Download size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                            Descargar Plantilla CSV
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="resultado-carga-masiva">
                                    <div className={`resultado-header ${resultadoCargaMasiva.exitosas > 0 ? 'success' : 'error'}`}>
                                        <h3>
                                            {resultadoCargaMasiva.exitosas > 0 ? '✅' : '❌'} 
                                            {resultadoCargaMasiva.mensaje}
                                        </h3>
                                    </div>
                                    
                                    <div className="resultado-stats" style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
                                        <div style={{ flex: 1, padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{resultadoCargaMasiva.exitosas}</div>
                                            <div style={{ fontSize: '14px', color: '#15803d' }}>Exitosas</div>
                                        </div>
                                        <div style={{ flex: 1, padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{resultadoCargaMasiva.fallidas}</div>
                                            <div style={{ fontSize: '14px', color: '#991b1b' }}>Fallidas</div>
                                        </div>
                                        <div style={{ flex: 1, padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#475569' }}>{resultadoCargaMasiva.totalFilas}</div>
                                            <div style={{ fontSize: '14px', color: '#64748b' }}>Total</div>
                                        </div>
                                    </div>

                                    {resultadoCargaMasiva.fallidas > 0 && (
                                        <div className="errores-detalle" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '20px' }}>
                                            <h4 style={{ marginBottom: '10px', color: '#dc2626' }}>Errores encontrados:</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {resultadoCargaMasiva.resultados
                                                    .filter(r => !r.exitoso)
                                                    .map((r, idx) => (
                                                        <div key={idx} style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                                                            <div style={{ fontWeight: 'bold', color: '#991b1b' }}>Fila {r.numeroFila}: {r.titulo || r.isbn}</div>
                                                            <div style={{ fontSize: '14px', color: '#dc2626', marginTop: '4px' }}>{r.mensaje}</div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            {!resultadoCargaMasiva ? (
                                <>
                                    <button
                                        className="btn-secondary"
                                        onClick={cerrarModalCargaMasiva}
                                        disabled={procesandoCargaMasiva}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={procesarCargaMasiva}
                                        disabled={!archivoCargaMasiva || procesandoCargaMasiva}
                                    >
                                        {procesandoCargaMasiva ? 'Procesando...' : 'Procesar Archivo'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="btn-primary"
                                    onClick={cerrarModalCargaMasiva}
                                >
                                    Cerrar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBooks;