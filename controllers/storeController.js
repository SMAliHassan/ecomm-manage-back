const crypto = require('crypto');
const axios = require('axios');

const Store = require('../models/storeModel');
const shopee = require('../utils/shopee');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllstores = catchAsync(async (req, res, next) => {
  const stores = await Store.find({ user: req.user.id });
  res.status(200).json({ status: 'success', data: { stores } });
});

exports.getAuthUrl = catchAsync(async (req, res, next) => {
  const type = req.params.type;

  if (type === 'shopee') {
    const authUrl = shopee.createAuth();
    return res.status(200).json({ status: 'success', authUrl });
  }

  res.status(400).json({ status: 'fail', message: 'Invalid store type!' });
});

exports.authorizeStore = catchAsync(async (req, res, next) => {
  if (type === 'shopee') {
    const { code, shop_id, main_account_id } = req.body;

    if (!shop_id && !main_account_id)
      return next(new AppError(400, 'No shop_id or main_account_id provided!'));

    const { access_token, refresh_token, expire_in, shop_id_list } = await shopee.authorize({
      code,
      shop_id,
      main_account_id,
    });

    if (shop_id_list) {
      const storePromiseArr = shop_id_list.map(id =>
        Store.create({
          storeType: 'shopee',
          user: req.user.id,
          shopId: id,
          accessToken: { token: access_token, expireIn: expire_in * 1000 },
          refreshToken: {
            token: refresh_token,
            expireIn: process.env.SHOPEE_REFRESH_EXPIRE * 24 * 60 * 60 * 1000,
          },
        })
      );
      await Promise.all(storePromiseArr);
    } else {
      await Store.create({
        storeType: 'shopee',
        user: req.user.id,
        shopId: shop_id,
        accessToken: { token: access_token, expireIn: expire_in * 1000 },
        refreshToken: {
          token: refresh_token,
          expireIn: process.env.SHOPEE_REFRESH_EXPIRE * 24 * 60 * 60 * 1000,
        },
      });
    }

    return res.status(201).json({ status: 'success' });
  }
});

exports.pullData = catchAsync(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  await shopee.pullData();

  const updatedStore = await Store.findById(store);

  res.status(201).json({ status: 'success', data: { store: updatedStore } });
});
