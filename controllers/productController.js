const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ user: req.user.id });

  res.status(200).json({ status: 'success', data: { products } });
});

exports.getProductsByChannel = catchAsync(async (req, res, next) => {
  const products = await Product.find({ user: res.user.id, storeType: req.params.channel });

  res.status(200).json({ status: 'success', data: { products } });
});
