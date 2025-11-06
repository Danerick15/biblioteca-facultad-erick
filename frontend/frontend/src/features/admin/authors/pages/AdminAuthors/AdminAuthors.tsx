import React, { useState, useEffect, useMemo } from 'react';
import { obtenerAutores, crearAutor, actualizarAutor, eliminarAutor } from '../../../../../api/autores';
import type { Autor, CrearAutorRequest, ActualizarAutorRequest } from '../../../../../api/autores';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import './AdminAuthors.css';

interface FormularioAutor {
    nombre: string;
    biografia?: string;
    orcid?: string;
}

interface Filtros {
    busqueda: string;
}

const AdminAuthors: React.FC = () => {
    // SEO
    useSEO({
        title: 'Administración de Autores - Biblioteca FISI',
        description: 'Gestiona los autores del catálogo de la biblioteca',
        keywords: 'autores, administración, biblioteca, catálogo'
    });
    
    const { goBack } = useNavigation();
    const [autores, setAutores] = useState<Autor[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [autorEditando, setAutorEditando] = useState<Autor | null>(null);
    const [formulario, setFormulario] = useState<FormularioAutor>({
        nombre: '',
        biografia: '',
        orcid: ''
    });
    
    // Estados de filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: ''
    });
    
    // Estados de UI
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [autorAEliminar, setAutorAEliminar] = useState<Autor | null>(null);
    const [procesando, setProcesando] = useState(false);

    // Cargar autores al montar el componente
    useEffect(() => {
        cargarAutores();
    }, []);

    const cargarAutores = async () => {
        try {
            setCargando(true);
            setError(null);
            const datos = await obtenerAutores();
            setAutores(datos);
        } catch (err) {
            setError('Error al cargar los autores');
            console.error('Error al cargar autores:', err);
        } finally {
            setCargando(false);
        }
    };

    // Filtrar autores
    const autoresFiltrados = useMemo(() => {
        let resultado = autores;

        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(autor =>
                autor.nombre.toLowerCase().includes(termino) ||
                (autor.biografia && autor.biografia.toLowerCase().includes(termino)) ||
                (autor.orcid && autor.orcid.toLowerCase().includes(termino))
            );
        }

        return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [autores, filtros]);

    // Manejar cambios en el formulario
    const manejarCambioFormulario = (campo: keyof FormularioAutor, valor: string) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setFormulario({
            nombre: '',
            biografia: '',
            orcid: ''
        });
        setAutorEditando(null);
        setMostrarFormulario(false);
    };

    // Abrir formulario para crear
    const abrirFormularioCrear = () => {
        limpiarFormulario();
        setMostrarFormulario(true);
    };

    // Abrir formulario para editar
    const abrirFormularioEditar = (autor: Autor) => {
        setFormulario({
            nombre: autor.nombre,
            biografia: autor.biografia || '',
            orcid: autor.orcid || ''
        });
        setAutorEditando(autor);
        setMostrarFormulario(true);
    };

    // Validar formulario
    const validarFormulario = (): boolean => {
        if (!formulario.nombre.trim()) {
            setError('El nombre del autor es obligatorio');
            return false;
        }

        if (formulario.nombre.length > 100) {
            setError('El nombre no puede exceder 100 caracteres');
            return false;
        }

        if (formulario.biografia && formulario.biografia.length > 1000) {
            setError('La biografía no puede exceder 1000 caracteres');
            return false;
        }

        if (formulario.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(formulario.orcid)) {
            setError('El formato del ORCID no es válido (ejemplo: 0000-0000-0000-0000)');
            return false;
        }

        return true;
    };

    // Guardar autor
    const guardarAutor = async () => {
        if (!validarFormulario()) {
            return;
        }

        try {
            setProcesando(true);
            setError(null);

            if (autorEditando) {
                // Actualizar autor existente
                const datosActualizacion: ActualizarAutorRequest = {
                    autorID: autorEditando.autorID,
                    nombre: formulario.nombre.trim(),
                    biografia: formulario.biografia?.trim() || undefined,
                    orcid: formulario.orcid?.trim() || undefined
                };
                await actualizarAutor(autorEditando.autorID, datosActualizacion);
            } else {
                // Crear nuevo autor
                const datosCreacion: CrearAutorRequest = {
                    nombre: formulario.nombre.trim(),
                    biografia: formulario.biografia?.trim() || undefined,
                    orcid: formulario.orcid?.trim() || undefined
                };
                await crearAutor(datosCreacion);
            }

            await cargarAutores();
            limpiarFormulario();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al guardar el autor');
            console.error('Error al guardar autor:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Confirmar eliminación
    const confirmarEliminacion = (autor: Autor) => {
        setAutorAEliminar(autor);
        setMostrarConfirmacion(true);
    };

    // Eliminar autor
    const eliminarAutorConfirmado = async () => {
        if (!autorAEliminar) return;

        try {
            setProcesando(true);
            setError(null);
            await eliminarAutor(autorAEliminar.autorID);
            await cargarAutores();
            setMostrarConfirmacion(false);
            setAutorAEliminar(null);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al eliminar el autor');
            console.error('Error al eliminar autor:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Cancelar eliminación
    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setAutorAEliminar(null);
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
                        <h1>Administración de Autores</h1>
                        <p>Gestiona los autores del catálogo de la biblioteca</p>
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
                            placeholder="Buscar autores por nombre, biografía o ORCID..."
                            value={filtros.busqueda}
                            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                            className="search-input"
                        />
                    </div>
                    <button 
                        className="btn-primary"
                        onClick={abrirFormularioCrear}
                    >
                        + Nuevo Autor
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Lista de autores */}
                <div className="admin-table-container">
                    {autoresFiltrados.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron autores</p>
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
                        <div className="autores-grid">
                            {autoresFiltrados.map((autor) => (
                                <div key={autor.autorID} className="autor-card">
                                    <div className="autor-header">
                                        <h3 className="autor-nombre">{autor.nombre}</h3>
                                        <div className="autor-actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => abrirFormularioEditar(autor)}
                                                title="Editar autor"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => confirmarEliminacion(autor)}
                                                title="Eliminar autor"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    {autor.biografia && (
                                        <p className="autor-biografia">{autor.biografia}</p>
                                    )}
                                    {autor.orcid && (
                                        <p className="autor-orcid">
                                            <strong>ORCID:</strong> {autor.orcid}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contador de resultados */}
                <div className="results-count">
                    Mostrando {autoresFiltrados.length} de {autores.length} autores
                </div>
            </div>

            {/* Modal de formulario */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{autorEditando ? 'Editar Autor' : 'Nuevo Autor'}</h2>
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
                                    placeholder="Nombre completo del autor"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="biografia">Biografía</label>
                                <textarea
                                    id="biografia"
                                    value={formulario.biografia}
                                    onChange={(e) => manejarCambioFormulario('biografia', e.target.value)}
                                    placeholder="Biografía del autor (opcional)"
                                    maxLength={1000}
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="orcid">ORCID</label>
                                <input
                                    type="text"
                                    id="orcid"
                                    value={formulario.orcid}
                                    onChange={(e) => manejarCambioFormulario('orcid', e.target.value)}
                                    placeholder="0000-0000-0000-0000"
                                    maxLength={19}
                                />
                                <small>Formato: 0000-0000-0000-0000</small>
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
                                onClick={guardarAutor}
                                disabled={procesando}
                            >
                                {procesando ? 'Guardando...' : (autorEditando ? 'Actualizar' : 'Crear')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {mostrarConfirmacion && autorAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Confirmar Eliminación</h2>
                        </div>
                        
                        <div className="modal-body">
                            <p>¿Estás seguro de que deseas eliminar el autor <strong>{autorAEliminar.nombre}</strong>?</p>
                            <p className="warning-text">Esta acción no se puede deshacer.</p>
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
                                onClick={eliminarAutorConfirmado}
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

export default AdminAuthors;
