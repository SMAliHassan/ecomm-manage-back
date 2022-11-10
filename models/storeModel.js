const { Schema, model } = require('mongoose');

const tokenSchema = new Schema({
  token: String,
  createdAt: { type: Date, default: Date.now },
  expireAt: Date,
});

const availableStoreTypes = process.env.STORE_TYPES.split(',');

const storeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  storeType: {
    type: String,
    lowercase: true,
    required: true,
    enum: {
      values: availableStoreTypes,
      message: 'The shop types can only be: ' + availableStoreTypes,
    },
  },

  storeName: String,

  // For Shopee and Tokopedia
  shopId: Number,

  // status: { type: String, enum: ['authorized', 'unauthorized'] },

  active: Boolean,

  // For Lazada
  countryCode: String,

  storeData: Schema.Types.Mixed,

  createdAt: { type: Date, default: Date.now },

  accessToken: tokenSchema,
  refreshToken: tokenSchema,
});

const Store = model('Store', storeSchema);

module.exports = Store;
