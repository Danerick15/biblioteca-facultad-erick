# ⚡ Inicio Rápido

Guía rápida para poner en marcha el sistema en 5 minutos.

---

## Prerrequisitos

- ✅ .NET 9.0 SDK instalado
- ✅ Node.js 18+ instalado
- ✅ SQL Server 2019+ ejecutándose
- ✅ Git instalado

---

## 🚀 Pasos Rápidos

### 1. Clonar el Repositorio

```bash
git clone https://github.com/G-E-L-O/biblioteca-facultad.git
cd biblioteca-facultad
```

### 2. Configurar Base de Datos

```bash
# Ejecutar script SQL en SSMS
# Archivo: database/BibliotecaFISI_Simplificado.sql

# Cargar datos (opcional)
cd database
python cargar_datos_completos.py
```

### 3. Configurar Backend

```bash
cd backend/NeoLibro.WebAPI

# Actualizar connection string en appsettings.json
# Luego ejecutar:
dotnet restore
dotnet run
```

Backend disponible en: `http://localhost:5000`

### 4. Configurar Frontend

```bash
cd frontend/frontend
npm install
npm run dev
```

Frontend disponible en: `http://localhost:5173`

---

## ✅ Verificación

1. Abre `http://localhost:5173` en tu navegador
2. Deberías ver la pantalla de login
3. Accede a `http://localhost:5000/swagger` para ver la API

---

## 📚 Siguiente Paso

Para una instalación completa y detallada, consulta la [Guía de Instalación Completa](installation.md).

---

## 🆘 Problemas?

Consulta la sección de [Troubleshooting](../troubleshooting/common-issues.md) si encuentras problemas.

