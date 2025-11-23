import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";

// Client ID de Google OAuth (en producción debe estar en variables de entorno)
// Para desarrollo, puedes usar un ID de prueba o configurar uno en Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_CLIENT_ID_AQUI";

const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
} else {
    console.error("No se encontró el elemento root");
}
