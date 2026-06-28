import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configurar base de datos
const dbFile = path.join(process.cwd(), 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { inmobiliarias: [] });

// Inicializar DB
await db.read();
db.data ||= { inmobiliarias: [] };

// ==================== RUTAS ====================

// GET - Obtener todas las inmobiliarias
app.get('/api/inmobiliarias', async (req, res) => {
  await db.read();
  
  const { ciudad, provincia, estado, busqueda } = req.query;
  let resultados = db.data.inmobiliarias;

  // Filtros
  if (ciudad) {
    resultados = resultados.filter(i => 
      i.ciudad?.toLowerCase().includes(ciudad.toLowerCase())
    );
  }
  
  if (estado) {
    resultados = resultados.filter(i => i.estado === estado);
  }

  if (busqueda) {
    resultados = resultados.filter(i =>
      i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.direccion?.toLowerCase().includes(busqueda.toLowerCase())
    );
  }

  res.json(resultados);
});

// GET - Obtener una inmobiliaria por ID
app.get('/api/inmobiliarias/:id', async (req, res) => {
  await db.read();
  const inmobiliaria = db.data.inmobiliarias.find(i => i.id === req.params.id);
  
  if (!inmobiliaria) {
    return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
  }
  
  res.json(inmobiliaria);
});

// PUT - Actualizar inmobiliaria
app.put('/api/inmobiliarias/:id', async (req, res) => {
  await db.read();
  
  const index = db.data.inmobiliarias.findIndex(i => i.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
  }

  db.data.inmobiliarias[index] = {
    ...db.data.inmobiliarias[index],
    ...req.body,
    ultimaActualizacion: new Date().toISOString()
  };

  await db.write();
  res.json(db.data.inmobiliarias[index]);
});

// POST - Agregar nota a inmobiliaria
app.post('/api/inmobiliarias/:id/notas', async (req, res) => {
  await db.read();
  
  const inmobiliaria = db.data.inmobiliarias.find(i => i.id === req.params.id);
  
  if (!inmobiliaria) {
    return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
  }

  const nota = {
    id: Date.now().toString(),
    texto: req.body.texto,
    fecha: new Date().toISOString()
  };

  inmobiliaria.notas = inmobiliaria.notas || [];
  inmobiliaria.notas.push(nota);
  inmobiliaria.ultimaActualizacion = new Date().toISOString();

  await db.write();
  res.json(nota);
});

// GET - Estadísticas
app.get('/api/estadisticas', async (req, res) => {
  await db.read();
  
  const total = db.data.inmobiliarias.length;
  const porEstado = {
    nuevo: db.data.inmobiliarias.filter(i => !i.estado || i.estado === 'nuevo').length,
    contactado: db.data.inmobiliarias.filter(i => i.estado === 'contactado').length,
    interesado: db.data.inmobiliarias.filter(i => i.estado === 'interesado').length,
    noInteresado: db.data.inmobiliarias.filter(i => i.estado === 'noInteresado').length,
    cliente: db.data.inmobiliarias.filter(i => i.estado === 'cliente').length
  };

  const conTelefono = db.data.inmobiliarias.filter(i => 
    i.telefono && i.telefono !== 'No disponible'
  ).length;

  const conWeb = db.data.inmobiliarias.filter(i => 
    i.sitioWeb && i.sitioWeb !== 'No disponible'
  ).length;

  res.json({
    total,
    porEstado,
    conTelefono,
    conWeb,
    porcentajeTelefono: ((conTelefono / total) * 100).toFixed(1),
    porcentajeWeb: ((conWeb / total) * 100).toFixed(1)
  });
});

// GET - Obtener ciudades únicas
app.get('/api/ciudades', async (req, res) => {
  await db.read();
  const ciudades = [...new Set(db.data.inmobiliarias.map(i => i.ciudad))].sort();
  res.json(ciudades);
});

// POST - Importar datos desde JSON
app.post('/api/importar', async (req, res) => {
  try {
    const { archivo } = req.body;
    const rutaArchivo = path.join(process.cwd(), '..', 'data', archivo);
    
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const datos = JSON.parse(contenido);

    await db.read();
    
    let importados = 0;
    datos.forEach(item => {
      // Verificar si ya existe
      const existe = db.data.inmobiliarias.find(i => 
        i.nombre === item.nombre && i.ciudad === item.ciudad
      );

      if (!existe) {
        db.data.inmobiliarias.push({
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          estado: 'nuevo',
          notas: [],
          fechaImportacion: new Date().toISOString()
        });
        importados++;
      }
    });

    await db.write();
    res.json({ 
      mensaje: `Importados ${importados} registros nuevos`,
      total: db.data.inmobiliarias.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Buscar teléfono faltante
app.post('/api/inmobiliarias/:id/buscar-telefono', async (req, res) => {
  try {
    await db.read();
    const inmobiliaria = db.data.inmobiliarias.find(i => i.id === req.params.id);
    
    if (!inmobiliaria) {
      return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
    }

    console.log(`🔍 Buscando teléfono para: ${inmobiliaria.nombre} - ${inmobiliaria.ciudad}`);

    // Buscar teléfono con Puppeteer
    const telefono = await buscarTelefonoEnGoogle(inmobiliaria.nombre, inmobiliaria.ciudad);

    if (telefono) {
      // Actualizar en DB
      inmobiliaria.telefono = telefono;
      inmobiliaria.telefonoEnriquecido = true;
      inmobiliaria.ultimaActualizacion = new Date().toISOString();
      
      await db.write();
      
      console.log(`✅ Teléfono encontrado: ${telefono}`);
      res.json({ 
        success: true, 
        telefono,
        mensaje: 'Teléfono encontrado y actualizado'
      });
    } else {
      console.log(`❌ No se encontró teléfono`);
      res.json({ 
        success: false, 
        mensaje: 'No se encontró teléfono en la web'
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función auxiliar para buscar teléfono
async function buscarTelefonoEnGoogle(nombre, ciudad) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    const query = `${nombre} ${ciudad} Argentina teléfono`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraer teléfono
    const telefono = await page.evaluate(() => {
      const patterns = [
        /(\+54\s?)?(\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{4})/g,
        /(\+54\s?\d{1,2}\s?\d{4}\s?\d{4})/g,
        /(\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/g
      ];

      const bodyText = document.body.innerText;
      
      for (const pattern of patterns) {
        const matches = bodyText.match(pattern);
        if (matches && matches.length > 0) {
          let tel = matches[0].trim();
          if (tel.replace(/\D/g, '').length >= 6) {
            return tel;
          }
        }
      }

      return null;
    });

    await browser.close();
    return telefono;

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api/inmobiliarias\n`);
});
