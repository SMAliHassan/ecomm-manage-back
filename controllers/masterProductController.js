const catchAsync = require('../utils/catchAsync');
const MasterProduct = require('../models/masterProductModel');
const AppError = require('../utils/appError');
const Product = require('../models/productModel');
const Store = require('../models/storeModel');
const tokopediaController = require('./tokopediaController');
const productController = require('./productController');

exports.createProduct = async product => {
  await MasterProduct.findOneAndDelete({ bindedProduct: product._id });

  const masterProductData = {
    user: product.user,
    bindedStore: product.store,
    bindedProduct: product._id,
    name: product.name,
    // price: product.productData.price.value,
    channelPrice: product.price,
    masterPrice: product.price,
    // image: product.productData.pictures[0].OriginalURL,
    // images: product.productData.pictures.map(pic => pic.OriginalURL),
    images: product.images,
    condition: product.condition,
    description: product.description,
    volume: product.volume,
    weight: product.weight,
  };

  return await MasterProduct.create(masterProductData);
};

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const masterProducts = await MasterProduct.find({ user: req.user.id }).populate({
    path: 'bindedStore',
    select: 'storeName storeType storeNameNew',
  });

  res.status(200).json({ status: 'success', data: { masterProducts } });
});

exports.createProductsByStore = catchAsync(async (req, res, next) => {
  if (!req.body.storeId) return next(new AppError(400, 'Please provide the store'));

  const products = await Product.find({ store: req.body.storeId });

  await Promise.all(
    products.map(async prod => {
      const masterProd = await MasterProduct.findOne({ bindedProduct: prod._id });

      if (!masterProd) {
        await exports.createProduct(prod);
      }
    })
  );

  res.status(201).json({ status: 'success' });
});

exports.getPriceList = catchAsync(async (req, res, next) => {
  const products = await MasterProduct.find({
    user: req.user.id,
    bindedStore: { $exists: true },
    bindedProduct: { $exists: true },
  })
    .select('bindedStore bindedProduct channelPrice masterPrice name createdAt images _id')
    .populate({
      path: 'bindedStore',
      select: 'storeName storeType storeNameNew',
    });

  res.status(200).json({ status: 'success', data: { products } });
});

exports.updatePrice = catchAsync(async (req, res, next) => {
  const { masterPrice, channelPrice, masterProductId } = req.body;

  const masterProduct = await MasterProduct.findById(masterProductId);
  if (!masterProduct) return next(new AppError(400, 'No master product exists with this ID'));

  if (!masterPrice && !channelPrice)
    return next(new AppError(400, 'Please provide masterPrice or channelPrice.'));

  if (masterPrice) masterProduct.masterPrice = +masterPrice;

  if (channelPrice) {
    const channelProduct = await Product.findById(masterProduct.bindedProduct);

    if (channelProduct.storeType === 'tokopedia') {
      await tokopediaController.updatePrice({
        productId: channelProduct.id,
        price: +channelPrice,
      });
    }

    // switch (channelProduct.storeType) {
    //   case 'tokopedia':
    //     await tokopediaController.updatePrice({
    //       productId: channelProduct.id,
    //       price: +channelPrice,
    //     });
    //     break;

    //   default:
    //     break;
    // }

    masterProduct.channelPrice = +channelPrice;
  }

  await masterProduct.save();

  res.status(200).json({ status: 'success' });
});

exports.createUnbindedProduct = catchAsync(async (req, res, next) => {
  const productData = req.body;

  productData.user = req.user.id;

  await exports.createProduct(productData);

  res.status(200).json({ status: 'success' });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await MasterProduct.findById(req.params.id);

  if (!product) return next(new AppError(400, 'No master product exists with this id.'));

  if (req.user.id !== product.user && req.user.role !== 'admin')
    return next(new AppError(403, 'You do not have the permission to perform this action!'));

  await MasterProduct.findByIdAndDelete(req.params.id);

  res.status(204).json({ status: 'success', data: null });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await MasterProduct.findById(req.params.id);

  if (!product) return next(new AppError(400, 'No master product exists with this id.'));

  res.status(200).json({ status: 'success', data: { product } });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await MasterProduct.findById(req.params.id);

  if (!product) return next(new AppError(400, 'No master product exists with this id.'));

  await MasterProduct.findByIdAndUpdate(req.params.id, req.body);

  res.status(200).json({ status: 'success' });
});

exports.publishToStore = catchAsync(async (req, res, next) => {
  const { storeId, productData } = req.body;

  const [store, masterProduct] = await Promise.all([
    await Store.findById(storeId),
    await MasterProduct.findById(req.params.id),
  ]);

  if (!masterProduct) return next(new AppError(400, 'No Master Product exists with this id.'));
  if (!store) return next(new AppError(400, 'No Store exists with this id.'));

  let createdProduct;
  switch (store.storeType) {
    case 'tokopedia':
      createdProduct = await tokopediaController.createProductV3(store.id, productData);
      break;

    default:
      break;
  }

  if (!masterProduct.bindedProduct) {
    masterProduct.bindedProduct = createdProduct.id;
    await masterProduct.save();
  }

  res.status(201).json({ status: 'success' });
});
