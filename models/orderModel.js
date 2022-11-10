const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
  store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeType: String,

  orderData: Schema.Types.Mixed,
});

const orderModel = model('Order', orderSchema);

module.exports = orderModel;
