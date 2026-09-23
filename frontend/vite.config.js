import { defineConfig } from 'vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

// build normal  -> ../server (listo para subir a public_html de Hostinger)
// build demo    -> ../docs/index.html (un solo archivo, datos en memoria; lo publica GitHub Pages)
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo'
  return {
    plugins: [vueJsx(), ...(demo ? [viteSingleFile()] : [])],
    resolve: {
      alias: {
        '@backend': fileURLToPath(new URL(demo ? './src/services/demo.js' : './src/services/http.js', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    base: demo ? './' : '/',
    build: demo
      ? { outDir: '../docs', emptyOutDir: true, assetsInlineLimit: 100_000_000 }
      : { outDir: '../server', emptyOutDir: false, assetsDir: 'assets' },
    server: {
      port: 5174,
      // En desarrollo la API PHP corre con:  php -S localhost:8082 dev-router.php  (carpeta /server)
      proxy: {
        '/api': 'http://localhost:8082',
        '/uploads': 'http://localhost:8082',
      },
    },
  }
})
