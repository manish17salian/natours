const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const bookingController = require('../controllers/bookingController');


const router = express.Router();


router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession)

module.exports = router