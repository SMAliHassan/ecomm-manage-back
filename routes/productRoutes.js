const express = require('express');

// const masterProductRouter = require('./masterProductRoutes');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

// All routes below this are protected
router.use(authController.protect);

// Get all products for the current user
router.route('/').get(productController.getAllProducts);

router.get('/types', productController.getProductTypes);

// Nested routing
router.post('/:id/sync', productController.syncProduct);

router.route('/:channel').get(productController.getProductsByChannel);

module.exports = router;
