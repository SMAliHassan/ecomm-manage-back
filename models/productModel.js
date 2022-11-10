const { Schema, model } = require('mongoose');

const availableStoreTypes = process.env.STORE_TYPES.split(',');

const productSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },

  storeType: {
    type: String,
    lowercase: true,
    required: true,
    enum: {
      values: availableStoreTypes,
      message: 'The shop types can only be: ' + availableStoreTypes,
    },
  },

  productId: { type: Number, required: true },

  name: { type: String, required: true },
  // sku: { type: String, required: true },

  // status: String,

  productData: Schema.Types.Mixed,

  createdAt: Date,
  updatedAt: Date,
});

const Product = model('Product', productSchema);

module.exports = Product;
