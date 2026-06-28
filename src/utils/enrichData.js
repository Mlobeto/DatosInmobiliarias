import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Enriquecedor de datos - Busca teléfonos y sitios web faltantes
 */
class DataEnricher {
  constructor(archivoJson) {
    this.archivoJson = archivoJson;
    this.datos = [];
    this.actualizados = 0;
  }

  async iniciarNavegador() {
    console.log('🌐 Iniciando navegador...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
  }

  async cargarDatos() {
    console.log(`📂 Cargando datos de: ${this.archivoJson}`);
    const contenido = fs.readFileSync(this.archivoJson, 'utf-8');
    this.datos = JSON.parse(contenido);
    console.log(`✅ ${this.datos.length} registros cargados\n`);
  }

  async buscarTelefono(nombre, ciudad) {
    try {
      const query = `${nombre} ${ciudad} Argentina teléfono`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await this.delay(1500);

      // Buscar teléfono en el knowledge panel o resultados
      const telefono = await this.page.evaluate(() => {
        // Patrón de teléfono argentino
        const patterns = [
          // Con código de área
          /(\+54\s?)?(\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{4})/g,
          // Formato internacional
          /(\+54\s?\d{1,2}\s?\d{4}\s?\d{4})/g,
          // Formato celular
          /(\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/g
        ];

        // Buscar en el texto visible de la página
        const bodyText = document.body.innerText;
        
        for (const pattern of patterns) {
          const matches = bodyText.match(pattern);
          if (matches && matches.length > 0) {
            // Tomar el primer match y limpiar
            let tel = matches[0].trim();
            // Validar que tenga al menos 6 dígitos
            if (tel.replace(/\D/g, '').length >= 6) {
              return tel;
            }
          }
        }

        return null;
      });

      return telefono;
    } catch (error) {
      console.log(`  ⚠️  Error buscando: ${error.message}`);
      return null;
    }
  }

  async buscarSitioWeb(nombre, ciudad) {
    try {
      const query = `${nombre} ${ciudad} Argentina`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await this.delay(1000);

      // Extraer primer resultado (no de Google Maps)
      const sitio = await this.page.evaluate(() => {
        const links = document.querySelectorAll('a[href]');
        
        for (const link of links) {
          const href = link.href;
          // Excluir dominios de Google y redes sociales genéricas
          if (href && 
              !href.includes('google.com') &&
              !href.includes('facebook.com/login') &&
              !href.includes('instagram.com/accounts') &&
              (href.includes('.com.ar') || href.includes('.ar') || href.includes('.com'))) {
            return href;
          }
        }
        
        return null;
      });

      return sitio;
    } catch (error) {
      return null;
    }
  }

  async enriquecerDatos() {
    console.log('🔍 Iniciando enriquecimiento de datos...\n');
    
    const sinTelefono = this.datos.filter(d => 
      !d.telefono || d.telefono === 'No disponible' || d.telefono.trim() === ''
    );
    
    const sinWeb = this.datos.filter(d => 
      !d.sitioWeb || d.sitioWeb === 'No disponible' || d.sitioWeb.trim() === ''
    );

    console.log(`📊 Estadísticas:`);
    console.log(`   Total registros: ${this.datos.length}`);
    console.log(`   Sin teléfono: ${sinTelefono.length}`);
    console.log(`   Sin sitio web: ${sinWeb.length}\n`);

    if (sinTelefono.length === 0 && sinWeb.length === 0) {
      console.log('✅ Todos los registros tienen datos completos');
      return;
    }

    await this.iniciarNavegador();

    // Procesar registros sin teléfono
    console.log('📞 Buscando teléfonos faltantes...\n');
    for (let i = 0; i < Math.min(sinTelefono.length, 50); i++) {
      const item = sinTelefono[i];
      console.log(`[${i + 1}/${Math.min(sinTelefono.length, 50)}] ${item.nombre} - ${item.ciudad}`);
      
      const telefono = await this.buscarTelefono(item.nombre, item.ciudad);
      
      if (telefono) {
        item.telefono = telefono;
        item.telefonoEnriquecido = true;
        this.actualizados++;
        console.log(`  ✅ Teléfono encontrado: ${telefono}`);
      } else {
        console.log(`  ❌ No se encontró teléfono`);
      }
      
      await this.delay(2000); // Delay para evitar bloqueos
    }

    // Procesar registros sin web
    console.log('\n🌐 Buscando sitios web faltantes...\n');
    for (let i = 0; i < Math.min(sinWeb.length, 30); i++) {
      const item = sinWeb[i];
      
      if (item.telefono && item.telefono !== 'No disponible') {
        continue; // Si ya tiene teléfono, priorizar otros
      }
      
      console.log(`[${i + 1}/${Math.min(sinWeb.length, 30)}] ${item.nombre}`);
      
      const sitio = await this.buscarSitioWeb(item.nombre, item.ciudad);
      
      if (sitio) {
        item.sitioWeb = sitio;
        item.webEnriquecido = true;
        this.actualizados++;
        console.log(`  ✅ Web encontrada: ${sitio}`);
      } else {
        console.log(`  ❌ No se encontró sitio web`);
      }
      
      await this.delay(2000);
    }

    await this.browser.close();
  }

  async guardarResultados() {
    if (this.actualizados === 0) {
      console.log('\n⚠️  No se realizaron actualizaciones');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.dirname(this.archivoJson);
    const outputPath = path.join(dir, `enriquecido_${timestamp}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(this.datos, null, 2));

    // También guardar CSV
    const csvPath = path.join(dir, `enriquecido_${timestamp}.csv`);
    const csvContent = this.convertirACSV(this.datos);
    fs.writeFileSync(csvPath, csvContent);

    console.log(`\n✅ ENRIQUECIMIENTO COMPLETADO:`);
    console.log(`   Registros actualizados: ${this.actualizados}`);
    console.log(`   Total registros: ${this.datos.length}`);
    
    const conTelefono = this.datos.filter(d => d.telefono && d.telefono !== 'No disponible').length;
    const conWeb = this.datos.filter(d => d.sitioWeb && d.sitioWeb !== 'No disponible').length;
    
    console.log(`\n📊 COBERTURA FINAL:`);
    console.log(`   Con teléfono: ${conTelefono} (${(conTelefono/this.datos.length*100).toFixed(1)}%)`);
    console.log(`   Con sitio web: ${conWeb} (${(conWeb/this.datos.length*100).toFixed(1)}%)`);
    
    console.log(`\n💾 Datos guardados en:`);
    console.log(`   JSON: ${outputPath}`);
    console.log(`   CSV: ${csvPath}`);
  }

  convertirACSV(datos) {
    const headers = ['Nombre', 'Ciudad', 'Dirección', 'Teléfono', 'Sitio Web', 'Rating', 'Enriquecido'];
    const rows = datos.map(d => [
      this.escaparCSV(d.nombre),
      this.escaparCSV(d.ciudad),
      this.escaparCSV(d.direccion),
      this.escaparCSV(d.telefono || 'No disponible'),
      this.escaparCSV(d.sitioWeb || 'No disponible'),
      this.escaparCSV(d.rating || 'N/A'),
      d.telefonoEnriquecido || d.webEnriquecido ? 'Sí' : 'No'
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

  async ejecutar() {
    await this.cargarDatos();
    await this.enriquecerDatos();
    await this.guardarResultados();
  }
}

// Uso desde línea de comandos
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('\n❌ Error: Debes proporcionar la ruta del archivo JSON');
  console.log('\n📖 Uso:');
  console.log('   node src/utils/enrichData.js <ruta-archivo.json>');
  console.log('\nEjemplo:');
  console.log('   node src/utils/enrichData.js data/webscraping_2026-01-15T01-23-32-684Z.json\n');
  process.exit(1);
}

const archivoJson = args[0];
if (!fs.existsSync(archivoJson)) {
  console.error(`\n❌ Error: El archivo no existe: ${archivoJson}\n`);
  process.exit(1);
}

const enricher = new DataEnricher(archivoJson);
enricher.ejecutar().catch(console.error);
