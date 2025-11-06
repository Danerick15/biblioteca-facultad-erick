import React, { useState, useEffect, useMemo } from 'react';
import { obtenerEjemplares, crearEjemplar, modificarEjemplar, eliminarEjemplar, cambiarEstadoEjemplar } from '../../../../../api/ejemplares';
import type { Ejemplar } from '../../../../../api/ejemplares';
import { obtenerLibros } from '../../../../../api/libros';
import type { LibroDTO } from '../../../../../api/libros';
import { useNavigation } from '../../../../../hooks/useNavigation';
import { useSEO, SEOConfigs } from '../../../../../hooks/useSEO';
import PageLoader from '../../../../../components/PageLoader';
import './AdminCopies.css';

interface FormularioEjemplar {
    libroID: number;
    numeroEjemplar: number;
    codigoBarras: string;
    ubicacion: string;
    estado: string;
    observaciones?: string;
}

interface Filtros {
    busqueda: string;
    libro: string;
    estado: string;
    ubicacion: string;
}

const AdminCopies: React.FC = () => {
    // SEO
    useSEO(SEOConfigs.adminEjemplares);
    
    const { goBack } = useNavigation();
    const [ejemplares, setEjemplares] = useState<Ejemplar[]>([]);
    const [libros, setLibros] = useState<LibroDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [ejemplarEditando, setEjemplarEditando] = useState<Ejemplar | null>(null);
    const [formulario, setFormulario] = useState<FormularioEjemplar>({
        libroID: 0,
        numeroEjemplar: 1,
        codigoBarras: '',
        ubicacion: '',
        estado: 'Disponible',
        observaciones: ''
    });
    
    // Estados de filtros
    const [filtros, setFiltros] = useState<Filtros>({
        busqueda: '',
        libro: '',
        estado: '',
        ubicacion: ''
    });
    
    // Estados de UI
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [ejemplarAEliminar, setEjemplarAEliminar] = useState<Ejemplar | null>(null);
    const [procesando, setProcesando] = useState(false);

    const estadosEjemplar = [
        'Disponible',
        'Prestado',
        'Reservado',
        'Reparacion',
        'Extraviado',
        'Baja'
    ];

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            
            const [ejemplaresData, librosData] = await Promise.all([
                obtenerEjemplares(),
                obtenerLibros()
            ]);
            
            setEjemplares(ejemplaresData);
            setLibros(librosData);
        } catch (err) {
            setError('Error al cargar los datos');
            console.error('Error al cargar datos:', err);
        } finally {
            setCargando(false);
        }
    };

    // Filtrar ejemplares
    const ejemplaresFiltrados = useMemo(() => {
        let resultado = ejemplares;

        if (filtros.busqueda.trim()) {
            const termino = filtros.busqueda.toLowerCase();
            resultado = resultado.filter(ejemplar =>
                ejemplar.codigoBarras.toLowerCase().includes(termino) ||
                ejemplar.ubicacion?.toLowerCase().includes(termino) ||
                ejemplar.observaciones?.toLowerCase().includes(termino) ||
                libros.find(l => l.libroID === ejemplar.libroID)?.titulo.toLowerCase().includes(termino)
            );
        }

        if (filtros.libro) {
            resultado = resultado.filter(ejemplar =>
                ejemplar.libroID.toString() === filtros.libro
            );
        }

        if (filtros.estado) {
            resultado = resultado.filter(ejemplar =>
                ejemplar.estado === filtros.estado
            );
        }

        if (filtros.ubicacion.trim()) {
            resultado = resultado.filter(ejemplar =>
                ejemplar.ubicacion?.toLowerCase().includes(filtros.ubicacion.toLowerCase())
            );
        }

        return resultado.sort((a, b) => {
            // Ordenar por libro y luego por número de ejemplar
            const tituloA = libros.find(l => l.libroID === a.libroID)?.titulo || '';
            const tituloB = libros.find(l => l.libroID === b.libroID)?.titulo || '';
            if (tituloA !== tituloB) {
                return tituloA.localeCompare(tituloB);
            }
            return a.numeroEjemplar - b.numeroEjemplar;
        });
    }, [ejemplares, filtros, libros]);

    // Manejar cambios en el formulario
    const manejarCambioFormulario = (campo: keyof FormularioEjemplar, valor: string | number) => {
        setFormulario(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Limpiar formulario
    const limpiarFormulario = () => {
        setFormulario({
            libroID: 0,
            numeroEjemplar: 1,
            codigoBarras: '',
            ubicacion: '',
            estado: 'Disponible',
            observaciones: ''
        });
        setEjemplarEditando(null);
        setMostrarFormulario(false);
    };

    // Abrir formulario para crear
    const abrirFormularioCrear = () => {
        limpiarFormulario();
        setMostrarFormulario(true);
    };

    // Abrir formulario para editar
    const abrirFormularioEditar = (ejemplar: Ejemplar) => {
        setFormulario({
            libroID: ejemplar.libroID,
            numeroEjemplar: ejemplar.numeroEjemplar,
            codigoBarras: ejemplar.codigoBarras,
            ubicacion: ejemplar.ubicacion || '',
            estado: ejemplar.estado,
            observaciones: ejemplar.observaciones || ''
        });
        setEjemplarEditando(ejemplar);
        setMostrarFormulario(true);
    };

    // Validar formulario
    const validarFormulario = (): boolean => {
        if (!formulario.libroID) {
            setError('Debe seleccionar un libro');
            return false;
        }

        if (!formulario.codigoBarras.trim()) {
            setError('El código de barras es obligatorio');
            return false;
        }

        if (!formulario.ubicacion.trim()) {
            setError('La ubicación es obligatoria');
            return false;
        }

        if (formulario.numeroEjemplar < 1) {
            setError('El número de ejemplar debe ser mayor a 0');
            return false;
        }

        return true;
    };

    // Guardar ejemplar
    const guardarEjemplar = async () => {
        if (!validarFormulario()) {
            return;
        }

        try {
            setProcesando(true);
            setError(null);

            const datosEjemplar = {
                libroID: formulario.libroID,
                numeroEjemplar: formulario.numeroEjemplar,
                codigoBarras: formulario.codigoBarras.trim(),
                ubicacion: formulario.ubicacion.trim() || '',
                estado: formulario.estado,
                observaciones: formulario.observaciones?.trim() || undefined
            };

            if (ejemplarEditando) {
                await modificarEjemplar({ ...ejemplarEditando, ...datosEjemplar });
            } else {
                await crearEjemplar(datosEjemplar);
            }

            await cargarDatos();
            limpiarFormulario();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al guardar el ejemplar');
            console.error('Error al guardar ejemplar:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Cambiar estado del ejemplar
    const cambiarEstado = async (ejemplar: Ejemplar, nuevoEstado: string) => {
        try {
            setProcesando(true);
            setError(null);
            await cambiarEstadoEjemplar(ejemplar.ejemplarID, nuevoEstado);
            await cargarDatos();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al cambiar el estado del ejemplar');
            console.error('Error al cambiar estado:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Confirmar eliminación
    const confirmarEliminacion = (ejemplar: Ejemplar) => {
        setEjemplarAEliminar(ejemplar);
        setMostrarConfirmacion(true);
    };

    // Eliminar ejemplar
    const eliminarEjemplarConfirmado = async () => {
        if (!ejemplarAEliminar) return;

        try {
            setProcesando(true);
            setError(null);
            await eliminarEjemplar(ejemplarAEliminar.ejemplarID);
            await cargarDatos();
            setMostrarConfirmacion(false);
            setEjemplarAEliminar(null);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { mensaje?: string } } };
            setError(error.response?.data?.mensaje || 'Error al eliminar el ejemplar');
            console.error('Error al eliminar ejemplar:', err);
        } finally {
            setProcesando(false);
        }
    };

    // Cancelar eliminación
    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false);
        setEjemplarAEliminar(null);
    };

    // Obtener el color del estado
    const obtenerColorEstado = (estado: string) => {
        switch (estado) {
            case 'Disponible': return 'disponible';
            case 'Prestado': return 'prestado';
            case 'Reservado': return 'reservado';
            case 'Reparacion': return 'reparacion';
            case 'Extraviado': return 'extraviado';
            case 'Baja': return 'baja';
            default: return 'disponible';
        }
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
                        <h1>Administración de Ejemplares</h1>
                        <p>Gestiona los ejemplares físicos de la biblioteca</p>
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
                                placeholder="Buscar por código de barras, ubicación, observaciones o libro..."
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                                className="search-input"
                            />
                        </div>
                        
                        <div className="filter-row">
                            <select
                                value={filtros.libro}
                                onChange={(e) => setFiltros(prev => ({ ...prev, libro: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">Todos los libros</option>
                                {libros.map(libro => (
                                    <option key={libro.libroID} value={libro.libroID.toString()}>
                                        {libro.titulo}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filtros.estado}
                                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                                className="filter-select"
                            >
                                <option value="">Todos los estados</option>
                                {estadosEjemplar.map(estado => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        className="btn-primary"
                        onClick={abrirFormularioCrear}
                    >
                        + Nuevo Ejemplar
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Lista de ejemplares */}
                <div className="admin-table-container">
                    {ejemplaresFiltrados.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron ejemplares</p>
                            {Object.values(filtros).some(f => f.trim()) && (
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setFiltros({
                                        busqueda: '',
                                        libro: '',
                                        estado: '',
                                        ubicacion: ''
                                    })}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="ejemplares-grid">
                            {ejemplaresFiltrados.map((ejemplar) => (
                                <div key={ejemplar.ejemplarID} className="ejemplar-card">
                                    <div className="ejemplar-header">
                                        <div className="ejemplar-info-principal">
                                            <h3 className="ejemplar-libro">{libros.find(l => l.libroID === ejemplar.libroID)?.titulo || 'Libro no encontrado'}</h3>
                                            <p className="ejemplar-codigo">
                                                <strong>Código:</strong> {ejemplar.codigoBarras}
                                            </p>
                                        </div>
                                        <div className="ejemplar-actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => abrirFormularioEditar(ejemplar)}
                                                title="Editar ejemplar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => confirmarEliminacion(ejemplar)}
                                                title="Eliminar ejemplar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="ejemplar-details">
                                        <div className="ejemplar-meta">
                                            <p className="ejemplar-numero">
                                                <strong>Ejemplar #:</strong> {ejemplar.numeroEjemplar}
                                            </p>
                                            <p className="ejemplar-ubicacion">
                                                <strong>Ubicación:</strong> {ejemplar.ubicacion}
                                            </p>
                                        </div>

                                        <div className="ejemplar-estado-container">
                                            <span className={`estado-badge ${obtenerColorEstado(ejemplar.estado)}`}>
                                                {ejemplar.estado}
                                            </span>
                                            
                                            <select
                                                value={ejemplar.estado}
                                                onChange={(e) => cambiarEstado(ejemplar, e.target.value)}
                                                className="estado-select"
                                                disabled={procesando}
                                            >
                                                {estadosEjemplar.map(estado => (
                                                    <option key={estado} value={estado}>{estado}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {ejemplar.observaciones && (
                                            <div className="ejemplar-observaciones">
                                                <strong>Observaciones:</strong> {ejemplar.observaciones}
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
                    Mostrando {ejemplaresFiltrados.length} de {ejemplares.length} ejemplares
                </div>
            </div>

            {/* Modal de formulario */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{ejemplarEditando ? 'Editar Ejemplar' : 'Nuevo Ejemplar'}</h2>
                            <button 
                                className="btn-close"
                                onClick={limpiarFormulario}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="libroID">Libro *</label>
                                <select
                                    id="libroID"
                                    value={formulario.libroID}
                                    onChange={(e) => manejarCambioFormulario('libroID', parseInt(e.target.value))}
                                    required
                                >
                                    <option value={0}>Seleccionar libro</option>
                                    {libros.map(libro => (
                                        <option key={libro.libroID} value={libro.libroID}>
                                            {libro.titulo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="numeroEjemplar">Número de Ejemplar *</label>
                                    <input
                                        type="number"
                                        id="numeroEjemplar"
                                        value={formulario.numeroEjemplar}
                                        onChange={(e) => manejarCambioFormulario('numeroEjemplar', parseInt(e.target.value))}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="codigoBarras">Código de Barras *</label>
                                    <input
                                        type="text"
                                        id="codigoBarras"
                                        value={formulario.codigoBarras}
                                        onChange={(e) => manejarCambioFormulario('codigoBarras', e.target.value)}
                                        placeholder="Código único del ejemplar"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="ubicacion">Ubicación *</label>
                                    <input
                                        type="text"
                                        id="ubicacion"
                                        value={formulario.ubicacion}
                                        onChange={(e) => manejarCambioFormulario('ubicacion', e.target.value)}
                                        placeholder="Estante, sección, etc."
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="estado">Estado *</label>
                                    <select
                                        id="estado"
                                        value={formulario.estado}
                                        onChange={(e) => manejarCambioFormulario('estado', e.target.value)}
                                        required
                                    >
                                        {estadosEjemplar.map(estado => (
                                            <option key={estado} value={estado}>{estado}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="observaciones">Observaciones</label>
                                <textarea
                                    id="observaciones"
                                    value={formulario.observaciones}
                                    onChange={(e) => manejarCambioFormulario('observaciones', e.target.value)}
                                    placeholder="Observaciones adicionales (opcional)"
                                    rows={3}
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
                                onClick={guardarEjemplar}
                                disabled={procesando}
                            >
                                {procesando ? 'Guardando...' : (ejemplarEditando ? 'Actualizar' : 'Crear')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación */}
            {mostrarConfirmacion && ejemplarAEliminar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Confirmar Eliminación</h2>
                        </div>
                        
                        <div className="modal-body">
                            <p>¿Estás seguro de que deseas eliminar el ejemplar <strong>{ejemplarAEliminar.codigoBarras}</strong>?</p>
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
                                onClick={eliminarEjemplarConfirmado}
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

export default AdminCopies;