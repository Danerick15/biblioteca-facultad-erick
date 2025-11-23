import React, { useState, useEffect, useMemo } from 'react';
import { 
    obtenerMisRecomendaciones, 
    crearRecomendacion, 
    modificarRecomendacion, 
    eliminarRecomendacion,
    type RecomendacionDTO,
    type CrearRecomendacionRequest,
    type ModificarRecomendacionRequest
} from '../../../../../api/recomendaciones';
import { obtenerLibros, type LibroDTO } from '../../../../../api/libros';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import { useToast } from '../../../../../components/Toast';
import { BookOpen, Plus, Edit, Trash2, Search, ExternalLink, X } from 'lucide-react';
import './ProfessorRecommendations.css';

interface FormularioRecomendacion {
    curso: string;
    libroID?: number;
    urlExterna?: string;
}

interface Filtros {
    busqueda: string;
    curso: string;
}

const ProfessorRecommendations: React.FC = () => {
    // SEO
    useSEO({
        title: 'Mis Recomendaciones - Biblioteca FISI',
        description: 'Gestiona tus listas de recomendaciones de libros',
        keywords: 'recomendaciones, profesor, libros, biblioteca'
    });
    
    const { goBack } = useNavigation();
    const { showToast } = useToast();
    const [recomendaciones, setRecomendaciones] = useState<RecomendacionDTO[]>([]);
    const [libros, setLibros] = useState<LibroDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [recomendacionEditando, setRecomendacionEditando] = useState<RecomendacionDTO | null>(null);
    const [formulario, setFormulario] = useState<FormularioRecomendacion>({
        curso: '',
        libroID: undefined,
        urlExterna: ''
    });
    
    // Estados de filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        curso: ''
    });
    
    // Estados de UI
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [recomendacionAEliminar, setRecomendacionAEliminar] = useState<RecomendacionDTO | null>(null);
    const [procesando, setProcesando] = useState(false);
    const [buscarLibro, setBuscarLibro] = useState('');

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            const [recomendacionesData, librosData] = await Promise.all([
                obtenerMisRecomendaciones(),
                obtenerLibros()
            ]);
            setRecomendaciones(recomendacionesData || []);
            setLibros(librosData || []);
        } catch (err: any) {
            // Si es un 404, probablemente no hay recomendaciones (no es un error real)
            if (err.response?.status === 404) {
                setRecomendaciones([]);
                setLibros([]);
            } else {
                setError('Error al cargar los datos');
                console.error('Error al cargar datos:', err);
            }
        } finally {
            setCargando(false);
        }
    };

    // Filtrar recomendaciones
    const recomendacionesFiltradas = useMemo(() => {
        let resultado = recomendaciones;

        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(rec =>
                rec.curso.toLowerCase().includes(termino) ||
                (rec.tituloLibro && rec.tituloLibro.toLowerCase().includes(termino)) ||
                (rec.nombreProfesor && rec.nombreProfesor.toLowerCase().includes(termino))
            );
        }

        if (filtros.curso.trim()) {
            resultado = resultado.filter(rec =>
                rec.curso.toLowerCase().includes(filtros.curso.toLowerCase())
            );
        }

        return resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [recomendaciones, filtros]);

    // Filtrar libros para el selector
    const librosFiltrados = useMemo(() => {
        if (!buscarLibro.trim()) return libros.slice(0, 10);
        
        const termino = buscarLibro.toLowerCase();
        return libros.filter(libro =>
            libro.titulo.toLowerCase().includes(termino) ||
            libro.isbn.toLowerCase().includes(termino) ||
            libro.autores?.some(autor => autor.toLowerCase().includes(termino))
        ).slice(0, 10);
    }, [libros, buscarLibro]);

    // Manejar cambios en el formulario
    const manejarCambioFormulario = (campo: keyof FormularioRecomendacion, valor: string | number | undefined) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setFormulario({
            curso: '',
            libroID: undefined,
            urlExterna: ''
        });
        setRecomendacionEditando(null);
        setMostrarFormulario(false);
        setBuscarLibro('');
    };

    // Abrir formulario para crear
    const abrirFormularioCrear = () => {
        limpiarFormulario();
        setMostrarFormulario(true);
    };

    // Abrir formulario para editar
    const abrirFormularioEditar = (recomendacion: RecomendacionDTO) => {
        setFormulario({
            curso: recomendacion.curso,
            libroID: recomendacion.libroID,
            urlExterna: recomendacion.urlExterna || ''
        });
        setRecomendacionEditando(recomendacion);
        setMostrarFormulario(true);
        if (recomendacion.libroID) {
            const libro = libros.find(l => l.libroID === recomendacion.libroID);
            if (libro) {
                setBuscarLibro(libro.titulo);
            }
        }
    };

    // Validar formulario
    const validarFormulario = (): boolean => {
        if (!formulario.curso.trim()) {
            setError('El curso es obligatorio');
            return false;
        }

        if (!formulario.libroID && !formulario.urlExterna?.trim()) {
            setError('Debe especificar un libro o una URL externa');
            return false;
        }

        if (formulario.urlExterna && !/^https?:\/\/.+/.test(formulario.urlExterna)) {
            setError('La URL debe comenzar con http:// o https://');
            return false;
        }

        return true;
    };

    // Guardar recomendación
    const guardarRecomendacion = async () => {
        if (!validarFormulario()) {
            return;
        }

        try {
            setProcesando(true);
            setError(null);

            if (recomendacionEditando) {
                const request: ModificarRecomendacionRequest = {
                    curso: formulario.curso,
                    libroID: formulario.libroID,
                    urlExterna: formulario.urlExterna || undefined
                };
                await modificarRecomendacion(recomendacionEditando.recomendacionID, request);
                showToast('Recomendación modificada correctamente', 'success');
            } else {
                const request: CrearRecomendacionRequest = {
                    curso: formulario.curso,
                    libroID: formulario.libroID,
                    urlExterna: formulario.urlExterna || undefined
                };
                await crearRecomendacion(request);
                showToast('Recomendación creada correctamente', 'success');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            const mensaje = err.response?.data?.mensaje || 'Error al guardar la recomendación';
            setError(mensaje);
            showToast(mensaje, 'error');
        } finally {
            setProcesando(false);
        }
    };

    // Confirmar eliminación
    const confirmarEliminar = (recomendacion: RecomendacionDTO) => {
        setRecomendacionAEliminar(recomendacion);
        setMostrarConfirmacion(true);
    };

    // Eliminar recomendación
    const eliminar = async () => {
        if (!recomendacionAEliminar) return;

        try {
            setProcesando(true);
            setError(null);
            await eliminarRecomendacion(recomendacionAEliminar.recomendacionID);
            showToast('Recomendación eliminada correctamente', 'success');
            setMostrarConfirmacion(false);
            setRecomendacionAEliminar(null);
            await cargarDatos();
        } catch (err: any) {
            const mensaje = err.response?.data?.mensaje || 'Error al eliminar la recomendación';
            setError(mensaje);
            showToast(mensaje, 'error');
        } finally {
            setProcesando(false);
        }
    };

    // Obtener cursos únicos para el filtro
    const cursosUnicos = useMemo(() => {
        const cursos = recomendaciones.map(r => r.curso).filter((c, i, arr) => arr.indexOf(c) === i);
        return cursos.sort();
    }, [recomendaciones]);

    if (cargando) {
        return <PageLoader type="page" message="Cargando recomendaciones..." />;
    }

    return (
        <div className="professor-recommendations-container">
            {/* Header */}
            <div className="recommendations-header">
                <div className="header-content">
                    <div className="header-title">
                        <BookOpen className="title-icon" />
                        <h1>Mis Recomendaciones</h1>
                    </div>
                    <button 
                        className="btn-primary"
                        onClick={abrirFormularioCrear}
                    >
                        <Plus size={20} />
                        Nueva Recomendación
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="recommendations-filters">
                <div className="filter-group">
                    <Search className="filter-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por curso, libro o profesor..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={filtros.curso}
                        onChange={(e) => setFiltros(prev => ({ ...prev, curso: e.target.value }))}
                    >
                        <option value="">Todos los cursos</option>
                        {cursosUnicos.map(curso => (
                            <option key={curso} value={curso}>{curso}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Lista de recomendaciones */}
            <div className="recommendations-list">
                {recomendacionesFiltradas.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <p>No hay recomendaciones para mostrar</p>
                        <button className="btn-primary" onClick={abrirFormularioCrear}>
                            Crear primera recomendación
                        </button>
                    </div>
                ) : (
                    recomendacionesFiltradas.map(recomendacion => (
                        <div key={recomendacion.recomendacionID} className="recommendation-card">
                            <div className="recommendation-header">
                                <div className="recommendation-info">
                                    <h3>{recomendacion.curso}</h3>
                                    <span className="recommendation-date">
                                        {new Date(recomendacion.fecha).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="recommendation-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => abrirFormularioEditar(recomendacion)}
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        className="btn-icon btn-danger"
                                        onClick={() => confirmarEliminar(recomendacion)}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="recommendation-content">
                                {recomendacion.libroID ? (
                                    <div className="recommendation-book">
                                        <BookOpen size={20} />
                                        <div>
                                            <strong>{recomendacion.tituloLibro}</strong>
                                            {recomendacion.isbn && (
                                                <span className="book-isbn">ISBN: {recomendacion.isbn}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : recomendacion.urlExterna ? (
                                    <div className="recommendation-link">
                                        <ExternalLink size={20} />
                                        <a 
                                            href={recomendacion.urlExterna} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            {recomendacion.urlExterna}
                                        </a>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de formulario */}
            {mostrarFormulario && (
                <div className="modal-overlay" onClick={limpiarFormulario}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{recomendacionEditando ? 'Editar Recomendación' : 'Nueva Recomendación'}</h2>
                            <button className="btn-icon" onClick={limpiarFormulario}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Curso *</label>
                                <input
                                    type="text"
                                    value={formulario.curso}
                                    onChange={(e) => manejarCambioFormulario('curso', e.target.value)}
                                    placeholder="Ej: Matemáticas I"
                                />
                            </div>
                            <div className="form-group">
                                <label>Libro</label>
                                <input
                                    type="text"
                                    value={buscarLibro}
                                    onChange={(e) => {
                                        setBuscarLibro(e.target.value);
                                        if (!e.target.value) {
                                            manejarCambioFormulario('libroID', undefined);
                                        }
                                    }}
                                    placeholder="Buscar libro por título, ISBN o autor..."
                                />
                                {buscarLibro && librosFiltrados.length > 0 && (
                                    <div className="libros-dropdown">
                                        {librosFiltrados.map(libro => (
                                            <div
                                                key={libro.libroID}
                                                className="libro-option"
                                                onClick={() => {
                                                    manejarCambioFormulario('libroID', libro.libroID);
                                                    setBuscarLibro(libro.titulo);
                                                    manejarCambioFormulario('urlExterna', '');
                                                }}
                                            >
                                                <strong>{libro.titulo}</strong>
                                                <span>{libro.autores?.join(', ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>O URL Externa</label>
                                <input
                                    type="url"
                                    value={formulario.urlExterna || ''}
                                    onChange={(e) => {
                                        manejarCambioFormulario('urlExterna', e.target.value);
                                        if (e.target.value) {
                                            manejarCambioFormulario('libroID', undefined);
                                            setBuscarLibro('');
                                        }
                                    }}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={limpiarFormulario}>
                                Cancelar
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={guardarRecomendacion}
                                disabled={procesando}
                            >
                                {procesando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {mostrarConfirmacion && recomendacionAEliminar && (
                <div className="modal-overlay" onClick={() => setMostrarConfirmacion(false)}>
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirmar Eliminación</h2>
                            <button className="btn-icon" onClick={() => setMostrarConfirmacion(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>¿Está seguro de que desea eliminar la recomendación de <strong>{recomendacionAEliminar.curso}</strong>?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setMostrarConfirmacion(false)}>
                                Cancelar
                            </button>
                            <button 
                                className="btn-danger" 
                                onClick={eliminar}
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

export default ProfessorRecommendations;


