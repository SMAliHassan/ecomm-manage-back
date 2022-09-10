const express = require('express');

const authController = require('../controllers/authController');
const storeController = require('../controllers/storeController');

const router = express.Router();

router.route('/').get(authController.protect, storeController.getAllstores);

router
  .route('/:type/auth')
  .get(authController.protect, storeController.getAuthUrl)
  .post(authController.protect, storeController.authorizeStore);

router.route('/:id/pull').post(authController.protect, storeController.pullData);

module.exports = router;
