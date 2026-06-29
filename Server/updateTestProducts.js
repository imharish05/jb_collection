const sequelize = require('./config/database');
const Product = require('./models/Product');
const { Op } = require('sequelize');

async function update() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // We used "/assets/img/product/fashion/1.jpg" for image, let's use a real sample image from the app
    // I noticed an artifact image path like "/uploads/settings/..." or just use a placeholder
    // Or just a known working image from their system. Often "uploads/sample.jpg". 
    // Wait, earlier I saw an image in the footer/header or an actual path. I'll use a placeholder like "https://via.placeholder.com/600x800" to ensure it works.

    const result = await Product.update(
      {
        isNew: true,
        isHotDeal: true,
        image: ['https://via.placeholder.com/600x800.png?text=Sample+Product'], // Valid image array
      },
      {
        where: {
          sku: {
            [Op.like]: 'IS-TEST-%'
          }
        }
      }
    );

    console.log(`Successfully updated ${result[0]} test products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    process.exit(1);
  }
}

update();
