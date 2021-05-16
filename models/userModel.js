const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, 'Please feel free to tell us you Name']
    },
    email:{
        type:String,
        required:[true, 'Please tell us your email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail, 'Please provide a Valid Email Address']
    },
    photo:{
        type:String,
        default:'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
      },
    password:{
        type:String,
        required:[true, 'Please provide a password'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true, 'Please Confirm your Password'],
        validate:{
            validator: function(el){
                return el === this.password
            },
            message: 'Passwords are not same'
        },
    },
    passwordChangedAt: Date,
    passwordResetToken:String,
    passwordRestExpires: Date,
    active:{
        type:Boolean,
        default:true,
        select: false
    }
})

userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)

    this.passwordConfirm = undefined;
    next()

})



userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew ) return next()

    this.passwordChangedAt = Date.now() - 1000;
    next()
})

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne:false}});
    next()
})

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);

}


userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        console.log(changedTimeStamp, JWTTimestamp)

        return JWTTimestamp < changedTimeStamp  //return true if the the password is changed after getting the token
    }
    return false
}

userSchema.methods.changePasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');   //used because reset token can be less secured
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordRestExpires = Date.now() + 10*60*1000;

    // console.log({resetToken}, this.passwordResetToken, this.passwordRestExpires)

    return resetToken //This reset token is returned where the function is called
    
}


const User = mongoose.model('User', userSchema);

module.exports = User;