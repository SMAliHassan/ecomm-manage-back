const express = require('express');

const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

// Get all products for the current user
router.route('/').get(authController.protect, productController.getAllProducts);

router.route('/:channel').get(authController.protect, productController.getProductsByChannel);

module.exports = router;
