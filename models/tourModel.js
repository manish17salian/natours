const mongoose = require('mongoose');
const slugify = require('slugify');

// const User = require('./userModel')

const tourSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'A Tour must have a NAME'],
      trim:true,
      unique:true,
      maxlength:[40, 'A Tour name must have less than or equal to 40 character'],
      minlength: [10, 'A Tour name must have less than or equal to 10 character']
    },
    duration:{
      type: Number,
      required:[true, 'A Tour must have DURATION']
    },
    maxGroupSize:{
      type: Number,
      required:[true, 'A Tour must have GROUP SIZE']
    },
    difficulty:{
      type: String,
      required:[true, 'A Tour mst have a DIFFICULTY'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty should be either easy, medium, difficult'
      }
    },
    ratingsAverage:{
      type:Number,
      default:4.5,
      min:[1, 'Rating must be above 1.0'],
      max:[5, 'Rating must be below 5'],
      set:val=>Math.round(val*10) / 10 //Makes sure the rating is only upto 1 decimal place
    },
    ratingsQuantity:{
      type:Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a PRICE'],
    },
    priceDiscount:{
      type:Number,
      validate:{
        validator:function(val){
          return val < this.price
        },
        message:'Discount must be less than the Price'
      }
    },
    summary:{
      type:String,
      trim:true,
      required:[true, 'A Tour nmust have SUMMARY']
    },
    description:{
      type:String,
      trim:true
    },
    imageCover:{
      type:String,
      required:[true, 'A Tour must have COVER Image']
    },
    images:[String],
    createdAt:{
      type: Date,
      default: Date.now(),
      select:false //To hide the data from the response
    },
    slug:String,

    startDates:[Date],

    secretTour:{
      type:Boolean,
      default:false
    },
    startLocation:{
      type:{
        type:String,
        default:'Point',
        enum:['Point']
      },
      coordinates:[Number],
      address:String,
      description:String
    },
    locations:[
      {
        type:{
          type:String,
          default:'Point',
          enum:['Point']
        },
        coordinates:[Number],
        address:String,
        description:String,
        day:Number
      }
    ],
    guides:[                          //list of guides in the array
      {
      type:mongoose.Schema.ObjectId,
      ref: 'User'
      }
    ]
  },{
    toJSON: {
      virtuals:true
    },
    toObject:{
      virtuals:true
    }
  });


  // tourSchema.index({price:1})
  tourSchema.index({price:1, ratingsAverage:-1})
  tourSchema.index({slug:1})
  tourSchema.index({startLocation : '2dsphere'})



  //Virtual are used to converstions of data and are showed in the output but are not stored in the database

tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7
})

tourSchema.virtual('reviews',{        //Helps to populate reviewSchema in the response
  ref:'Review',
  foreignField: 'tour',
  localField:'_id'
})
//Document Middlewre

//PRE middlw ware is used to make changes before saving the document
tourSchema.pre('save', function(next){               //Before saving the tour adds the slug field
  this.slug = slugify(this.name,{lower:true});
  next()
})

// tourSchema.pre('save',async function(next){ //EMBEDDING USER DOCUMENTS INTO THE TOUR DOCUMENT
//   const guidesPromises = this.guides.map(async id=> await User.findById(id))
//   this.guides = await Promise.all(guidesPromises)
//   next();
// })

// tourSchema.post('save', function(doc,next) {
//   console.log(doc)
// })

//Query Middleware

tourSchema.pre(/^find/, function(next){
this.find({secretTour:{$ne:true}})

this.start = Date.now()
  next();
})

tourSchema.pre(/^find/, function(next){         //Populates the guides field in the Response
  this.populate({
    path:'guides',
    select:'-__v -passwordChangedAt'
  });
  next()
})

tourSchema.post(/^find/, function(docs,next){
  // console.log(Date.now() - this.start)
    // console.log(docs);
    next();
  })

  //AggregationMiddleware

  // tourSchema.pre('aggregate', function(next){
  //   this.pipeline().unshift({$match:{secretTour:{$ne:true}}})
  //   next()
  // })

  const Tour = mongoose.model('Tour', tourSchema
  )
  module.exports = Tour;