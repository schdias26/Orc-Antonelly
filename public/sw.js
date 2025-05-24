const CACHE_NAME = "antonelly-orcamentos-v2"
const urlsToCache = [
  "/",
  "/orcamentos",
  "/logo-antonelly.png",
  "/manifest.json",
  "/_next/static/css/app/layout.css",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/main-app.js",
  "/_next/static/chunks/app/layout.js",
  "/_next/static/chunks/app/page.js",
  "/_next/static/chunks/app/orcamentos/page.js",
]

// Instalar Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.log("Erro ao cachear recursos:", error)
        // Continuar mesmo se alguns recursos falharem
        return Promise.resolve()
      })
    }),
  )
  self.skipWaiting()
})

// Ativar Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Retorna do cache se disponível
        if (response) {
          return response
        }

        // Tenta buscar da rede
        return fetch(event.request)
          .then((response) => {
            // Verifica se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response
            }

            // Clona a resposta
            const responseToCache = response.clone()

            // Adiciona ao cache
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })

            return response
          })
          .catch(() => {
            // Se falhar, retorna página offline básica para navegação
            if (event.request.destination === "document") {
              return new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Antonelly - Offline</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0fdf4; }
                    .container { max-width: 500px; margin: 0 auto; }
                    h1 { color: #22c55e; }
                    p { color: #666; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>📱 Antonelly Orçamentos</h1>
                    <h2>Modo Offline</h2>
                    <p>Você está offline, mas o app continua funcionando!</p>
                    <p>Seus dados estão salvos localmente.</p>
                    <button onclick="window.location.reload()">Tentar Novamente</button>
                  </div>
                </body>
                </html>
              `,
                {
                  headers: { "Content-Type": "text/html" },
                },
              )
            }
          })
      })
      .catch(() => {
        // Fallback para qualquer erro
        return new Response("Offline", { status: 503 })
      }),
  )
})
