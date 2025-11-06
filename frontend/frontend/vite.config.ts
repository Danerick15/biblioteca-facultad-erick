import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        open: true, // Abrir automáticamente el navegador
        proxy: {
            "/api": {
                target: "http://localhost:5180",
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks
                    'react-vendor': ['react', 'react-dom'],
                    'router-vendor': ['react-router-dom'],
                    'ui-vendor': ['lucide-react'],
                    
                    // Feature chunks
                    'auth-pages': [
                        './src/features/auth/pages/Login/Login',
                        './src/features/auth/pages/Register/Register'
                    ],
                    'main-pages': [
                        './src/features/dashboard/pages/Dashboard/Dashboard',
                        './src/features/catalog/pages/Catalog/Catalog',
                        './src/features/profile/pages/Profile/Profile'
                    ],
                    'user-pages': [
                        './src/features/loans/pages/MyLoans/MyLoans',
                        './src/features/notifications/pages/Notifications/Notifications',
                        './src/features/fines/pages/Fines/Fines'
                    ],
                    'admin-pages': [
                        './src/features/admin/books/pages/AdminBooks/AdminBooks',
                        './src/features/admin/copies/pages/AdminCopies/AdminCopies',
                        './src/features/admin/authors/pages/AdminAuthors/AdminAuthors',
                        './src/features/admin/categories/pages/AdminCategories/AdminCategories',
                        './src/features/admin/reservas/pages/AdminReservas/AdminReservas'
                    ]
                }
            }
        },
        // Optimizaciones adicionales
        minify: 'esbuild',
        // Aumentar el límite de warning de chunk size
        chunkSizeWarningLimit: 1000,
    },
    // Optimizaciones de desarrollo
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'lucide-react'
        ]
    }
})
