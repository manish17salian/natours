const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req,res,next)=>{

    //Get Tour Data

    const tours = await Tour.find()

    //Build Template


    //Render the Template


    res.status(200).render('overview',{
        title: 'All Tours',
        tours
    })
})


exports.getTour = catchAsync(async (req,res,next)=>{

    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    if(!tour){
        return next(new AppError('Tour Not Found',404))
    }
    res.status(200).set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
      ).render('tour',{
        title: `${tour.name} Tour`,
        tour
      })
    })





exports.getLoginForm = catchAsync(async (req,res,next)=>{
    res.status(200).set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
      ).render('login',{
        title:'Login'
    })
})


exports.getAccount = (req,res)=>{
    res.status(200).render('account',{
        title: 'Your Account'
    })
}

exports.getMyTours = catchAsync(async(req,res,next)=>{
    const booking = await Booking.find({user:req.user.id})

    const tourIds = booking.map(el=>el.tour)


    const tours = await Tour.find({_id:{$in:tourIds}})

    res.status(200).render('overview',{
        title:'My Tours',
        tours
    })
})

exports.alerts = (req,res,next)=>{
    const {alert} =req.query;
    if(alert === booking) res.locals.alert = 'Your booking was successful'

    next()
}