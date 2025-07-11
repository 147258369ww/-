addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url)
    const newUrl = new URL(`http://43.138.3.83:5173${url.pathname}${url.search}`)
    
    return fetch(newUrl, request)
  }