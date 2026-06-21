const { productSalesReport } = require("./controllers/reportController");
const sequelize = require("./config/database");
const { User, Product, Variant, Order, OrderItem } = require("./models");

async function testController() {
  const t = await sequelize.transaction();
  try {
    // Insert some mock data in the transaction
    const user = await User.create({
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
      password: "hashedpassword",
    }, { transaction: t });

    const product = await Product.create({
      name: "Test Product Report",
      productName: "Test Product Report",
      price: 100.00,
      stock: 50,
      description: "Test description",
    }, { transaction: t });

    const variant = await Variant.create({
      productId: product.id,
      variantName: "Color: Blue",
      mrp: 120.00,
      salesPrice: 100.00,
      stock: 20,
    }, { transaction: t });

    const address = await sequelize.query(`SELECT id FROM addresses LIMIT 1`, { type: sequelize.QueryTypes.SELECT, transaction: t });
    let addressId;
    if (address.length > 0) {
      addressId = address[0].id;
    } else {
      // Create a dummy address
      const [addrResult] = await sequelize.query(`INSERT INTO addresses (id, user_id, name, phone, address_line1, city, state, pincode, is_default, createdAt, updatedAt) VALUES (UUID(), '${user.id}', 'Home', '1234567890', '123 St', 'City', 'State', '123456', 1, NOW(), NOW())`, { transaction: t });
      const newAddress = await sequelize.query(`SELECT id FROM addresses LIMIT 1`, { type: sequelize.QueryTypes.SELECT, transaction: t });
      addressId = newAddress[0].id;
    }

    const order = await Order.create({
      userId: user.id,
      status: "confirmed",
      totalAmount: 110.00,
      shippingCharge: 10.00,
      paymentMethod: "razorpay",
      shippingAddressId: addressId,
    }, { transaction: t });

    const orderItem = await OrderItem.create({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      selectedVariantId: variant.id,
      selectedVariantName: variant.variantName,
      quantity: 2,
      price: 100.00,
      salesPrice: 100.00,
    }, { transaction: t });

    console.log("Mock data created in transaction!");

    // Mock Express req and res
    const req = {
      query: {
        format: "xlsx",
        dateRange: "all"
      }
    };

    const headers = {};
    let responseData = null;
    let statusCode = 200;

    const res = {
      setHeader(name, value) {
        headers[name] = value;
      },
      send(data) {
        responseData = data;
        console.log("res.send called with data of length:", data.length);
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(obj) {
        responseData = obj;
        console.log("res.json called with:", obj);
      }
    };

    // Now call the controller function
    // Note: because the controller runs its own transaction/queries, 
    // it won't see our uncommitted transaction data unless we commit it.
    // So let's commit the transaction first!
    await t.commit();
    console.log("Transaction committed. Invoking productSalesReport...");

    await productSalesReport(req, res);

    console.log("Status Code:", statusCode);
    console.log("Headers:", headers);
    if (statusCode !== 200) {
      console.log("Error response:", responseData);
    } else {
      console.log("Response data type:", typeof responseData);
    }

    // Clean up created mock data
    console.log("Cleaning up mock data...");
    await OrderItem.destroy({ where: { orderId: order.id } });
    await Order.destroy({ where: { id: order.id } });
    await Variant.destroy({ where: { id: variant.id } });
    await Product.destroy({ where: { id: product.id } });
    await User.destroy({ where: { id: user.id } });
    console.log("Cleanup done!");

  } catch (err) {
    console.error("Test controller failed with error:", err);
    await t.rollback();
  } finally {
    await sequelize.close();
  }
}

testController();
