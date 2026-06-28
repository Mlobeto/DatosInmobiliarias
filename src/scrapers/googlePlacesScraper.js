import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PROVINCIAS = process.env.PROVINCIAS?.split(',') || ['Buenos Aires', 'CABA', 'Córdoba'];
const MAX_RESULTS = parseInt(process.env.MAX_RESULTS) || 100;
const DELAY = parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 2000;

// Coordenadas de ciudades pequeñas (menos de 50,000 habitantes)
// Provincias: Santa Fe, Córdoba, Buenos Aires, Catamarca, La Rioja, Salta, Tucumán
const COORDENADAS_CIUDADES = {
  // Santa Fe (ciudades pequeñas)
  'Cañada de Gómez': { lat: -32.8167, lng: -61.3833 },
  'Casilda': { lat: -33.0439, lng: -61.1678 },
  'Firmat': { lat: -33.4586, lng: -61.4839 },
  'Totoras': { lat: -32.5833, lng: -61.1667 },
  'Armstrong': { lat: -32.7833, lng: -61.6000 },
  'Esperanza': { lat: -31.4489, lng: -60.9306 },
  'Coronda': { lat: -31.9667, lng: -60.9167 },
  'San Javier': { lat: -30.5764, lng: -59.9311 },
  'Villa Constitución': { lat: -33.2306, lng: -60.3306 },
  
  // Córdoba (ciudades pequeñas)
  'Arroyito': { lat: -31.4167, lng: -63.0500 },
  'Morteros': { lat: -30.7111, lng: -61.9997 },
  'Las Varillas': { lat: -31.8717, lng: -62.7189 },
  'Laboulaye': { lat: -34.1267, lng: -63.3892 },
  'Oncativo': { lat: -31.9111, lng: -63.6833 },
  'Jesús María': { lat: -30.9806, lng: -64.0958 },
  'La Falda': { lat: -31.0833, lng: -64.4833 },
  'Marcos Juárez': { lat: -32.6978, lng: -62.1014 },
  'Las Higueras': { lat: -33.0833, lng: -64.3000 },
  
  // Buenos Aires (ciudades pequeñas)
  'Carmen de Patagones': { lat: -40.7994, lng: -62.9808 },
  'Coronel Dorrego': { lat: -38.7167, lng: -61.2833 },
  'Coronel Pringles': { lat: -37.9833, lng: -61.3500 },
  'General Villegas': { lat: -35.0328, lng: -63.0114 },
  'General Pinto': { lat: -34.7667, lng: -61.8833 },
  'Bragado': { lat: -35.1167, lng: -60.4833 },
  '25 de Mayo': { lat: -35.4333, lng: -60.1667 },
  'Saladillo': { lat: -35.6333, lng: -59.7833 },
  'Roque Pérez': { lat: -35.4167, lng: -59.3333 },
  'San Antonio de Areco': { lat: -34.2500, lng: -59.4667 },
  'Capilla del Señor': { lat: -34.2833, lng: -59.1167 },
  'Capitán Sarmiento': { lat: -34.1667, lng: -59.8000 },
  'Salán': { lat: -35.6333, lng: -61.2167 },
  
  // Catamarca
  'Aimogasta': { lat: -28.5667, lng: -66.8167 },
  'Tinogasta': { lat: -28.0667, lng: -67.5667 },
  'Andalgalá': { lat: -27.5833, lng: -66.3167 },
  'Belén': { lat: -27.6500, lng: -67.0333 },
  
  // La Rioja
  'Chilecito': { lat: -29.1639, lng: -67.4983 },
  'Arauco': { lat: -28.5833, lng: -66.7833 },
  'Chamical': { lat: -30.3617, lng: -66.3131 },
  
  // Salta (ciudades pequeñas)
  'Cafayate': { lat: -26.0739, lng: -65.9778 },
  'Rosario de la Frontera': { lat: -25.8000, lng: -64.9667 },
  'Embarcación': { lat: -23.2167, lng: -64.0833 },
  'Joaquín V. González': { lat: -25.0833, lng: -64.1167 },
  'San José de Metán': { lat: -25.5000, lng: -64.9667 },
  'Agüero': { lat: -23.0167, lng: -63.9833 },
  
  // Tucumán (ciudades pequeñas)
  'Monteros': { lat: -27.1667, lng: -65.5000 },
  'Trancas': { lat: -26.2167, lng: -65.2833 },
  'Simoca': { lat: -27.2667, lng: -65.3500 },
  'Famaillá': { lat: -27.0500, lng: -65.4000 }
};

