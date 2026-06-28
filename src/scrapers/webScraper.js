import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Web Scraper alternativo sin usar API de Google
 * Busca inmobiliarias directamente en Google Maps
 */
class WebScraper {
  constructor() {
    this.resultados = [];
    this.dataDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async iniciarNavegador() {
    console.log('🌐 Iniciando navegador...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Simular usuario real
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
  }

  async buscarEnGoogleMaps(ciudad) {
    console.log(`\n🔍 Buscando en Google Maps: inmobiliarias en ${ciudad}`);
    
    try {
      const searchQuery = `inmobiliarias en ${ciudad}, Argentina`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.delay(3000);

      // Scroll para cargar más resultados
      await this.scrollResultados();

      // Extraer resultados
      const resultados = await this.page.evaluate(() => {
        const items = [];
        const elementos = document.querySelectorAll('div[role="article"]');
        
        elementos.forEach((elem) => {
          try {
            // Nombre del negocio
            const nombreElem = elem.querySelector('a.hfpxzc');
            if (!nombreElem) return;
            
            const nombre = nombreElem.getAttribute('aria-label') || nombreElem.textContent.trim();
            
            // Rating
            const ratingElem = elem.querySelector('span[role="img"]');
            const rating = ratingElem?.getAttribute('aria-label') || 'Sin rating';
            
            // Dirección y otros datos están en diferentes spans
            const spans = elem.querySelectorAll('span');
            let direccion = 'No disponible';
            
      spans.forEach(span => {
        const text = span.textContent;
        // Buscar dirección (usualmente contiene números y calle)
        if (text && text.match(/\d+/) && !text.includes('estrellas') && text.length > 10) {
          direccion = text;
        }
      });

      items.push({
        nombre: nombre,
        direccion: direccion,
        rating: rating
      });
          } catch (e) {
            // Ignorar errores de elementos individuales
          }
        });
        
        return items;
      });

      console.log(`  ✓ Encontrados ${resultados.length} resultados`);

      // Procesar cada resultado para obtener más detalles
      for (let i = 0; i < Math.min(resultados.length, 50); i++) {
        const resultado = resultados[i];
        
        try {
          // Hacer clic en el resultado
          const selector = `div[role="article"]:nth-child(${i + 1})`;
          await this.page.click(selector);
          await this.delay(1500);

          // Extraer detalles adicionales con múltiples selectores
          const detalles = await this.page.evaluate(() => {
            // Buscar teléfono
            let telefono = 'No disponible';
            const telefonoBtn = document.querySelector('button[data-item-id*="phone"]');
            if (telefonoBtn) {
              telefono = telefonoBtn.getAttribute('aria-label')?.replace('Teléfono: ', '') || 
                         telefonoBtn.getAttribute('aria-label') || 'No disponible';
            }
            
            // Buscar sitio web
            let sitioWeb = 'No disponible';
            const webLink = document.querySelector('a[data-item-id*="authority"]') || 
                           document.querySelector('a[href*="http"]');
            if (webLink && webLink.href && !webLink.href.includes('google.com')) {
              sitioWeb = webLink.href;
            }
            
            // Buscar más info
            const addressElem = document.querySelector('[data-item-id*="address"]');
            const address = addressElem?.textContent || '';
            
            return {
              telefono,
              sitioWeb,
              direccionCompleta: address
            };
          });

          const inmobiliaria = {
            nombre: resultado.nombre,
            direccion: detalles.direccionCompleta || resultado.direccion,
            ciudad: ciudad,
            telefono: detalles.telefono,
            sitioWeb: detalles.sitioWeb,
            rating: resultado.rating,
            fechaExtraccion: new Date().toISOString()
          };

          this.resultados.push(inmobiliaria);
          console.log(`  ✓ ${inmobiliaria.nombre} - ${inmobiliaria.telefono}`);
          
        } catch (error) {
          // Guardar aunque falle la extracción de detalles
          this.resultados.push({
            nombre: resultado.nombre,
            direccion: resultado.direccion,
            ciudad: ciudad,
            telefono: 'No disponible',
            sitioWeb: 'No disponible',
            rating: resultado.rating,
            fechaExtraccion: new Date().toISOString()
          });
          console.log(`  ⚠️  ${resultado.nombre} (datos parciales)`);
        }
      }

    } catch (error) {
      console.error(`❌ Error en búsqueda: ${error.message}`);
    }
  }

  async scrollResultados() {
    const scrollContainer = await this.page.$('div[role="feed"]');
    if (!scrollContainer) return;

    console.log('  📜 Cargando más resultados...');
    
    for (let i = 0; i < 5; i++) {
      await this.page.evaluate((selector) => {
        const elem = document.querySelector(selector);
        if (elem) {
          elem.scrollTop = elem.scrollHeight;
        }
      }, 'div[role="feed"]');
      
      await this.delay(2000);
    }
  }

  async ejecutar() {
    console.log('🚀 Iniciando Web Scraper para inmobiliarias...\n');
    console.log('🎯 Buscando en ciudades de menos de 50,000 habitantes\n');
    console.log('🗺️ Provincias: Santa Fe, Córdoba, Buenos Aires, Catamarca, La Rioja, Salta, Tucumán\n');
    
    // Ciudades pequeñas de menos de 50k habitantes
    const ciudades = [
      // Santa Fe
      'Cañada de Gómez', 'Casilda', 'Firmat', 'Armstrong', 'Esperanza',
      'Villa Constitución',
      // Córdoba
      'Arroyito', 'Morteros', 'Las Varillas', 'Laboulaye', 'Oncativo',
      'Jesús María', 'La Falda', 'Marcos Juárez',
      // Buenos Aires
      'Carmen de Patagones', 'Coronel Dorrego', 'Coronel Pringles',
      'General Villegas', 'Bragado', '25 de Mayo', 'Saladillo',
      'San Antonio de Areco',
      // Catamarca
      'Tinogasta', 'Andalgalá', 'Belén',
      // La Rioja
      'Chilecito', 'Chamical',
      // Salta
      'Cafayate', 'Rosario de la Frontera', 'Embarcación',
      // Tucumán
      'Monteros', 'Simoca', 'Famaillá'
    ];
    
    await this.iniciarNavegador();

    for (const ciudad of ciudades) {
      await this.buscarEnGoogleMaps(ciudad);
      await this.delay(3000);
    }

    await this.browser.close();
    await this.guardarResultados();
  }

  async guardarResultados() {
    if (this.resultados.length === 0) {
      console.log('\n⚠️  No se encontraron resultados');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // JSON
    const jsonPath = path.join(this.dataDir, `webscraping_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.resultados, null, 2));
    
    // CSV
    const csvPath = path.join(this.dataDir, `webscraping_${timestamp}.csv`);
    const csvContent = this.convertirACSV(this.resultados);
    fs.writeFileSync(csvPath, csvContent);

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Total inmobiliarias: ${this.resultados.length}`);
    console.log(`   Con teléfono: ${this.resultados.filter(i => i.telefono !== 'No disponible').length}`);
    console.log(`   Con sitio web: ${this.resultados.filter(i => i.sitioWeb !== 'No disponible').length}`);
    console.log(`\n💾 Datos guardados en:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   CSV: ${csvPath}`);
  }

  convertirACSV(datos) {
    const headers = ['Nombre', 'Ciudad', 'Dirección', 'Teléfono', 'Sitio Web', 'Rating'];
    const rows = datos.map(d => [
      this.escaparCSV(d.nombre),
      this.escaparCSV(d.ciudad),
      this.escaparCSV(d.direccion),
      this.escaparCSV(d.telefono),
      this.escaparCSV(d.sitioWeb),
      this.escaparCSV(d.rating)
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
const scraper = new WebScraper();
scraper.ejecutar().catch(console.error);
