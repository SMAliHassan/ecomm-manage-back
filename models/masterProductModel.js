const { Schema, model } = require('mongoose');

// const availableStoreTypes = process.env.STORE_TYPES.split(',');

const volumeSchema = new Schema({
  length: Number,
  width: Number,
  height: Number,
});

const masterProductSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bindedStore: { type: Schema.Types.ObjectId, ref: 'Store' },
  bindedProduct: { type: Schema.Types.ObjectId, ref: 'Product' },

  images: [String],
  condition: Number, // NEW = 1 and USED = 2

  channelPrice: Number,
  masterPrice: Number,

  name: { type: String, required: true },

  description: String,

  volume: volumeSchema,
  weight: Number, // In Grams

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const MasterProduct = model('MasterProduct', masterProductSchema);

module.exports = MasterProduct;
