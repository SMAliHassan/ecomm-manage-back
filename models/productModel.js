const { Schema, model } = require('mongoose');

const productSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },

  productId: { type: Number, required: true },

  name: { type: String, required: true },
  sku: { type: String, required: true },

  status: String,

  createdAt: Date,
  updatedAt: Date,
});

const Product = model('Product', productSchema);

module.exports = Product;
