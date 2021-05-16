const express = require('express');
const path = require('path')
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean')
const hpp =  require('hpp')


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRouter');
const bookingRouter = require('./routes/bookingRoutes')
const cookieParser = require('cookie-parser');


const app = express();

app.set('view engine', 'pug');
app.set('views',path.join(__dirname,'views'))

// 1) MIDDLEWARES

// app.use(express.static(`${__dirname}/public`));   //Used to host the static files
app.use(express.static(path.join(__dirname,'public')));   //Used to host the static files


app.use(helmet()) //Used to protct the headers

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));  //Morgan is used to check the api name in the console.log
}

const limiter = rateLimit({
  max:100,
  windowMs:60*60*1000,
  message:'To many request from this IP, please try again in an Hour'
});

app.use('/api', limiter); //Limiter is used to limit the number of request 

app.use(express.json({
  limit: '10kb'
}));

app.use(cookieParser())

app.use(mongoSanitize()); //Mongo sanitize is used to prevent the NoSQL injection attacks

app.use(xss()); //XSS is used to prevent

app.use(hpp({
  whitelist:[
    'duration',
    'ratingsQuantity',
    'ratings',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}))  //It is used to prevent the query pollution such as [api/sort=price&sort=duration] which is not handled and causes error so to avoid such case
//and Whitelist is used to avoid case where we have implemented the above case



app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies)
  next();
});  //Dummy middleware

// 3) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);



app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
}); //Used to handle the apis that are not defined

app.use(globalErrorHandler)  //This error module is used for the errors that come up during the production


module.exports = app;
