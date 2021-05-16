// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.alias = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image!Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// exports.getAllTours = catchAsync(async (req, res,next) => {

//     //Execute Query
//     const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().pagination()
//     const tours= await features.query
//     // const tours = await query;
//     // console.log(tours, '-----------')

//     res.status(200).json({
//       status: 'success',
//       result: tours.length,
//       data: {
//         tours,
//       },
//     });
//   }
// )

// exports.getTour = catchAsync( async (req, res, next) => {

//   const tour = await Tour.findById(req.params.id).populate('reviews') //Populates guides data in the tours
//   // const tour = tours.find((el) => el.id == req.params.id * 1);

//   if(!tour){
//   return  next(new AppError('No Tour Found for the Id', 404))
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

// exports.createTour = catchAsync(async (req, res,next) => {

//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });

// });

// exports.updateTour = catchAsync(async (req, res) => {

//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   })

//   if(!tour){
//     return  next(new AppError('No Tour Found for the Id', 404))
//     }
//   res.status(200).json({
//     status: 'success',
//     message: 'Updated Successfully',
//     data:{
//       tour
//   }
// });

// });

// exports.deleteTour = catchAsync(async(req, res, next) => {

//   const tour = await Tour.findByIdAndDelete(req.params.id)

//   if(!tour){
//     return  next(new AppError('No Tour Found for the Id', 404))
//     }
//   res.status(200).json({
//     status: 'success',
//     message: 'Deleted Successfully',
//   });

// });

exports.getAllTours = factory.getAll(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});

//Aggregation is used to group the data accroding to the need

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAvg: { $gte: 4.5 } }, //Similar to the find method, here it will only display results of which th ratingsAvg are greater than 4.5
    },
    {
      $group: {
        _id: '$difficulty',
        avgRating: { $avg: '$ratingsAvg' },
        numRatings: { $sum: '$ratingsQuantity' },
        numTours: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }, //The properties wriiten here will only be displayed in the result page
    },
    {
      $sort: { avgPrice: 1 }, //Sort accroding to greater and less than
    },
    {
      $match: {
        // _id:{$ne: 'easy'}
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.param.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`2021-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, //Makes the id false
      },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/233/center/34.075348, -118.312206/unit/mi
// '/tours-within/:distance/center/:latlng/unit/:unit'
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    next(new AppError('Please specify the latituded and longitude', 400));

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // const radius = unit === 'mi' ? distance/3963.2 : distance/6378.1

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(new AppError('Please specify the latituded and longitude', 400));

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
