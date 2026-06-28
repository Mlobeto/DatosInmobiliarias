# 🏢 CRM Inmobiliarias - Sistema de Gestión de Leads

Sistema completo para gestionar leads de inmobiliarias con frontend React y backend Node.js.

## 🎯 Características

- ✅ Dashboard con estadísticas en tiempo real
- ✅ Filtros por ciudad, estado y búsqueda
- ✅ Sistema de seguimiento (Nuevo, Contactado, Interesado, No Interesado, Cliente)
- ✅ Agregar notas a cada lead
- ✅ Visualización de datos de contacto (teléfono, web, dirección)
- ✅ Base de datos JSON persistente
- ✅ API REST completa

## 📦 Estructura

```
DatosInmobiliarias/
├── backend/           # API Node.js + Express
│   ├── server.js     # Servidor API
│   ├── importData.js # Script para importar datos
│   ├── db.json       # Base de datos (se crea automáticamente)
│   └── package.json
├── frontend/          # App React + Vite
│   ├── src/
│   │   ├── App.jsx   # Componente principal
│   │   └── index.css # Estilos
│   └── package.json
└── data/             # Datos scrapeados (JSON/CSV)
```

## 🚀 Instalación

### 1. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 2. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

## 📊 Importar Datos

Importa los datos scrapeados a la base de datos del CRM:

```bash
cd backend
node importData.js ../data/webscraping_2026-01-15T02-31-34-662Z.json
```

## ▶️ Ejecutar el Sistema

### Terminal 1: Iniciar Backend (API)

```bash
cd backend
npm start
```

Servidor corriendo en: http://localhost:3001

### Terminal 2: Iniciar Frontend (React)

```bash
cd frontend
npm run dev
```

App corriendo en: http://localhost:3000

## 🎨 Uso

### Dashboard
- Ver estadísticas generales
- Total de inmobiliarias
- Distribución por estado
- Porcentaje con teléfono/web

### Filtros
- **Buscar:** Por nombre o dirección
- **Ciudad:** Filtrar por ciudad específica
- **Estado:** Filtrar por estado del lead

### Gestión de Leads

**Estados disponibles:**
- 🆕 **Nuevo** - Lead sin contactar
- 📞 **Contactado** - Ya se hizo contacto
- ✅ **Interesado** - Mostró interés en el producto
- ❌ **No Interesado** - No le interesa
- 🎯 **Cliente** - Se convirtió en cliente

**Acciones rápidas:**
- Marcar como contactado
- Marcar como interesado
- Marcar como no interesado
- Ver detalles completos

**Modal de detalles:**
- Cambiar estado
- Agregar notas
- Ver historial de notas
- Ver todos los datos de contacto

### API Endpoints

```
GET    /api/inmobiliarias              # Listar todas (con filtros opcionales)
GET    /api/inmobiliarias/:id          # Obtener una
PUT    /api/inmobiliarias/:id          # Actualizar
POST   /api/inmobiliarias/:id/notas    # Agregar nota
GET    /api/estadisticas               # Dashboard stats
GET    /api/ciudades                   # Listar ciudades
POST   /api/importar                   # Importar datos
```

## 💡 Flujo de Trabajo Recomendado

1. **Scrapear datos:**
   ```bash
   npm run scrape:web
   ```

2. **Importar al CRM:**
   ```bash
   cd backend
   node importData.js ../data/webscraping_FECHA.json
   ```

3. **Iniciar sistema:**
   - Terminal 1: `cd backend && npm start`
   - Terminal 2: `cd frontend && npm run dev`

4. **Gestionar leads:**
   - Filtrar por ciudad
   - Contactar inmobiliarias
   - Marcar estados
   - Agregar notas de seguimiento

5. **Hacer seguimiento:**
   - Ver leads interesados
   - Revisar notas anteriores
   - Convertir a clientes

## 🎯 Mejoras Futuras

- [ ] Autenticación de usuarios
- [ ] Exportar a Excel/CSV
- [ ] Recordatorios y tareas
- [ ] Integración con email
- [ ] Gráficos y reportes
- [ ] Base de datos PostgreSQL
- [ ] Deploy a producción

## 🔧 Desarrollo

### Backend
```bash
cd backend
npm run dev  # Con nodemon (auto-reload)
```

### Frontend
```bash
cd frontend
npm run dev  # Con hot-reload
```

## 📝 Notas

- Los datos se guardan automáticamente en `backend/db.json`
- El frontend se actualiza en tiempo real
- Los filtros son instantáneos
- Las notas se guardan con timestamp

---

¡Ahora tienes un CRM completo para gestionar tus leads! 🚀
