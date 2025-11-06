import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Home, 
    ArrowLeft, 
    Search,
    AlertTriangle,
    BookOpen
} from 'lucide-react';
import { useSEO } from '../../../../hooks/useSEO';
import './NotFound.css';

const NotFound: React.FC = () => {
    // SEO para página 404
    useSEO({
        title: "Página no encontrada - Biblioteca FISI",
        description: "La página que buscas no existe. Regresa al inicio o explora nuestro catálogo.",
        keywords: "404, página no encontrada, error, biblioteca FISI"
    });

    return (
        <div className="not-found-page">
            <div className="not-found-container">
                {/* Ilustración */}
                <div className="not-found-illustration">
                    <div className="error-code">
                        <span className="code-4">4</span>
                        <span className="code-0">0</span>
                        <span className="code-4">4</span>
                    </div>
                    <div className="floating-books">
                        <BookOpen size={24} className="book book-1" />
                        <BookOpen size={20} className="book book-2" />
                        <BookOpen size={18} className="book book-3" />
                        <BookOpen size={22} className="book book-4" />
                    </div>
                </div>

                {/* Contenido */}
                <div className="not-found-content">
                    <div className="error-icon">
                        <AlertTriangle size={48} />
                    </div>
                    
                    <h1 className="error-title">¡Ups! Página no encontrada</h1>
                    
                    <p className="error-description">
                        La página que buscas no existe o ha sido movida. 
                        No te preocupes, te ayudamos a encontrar lo que necesitas.
                    </p>

                    {/* Sugerencias */}
                    <div className="suggestions">
                        <h3>¿Qué puedes hacer?</h3>
                        <ul className="suggestions-list">
                            <li>
                                <Search size={16} />
                                <span>Verificar la URL en la barra de direcciones</span>
                            </li>
                            <li>
                                <BookOpen size={16} />
                                <span>Explorar nuestro catálogo de libros</span>
                            </li>
                            <li>
                                <Home size={16} />
                                <span>Regresar al dashboard principal</span>
                            </li>
                        </ul>
                    </div>

                    {/* Botones de acción */}
                    <div className="action-buttons">
                        <Link to="/dashboard" className="btn btn-primary">
                            <Home size={20} />
                            <span>Ir al Dashboard</span>
                        </Link>
                        
                        <Link to="/catalogo" className="btn btn-secondary">
                            <BookOpen size={20} />
                            <span>Explorar Catálogo</span>
                        </Link>
                        
                        <button 
                            onClick={() => window.history.back()} 
                            className="btn btn-outline"
                        >
                            <ArrowLeft size={20} />
                            <span>Volver Atrás</span>
                        </button>
                    </div>

                    {/* Información adicional */}
                    <div className="help-info">
                        <p>
                            Si crees que esto es un error, puedes contactar al administrador del sistema.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
