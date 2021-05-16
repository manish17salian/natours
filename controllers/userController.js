const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');


// const multerStorage = multer.diskStorage({
//   destination:(req,file,cb) =>{     //cb(error, callback value)
//     cb(null, 'public/img/users');
//   },
//   filename:(req,file,cb)=>{
//     const ext = file.mimetype.split('/')[1]
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });  //This can be used when u have save the file without any manipulation such as resizing the image

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb)=>{
  console.log(file, 'fileeeeeeeeeeeeeeeeeeee')
  if(file.mimetype.startsWith('image')){
    cb(null,  true)
  }else{
    cb(new AppError('Not an Image!Please upload only images', 400), false)
  }
}

// const upload = multer({
//   dest: 'public/img/users', //destination for uploaded image
// });

const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter
})

exports.uploadUserPhoto = upload.single('photo')
exports.resizeUserPhoto = catchAsync(
  async (req,res,next)=>{
    if(!req.file) return next()
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/users/${req.file.filename}`);
  
    console.log(req.file)
  
    next();
  }
)


const filterObj = (obj, ...allowedFields) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];  //creates an object {name: name recievd by the user, email: email recieved by the user}
  });

  return newObj; //returns the created object
};


// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const user = await User.find();
//   // const user = await query;
//   // console.log(user, '-----------')

//   res.status(200).json({
//     status: 'success',
//     result: user.length,
//     data: {
//       user,
//     },
//   });
// });

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user posts password data
  // console.log(req.file)

  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password Update', 400)); 
  }
  //update user document


  const filteredBody = filterObj(req.body, 'name', 'email');
  if(req.file) filteredBody.photo = req.file.filename
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data:{
      user:updatedUser
    }
  });
});


exports.deleteMe = catchAsync(async (req,res,next)=>{
  await User.findByIdAndUpdate(req.user.id, {active:false})

  res.status(204).json({
    status:'success',
    data:null
  })
})

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'success',
    message: 'Route Not Implemented',
  });
};

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'success',
//     message: 'Route Not Implemented',
//   });
// };

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'success',
//     message: 'Route Not Implemented',
//   });
// };


exports.getMe = (req,res,next)=>{
  req.params.id = req.user.id;
  next()
}

exports.deleteUser = factory.deleteOne(User);
exports.updateUser = factory.updateOne(User); //Cannot update Password here
exports.getUser = factory.getOne(User)
exports.getAllUsers = factory.getAll(User)

