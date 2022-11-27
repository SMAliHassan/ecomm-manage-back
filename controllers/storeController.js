const Store = require('../models/storeModel');
const shopeeController = require('./shopeeController');
const lazadaController = require('./lazadaController');
const tokopediaController = require('./tokopediaController');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllUserStores = catchAsync(async (req, res, next) => {
  const stores = await Store.find({ user: req.user.id });
  res.status(200).json({ status: 'success', data: { stores } });
});

exports.getAllStores = catchAsync(async (req, res, next) => {
  const stores = await Store.find();
  res.status(200).json({ status: 'success', data: { stores } });
});

exports.createStore = catchAsync(async (req, res, next) => {
  const user = req.body.userId ? req.body.userId : req.user.id;

  if (req.params.type === 'tokopedia') await tokopediaController.createStore(req.body.shopId, user);

  res.status(201).json({ status: 'success' });
});

exports.getAuthUrl = catchAsync(async (req, res, next) => {
  const { type } = req.params;
  let authUrl;

  switch (type) {
    case 'shopee':
      authUrl = shopeeController.buildAuth();
      break;

    case 'lazada':
      authUrl = lazadaController.buildAuth();
      break;

    default:
      res.status(400).json({ status: 'fail', message: 'Invalid store type!' });
  }

  res.status(200).json({ status: 'success', data: { authUrl } });
});

exports.authorizeStore = catchAsync(async (req, res, next) => {
  const { type } = req.params;

  switch (type) {
    case 'shopee':
      await shopeeController.authorize(req);
    case 'lazada':
      await lazadaController.authorize();
  }

  res.status(201).json({ status: 'success' });
});

exports.pullData = catchAsync(async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  if (!store) return next(new AppError(400, 'No store found with this id.'));

  switch (store.storeType) {
    case 'shopee':
      await shopeeController.pullData(store.id);
    case 'lazada':
      await lazadaController.pullData();
    case 'tokopedia':
      await tokopediaController.pullData(store.id);
  }

  res.status(201).json({ status: 'success' });
});
