#!/usr/bin/env bash
set -e

########################################
# CONFIGURACIÓN BÁSICA
########################################

# Ruta base del proyecto clonado en Ubuntu
BASE="/home/dan/biblioteca-facultad"

FRONT="$BASE/frontend/frontend"
BACK="$BASE/backend/NeoLibro.WebAPI"

BACKEND_PORT=5000
FRONTEND_PORT=4200

# SQL Server en Windows (VMnet8)
SQL_SERVER_HOST="192.168.229.1"
SQL_SERVER_PORT="1433"

SQL_DB_NAME="NeoLibroDB"
SQL_USER="sa"
SQL_PASSWORD="TuPasswordAqui"

NGROK_AUTHTOKEN=""

########################################
# FUNCIONES
########################################

log() { echo -e "\n[DEPLOY] $1\n"; }

check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "[ERROR] No se encontró '$1'."
    exit 1
  fi
}

########################################
# DEPENDENCIAS
########################################

log "Verificando dependencias..."
check_command dotnet
check_command npm
check_command npx
check_command ngrok

if ! npm list -g http-server &>/dev/null; then
  log "Instalando http-server..."
  sudo npm install -g http-server
fi

########################################
# EXPORTAR VARIABLES BACKEND
########################################

log "Configurando variables del backend..."

export ASPNETCORE_ENVIRONMENT="Development"
export ASPNETCORE_URLS="http://0.0.0.0:${BACKEND_PORT}"

export ConnectionStrings__cnnNeoLibroDB="Server=${SQL_SERVER_HOST},${SQL_SERVER_PORT};Database=${SQL_DB_NAME};User Id=${SQL_USER};Password=${SQL_PASSWORD};TrustServerCertificate=True;Encrypt=False"

#!/usr/bin/env bash
set -e

########################################
# CONFIGURACIÓN BÁSICA
########################################

# Ruta base del proyecto clonado en Ubuntu
BASE="/home/dan/biblioteca-facultad"

FRONT="$BASE/frontend/frontend"
BACK="$BASE/backend/NeoLibro.WebAPI"

BACKEND_PORT=5000
FRONTEND_PORT=4200

# SQL Server en Windows (VMnet8)
SQL_SERVER_HOST="192.168.229.1"
SQL_SERVER_PORT="1433"

SQL_DB_NAME="NeoLibroDB"
SQL_USER="sa"
SQL_PASSWORD="TuPasswordAqui"

NGROK_AUTHTOKEN=""

########################################
# FUNCIONES
########################################

log() { echo -e "\n[DEPLOY] $1\n"; }

check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "[ERROR] No se encontró '$1'."
    exit 1
  fi
}

########################################
# DEPENDENCIAS
########################################

log "Verificando dependencias..."
check_command dotnet
check_command npm
check_command npx
check_command ngrok

if ! npm list -g http-server &>/dev/null; then
  log "Instalando http-server..."
  sudo npm install -g http-server
fi

########################################
# EXPORTAR VARIABLES BACKEND
########################################

log "Configurando variables del backend..."

export ASPNETCORE_ENVIRONMENT="Development"
export ASPNETCORE_URLS="http://0.0.0.0:${BACKEND_PORT}"

export ConnectionStrings__cnnNeoLibroDB="Server=${SQL_SERVER_HOST},${SQL_SERVER_PORT};Database=${SQL_DB_NAME};User Id=${SQL_USER};Password=${SQL_PASSWORD};TrustServerCertificate=True;Encrypt=False"

########################################
# BUILD FRONTEND
########################################

log "Construyendo frontend..."

cd "$FRONT"
npm install
npm run build

########################################
# INICIAR BACKEND
########################################

log "Iniciando backend..."

cd "$BACK"
dotnet run --urls "http://0.0.0.0:${BACKEND_PORT}" &
BACK_PID=$!
sleep 5

########################################
# HTTP SERVER FRONTEND
########################################

log "Iniciando servidor estático..."

cd "$FRONT/dist"
npx http-server . \
  -p "${FRONTEND_PORT}" \
  --cors \
  -P "http://localhost:${BACKEND_PORT}" \
  --fallback "index.html" &
HTTP_PID=$!

sleep 3

########################################
# NGROK
########################################

log "Exponiendo aplicación con ngrok..."

if [ -n "$NGROK_AUTHTOKEN" ]; then
  ngrok config add-authtoken "$NGROK_AUTHTOKEN"
fi

ngrok http "${FRONTEND_PORT}"

########################################
# LIMPIEZA
########################################

log "Cerrando procesos..."
kill "$BACK_PID" "$HTTP_PID" 2>/dev/null || true

log "FIN DEL DEPLOY."
