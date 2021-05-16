const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.params.id, Model)

    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document Found for the Id', 404));
    }
    res.status(200).json({
      status: 'success',
      message: 'Deleted Successfully',
    });
  });


exports.updateOne = (Model)=> catchAsync(async (req, res,next) => {
    console.log(req.params.id, Model)
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
  
    if(!doc){
      return  next(new AppError('No document Found for the Id', 404))
      }
    res.status(200).json({
      status: 'success',
      message: 'Updated Successfully',
      data:{
        data: doc
    }
  });
  
  });


exports.createOne = (Model)=>catchAsync(async (req, res,next) => {
 
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  
  });


exports.getOne = (Model, popOptions)=> catchAsync( async (req, res, next) => {

    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions)
    const doc = await query;

    // const doc = await Model.findById(req.params.id).populate('reviews') //Populates guides data in the tours
    // const tour = tours.find((el) => el.id == req.params.id * 1);
  
    if(!doc){
    return  next(new AppError('No document Found for the Id', 404))
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = Model => catchAsync(async (req, res,next) => {



//To allow for nested Routes
    let filter;

    if(req.params.tourId) filter = {tour:req.params.tourId}



    //Execute Query
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().pagination()
    // const doc= await features.query.explain()  //Indexes
    const doc= await features.query 



    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: {
        data:doc,
      },
    });
  }
)