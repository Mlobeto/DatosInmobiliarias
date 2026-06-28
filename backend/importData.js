import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para importar datos de JSON a la base de datos del CRM
 */
async function importarDatos() {
  console.log('📥 Importador de Datos CRM\n');

  // Verificar argumentos
  const archivoInput = process.argv[2];
  
  if (!archivoInput) {
    console.log('❌ Error: Debes especificar el archivo JSON a importar\n');
    console.log('Uso:');
    console.log('  node importData.js <archivo.json>\n');
    console.log('Ejemplo:');
    console.log('  node importData.js ../data/webscraping_2026-01-15T02-31-34-662Z.json\n');
    return;
  }

  // Verificar que el archivo existe
  const rutaArchivo = path.resolve(archivoInput);
  if (!fs.existsSync(rutaArchivo)) {
    console.error(`❌ Error: El archivo no existe: ${rutaArchivo}\n`);
    return;
  }

  // Cargar datos del archivo JSON
  console.log(`📂 Cargando datos de: ${path.basename(rutaArchivo)}`);
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
  const datos = JSON.parse(contenido);
  console.log(`✅ ${datos.length} registros encontrados\n`);

  // Configurar base de datos
  const dbPath = path.join(__dirname, 'db.json');
  const adapter = new JSONFile(dbPath);
  const db = new Low(adapter, { inmobiliarias: [] });
  await db.read();
  
  db.data ||= { inmobiliarias: [] };

  console.log(`📊 Base de datos actual: ${db.data.inmobiliarias.length} registros\n`);
  console.log('🔄 Importando datos...\n');

  let importados = 0;
  let duplicados = 0;

  for (const item of datos) {
    // Verificar si ya existe (por nombre y ciudad)
    const existe = db.data.inmobiliarias.find(i => 
      i.nombre === item.nombre && i.ciudad === item.ciudad
    );

    if (!existe) {
      // Agregar nuevo registro
      db.data.inmobiliarias.push({
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        estado: 'nuevo',
        notas: [],
        fechaImportacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      });
      importados++;
      console.log(`  ✓ ${item.nombre} - ${item.ciudad}`);
    } else {
      duplicados++;
    }
  }

  // Guardar cambios
  await db.write();

  console.log(`\n✅ IMPORTACIÓN COMPLETADA\n`);
  console.log(`📊 Resumen:`);
  console.log(`   Registros nuevos importados: ${importados}`);
  console.log(`   Duplicados omitidos: ${duplicados}`);
  console.log(`   Total en base de datos: ${db.data.inmobiliarias.length}\n`);
  console.log(`💡 Inicia el frontend y backend para ver los datos:\n`);
  console.log(`   Backend:  cd backend && npm start`);
  console.log(`   Frontend: cd frontend && npm run dev\n`);
}

// Ejecutar
importarDatos().catch(console.error);
