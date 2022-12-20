const { Schema, model } = require('mongoose');

const tokenSchema = new Schema({
  token: String,
  createdAt: { type: Date, default: Date.now },
  expireAt: Date,
});

const availableStoreTypes = process.env.STORE_TYPES.split(',');

const storeSchema = new Schema(
  {
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

    storeNameNew: String,
    storeName: String,

    // For Shopee and Tokopedia
    shopId: Number,

    // status: { type: String, enum: ['authorized', 'unauthorized'] },

    active: Boolean,

    countryRegion: String,

    storeData: Schema.Types.Mixed,

    authorizedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },

    accessToken: tokenSchema,
    refreshToken: tokenSchema,
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

storeSchema.virtual('authValidFor').get(function () {
  let val;

  switch (this.storeType) {
    case 'shopee': {
      const daysSinceAuth = +(
        (Date.now() - new Date(this.authorizedAt).getTime()) /
        (24 * 60 * 60 * 1000)
      ).toFixed();

      val = `${+process.env.AUTH_VALIDITY_PERIOD - daysSinceAuth} days`;
    }

    case 'lazada': {
      val = (
        (new Date(this.refreshToken.expireAt).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000)
      ).toFixed();

      val += ' days';
    }

    case 'tokopedia': {
      val = 'Forever';
    }
  }

  return val;
});

storeSchema.virtual('authorized').get(function () {
  if (this.storeType === 'tokopedia') return true;

  // return newDate(this.authorizedAt).getTime()
});

const Store = model('Store', storeSchema);

module.exports = Store;
