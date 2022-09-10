const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const availableRoles = ['user'];
const availableStores = ['shopee'];

const userSchema = new Schema(
  {
    name: String,

    email: {
      type: String,
      required: [true, 'Please provide your email.'],
      unique: [true, 'An account with this email already exists! Try logging in.'],
    },

    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      minlength: [8, 'Please provide a strong password atleast 8 characters long.'],
      select: false,
    },

    passwordConfirm: {
      type: String,
      validate: {
        validator: function (val) {
          return this.password === val;
        },
        message: 'Passwords are not the same!',
      },
    },

    createdAt: { type: Date, default: Date.now },

    passwordChangedAt: Date,

    role: {
      type: String,
      enum: {
        values: availableRoles,
        message: 'The role can only be: ' + availableRoles,
      },
      default: 'user',
    },

    active: { type: Boolean, default: true, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// userSchema.virtual('orders', {
//   ref: 'Order',
//   foreignField: 'user',
//   localField: '_id',
// });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

userSchema.pre(/^find/, function (next) {
  this.select('-__v -passwordChangedAt');

  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, password) {
  return await bcrypt.compare(candidatePassword, password);
};

userSchema.methods.passwordChangedAfter = function (jwtDate) {
  if (this.passwordChangedAt) return false;

  const passwordChangeTime = this.passwordChangedAt / 1000;

  return passwordChangeTime > jwtDate;
};

const User = model('User', userSchema);

module.exports = User;
