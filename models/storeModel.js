const { Schema, model } = require('mongoose');

const tokenSchema = new Schema({
  token: String,
  createdAt: { type: Date, default: Date.now },
  expireIn: Number,
});

const availableStores = ['shopee'];

const storeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  storeType: {
    type: String,
    lowercase: true,
    required: true,

    enum: {
      values: availableStores,
      message: 'The role can only be: ' + availableStores,
    },
  },

  // Only for Shopee
  shopId: Number,

  accessToken: tokenSchema,
  refreshToken: tokenSchema,
});

const Store = model('Store', storeSchema);

module.exports = Store;
