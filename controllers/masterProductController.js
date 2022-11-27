const catchAsync = require('../utils/catchAsync');
const MasterProduct = require('../models/masterProductModel');
const AppError = require('../utils/appError');

exports.createProduct = async product => {
  await MasterProduct.findOneAndDelete({ bindedProduct: product._id });

  const masterProductData = {
    user: product.user,
    bindedStore: product.store,
    bindedProduct: product._id,
    name: product.name,
    defaultPrice: product.productData.price.value,
    price: product.productData.price.value,
    image: product.productData.pictures[0].OriginalURL,
  };

  return await MasterProduct.create(masterProductData);
};

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const masterProducts = await MasterProduct.find().populate({
    path: 'bindedStore',
    select: 'storeName storeType',
  });

  res.status(200).json({ status: 'success', data: { masterProducts } });
});
