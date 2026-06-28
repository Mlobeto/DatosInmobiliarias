#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('datos-inmobiliarias')
  .description('Herramienta CLI para extraer datos de inmobiliarias en Argentina')
  .version('1.0.0');

program
  .command('google')
  .description('Buscar inmobiliarias usando Google Places API')
  .action(() => {
    ejecutarScript('scrapers/googlePlacesScraper.js');
  });

program
  .command('web')
  .description('Buscar inmobiliarias con web scraping')
  .action(() => {
    ejecutarScript('scrapers/webScraper.js');
  });

program
  .command('consolidar')
  .description('Consolidar y procesar todos los datos extraídos')
  .action(() => {
    ejecutarScript('utils/dataProcessor.js');
  });

function ejecutarScript(scriptPath) {
  const fullPath = path.join(__dirname, scriptPath);
  const proceso = spawn('node', [fullPath], { stdio: 'inherit' });
  
  proceso.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });
}

program.parse();
