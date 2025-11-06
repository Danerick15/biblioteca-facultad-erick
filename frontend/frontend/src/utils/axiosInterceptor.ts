import axios from 'axios';

// Configurar interceptor para manejar errores de autorización
export const setupAxiosInterceptors = (onUnauthorized: () => void) => {
    // Interceptor de respuesta para manejar errores 401/403
    axios.interceptors.response.use(
        (response) => {
            // Si la respuesta es exitosa, la devolvemos tal como está
            return response;
        },
        (error) => {
            // Si hay un error de autorización (401 o 403)
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.warn('Error de autorización detectado:', error.response.status);
                
                // Limpiar datos de sesión
                localStorage.removeItem("usuario");
                
                // Notificar a la aplicación que el usuario no está autorizado
                onUnauthorized();
                
                // Redirigir al login o mostrar mensaje de error
                return Promise.reject({
                    ...error,
                    message: 'Sesión expirada o acceso denegado. Por favor, inicia sesión nuevamente.'
                });
            }
            
            // Para otros errores, los devolvemos tal como están
            return Promise.reject(error);
        }
    );
};

// Función para configurar headers de autorización
export const setAuthHeaders = (token?: string) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

// Función para limpiar headers de autorización
export const clearAuthHeaders = () => {
    delete axios.defaults.headers.common['Authorization'];
};
