import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinay.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation user details - not empty
  // check if user already exists
  // check for images and check for avatar
  // upload them into cloudinary - avatar check on  cloudinary
  // create user object  - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullname, username, email, password } = req.body;
  console.log("email: " + email);

  // if(fullname === ""){
  //   throw new ApiError(400,"Fullname is required")
  // }
  if (
    [fullname, username, email, password].some((field) => {
      return field === "";
    })
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }


  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImgLocalPath = req.files?.coverImage[0]?.path;
  let coverImgLocalPath;
  if(req.files && Array.isArray(req.files.coverImage
    && req.files.coverImage.length > 0)) {
    coverImage = req.files.coverImage[0].path
  }


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImgLocalPath);



  if (!avatar) {
    throw new ApiError(400, "Avatar is required cloudinary issue");
  }

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user.id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

export { registerUser };
