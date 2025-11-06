import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface Usuario {
    usuarioID: number;
    nombre: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: string;
}

interface ProtectedRouteProps {
    usuario: Usuario | null;
    rolesPermitidos: string[];
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    usuario, 
    rolesPermitidos, 
    children 
}) => {
    const navigate = useNavigate();

    // Si no hay usuario, redirigir al login
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    const tienePermiso = rolesPermitidos.includes(usuario.rol);

    if (!tienePermiso) {
        // Mostrar página de acceso denegado
        return (
            <div className="access-denied-container">
                <div className="access-denied-content">
                    <h1>🚫 Acceso Denegado</h1>
                    <p>No tienes permisos para acceder a esta sección.</p>
                    <p>Tu rol actual: <strong>{usuario.rol}</strong></p>
                    <p>Roles permitidos: <strong>{rolesPermitidos.join(', ')}</strong></p>
                    <button 
                        className="btn-back" 
                        onClick={() => navigate('/catalogo')}
                    >
                        ← Volver al Catálogo
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