class GooglePlacesScraper {
  constructor() {
    this.resultados = [];
    this.dataDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async buscarPorCiudad(ciudad, coordenadas) {
    console.log(`\n🔍 Buscando inmobiliarias en ${ciudad}...`);
    
    try {
      // Text Search API - más resultados
      const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
      let nextPageToken = null;
      let resultadosCiudad = 0;

      do {
        const params = {
          query: `inmobiliaria en ${ciudad}, Argentina`,
          key: API_KEY,
          language: 'es',
          region: 'ar'
        };

        if (nextPageToken) {
          params.pagetoken = nextPageToken;
          // Google requiere un delay antes de usar el pagetoken
          await this.delay(2000);
        }

        const response = await axios.get(url, { params });

        console.log(`  Status: ${response.data.status}`);
        if (response.data.error_message) {
          console.log(`  Error message: ${response.data.error_message}`);
        }

        if (response.data.status === 'REQUEST_DENIED') {
          console.error('\n❌ ERROR: Places API no está habilitada en tu proyecto');
          console.error('\n📝 Solución:');
          console.error('1. Ve a: https://console.cloud.google.com/apis/library/places-backend.googleapis.com?project=datosinmo');
          console.error('2. Haz clic en "HABILITAR"');
          console.error('3. Espera 1-2 minutos y vuelve a ejecutar el script\n');
          console.error(`Detalles: ${response.data.error_message || 'API no habilitada'}\n`);
          return;
        } else if (response.data.status === 'OK' && response.data.results) {
          for (const place of response.data.results) {
            const detalles = await this.obtenerDetalles(place.place_id);
            
            const inmobiliaria = {
              nombre: place.name,
              direccion: place.formatted_address,
              ciudad: ciudad,
              telefono: detalles?.formatted_phone_number || 'No disponible',
              sitioWeb: detalles?.website || 'No disponible',
              rating: place.rating || 'N/A',
              totalReviews: place.user_ratings_total || 0,
              placeId: place.place_id,
              ubicacion: place.geometry?.location,
              horarios: detalles?.opening_hours?.weekday_text || [],
              email: this.extraerEmail(detalles),
              fechaExtraccion: new Date().toISOString()
            };

            this.resultados.push(inmobiliaria);
            resultadosCiudad++;
            
            console.log(`  ✓ ${inmobiliaria.nombre} - ${inmobiliaria.telefono}`);
          }

          nextPageToken = response.data.next_page_token;
        } else {
          console.log(`  ⚠️  Error en búsqueda: ${response.data.status}`);
          break;
        }

        await this.delay(DELAY);

      } while (nextPageToken && resultadosCiudad < MAX_RESULTS);

      console.log(`✅ Encontradas ${resultadosCiudad} inmobiliarias en ${ciudad}`);
      
    } catch (error) {
      console.error(`❌ Error buscando en ${ciudad}:`, error.message);
    }
  }

  async obtenerDetalles(placeId) {
    try {
      const url = 'https://maps.googleapis.com/maps/api/place/details/json';
      const response = await axios.get(url, {
        params: {
          place_id: placeId,
          fields: 'formatted_phone_number,website,opening_hours,email',
          key: API_KEY,
          language: 'es'
        }
      });

      if (response.data.status === 'OK') {
        return response.data.result;
      }
    } catch (error) {
      console.error(`Error obteniendo detalles: ${error.message}`);
    }
    return null;
  }

  extraerEmail(detalles) {
    if (detalles?.email) return detalles.email;
    
    // Intentar extraer del sitio web
    const website = detalles?.website;
    if (website) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const match = website.match(emailRegex);
      if (match) return match[0];
    }
    
    return 'No disponible';
  }

  async ejecutar() {
    console.log('🚀 Iniciando búsqueda de inmobiliarias en Argentina...\n');
    
    if (!API_KEY || API_KEY === 'tu_api_key_aqui') {
      console.error('❌ ERROR: Configura tu GOOGLE_MAPS_API_KEY en el archivo .env');
      console.log('\nPasos:');
      console.log('1. Copia .env.example a .env');
      console.log('2. Ve a https://console.cloud.google.com/');
      console.log('3. Habilita Google Places API');
      console.log('4. Crea una API Key y agrégala al archivo .env\n');
      return;
    }

    for (const provincia of PROVINCIAS) {
      const coordenadas = COORDENADAS_CIUDADES[provincia.trim()];
      if (coordenadas) {
        await this.buscarPorCiudad(provincia.trim(), coordenadas);
      }
    }

    await this.guardarResultados();
  }

  async guardarResultados() {
    if (this.resultados.length === 0) {
      console.log('\n⚠️  No se encontraron resultados');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Guardar JSON
    const jsonPath = path.join(this.dataDir, `inmobiliarias_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.resultados, null, 2));
    
    // Guardar CSV
    const csvPath = path.join(this.dataDir, `inmobiliarias_${timestamp}.csv`);
    const csvContent = this.convertirACSV(this.resultados);
    fs.writeFileSync(csvPath, csvContent);

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total inmobiliarias encontradas: ${this.resultados.length}`);
    console.log(`   Con teléfono: ${this.resultados.filter(i => i.telefono !== 'No disponible').length}`);
    console.log(`   Con sitio web: ${this.resultados.filter(i => i.sitioWeb !== 'No disponible').length}`);
    console.log(`\n💾 Datos guardados en:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);
  }

  convertirACSV(datos) {
    const headers = ['Nombre', 'Ciudad', 'Dirección', 'Teléfono', 'Sitio Web', 'Email', 'Rating', 'Reviews', 'Place ID'];
    const rows = datos.map(d => [
      this.escaparCSV(d.nombre),
      this.escaparCSV(d.ciudad),
      this.escaparCSV(d.direccion),
      this.escaparCSV(d.telefono),
      this.escaparCSV(d.sitioWeb),
      this.escaparCSV(d.email),
      d.rating,
      d.totalReviews,
      d.placeId
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  escaparCSV(valor) {
    if (typeof valor !== 'string') return valor;
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Ejecutar
const scraper = new GooglePlacesScraper();
scraper.ejecutar().catch(console.error);
