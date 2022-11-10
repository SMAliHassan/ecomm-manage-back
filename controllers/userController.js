const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
// const { sendEmail } = require('../utils/email');
// const { unescape } = require('html-escaper');

const filterObj = (obj, ...properties) => {
  const filteredObj = {};

  Object.keys(obj).forEach(key => {
    if (properties.includes(key)) filteredObj[key] = obj[key];
  });

  return filteredObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({ status: 'success', data: { results: users.length, users } });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError(404, 'User not found!'));
  }

  res.status(200).json({ status: 'success', data: { user } });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user);

  if (!user) {
    return next(new AppError(404, 'User not found!'));
  }

  res.status(200).json({ status: 'success', data: { user } });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user) return next(new AppError(404, 'User not found!'));

  const password = req.body.password;
  if (!password || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(400, 'Incorrect password!'));
  }

  user.active = false;

  await user.save();

  res.status(204).json({ status: 'success', data: null });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        400,
        'This path is not for changing password. If you want to change your password, use "/updatePassword"'
      )
    );
  }

  const updateObj = filterObj(req.body, 'name', 'role'); // Add other changeable properties later

  const user = await User.findByIdAndUpdate(req.user.id, updateObj, {
    new: true,
    runValidators: true,
  });

  if (!user) return next(new AppError(404, 'User not found!'));

  res.status(200).json({ status: 'success', data: { user } });
});

// exports.mail = catchAsync(async (req, res, next) => {
//   if (!req.body.html && !req.body.message)
//     return next(new AppError(400, 'Please provide a message or HTML for the email body.'));

//   if (req.params.id) req.body.users = [req.params.id];

//   const usersPromisArr = req.body.users.map(user => User.findById(user).select('email'));
//   const userEmailArr = await Promise.all(usersPromisArr);

//   const options = {
//     subject: req.body.subject,
//   };
//   if (req.body.html) {
//     options.html = unescape(req.body.html);
//   } else {
//     options.message = req.body.message;
//   }

//   const cleanedUsers = userEmailArr.map(({ email }) => email);

//   options.email = cleanedUsers;

//   await sendEmail(options);

//   res
//     .status(201)
//     .json({ status: 'success', message: `${cleanedUsers.length} Email(s) sent successfully.` });
// });

exports.getNewUsers = catchAsync(async (req, res, next) => {
  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;

  const users = await User.find({ createdAt: { $gte: fiveDaysAgo } }).sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', data: { users } });
});
