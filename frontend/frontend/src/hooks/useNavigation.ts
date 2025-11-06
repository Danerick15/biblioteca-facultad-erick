import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const LAST_PATH_KEY = 'lastPath';

export const useNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Guardar la ruta actual en localStorage cada vez que cambia
    useEffect(() => {
        if (location.pathname !== '/login' && location.pathname !== '/registro') {
            localStorage.setItem(LAST_PATH_KEY, location.pathname);
        }
    }, [location.pathname]);

    const goToCatalogo = () => {
        navigate('/catalogo');
    };

    const goToPerfil = () => {
        navigate('/perfil');
    };

    const goToPrestamos = () => {
        navigate('/prestamos');
    };

    const goToAdminLibros = () => {
        navigate('/admin/libros');
    };

    const goToAdminEjemplares = () => {
        navigate('/admin/ejemplares');
    };

    const goBack = () => {
        navigate(-1);
    };

    const resetToCatalogo = () => {
        navigate('/catalogo', { replace: true });
        localStorage.setItem(LAST_PATH_KEY, '/catalogo');
    };

    const getLastPath = (): string => {
        return localStorage.getItem(LAST_PATH_KEY) || '/catalogo';
    };

    return {
        navigate,
        goToCatalogo,
        goToPerfil,
        goToPrestamos,
        goToAdminLibros,
        goToAdminEjemplares,
        goBack,
        resetToCatalogo,
        getLastPath,
        currentPath: location.pathname
    };
};
