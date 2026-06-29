const sequelize = require('./config/database');
const Product = require('./models/Product');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const products = [];
    for (let i = 1; i <= 60; i++) {
      const idStr = Date.now() + '-' + i;
      products.push({
        name: `Infinite Scroll Test Product ${i}`,
        sku: `IS-TEST-${idStr}`,
        slug: `infinite-scroll-test-product-${idStr}`,
        price: (Math.random() * 5000 + 100).toFixed(2),
        discount: 10,
        stock: 50,
        isActive: true,
        image: ['/assets/img/product/fashion/1.jpg'],
        shortDescription: `This is a test product for infinite scroll. Item #${i}`,
      });
    }

    await Product.bulkCreate(products);
    console.log('Successfully inserted 60 test products.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seed();
