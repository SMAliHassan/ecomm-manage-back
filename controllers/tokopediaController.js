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
  if (!Number.isInteger(+shopId)) throw new AppError(400, 'The shopId should be a number!');

  const shopCheck = await Store.findOne({ shopId, storeType: 'tokopedia' });
  if (shopCheck) throw new AppError(400, 'Such a store already exists!');

  let shop;
  try {
    [shop] = await client.shop.getShopInfo(shopId);
  } catch (err) {
    throw new AppError(
      400,
      'No Tokopedia shop found with this shopId that is associated with our Tokopedia App!'
    );
  }

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

  // const popo = await client.product.getProductById(productsArr[0].variant.childrenID[0]);
  // const popo = await client.product.getProductInfo([3062014918]);
  // console.log(popo[0].variant);

  const productsModeled = productsArr.map(prod => {
    const images = prod.pictures.map(pic => pic.OriginalURL);

    const price = prod.price.idr ? prod.price.idr : prod.price.value;

    const weight = prod.weight.unit === 1 ? prod.weight.value : prod.weight.value * 1000;

    return {
      user: store.user,
      store: store.id,
      storeType: 'tokopedia',
      productData: prod,
      name: prod.basic.name,
      images,
      price,
      url: prod.other.url,
      productId: prod.basic.productID,
      condition: prod.basic.condition,
      description: prod.basic.shortDesc,
      volume: prod.volume,
      weight,
    };
  });

  await Promise.all(
    productsModeled.map(async prod => {
      const prodOld = await Product.findOne({ productId: prod.productId, store: prod.store });

      if (prodOld) {
        await Product.findOneAndUpdate({ productId: prod.productId, store: prod.store }, prod);
      } else {
        await Product.create(prod);
      }
    })
  );
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

exports.updatePrice = async ({ productId, price }) => {
  const product = await Product.findById(productId).populate({ path: 'store', select: 'shopId' });

  try {
    await client.product.updateProductPrice({
      shop_id: product.store.shopId,
      update_details: [{ product_id: product.productId, new_price: price }],
    });
  } catch (err) {
    if (err.message.trim().startsWith('RBAC_MDLW_002')) {
      throw new AppError(
        400,
        "You do not have the required privilege to perform this action on this shop's items."
      );
    }

    throw err;
  }
};
