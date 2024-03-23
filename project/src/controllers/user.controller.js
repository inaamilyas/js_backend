import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinay.js";
import { jwt } from "jsonwebtoken";

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
  // console.log(email, password);
  // console.log(email, username, password);
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
    // password: password,
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
  console.log("Inside logout");
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("access_token", accessToken, options)
      .cookie("refresh_token", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            refreshToken: newRefreshToken,
          },
          "User refreshed successfully"
        )
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not correct");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    {
      new: true,
    }.select("-password")
  );

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});


const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }.select("-password")
  );

  return res
  .status(200)
  .json(new ApiResponse(200, user, "avatar update successfully"));

});

const updateUserCover = asyncHandler(async (req, res) => {
  const CoverLocalPath = req.file?.path
  
  if(!CoverLocalPath){
    throw new ApiError(400, "Cover file is missing")
  }

  const coverImage = await uploadOnCloudinary(CoverLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading cover imagee")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }.select("-password")
  );

  return res
  .status(200)
  .json(new ApiResponse(200, user, "cover image update successfully"));

});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover
};
