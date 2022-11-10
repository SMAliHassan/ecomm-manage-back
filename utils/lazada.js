const LazadaAPI = require('lazada-open-platform-sdk');
const { get: lazadaGetRequest } = require('lazada-open-platform-sdk/lib/LazadaRequest');

const Store = require('../models/storeModel');
const catchAsync = require('../utils/catchAsync');

const appKey = process.env.LAZADA_APP_KEY;
const appSecret = process.env.LAZADA_APP_SECRET;

// https://auth.lazada.com/oauth/authorize?client_id=115159&redirect_uri=https%3A%2F%2Fpartner.ginee.com%2Fauth%2Flazada&force_auth=true&response_type=code&state=SHOP
exports.buildAuth = () => {
  const redirectUri = process.env.AUTH_REDIRECT_URL_BASE + '/lazada';
  const clientId = process.env.LAZADA_APP_KEY;

  return `https://auth.lazada.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&force_auth=true&response_type=code`;
};

const createLazadaClient = (accessToken, countryCode = 'id') => {
  let country;

  switch (countryCode.toLowerCase()) {
    case 'sg':
      country = 'SINGAPORE';
      break;

    case 'id':
      country = 'INDONESIA';
      break;

    case 'my':
      country = 'MALAYSIA';
      break;

    case 'ph':
      country = 'PHILIPPINES';
      break;

    case 'vn':
      country = 'VIETNAM';
      break;

    case 'th':
      country = 'THAILAND';
      break;
  }

  return new LazadaAPI(
    process.env.LAZADA_APP_KEY,
    process.env.LAZADA_APP_SECRET,
    country,
    accessToken
  );
};

const getBaseUrl = country => createLazadaClient('_', country)._gateway;

const _checkGenerateAccessToken = async storeId => {
  let store = Store.findById(storeId);

  if (new Date(store.accessToken.expireAt) <= new Date()) {
    // Refresh Token

    const lazadaClient = createLazadaClient(undefined, store.countryCode);
    const { access_token, expires_in, refresh_token, refresh_expires_in } =
      await lazadaClient.refreshAccessToken();

    const updateObj = {
      accessToken: {
        token: access_token,
        expireAt: new Date(expires_in * 1000),
      },
      refreshToken: {
        token: refresh_token,
        expireAt: new Date(refresh_expires_in * 1000),
      },
    };

    store = await Store.findByIdAndUpdate(storeId, updateObj, { new: true });
  }

  return store;
};

const getSeller = async (country, accessToken) => {
  const { data } = await lazadaGetRequest(
    getBaseUrl(country),
    process.env.LAZADA_APP_KEY,
    process.env.LAZADA_APP_SECRET,
    '/seller/get',
    accessToken
  );

  return data;
};

exports.authorize = async () => {
  const { code } = req.body;

  const lazadaClient = createLazadaClient();

  const {
    access_token,
    refresh_token,
    expires_in,
    refresh_expires_in,
    country: countryCode,
  } = await lazadaClient.generateAccessToken({
    code,
  });

  const { seller } = await getSeller();

  const store = await Store.create({
    shopType: 'lazada',
    countryCode,
    shopData: data,
    storeName: seller.name,

    accessToken: {
      token: access_token,
      expireAt: new Date(expires_in * 1000 + Date.now()),
    },

    refreshAccessToken: {
      token: refresh_token,
      expireAt: new Date(refresh_expires_in * 1000 + Date.now()),
    },
  });

  return store;
};

exports.pullData = async storeId => {
  const store = await Store.findById(storeId);
  const aLazadaClient = createLazadaClient(store.accessToken.token, store.countryCode);

  while (true) {}

  const products = await aLazadaClient.getProducts();
};
