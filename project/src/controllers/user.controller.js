import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinay.js";

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage && req.files.coverImage.length > 0)
  ) {
    coverImage = req.files.coverImage[0].path;
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

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // check password
  // access and refresh token generate
  // send cookies
  // send response for successful login

  const { email, username, password } = req.body;
  if (!username || !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
    password: password,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not correct");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("access_token", accessToken, options)
    .cookie("refresh_token", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

async function generateAccessAndRefreshToken(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while generating access token"
    );
  }
}

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("access_token", options)
    .clearCookie("refresh_token", options)
    .json(new ApiResponse(200, "", "User logout successfully"));
});

export { registerUser, loginUser, logoutUser };
