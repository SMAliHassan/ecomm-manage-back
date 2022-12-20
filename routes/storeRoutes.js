const express = require('express');

const authController = require('../controllers/authController');
const storeController = require('../controllers/storeController');

const router = express.Router();

// All routes under this are protected.
router.use(authController.protect);

router.route('/').get(storeController.getAllUserStores);

router.get(
  '/all',

  authController.restrictTo('admin'),
  storeController.getAllStores
);
// .post( storeController.createStore);

// router.get('/connected-store-types', storeController.getConnectedStoreTypes);

router.post(
  '/:type',

  authController.restrictTo('admin'),
  storeController.createStore
);

router.patch('/:id', storeController.updateStore);

router.route('/auth/:type').get(storeController.getAuthUrl).post(storeController.authorizeStore);

router.route('/:id/pull-data').post(storeController.pullData);

module.exports = router;
