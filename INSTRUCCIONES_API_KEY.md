# 🔑 Cómo obtener tu API Key de Google Places

## Ya tienes el proyecto "datosinmo" creado ✅

Ahora necesitas crear una **API Key** (no OAuth2):

### Pasos:

1. **Ve a Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials?project=datosinmo

2. **Habilita las APIs necesarias:**
   - Ve a: https://console.cloud.google.com/apis/library?project=datosinmo
   - Busca y habilita:
     - ✅ **Places API** (la principal)
     - ✅ **Places API (New)** (opcional, es la versión nueva)
     - ✅ **Geocoding API** (opcional, para geocodificación)

3. **Crear API Key:**
   - Ve a: https://console.cloud.google.com/apis/credentials?project=datosinmo
   - Haz clic en **"+ CREAR CREDENCIALES"** (arriba)
   - Selecciona **"Clave de API"**
   - ¡Se creará tu API Key! 🎉

4. **Copiar la API Key:**
   - Copia la API Key que aparece
   - Pégala en el archivo `.env` en la línea:
     ```
     GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
     ```

5. **Restringir la API Key (Recomendado para seguridad):**
   - Haz clic en **"Editar clave de API"**
   - En "Restricciones de la aplicación", selecciona **"Direcciones IP"**
   - Agrega tu IP actual o deja sin restricción para desarrollo
   - En "Restricciones de API", selecciona **"Restringir clave"**
   - Marca solo las APIs que necesitas:
     - ✅ Places API
     - ✅ Places API (New)
     - ✅ Geocoding API
   - Guarda los cambios

## 💰 Costos

### Cuota gratuita mensual:
- **$200 USD de crédito gratis** cada mes
- Places API (Text Search): $32 por 1,000 requests
- Con $200 gratis = **~6,250 búsquedas gratis/mes**

### Para este proyecto:
- 8 ciudades × 100 inmobiliarias = 800 requests ≈ $25 USD
- **¡Entra en la cuota gratuita!** ✅

## 🔍 Verificar que funciona:

Después de agregar la API Key al archivo `.env`, ejecuta:

```bash
npm run scrape:google
```

Si ves este mensaje: ✅
```
🔍 Buscando inmobiliarias en CABA...
```

Si ves un error de API Key: ❌
```
❌ ERROR: Configura tu GOOGLE_MAPS_API_KEY
```

## ⚠️ Archivo OAuth2 vs API Key

El archivo que descargaste (`client_secret_...json`) es para **OAuth2**, que sirve para:
- Aplicaciones que acceden a datos privados del usuario
- Login con Google
- Acceso a Drive, Gmail, Calendar del usuario

Para este proyecto necesitas **API Key** que sirve para:
- ✅ Acceder a datos públicos de Google Maps
- ✅ Buscar lugares públicos
- ✅ No requiere login del usuario

## 🆘 ¿Problemas?

### "API Places no habilitada"
```
ERROR: Google Places API has not been used in project...
```
**Solución:** Ve al paso 2 y habilita Places API

### "API Key inválida"
```
ERROR: The provided API key is invalid
```
**Solución:** Verifica que copiaste bien la API Key al archivo `.env`

### "Quota exceeded"
```
ERROR: You have exceeded your daily quota
```
**Solución:** 
- Espera hasta mañana
- O habilita facturación en Google Cloud

---

**🎯 Próximo paso:** Una vez que tengas tu API Key en el archivo `.env`, ejecuta:
```bash
npm run scrape:google
```
