const { Schema, model } = require('mongoose');

const availableStoreTypes = process.env.STORE_TYPES.split(',');

const volumeSchema = new Schema({
  length: Number,
  width: Number,
  height: Number,
});

const productSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },

    // masterProduct: { type: Schema.Types.ObjectId, ref: 'MasterProduct' },

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
    images: [String],
    description: String,
    condition: Number, // NEW = 1 and USED = 2
    url: String,
    price: Number,

    volume: volumeSchema,
    weight: Number, // In Grams

    productData: Schema.Types.Mixed,

    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// productSchema.pre(/^find/, function () {
//   this.populate({ path: 'store', select: 'storeName storeType' });
// });

productSchema.virtual('masterProduct', {
  ref: 'MasterProduct',
  localField: '_id',
  foreignField: 'bindedProduct',
});

const Product = model('Product', productSchema);

module.exports = Product;
