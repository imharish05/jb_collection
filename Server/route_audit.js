const endpoints = [
  { name: 'health', method: 'GET', path: '/api/health' },
  { name: 'products', method: 'GET', path: '/api/products' },
  { name: 'productById', method: 'GET', path: '/api/products/e0cdb883-fae7-432b-b80b-08196df2356d' },
  { name: 'categories', method: 'GET', path: '/api/categories' },
  { name: 'brands', method: 'GET', path: '/api/brands' },
  { name: 'variants', method: 'GET', path: '/api/variants' },
  { name: 'reviewsProduct', method: 'GET', path: '/api/reviews/product/e0cdb883-fae7-432b-b80b-08196df2356d' },
  { name: 'heroSlides', method: 'GET', path: '/api/hero-slides' },
  { name: 'offerBanners', method: 'GET', path: '/api/offer-banners' },
  { name: 'marquee', method: 'GET', path: '/api/marquee' },
  { name: 'cartProtected', method: 'GET', path: '/api/cart' },
  { name: 'blogsProtected', method: 'GET', path: '/api/blogs' },
  { name: 'ordersProtected', method: 'GET', path: '/api/orders' },
  { name: 'combos', method: 'GET', path: '/api/combos' },
  { name: 'contactPostEmpty', method: 'POST', path: '/api/contact', body: {} },
  { name: 'authLoginInvalid', method: 'POST', path: '/api/auth/login', body: { email: 'test@example.com', password: 'wrong' } },
];

async function run() {
  const results = [];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch('http://localhost:5000' + endpoint.path, {
        method: endpoint.method,
        headers: endpoint.body ? { 'Content-Type': 'application/json' } : {},
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        parsed = text;
      }

      results.push({
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: res.status,
        contentType: res.headers.get('content-type') || '',
        response: parsed,
      });
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        error: error.message,
      });
    }
  }

  const outputPath = 'route_audit_results.json';
  require('fs').writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${outputPath}`);
  console.log(JSON.stringify(results, null, 2));
}

run();
