const mongoose = require('mongoose');
const Tour = require('./tourModel');


const reviewSchema = new mongoose.Schema({

    review:{
        type:String,
        required: [true, 'Review cannot be EMPTY']
    },
    rating:{
        type:Number,
        default:4.5,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    tour:{
            type:mongoose.Schema.ObjectId,
            ref: 'Tour',
            required:[true,'Review must belong to a Tour']
    },
    user:{
            type:mongoose.Schema.ObjectId,
            ref: 'User',
            required:[true, 'Review must belong to a User']
    }

},{
    toJSON: {
        virtuals:true
      },
      toObject:{
        virtuals:true
      }
})


reviewSchema.index({tour:1, user:1},{
    unique:true
})


reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path:'tour',
    //     select:'name'
    // }).populate({
    //     path:'user',
    //     select:'name photo'
    // })

    this.populate({
        path:'user',
        select:'name photo'
    })
    next()
})


reviewSchema.statics.calcAverageRatings = async function(tourId){
 const stats =  await this.aggregate([
        {
            $match:{
                tour:tourId
            }
        },
        {
            $group:{
                _id:'$tour',
                nRating:{$sum:1},
                avgRating:{$avg: '$rating'}
            }
        }
    ]);

    console.log(stats)
if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId,{
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating
    })
}
}

reviewSchema.post('save', function(){

    this.constructor.calcAverageRatings(this.tour);
    // next()
})

// reviewSchema.pre(/^findOneAnd/,async function(next){
//  this.r = await this.findOne();
//  console.log(r)
// })

reviewSchema.post(/^findOneAnd/,async function(doc){

   await doc.constructor.calcAverageRatings(doc.tour);
    // next()
})


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review