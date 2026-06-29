const sequelize = require('./config/database');
const Product = require('./models/Product');
const { Category } = require('./models/Category');

const adjectives = ['Premium', 'Custom', 'Personalized', 'Engraved', 'Luxury', 'Handcrafted', 'Designer', 'Exclusive', 'Classic', 'Elegant'];
const nouns = ['Gift Set', 'Hamper', 'Keychain', 'Mug', 'Pen', 'Notebook', 'Bottle', 'Photo Frame', 'Wall Clock', 'Tote Bag'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedRealProducts() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    console.log('Deleting existing products...');
    await Product.destroy({ where: {} });
    console.log('Deleted existing products.');

    const categories = await Category.findAll();
    console.log(`Found ${categories.length} categories.`);

    const products = [];
    
    for (const category of categories) {
      for (let i = 1; i <= 5; i++) {
        const idStr = Date.now() + '-' + category.id.substring(0, 5) + '-' + i;
        const productName = `${getRandomItem(adjectives)} ${category.label} ${getRandomItem(nouns)}`;
        
        products.push({
          name: productName,
          sku: `SKU-${idStr.toUpperCase()}`,
          slug: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
          price: (Math.random() * 2000 + 100).toFixed(2),
          discount: Math.floor(Math.random() * 20),
          stock: 50,
          isActive: true,
          category: [category.value], // assign to this category
          image: ['/assets/img/product/fashion/1.jpg'],
          shortDescription: `This is a high-quality ${productName} perfect for all occasions.`,
          categoryId: category.id
        });
      }
    }

    await Product.bulkCreate(products);
    console.log(`Successfully inserted ${products.length} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedRealProducts();
