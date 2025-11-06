import { useEffect } from 'react';

interface SEOConfig {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
}

export const useSEO = (config: SEOConfig) => {
    useEffect(() => {
        const {
            title = "Biblioteca FISI - Sistema de Gestión Bibliotecaria",
            description = "Sistema de gestión bibliotecaria moderno para la Facultad de Ingeniería de Sistemas e Informática de la UNMSM",
            keywords = "biblioteca, FISI, UNMSM, libros, préstamos, gestión bibliotecaria",
            author = "Biblioteca FISI",
            ogTitle,
            ogDescription,
            ogImage = "/vite.svg",
            ogUrl,
            twitterCard = "summary_large_image",
            twitterTitle,
            twitterDescription,
            twitterImage
        } = config;

        // Actualizar título de la página
        document.title = title;

        // Función para actualizar o crear meta tags
        const updateMetaTag = (name: string, content: string, property?: boolean) => {
            const attribute = property ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
            
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attribute, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        // Meta tags básicos
        updateMetaTag('description', description);
        updateMetaTag('keywords', keywords);
        updateMetaTag('author', author);
        updateMetaTag('robots', 'index, follow');

        // Open Graph tags
        updateMetaTag('og:title', ogTitle || title, true);
        updateMetaTag('og:description', ogDescription || description, true);
        updateMetaTag('og:image', ogImage, true);
        updateMetaTag('og:type', 'website', true);
        if (ogUrl) {
            updateMetaTag('og:url', ogUrl, true);
        }

        // Twitter Card tags
        updateMetaTag('twitter:card', twitterCard);
        updateMetaTag('twitter:title', twitterTitle || title);
        updateMetaTag('twitter:description', twitterDescription || description);
        if (twitterImage) {
            updateMetaTag('twitter:image', twitterImage);
        }

        // Meta tags adicionales para PWA
        updateMetaTag('theme-color', '#1e293b');
        updateMetaTag('msapplication-TileColor', '#1e293b');
        updateMetaTag('apple-mobile-web-app-capable', 'yes');
        updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');

    }, [config]);
};

// Configuraciones predefinidas para diferentes páginas
export const SEOConfigs = {
    login: {
        title: "Iniciar Sesión - Biblioteca FISI",
        description: "Inicia sesión en el sistema de gestión bibliotecaria de la FISI",
        keywords: "login, inicio sesión, biblioteca FISI, autenticación"
    },
    registro: {
        title: "Registro de Usuario - Biblioteca FISI",
        description: "Regístrate en el sistema de gestión bibliotecaria de la FISI",
        keywords: "registro, crear cuenta, biblioteca FISI, nuevo usuario"
    },
    dashboard: {
        title: "Dashboard - Biblioteca FISI",
        description: "Panel principal del sistema de gestión bibliotecaria",
        keywords: "dashboard, panel principal, biblioteca FISI, métricas"
    },
    catalogo: {
        title: "Catálogo de Libros - Biblioteca FISI",
        description: "Explora nuestro catálogo completo de libros y recursos bibliográficos",
        keywords: "catálogo, libros, biblioteca FISI, búsqueda, préstamos"
    },
    perfil: {
        title: "Mi Perfil - Biblioteca FISI",
        description: "Gestiona tu información personal y configuración de cuenta",
        keywords: "perfil, usuario, configuración, biblioteca FISI"
    },
    prestamos: {
        title: "Mis Préstamos - Biblioteca FISI",
        description: "Consulta tu historial de préstamos y devoluciones",
        keywords: "préstamos, historial, devoluciones, biblioteca FISI"
    },
    notificaciones: {
        title: "Notificaciones - Biblioteca FISI",
        description: "Mantente al día con las notificaciones de la biblioteca",
        keywords: "notificaciones, alertas, biblioteca FISI, novedades"
    },
    multas: {
        title: "Mis Multas - Biblioteca FISI",
        description: "Gestiona tus multas y mantén tu historial al día",
        keywords: "multas, pagos, biblioteca FISI, gestión financiera"
    },
    adminLibros: {
        title: "Administración de Libros - Biblioteca FISI",
        description: "Panel de administración para gestión de libros y catálogo",
        keywords: "administración, libros, gestión, biblioteca FISI"
    },
    adminEjemplares: {
        title: "Administración de Ejemplares - Biblioteca FISI",
        description: "Panel de administración para gestión de ejemplares",
        keywords: "administración, ejemplares, gestión, biblioteca FISI"
    },
    adminAutores: {
        title: "Administración de Autores - Biblioteca FISI",
        description: "Panel de administración para gestión de autores del catálogo",
        keywords: "administración, autores, gestión, biblioteca FISI"
    },
    adminCategorias: {
        title: "Administración de Categorías - Biblioteca FISI",
        description: "Panel de administración para gestión de categorías del catálogo",
        keywords: "administración, categorías, gestión, biblioteca FISI"
    }
};
