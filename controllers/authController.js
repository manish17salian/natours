const jwt = require('jsonwebtoken')
const {promisify} = require('util')
const crypto= require('crypto')

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const Email = require('../utils/email')


const signToken = id=>{
    // console.log(process.env.JWT_EXPIRES_IN)
    return jwt.sign({id:id}, process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}


const createSendToken = (user, statusCode, res)=>{
    const token = signToken(user._id)
    const cookieOption = {
        expires:new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN *24*60*60*1000),
        // secure:true,
        httpOnly: true
    };
    if(process.env.NODE_ENV === 'production') cookieOption.secure = true
    res.cookie('jwt',token,cookieOption)  //To store token in cookies
    user.password = undefined
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user:user
        }
    })
}

exports.signup = catchAsync( async(req,res, next)=>{
    const newUser = await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
        passwordChangedAt:req.body.passwordChangedAt,
        role:req.body.role
    })

    const url = `${req.protocol}://${req.get('host')}/me`;
    // console.log(url)
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res)

})


exports.login = catchAsync(async (req,res,next)=>{

    const {email, password} = req.body;

    if(!email || !password) return next(new AppError('Please provide valid email address or password', 400))

    const user = await User.findOne({
        email,
        
    }).select('+password')


if(!user || !(await user.correctPassword(password, user.password))){   //Coorect Password function comes from the user model
    return next(new AppError ('Incorrect Email or Password', 401))
}

createSendToken(user, 200, res)


})


exports.protect = catchAsync(async (req, res, next)=>{  //To check if a valid user is accessing the route
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer') ){
         token = req.headers.authorization.split(' ')[1]
    }else if(req.cookies.jwt){
        token = req.cookies.jwt
    }
    if(!token){
        return next(new AppError('Please login and try again', 401))
    }

    //Verifiction Token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)   // await promisify returns the promisified version of the function jwt.verify which is then again called with the arguments of token and seceret
    
    //Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if(!currentUser) return next(new AppError('User does not exists', 401))

    if(currentUser.changePasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed Password! Please login again', 401))   //check if user logged in and changed the password and using the old token to access the route
    }

    req.user = currentUser
    res.locals.user = currentUser

    next()
})


exports.restrictTo = (...roles)=>{  //Roles argument is recieved as argument from  the function
    return (req, res, next)=>{
        //Roles will be inform of array
        if(!roles.includes(req.user.role)){   //Check if the argument in the array matches from the option recieved by the user
            return next(new AppError('You donot have permission to perfom this action',403))
        }
        next()
    }
}


exports.forgotPassword =  catchAsync(async (req,res,next) =>{
    //Get User based on POsted Email
    const user = await User.findOne({email: req.body.email})

    if(!user){
        return next(new AppError('There is no user with this email address', 404))
    }
    //generate Token
    const resetToken = user.changePasswordResetToken();  //function defined in the user model
    await user.save({validateBeforeSave:false})  //save the encrypted reset token in the schema and not to validate because if validate is true then the validator runs and then check if the user has logged in
    //Send its token

    // const message = `Forgot your password? Please process to the following URL ${resetURL} along with new paasword and password confirm`

    try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset()
        res.status(200).json({
            status:'success',
            message:'Token sent to email'
        })
    } catch (error) {
        user.passwordResetToken =  undefined;
        user.passwordRestExpires = undefined ;
    await user.save({validateBeforeSave:false})
    // console.log(error)

    return next(new AppError('There was an error',500))
    }


})

exports.resetPassword=catchAsync(async (req,res,next)=>{
    //get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex'); //this token is in non encrypted form which is encrypted and then comparted to the one stored in the database

    const user = await User.findOne({passwordResetToken: hashedToken, passwordRestExpires:{$gt: Date.now()}}) //Checks if the token exists and if the user is resetting password after the token is expired


    //If token doesnot expire amd there is new user, set new password

    if(!user){
        return next(new AppError('Token is not valid or expired', 400))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm

    user.passwordResetToken = undefined;
    user.passwordRestExpires = undefined;

    await user.save();
    // changepassword at property



    //log user in

createSendToken(user, 200, res)

})


//IF THE USER IS LOGGED IN AND THEN CHANGING THE PASSWORD

exports.updatePassword = catchAsync(async (req,res,next)=>{
    //User from th collection

    const user = await User.findById(req.user.id).select('+password') //Gets the user from the database

    //Check if posted password is correct

    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){ //compares the current password entered with the password in the data base with the coorect password entered by the user
        return next(new AppError('Your current password is incorrect',401))
    }
    //If correct update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    //log user in
createSendToken(user, 200, res)

})

//Only for rendered pages
exports.isLoggedIn = async (req, res, next)=>{  //To check if a valid user is accessing the route
     if(req.cookies.jwt){
        //Verifiction Token
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)   // await promisify returns the proisified version of the function jwt.verify which is then again called with the arguments of token and seceret
    
            //Check if user still exists
            const currentUser = await User.findById(decoded.id);
        
            if(!currentUser){ return next()}
        
            if(currentUser.changePasswordAfter(decoded.iat)){
                return next()   //check if user logged in and changed the password and using the old token to access the route
            }
        
            res.locals.user = currentUser
            return next()
        } catch (error) {
            return next() 
        }
     }
    
    next()
}

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.status(200).json({ status: 'success' });
  };

