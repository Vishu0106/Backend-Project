import { asyncHandler } from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async(userId) => {
    try {

    const user = await User.findById(userId);

   const accessToken = user.generateAccessToken()
   const refreshToken = user.genrateRefreshToken()

   user.refreshToken = refreshToken
   await user.save({ validateBeforeSave: false })

   return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500,'some thing went wong while genrating refresh and access token')
    }
}



const registerUser = asyncHandler(async (req,res) => {
    // get user details from frontend
    // validation -- not empty
    // check if user already exists : username, email
    // check for images , check for avatar
    // upload them to cloudinary , avatar
    // create user object  - create entry in DB
    // remove password and refresh token from response 
    // check for user creation 
    // return response

    const {fullName, email, username, password } = req.body

    // console.log("email: ",email);

    if(fullName === "") {
        throw new ApiError(400,'FullName is required');
    }

    if(
        [fullName, email, username, password].some((feild)=> feild?.trim() === "")
    ) {
        throw new ApiError(400,"All feilds are required")
    }
   const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatr is required")
    }

   const  avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
//    console.log(coverImage.url)

    if(!avatar) {
        throw new ApiError(400, "Avatr is not uploaded to cloudinary")
    }

  const user =  await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     )

     if(!createdUser) {
        throw new ApiError(500,"Somw went wrong while registring the user");
     }


     return res.status(200).json(
        new ApiResponse(201,createdUser,'user registration completed sucessfully..')
     )

})


const loginUser = asyncHandler(async (req,res)=>{
    // req.body se data leavo
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
   const {email, username, password} = req.body

   if(!username || !email) {
    throw new ApiError(400,'Username or password is required');
   }
  const user = await User.findOne({
    $or :[ {username},{email} ]
   })

   if(!user){
    throw new ApiError(400,'User doest not exists with given credentials...')
   }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid) {
    throw new ApiError(401,'Invalid user credentials..')
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUSer = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,
        {
        user:loggedInUSer,
        accessToken,
        refreshToken
       },
       "User logged in succesfully"
    )
  )





})

const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly : true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))

})

export {
    registerUser,
    loginUser,
    logoutUser
}