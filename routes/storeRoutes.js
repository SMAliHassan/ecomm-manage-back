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

// router.get('/connected-store-types', storeController.getConnectedStoreTypes);

router.get('/categories/:type', storeController.getCategories);

router.post(
  '/:type',

  authController.restrictTo('admin'),
  storeController.createStore
);

router.route('/:id').get(storeController.getStore).patch(storeController.updateStore);

router.route('/auth/:type').get(storeController.getAuthUrl).post(storeController.authorizeStore);

router.route('/:id/pull-data').post(storeController.pullData);

router.get('/:id/showcase', storeController.getAllShowcase);

module.exports = router;
