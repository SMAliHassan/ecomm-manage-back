const { default: ShopeeOpenAPI } = require('shopee-open-api');
const { default: shopeeApiV2 } = require('shopee-openapi-v2'); // For auth only

const Store = require('../models/storeModel.js');
const AppError = require('../utils/appError');

const partner_id = +process.env.SHOPEE_PARTNER_ID;
const partner_key = process.env.SHOPEE_PARTNER_KEY;
const redirect = process.env.AUTH_REDIRECT_URL_BASE + '/shopee';

shopeeApiV2.setAppConfig({
  partner_id,
  partner_key,
  is_dev: process.env.NODE_ENV === 'production' ? false : true,
  redirect,
});

const shopeeApi = ShopeeOpenAPI({
  host: 'https://partner.test-stable.shopeemobile.com', //change this to production url
  partner_id,
  partner_key,
  redirect,
});

// Generate Auth link
exports.buildAuth = () => shopeeApi.getAuthLink();

const getShopData = async (shopId, accessToken) => {
  return await shopeeApi
    .createShop({
      shop_id: shopId,
      onGetAccessToken: async () => accessToken,
    })
    .getShopInfo();
};

exports.authorize = async user => {
  const { code, shop_id, main_account_id } = req.body;

  if (!shop_id && !main_account_id)
    return next(new AppError(400, 'No shop_id or main_account_id provided!'));

  const { access_token, refresh_token, expire_in, shop_id_list, merchant_id_list } =
    await shopeeApiV2.getAccesstoken({
      code,
      shop_id,
      main_account_id,
      partner_id,
    });

  if (shop_id_list?.length) {
    const storePromiseArr = shop_id_list.map(async id => {
      const shopData = await getShopData(id, access_token);

      await Store.create({
        storeType: 'shopee',
        user,
        shopData,
        shopId: id,
        accessToken: { token: access_token, expireAt: new Date(expire_in * 1000 + Date.now()) },
        refreshToken: {
          token: refresh_token,
          expireAt: new Date(process.env.SHOPEE_REFRESH_EXPIRE * 24 * 60 * 60 * 1000),
        },
      });
    });

    await Promise.all(storePromiseArr);
  } else {
    const shopData = await getShopData(shop_id, access_token);

    await Store.create({
      storeType: 'shopee',
      user,
      shopData,
      shopId: shop_id,
      accessToken: { token: access_token, expireAt: new Date(expire_in * 1000 + Date.now()) },
      refreshToken: {
        token: refresh_token,
        expireAt: new Date(process.env.SHOPEE_REFRESH_EXPIRE * 24 * 60 * 60 * 1000),
      },
    });
  }

  return res.status(201).json({ status: 'success' });
};

const pullData = async storeId => {
  const store = await Store.findById(storeId);
  if (!store) throw new AppError(400, 'No store found with this ID.');

  const shop = shopeeApi.createShop({
    shop_id: store.shopId,
    onGetAccessToken: async () => store.accessToken.token,
    onRefreshAccessToken: async () => {
      //OPTIONAL
      //you might want to have some logic here to prevent multiple calls to refresh access token
      const { access_token, refresh_token, expire_in } = await shopeeApi.refreshAccessToken({
        refresh_token: store.refreshToken.token,
        shop_id: store.shopId,
      });

      store.refreshToken = {
        token: refresh_token,
        expireAt: new Date(process.env.SHOPEE_REFRESH_EXPIRE * 24 * 60 * 60 * 1000),
      };
      store.accessToken = {
        token: access_token,
        expireAt: new Date(expire_in * 1000 + Date.now()),
      };
      await store.save();

      return access_token;
    },
  });

  let offset = 0;
  let more = true;
  const productsArr = [];
  while (more) {
    const { response } = await shop.Product.getItemList({ offset, page_size: 100 });

    productsArr.push(...response.item);
    more = newProdArr?.length;
    offset += 100;
  }

  const productsIdList = productsArr.map(prod => prod.item_id);

  const productsInfoArr = await getProductBaseInfo(productsIdList, shop);
  const productsModeledArr = productsInfoArr.map(prod => {
    return { productData: prod, store: store.storeId };
  });

  await Store.create(productsModeledArr);
};

const getProductBaseInfo = async (idList, shop) => {
  const remainingIds = [...idList];

  let offset = 0;
  const limit = 50;
  const productsArr = [];

  while (remainingIds.length) {
    const item_id_list = remainingIds.splice(offset, limit);
    const { response } = await shop.Product.getItemBaseInfo({ item_id_list });

    productsArr.push(...response.item);
    offset += limit;
  }

  return productsArr;
};
