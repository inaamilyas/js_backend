import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      //TODO: discuss about frontend
      throw new ApiError(401, "Invalid token");
    }

    req.user = user;
    console.log('Ending up to middleware');
    next();
  } catch (error) {
    console.log(error);
    return new ApiError(401, error?.message || "Invalid token");
  }
});
