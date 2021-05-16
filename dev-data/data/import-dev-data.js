const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });


const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');



const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => console.log('----CONNECTION SUCCESSFULLY-----'));



const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));


// console.log(tours)

const importData = async()=>{
    try {
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Successfully Imported')
    } catch (error) {
        console.log(error)
    }
    process.exit()

}

const deleteData = async()=>{
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()

        console.log('Sucessfully Deleted')
    } catch (error) {
        console.log(error)
    }

    process.exit()
}


// console.log(process.argv)

if(process.argv[2] === '--import'){
    importData()
}else if(process.argv[2] === '--delete'){
    deleteData()
}