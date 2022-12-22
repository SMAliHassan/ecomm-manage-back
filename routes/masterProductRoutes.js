const express = require('express');

const authController = require('../controllers/authController');
const masterProductController = require('../controllers/masterProductController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/price')
  .patch(masterProductController.updatePrice)
  .get(masterProductController.getPriceList);

router
  .route('/:id')
  .get(masterProductController.getProduct)
  .patch(masterProductController.updateProduct)
  .delete(masterProductController.deleteProduct);

router.post('/:id/publish', masterProductController.publishToStore);

router
  .route('/')
  .get(masterProductController.getAllProducts)
  .post(masterProductController.createUnbindedProduct);

router.post('/create-by-store', masterProductController.createProductsByStore);

module.exports = router;
