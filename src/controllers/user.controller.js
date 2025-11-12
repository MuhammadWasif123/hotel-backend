import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/sendEmail.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password, phone } = req.body;

  if (
    [userName, email, password, phone].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email and username already exist");
  }

  console.log("Checking required files for testing", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log(`Response from cloudinary ${avatar.url}`);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    password,
    phone,
    avatar: avatar.url,
  });
  //   console.log(
  //     `This is the response from the  user object we are saving in the database ${user}`
  //   );

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: "Welcome to Hotel Mern Project",
    text: `Welcome to Hotel Mern Project Website.Your account has been created with the email id ${email}`,
  };

  await transporter.sendMail(mailOptions);

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  //   Hashing otp for database storage
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  //  Set otp data in the database
  user.verifyOtp = hashedOtp;
  user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail(user.email, otp);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -verifyOtp"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.isAccountVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
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
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isAccountVerified) {
      throw new ApiError(200, "Account already verified");
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      user.verifyOtp = "";
      user.verifyOtpExpireAt = 0;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(400, "OTP expired,please request a new one");
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (hashedOtp !== user.verifyOtp) {
      throw new ApiError(400, "Invalid OTP");
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Email verified sucessfully! You can now log in"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Failed to verify OTP");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken,
  verifyEmailOtp,
};
