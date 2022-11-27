const express = require('express');

const authController = require('../controllers/authController');
const masterProductController = require('../controllers/masterProductController');

const router = express.Router();

router.use(authController.protect);
// Syncing (channel) products
router.route('/').get(masterProductController.getAllProducts);

module.exports = router;
