import fs from 'fs';
import path from 'path';

/**
 * Script para limpiar y consolidar datos de múltiples fuentes
 */
class DataProcessor {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
  }

  async consolidarDatos() {
    console.log('🔄 Consolidando datos...\n');
    
    const archivos = fs.readdirSync(this.dataDir)
      .filter(f => f.endsWith('.json') && !f.includes('consolidado'));

    if (archivos.length === 0) {
      console.log('⚠️  No hay archivos para consolidar');
      return;
    }

    const todosLosDatos = [];
    const vistos = new Set();

    for (const archivo of archivos) {
      const rutaCompleta = path.join(this.dataDir, archivo);
      const datos = JSON.parse(fs.readFileSync(rutaCompleta, 'utf-8'));
      
      console.log(`📄 Procesando: ${archivo} (${datos.length} registros)`);
      
      for (const item of datos) {
        // Usar nombre + teléfono como key única
        const key = `${item.nombre}_${item.telefono}`;
        
        if (!vistos.has(key)) {
          vistos.add(key);
          todosLosDatos.push(item);
        }
      }
    }

    // Ordenar por ciudad y nombre
    todosLosDatos.sort((a, b) => {
      if (a.ciudad === b.ciudad) {
        return a.nombre.localeCompare(b.nombre);
      }
      return a.ciudad.localeCompare(b.ciudad);
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(this.dataDir, `consolidado_${timestamp}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(todosLosDatos, null, 2));
    
    console.log(`\n✅ Consolidación completada:`);
    console.log(`   Total registros únicos: ${todosLosDatos.length}`);
    console.log(`   Guardado en: ${outputPath}`);
    
    return todosLosDatos;
  }

  async exportarACSV(datos) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(this.dataDir, `consolidado_${timestamp}.csv`);
    
    const headers = ['Nombre', 'Ciudad', 'Dirección', 'Teléfono', 'Sitio Web', 'Email', 'Rating', 'Reviews'];
    const rows = datos.map(d => [
      this.escaparCSV(d.nombre),
      this.escaparCSV(d.ciudad),
      this.escaparCSV(d.direccion),
      this.escaparCSV(d.telefono),
      this.escaparCSV(d.sitioWeb || 'No disponible'),
      this.escaparCSV(d.email || 'No disponible'),
      d.rating || 'N/A',
      d.totalReviews || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    
    console.log(`   CSV guardado en: ${csvPath}`);
  }

  escaparCSV(valor) {
    if (typeof valor !== 'string') return valor;
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  }

  async generarEstadisticas(datos) {
    console.log('\n📊 ESTADÍSTICAS:\n');
    
    // Por ciudad
    const porCiudad = {};
    datos.forEach(item => {
      porCiudad[item.ciudad] = (porCiudad[item.ciudad] || 0) + 1;
    });
    
    console.log('Por ciudad:');
    Object.entries(porCiudad)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ciudad, cantidad]) => {
        console.log(`  ${ciudad}: ${cantidad}`);
      });

    // Datos de contacto
    const conTelefono = datos.filter(i => i.telefono && i.telefono !== 'No disponible').length;
    const conWeb = datos.filter(i => i.sitioWeb && i.sitioWeb !== 'No disponible').length;
    const conEmail = datos.filter(i => i.email && i.email !== 'No disponible').length;
    
    console.log('\nDatos de contacto:');
    console.log(`  Con teléfono: ${conTelefono} (${(conTelefono/datos.length*100).toFixed(1)}%)`);
    console.log(`  Con sitio web: ${conWeb} (${(conWeb/datos.length*100).toFixed(1)}%)`);
    console.log(`  Con email: ${conEmail} (${(conEmail/datos.length*100).toFixed(1)}%)`);
  }

  async ejecutar() {
    const datos = await this.consolidarDatos();
    if (datos && datos.length > 0) {
      await this.exportarACSV(datos);
      await this.generarEstadisticas(datos);
    }
  }
}

const processor = new DataProcessor();
processor.ejecutar().catch(console.error);
