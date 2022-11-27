const { Schema, model } = require('mongoose');

// const availableStoreTypes = process.env.STORE_TYPES.split(',');

const masterProductSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bindedStore: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  bindedProduct: { type: Schema.Types.ObjectId, ref: 'Product' },

  // storeType: {
  //   type: String,
  //   lowercase: true,
  //   required: true,
  //   enum: {
  //     values: availableStoreTypes,
  //     message: 'The shop types can only be: ' + availableStoreTypes,
  //   },
  // },

  // productId: { type: Number, required: true },

  image: String,

  defaultPrice: Number,
  price: Number,

  name: { type: String, required: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const MasterProduct = model('MasterProduct', masterProductSchema);

module.exports = MasterProduct;
