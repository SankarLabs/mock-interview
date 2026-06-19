import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function apiDevPlugin() {
  let env = {}
  return {
    name: 'api-dev-routes',
    config(_, { mode }) {
      // Load all .env.local vars (no prefix filter) so process.env gets OPENROUTER_API_KEY
      env = loadEnv(mode, process.cwd(), '')
      Object.assign(process.env, env)
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith('/api/')) return next()

        const routeName = url.slice(5) // e.g. "generate-questions"

        try {
          // ssrLoadModule runs the file through Vite's pipeline in a Node context
          const mod = await server.ssrLoadModule(`/api/${routeName}.js`)
          const handler = mod.default

          if (typeof handler !== 'function') return next()

          // Collect request body
          const chunks = []
          await new Promise((resolve, reject) => {
            req.on('data', c => chunks.push(c))
            req.on('end', resolve)
            req.on('error', reject)
          })

          const raw = Buffer.concat(chunks).toString()
          try { req.body = JSON.parse(raw) } catch { req.body = {} }

          // Minimal mock of Vercel's res object
          const mockRes = {
            _code: 200,
            status(code) { this._code = code; return this },
            json(data) {
              res.statusCode = this._code
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            },
          }

          await handler(req, mockRes)
        } catch (err) {
          console.error(`[api/${routeName}] error:`, err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
})
