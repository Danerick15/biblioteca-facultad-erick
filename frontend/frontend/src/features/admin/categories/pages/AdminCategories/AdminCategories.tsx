import React, { useState, useEffect, useMemo } from 'react';
import { obtenerCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '../../../../../api/categorias';
import type { Categoria, CrearCategoriaRequest, ActualizarCategoriaRequest } from '../../../../../api/categorias';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import './AdminCategories.css';

interface FormularioCategoria {
    nombre: string;
}

interface Filtros {
    busqueda: string;
}

const AdminCategories: React.FC = () => {
    // SEO
    useSEO({
        title: 'Administración de Categorías - Biblioteca FISI',
        description: 'Gestiona las categorías del catálogo de la biblioteca',
        keywords: 'categorías, administración, biblioteca, catálogo'
    });
    
    const { goBack } = useNavigation();
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
    const [formulario, setFormulario] = useState<FormularioCategoria>({
        nombre: ''
    });
    
    // Estados de filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: ''
    });
    
    // Estados de UI
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState<Categoria | null>(null);
    const [procesando, setProcesando] = useState(false);

    // Cargar categorías al montar el componente
    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            setCargando(true);
            setError(null);
            const datos = await obtenerCategorias();
            setCategorias(datos);
        } catch (err) {
            setError('Error al cargar las categorías');
            console.error('Error al cargar categorías:', err);
        } finally {
            setCargando(false);
        }
    };

    // Filtrar categorías
    const categoriasFiltradas = useMemo(() => {
        let resultado = categorias;

        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(categoria =>
                categoria.nombre.toLowerCase().includes(termino)
            );
        }

        return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [categorias, filtros]);

    // Manejar cambios en el formulario
    const manejarCambioFormulario = (campo: keyof FormularioCategoria, valor: string) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setFormulario({
            nombre: ''
        });
        setCategoriaEditando(null);
        setMostrarFormulario(false);
    };

    // Abrir formulario para crear
    const abrirFormularioCrear = () => {
        limpiarFormulario();
        setMostrarFormulario(true);
    };

    // Abrir formulario para editar
    const abrirFormularioEditar = (categoria: Categoria) => {
        setFormulario({
            nombre: categoria.nombre
        });
        setCategoriaEditando(categoria);
        setMostrarFormulario(true);
    };

    // Validar formulario
    const validarFormulario = (): boolean => {
        if (!formulario.nombre.trim()) {
            setError('El nombre de la categoría es obligatorio');
            return false;
        }

        if (formulario.nombre.length > 100) {
            setError('El nombre no puede exceder 100 caracteres');
            return false;
        }

        // Verificar si ya existe una categoría con el mismo nombre
        const nombreExistente = categorias.some(cat => 
            cat.nombre.toLowerCase() === formulario.nombre.toLowerCase().trim() &&
            (!categoriaEditando || cat.categoriaID !== categoriaEditando.categoriaID)
        );

        if (nombreExistente) {
            setError('Ya existe una categoría con ese nombre');
            return false;
        }

        return true;
    };

    // Guardar categoría
    const guardarCategoria = async () => {
        if (!validarFormulario()) {
            return;
        }

        try {
            setProcesando(true);
            setError(null);

            if (categoriaEditando) {
                // Actualizar categoría existente
                const datosActualizacion: ActualizarCategoriaRequest = {
                    categoriaID: categoriaEditando.categoriaID,
                    nombre: formulario.nombre.trim()
                };
                await actualizarCategoria(categoriaEditando.categoriaID, datosActualizacion);
            } else {
                // Crear nueva categoría
                const datosCreacion: CrearCategoriaRequest = {
                    nombre: formulario.nombre.trim()
                };
                await crearCategoria(datosCreacion);
            }

            await cargarCategorias();
            limpiarFormulario();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al guardar la categoría');
            console.error('Error al guardar categoría:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Confirmar eliminación
    const confirmarEliminacion = (categoria: Categoria) => {
        setCategoriaAEliminar(categoria);
        setMostrarConfirmacion(true);
    };

    // Eliminar categoría
    const eliminarCategoriaConfirmada = async () => {
        if (!categoriaAEliminar) return;

        try {
            setProcesando(true);
            setError(null);
            await eliminarCategoria(categoriaAEliminar.categoriaID);
            await cargarCategorias();
            setMostrarConfirmacion(false);
            setCategoriaAEliminar(null);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al eliminar la categoría');
            console.error('Error al eliminar categoría:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Cancelar eliminación
    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setCategoriaAEliminar(null);
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
                        <h1>Administración de Categorías</h1>
                        <p>Gestiona las categorías del catálogo de la biblioteca</p>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="admin-content">
                {/* Filtros y acciones */}
                <div className="admin-filters">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Buscar categorías por nombre..."
                            value={filtros.busqueda}
                            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                            className="search-input"
                        />
                    </div>
                    <button 
                        className="btn-primary"
                        onClick={abrirFormularioCrear}
                    >
                        + Nueva Categoría
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Lista de categorías */}
                <div className="admin-table-container">
                    {categoriasFiltradas.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron categorías</p>
                            {filtros.busqueda && (
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setFiltros(prev => ({ ...prev, busqueda: '' }))}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="categorias-grid">
                            {categoriasFiltradas.map((categoria) => (
                                <div key={categoria.categoriaID} className="categoria-card">
                                    <div className="categoria-header">
                                        <h3 className="categoria-nombre">{categoria.nombre}</h3>
                                        <div className="categoria-actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => abrirFormularioEditar(categoria)}
                                                title="Editar categoría"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => confirmarEliminacion(categoria)}
                                                title="Eliminar categoría"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="categoria-info">
                                        <p className="categoria-id">
                                            <strong>ID:</strong> {categoria.categoriaID}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contador de resultados */}
                <div className="results-count">
                    Mostrando {categoriasFiltradas.length} de {categorias.length} categorías
                </div>
            </div>

            {/* Modal de formulario */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button 
                                className="btn-close"
                                onClick={limpiarFormulario}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="nombre">Nombre *</label>
                                <input
                                    type="text"
                                    id="nombre"
                                    value={formulario.nombre}
                                    onChange={(e) => manejarCambioFormulario('nombre', e.target.value)}
                                    placeholder="Nombre de la categoría"
                                    maxLength={100}
                                    required
                                />
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
                                onClick={guardarCategoria}
                                disabled={procesando}
                            >
                                {procesando ? 'Guardando...' : (categoriaEditando ? 'Actualizar' : 'Crear')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {mostrarConfirmacion && categoriaAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Confirmar Eliminación</h2>
                        </div>
                        
                        <div className="modal-body">
                            <p>¿Estás seguro de que deseas eliminar la categoría <strong>{categoriaAEliminar.nombre}</strong>?</p>
                            <p className="warning-text">Esta acción no se puede deshacer y puede afectar a los libros asociados.</p>
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
                                onClick={eliminarCategoriaConfirmada}
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

export default AdminCategories;
