const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.delete('/logout', authController.logout);

router.patch('/updateMe', authController.protect, userController.updateUser);
router.patch('/updatePassword', authController.protect, authController.updatePassword);

router.delete('/deleteMe', authController.protect, userController.deleteUser);

router.get(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  userController.getAllUsers
);

// router.post(
//   '/mail',
//   authController.protect,
//   authController.restrictTo('admin'),
//   userController.mail
// );

router.get('/getMe', authController.protect, userController.getMe);

router.get(
  '/new',
  authController.protect,
  authController.restrictTo('admin'),
  userController.getNewUsers
);

router
  .route('/:id')
  .get(authController.protect, authController.restrictTo('admin'), userController.getUser)
  .delete(authController.protect, authController.restrictTo('admin'), userController.deleteUser)
  .patch(authController.protect, authController.restrictTo('admin'), userController.updateUser);

// router.post(
//   '/:id/mail',
//   authController.protect,
//   authController.restrictTo('admin'),
//   userController.mail
// );

module.exports = router;
