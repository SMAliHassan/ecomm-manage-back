const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllProducts = async (req, res, next) => {
  const products = await Product.find({ user: res.user.id });

  res.status(200).json({ status: 'success', data: { products } });
};
