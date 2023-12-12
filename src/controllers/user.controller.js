import { asyncHandler } from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



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

    console.log("email: ",email);

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatr is required")
    }

   const  avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverAvatar = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400, "Avatr is not uploaded to cloudinary")
    }

  const user =  await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverAvatar?.url || "",
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
        new ApiResponse(400,createdUser,'user registration completed sucessfully..')
     )

})

export {registerUser}