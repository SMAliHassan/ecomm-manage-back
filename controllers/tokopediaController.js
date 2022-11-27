const { default: TokopediaClient } = require('tokopedia-client');

const Store = require('../models/storeModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const AppError = require('../utils/appError');

const client = new TokopediaClient({
  fs_id: process.env.TOKOPEDIA_APP_ID,
  client_id: process.env.TOKOPEDIA_CLIENT_ID,
  client_secret: process.env.TOKOPEDIA_CLIENT_SECRET,
});

const generateAccessToken = async () => {
  try {
    const { expires_in } = await client.authenticate();

    console.log(
      `\nTokopedia client authenticated. \nWill expire in ${expires_in} seconds on ${new Date(
        Date.now() + expires_in * 1000
      )}`
    );

    // The value of "expires_in" is in seconds.
    setTimeout(generateAccessToken, expires_in * 1000);
  } catch (err) {
    console.log('\nCould not authenticate Tokopedia client!\n', err.message);
  }
};

// Initialize access_token
(async () => await generateAccessToken())();
// Initialize access_token

exports.createStore = async (shopId, userId) => {
  if (!shopId) throw new AppError(404, 'Please provide a shopId!');

  const shopCheck = await Store.findOne({ shopId, storeType: 'tokopedia' });
  if (shopCheck) throw new AppError(400, 'Such a store already exists!');

  const [shop] = await client.shop.getShopInfo(shopId);
  if (!shop) throw new AppError(400, 'No Tokopedia shop found with this shopId!');

  const store = await Store.create({
    user: userId,
    storeName: shop.shop_name,
    shopId,
    countryRegion: shop.province_name,
    storeType: 'tokopedia',
    storeData: shop,
  });

  return store;
};

const loopRequest = async (module, func, baseOptions, initialPage = 0) => {
  const arr = [];
  let page = +initialPage;
  // let more = true;

  while (true) {
    page++;

    const { data } = await client[module][func]({ ...baseOptions, page, per_page: 50 });

    if (!data?.length) break;

    arr.push(...data);
  }

  return arr;
};

const pullProducts = async store => {
  const productsArr = await loopRequest('product', 'getProductByShop', { shop_id: store.shopId });

  const productsModeled = productsArr.map(prod => {
    return {
      user: store.user,
      store: store.id,
      storeType: 'tokopedia',
      productData: prod,
      name: prod.basic.name,
      productId: prod.basic.productID,
    };
  });

  await Product.deleteMany();
  await Product.create(productsModeled);
};

const pullOrders = async store => {
  const ordersArr = await loopRequest('order', 'getOrder', {
    shop_id: store.shopId,
    from_date: new Date(store.createdAt).getTime(),
    to_date: Date.now(),
  });

  const ordersModeled = ordersArr.map(order => {
    return {
      store: store.id,
      user: store.user,
      orderData: order,
    };
  });

  await Order.deleteMany();
  await Order.create(ordersModeled);
};

exports.pullData = async storeId => {
  const store = await Store.findById(storeId);

  // await Promise.all([pullProducts(store), pullOrders(store)]);
  await pullProducts(store);
};
