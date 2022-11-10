const express = require('express');

const authController = require('../controllers/authController');
const storeController = require('../controllers/storeController');

const router = express.Router();

router.route('/').get(authController.protect, storeController.getAllUserStores);

router.get(
  '/all',
  authController.protect,
  authController.restrictTo('admin'),
  storeController.getAllStores
);
// .post( storeController.createStore);

// router.get('/connected-store-types', storeController.getConnectedStoreTypes);

router.post(
  '/:type',
  authController.protect,
  authController.restrictTo('admin'),
  storeController.createStore
);

router
  .route('/auth/:type')
  .get(authController.protect, storeController.getAuthUrl)
  .post(authController.protect, storeController.authorizeStore);

router.route('/:id/pull-data').post(authController.protect, storeController.pullData);

module.exports = router;
