// Después de "vite build": mueve index.html a server/core/template.html
// (index.php lo usa para inyectar los datos de cada emprendimiento)
// y elimina assets de compilaciones anteriores.
import { renameSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const server = resolve(import.meta.dirname, '../../server')
const template = resolve(server, 'core/template.html')
renameSync(resolve(server, 'index.html'), template)

const html = readFileSync(template, 'utf8')
for (const f of readdirSync(resolve(server, 'assets'))) {
  if (!html.includes(f) && !f.endsWith('.map')) {
    // archivos importados dinámicamente (chunks) se referencian desde el JS principal
    const js = readdirSync(resolve(server, 'assets')).filter((x) => x.endsWith('.js') && html.includes(x))
    const referenced = js.some((x) => readFileSync(resolve(server, 'assets', x), 'utf8').includes(f))
    if (!referenced) rmSync(resolve(server, 'assets', f))
  }
}
console.log('✔ Plantilla lista en server/core/template.html')
