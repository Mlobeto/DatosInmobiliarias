# 🏢 Datos Inmobiliarias Argentina

Herramienta automatizada para extraer datos de contacto de inmobiliarias en Argentina desde Google Maps y otras fuentes. Ideal para generar leads para tu SaaS.

## 🎯 Características

- ✅ Búsqueda en Google Places API (más confiable)
- ✅ Web scraping alternativo sin API
- ✅ Extracción de datos: nombre, dirección, teléfono, sitio web, email
- ✅ Export a CSV y JSON
- ✅ Consolidación y limpieza de datos
- ✅ Búsqueda por múltiples ciudades/provincias

## 📋 Requisitos

- Node.js 18 o superior
- Cuenta de Google Cloud (para usar Google Places API)
- npm o yarn

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd DatosInmobiliarias
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env y agregar tu API Key de Google
```

Para obtener una API Key:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. Habilita **Google Places API** y **Google Maps JavaScript API**
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia la API Key al archivo `.env`

## 📖 Uso

### Método 1: Google Places API (Recomendado)

```bash
npm run scrape:google
```

**Ventajas:**
- Datos más completos y precisos
- Incluye ratings, reviews, horarios
- Más rápido y confiable

**Limitaciones:**
- Requiere API Key (tiene costo después de cuota gratuita)
- Cuota gratuita: $200 USD/mes (~40,000 búsquedas)

### Método 2: Web Scraping (Gratis)

```bash
npm run scrape:web
```

**Ventajas:**
- Completamente gratis
- No requiere API Key

**Limitaciones:**
- Más lento (usa navegador)
- Puede tener limitaciones de Google
- Datos menos completos

### Consolidar datos

Después de ejecutar los scrapers, consolida y limpia los datos:

```bash
node src/utils/dataProcessor.js
```

## 📁 Estructura del proyecto

```
DatosInmobiliarias/
├── src/
│   ├── scrapers/
│   │   ├── googlePlacesScraper.js  # Scraper con Google API
│   │   └── webScraper.js           # Web scraper sin API
│   ├── utils/
│   │   └── dataProcessor.js        # Consolidación de datos
│   └── index.js                    # CLI principal
├── data/                           # Datos extraídos (CSV/JSON)
├── .env                           # Configuración (crear desde .env.example)
├── .env.example
├── package.json
└── README.md
```

## 📊 Datos extraídos

Cada inmobiliaria incluye:

- ✅ Nombre del negocio
- ✅ Dirección completa
- ✅ Ciudad/Provincia
- ✅ Teléfono de contacto
- ✅ Sitio web
- ✅ Email (cuando esté disponible)
- ✅ Rating y cantidad de reviews
- ✅ Ubicación (lat/lng)
- ✅ Horarios de atención

## ⚙️ Configuración

Edita el archivo `.env` para personalizar:

```env
# API Key de Google
GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# Ciudades/provincias a buscar (separadas por coma)
PROVINCIAS=Buenos Aires,Córdoba,Santa Fe,Mendoza,Tucumán,Salta,Rosario,CABA

# Límite de resultados por ciudad
MAX_RESULTS=100

# Delay entre requests (ms)
DELAY_BETWEEN_REQUESTS=2000
```

## 💡 Casos de uso

### 1. Exportar leads para CRM

Los archivos CSV generados se pueden importar directamente a:
- HubSpot
- Salesforce
- Pipedrive
- Google Sheets

### 2. Campañas de email marketing

Filtra inmobiliarias con email y usa los datos para:
- Mailchimp
- SendGrid
- Newsletter personalizado

### 3. Outreach telefónico

Lista de números de teléfono para:
- Cold calling
- WhatsApp Business
- SMS marketing

## 📈 Ejemplo de resultados

```json
{
  "nombre": "Inmobiliaria ABC",
  "ciudad": "Buenos Aires",
  "direccion": "Av. Corrientes 1234, C1043 CABA",
  "telefono": "+54 11 1234-5678",
  "sitioWeb": "https://www.inmobiliariabc.com.ar",
  "email": "contacto@inmobiliariabc.com.ar",
  "rating": 4.5,
  "totalReviews": 127,
  "placeId": "ChIJxxxxxxxxxxxxxxx"
}
```

## ⚠️ Consideraciones legales

- ✅ Datos públicos de Google Maps
- ⚠️ Respeta las políticas de uso de Google
- ⚠️ No hagas scraping masivo (usa delays)
- ⚠️ Cumple con leyes de protección de datos (GDPR, LGPD)
- ⚠️ Usa los datos de forma ética para contacto comercial legítimo

## 🔧 Troubleshooting

### Error: "GOOGLE_MAPS_API_KEY no configurada"

Asegúrate de:
1. Haber creado el archivo `.env` desde `.env.example`
2. Haber agregado tu API Key en el archivo `.env`

### Error: "API quota exceeded"

Has excedido la cuota gratuita de Google:
- Espera al siguiente mes
- O agrega método de pago en Google Cloud

### Web scraper no encuentra resultados

Google puede estar bloqueando requests:
- Aumenta el `DELAY_BETWEEN_REQUESTS`
- Usa el método de Google Places API en su lugar

## 📞 Soporte

Si tienes preguntas sobre:
- Configuración de la API
- Uso de los scripts
- Personalización

Abre un issue en el repositorio o consulta la documentación de:
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Puppeteer](https://pptr.dev/)

## 📝 Roadmap

- [ ] Búsqueda en otros sitios (ZonaProp, MercadoLibre)
- [ ] Validación de emails
- [ ] Enrichment de datos con redes sociales
- [ ] Dashboard web para visualización
- [ ] Export a Excel con formato
- [ ] Integración con CRMs via API

## 📄 Licencia

MIT License - Uso libre para proyectos comerciales y personales.

---

**⭐ Tip:** Empieza con el scraper de Google Places API para obtener mejores resultados. La inversión en la API se recupera rápidamente con los leads generados.
