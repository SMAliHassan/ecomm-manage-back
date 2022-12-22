const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const tokopediaController = require('./tokopediaController');
const masterProductController = require('./masterProductController');

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ user: req.user.id })
    .populate({
      path: 'store',
      select: 'storeName storeType',
    })
    .select('-productData');
  //.populate({ path: 'store', select: 'storeName' });

  res.status(200).json({ status: 'success', data: { products } });
});

exports.getProductsByChannel = catchAsync(async (req, res, next) => {
  const products = await Product.find({
    user: req.user.id,
    storeType: req.params.channel,
  })
    .populate({ path: 'store', select: 'storeName storeType' })
    .populate({ path: 'masterProduct', select: 'bindedProduct name' })
    .select('-productData');

  res.status(200).json({ status: 'success', data: { products } });
});

exports.getProductTypes = catchAsync(async (req, res, next) => {
  const products = await Product.find({ user: req.user.id }).select('storeType');

  const typesArr = products.map(prod => prod.storeType);
  const typesUniqueArr = [...new Set(typesArr)];

  res.status(200).json({ status: 'success', data: { types: typesUniqueArr } });
});

exports.syncProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new AppError(400, 'No product found with this id.'));

  await masterProductController.createProduct(product);

  res.status(201).json({ status: 'success' });
});
