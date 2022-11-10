const { default: TokopediaClient } = require('tokopedia-client');

const Store = require('../models/storeModel');
const Product = require('../models/productModel');

const client = new TokopediaClient({
  fs_id: 'YOUR FS ID',
  client_id: 'YOUR CLIENT ID',
  client_secret: 'YOUR CLIENT SECRET',
});

const generateAccessToken = async () => {
  const { expires_in } = await client.authenticate();

  setTimeout(generateAccessToken, expires_in * 1000);
};

// Initialize access_token
(async function () {
  try {
    // generateAccessToken(); uncomment the following line
    // await client.authenticate();
  } catch (err) {
    console.log(err.message);
  }
})();

exports.createShop = async (shopId, user) => {
  const shop = await client.shop.getShopInfo(shopId);

  const store = await Store.create({
    shopId,
    user,
    storeName: shop.shope_name,
    storeType: 'tokopedia',
    shopData: shop,
  });

  return store;
};

exports.pullData = async storeId => {
  const store = await Store.findById(storeId);

  const productsArr = [];
  let page = 0;
  let more = true;

  while (more) {
    page++;

    const products = await client.product.getProductByShop({
      shop_id: store.shopId,
      page,
      per_page: 50,
    });

    more = products?.length;

    productsArr.push(...products);
  }

  const productsModeled = productsArr.map(product => {
    const productObj = {
      productData: product,
      productId: product.basic.productId,
      Name: product.basic.Name,
    };
  });

  await Product.create(productsModeled);
};
