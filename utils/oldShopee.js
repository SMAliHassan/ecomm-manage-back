const axios = require('axios');

const Shop = require('../models/storeModel');

const host =
  process.env.NODE_ENV === 'production' ? process.env.SHOPEE_URL : process.env.SHOPEE_TEST_URL;

const createSign = (partnerId, path, timest) => {
  const signString = partnerId + path + timest;

  const sign = crypto
    .createHmac('sha256', process.env.SHOPEE_PARTNER_KEY)
    .update(signString)
    .digest('hex');

  return sign;
};
exports.createSign = createSign;

exports.buildAuth = () => {
  const host =
    process.env.NODE_ENV === 'production' ? process.env.SHOPEE_URL : process.env.SHOPEE_TEST_URL;

  const path = '/api/v2/store/auth_partner';
  const timest = new Date().getTime();

  const redirectUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://www.domainname.com/auth/shopee'
      : 'http://127.0.0.1:3000/auth/shopee';

  const partnerId = process.env.SHOPEE_PARTNER_ID;

  const sign = createSign(partnerId, path, timest);

  return `${
    host + path
  }?partner_id=${partnerId}&timestamp=${timest}&sign=${sign}&redirect=${redirectUrl}`;
};

const refreshAccessToken = async (refreshToken, shopId) => {
  const path = '/api/v2/auth/access_token/get';
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const timest = new Date().getTime();
  const sign = createSign(partnerId, path, timest);

  const url = `${host + path}?partner_id=${partnerId}&timestamp=${timest}&sign=${sign}`;
  const body = {
    refresh_token: refreshToken,
    partner_id: partnerId,
    shop_id: shopId,
  };

  const { data } = axios.post(url, body, {
    'Content-Type': 'application/json',
  });
  return data;
};
exports.refreshAccessToken = refreshAccessToken;

// const verifyRefreshAccess = async shop => {
//   const accessTokenExpire =
//     new Date(shop.accessToken.createdAt).getTime() + shop.accessToken.expireIn;

//   const now = new Date().getTime();

//   if (now > accessTokenExpire) {
//     const { refresh_token, access_token, expire_in } = await refreshAccessToken();
//   }
// };

exports.authorize = async ({ code, shop_id, main_account_id }) => {
  const host =
    process.env.NODE_ENV === 'production' ? process.env.SHOPEE_URL : process.env.SHOPEE_TEST_URL;

  const path = '/api/v2/auth/token/get';
  const timest = new Date().getTime();
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const sign = createSign(partnerId, path, timest);

  const body = {
    partner_id: partnerId,
    code,
  };
  if (shop_id) body.shop_id = shop_id;
  else body.main_account_id = main_account_id;

  const url = `${host + path}?partner_id=${partnerId}&timestamp=${timest}&sign=${sign}`;

  const { data } = await axios.post(url, body, {
    'Content-Type': 'application/json',
  });
  return data;
};

const pullAllProducts = async shopId => {
  const path = '/v2/product/get_item_list';
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const timest = new Date().getTime();
  const sign = createSign(partnerId, path, timest);
  const shop = await Shop.findOne({ shopId, shopType: 'shopee' });

  let productList = [];
  const pageSize = 100; // Max is 100
  const statuses = ['NORMAL', 'BANNED', 'DELETED', 'UNLIST'];

  let offset = 0;
  let more = true;

  while (more) {
    const url = `${
      host + path
    }?partner_id=${partnerId}&timestamp=${timest}&sign=${sign}&offset=${offset}&page_size=${pageSize}&item_status=${statuses.join(
      '&item_status='
    )}`;

    const { data } = await axios.get(url);

    productList = [...productList, ...data.response.item];

    offset = data.response.next_offset;
    more = data.response.has_next_page;
  }
};

exports.pullData = async shopId => {
  await pullAllProducts();
};
