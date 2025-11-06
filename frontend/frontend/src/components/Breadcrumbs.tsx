import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

interface BreadcrumbItem {
    label: string;
    path: string;
    icon?: React.ReactNode;
}

interface BreadcrumbsProps {
    customItems?: BreadcrumbItem[];
    showHome?: boolean;
    className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
    customItems, 
    showHome = true,
    className = '' 
}) => {
    const location = useLocation();

    // Mapeo de rutas a etiquetas
    const routeLabels: { [key: string]: { label: string; icon?: React.ReactNode } } = {
        '/dashboard': { 
            label: 'Dashboard',
            icon: <Home size={16} />
        },
        '/catalogo': { 
            label: 'Catálogo',
            icon: <Home size={16} />
        },
        '/perfil': { 
            label: 'Mi Perfil',
            icon: <Home size={16} />
        },
        '/prestamos': { 
            label: 'Mis Préstamos',
            icon: <Home size={16} />
        },
        '/notificaciones': { 
            label: 'Notificaciones',
            icon: <Home size={16} />
        },
        '/multas': { 
            label: 'Mis Multas',
            icon: <Home size={16} />
        },
        '/admin/libros': { 
            label: 'Administrar Libros',
            icon: <Home size={16} />
        },
        '/admin/ejemplares': { 
            label: 'Administrar Ejemplares',
            icon: <Home size={16} />
        }
    };

    // Generar breadcrumbs automáticamente basado en la ruta actual
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [];

        // Agregar "Inicio" si está habilitado
        if (showHome) {
            breadcrumbs.push({
                label: 'Inicio',
                path: '/dashboard',
                icon: <Home size={16} />
            });
        }

        // Construir breadcrumbs basado en los segmentos de la ruta
        let currentPath = '';
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            
            // Si es la última ruta, no es clickeable
            const isLast = index === pathSegments.length - 1;
            
            // Buscar etiqueta en el mapeo
            const routeInfo = routeLabels[currentPath];
            if (routeInfo) {
                breadcrumbs.push({
                    label: routeInfo.label,
                    path: isLast ? '' : currentPath,
                    icon: routeInfo.icon
                });
            } else {
                // Fallback: capitalizar el segmento
                breadcrumbs.push({
                    label: segment.charAt(0).toUpperCase() + segment.slice(1),
                    path: isLast ? '' : currentPath
                });
            }
        });

        return breadcrumbs;
    };

    const breadcrumbs = customItems || generateBreadcrumbs();

    // No mostrar breadcrumbs si solo hay un elemento (Inicio)
    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav className={`breadcrumbs ${className}`} aria-label="Breadcrumb">
            <ol className="breadcrumbs-list">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={item.path || index} className="breadcrumbs-item">
                            {item.icon && (
                                <span className="breadcrumbs-icon">
                                    {item.icon}
                                </span>
                            )}
                            
                            {isLast ? (
                                <span className="breadcrumbs-current" aria-current="page">
                                    {item.label}
                                </span>
                            ) : (
                                <Link 
                                    to={item.path} 
                                    className="breadcrumbs-link"
                                >
                                    {item.label}
                                </Link>
                            )}
                            
                            {!isLast && (
                                <ChevronRight 
                                    size={14} 
                                    className="breadcrumbs-separator" 
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
