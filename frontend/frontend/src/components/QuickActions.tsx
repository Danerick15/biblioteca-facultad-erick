import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, User, BarChart3, Users, Settings, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './QuickActions.css';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    route: string;
    color: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'success' | 'info';
    description?: string;
}

const QuickActions: React.FC = () => {
    const navigate = useNavigate();
    const { esAdmin } = useAuth();

    // Acciones base para todos los usuarios
    const baseActions: QuickAction[] = [
        {
            id: 'catalogo',
            label: 'Buscar Libros',
            icon: <BookOpen size={24} />,
            route: '/catalogo',
            color: 'primary',
            description: 'Explorar catálogo'
        },
        {
            id: 'prestamos',
            label: 'Mis Préstamos',
            icon: <Clock size={24} />,
            route: '/prestamos',
            color: 'secondary',
            description: 'Ver historial'
        },
        {
            id: 'reservas',
            label: 'Mis Reservas',
            icon: <Bell size={24} />,
            route: '/reservas',
            color: 'secondary',
            description: 'Ver y cancelar reservas'
        },
        {
            id: 'perfil',
            label: 'Mi Perfil',
            icon: <User size={24} />,
            route: '/perfil',
            color: 'tertiary',
            description: 'Gestionar cuenta'
        }
    ];

    // Acciones adicionales para administradores
    const adminActions: QuickAction[] = [
        {
            id: 'reportes',
            label: 'Reportes',
            icon: <BarChart3 size={24} />,
            route: '/admin/reportes',
            color: 'warning',
            description: 'Estadísticas'
        },
        {
            id: 'usuarios',
            label: 'Usuarios',
            icon: <Users size={24} />,
            route: '/admin/usuarios',
            color: 'info',
            description: 'Gestionar usuarios'
        },
        {
            id: 'reservas-admin',
            label: 'Reservas',
            icon: <Bell size={24} />,
            route: '/admin/reservas',
            color: 'warning',
            description: 'Aprobar y gestionar reservas'
        },
        {
            id: 'configuracion',
            label: 'Configuración',
            icon: <Settings size={24} />,
            route: '/admin/configuracion',
            color: 'success',
            description: 'Ajustes del sistema'
        }
    ];

    // Determinar qué acciones mostrar según el rol
    const getActions = (): QuickAction[] => {
        if (esAdmin()) {
            // Para administradores, excluir "Mis Préstamos" y "Mis Reservas"
            const baseActionsFiltradas = baseActions.filter(
                action => action.id !== 'prestamos' && action.id !== 'reservas'
            );
            return [...baseActionsFiltradas, ...adminActions];
        }
        return baseActions;
    };

    const actions = getActions();

    const handleActionClick = (route: string) => {
        navigate(route);
    };

    return (
        <div className="quick-actions">
            <div className="quick-actions-header">
                <h2>Acciones Rápidas</h2>
                <p className="quick-actions-subtitle">
                    Acceso directo a las funciones más utilizadas
                </p>
            </div>
            
            <div className="quick-actions-grid">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        className={`quick-action-btn quick-action-btn--${action.color}`}
                        onClick={() => handleActionClick(action.route)}
                        title={action.description}
                    >
                        <div className="quick-action-icon">
                            {action.icon}
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-label">{action.label}</span>
                            {action.description && (
                                <span className="quick-action-description">
                                    {action.description}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
