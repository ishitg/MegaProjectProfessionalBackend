import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      //   index is used to speed up queries on this field when we search for users by username
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudinary url
      required: true,
    },
    coverImg: {
      type: String, //cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      // challenge
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// pre-save hook to hash the password before saving the user
// pre is a mongoose middleware that runs before the save operation
// here we don't use arrow function because we need to access the `this` context
// and we use async-await to handle the asynchronous operation of hashing the password
// we use next because its a middleware function that tells mongoose to continue with the save operation
userSchema.pre("save", async function (next) {
  // check if the password is modified or new
  if (!this.isModified("password")) return next(); // if not modified, continue with the save operation

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// jwt is a bearer token
// bearer token meaning one who bears the token is authorized to access the resource
// means some one who has the token can access the resource
// so its like a key to access the resource

// you pass payload/data, a secret key, and options to the sign method

// now access token is used to authenticate the user and authorize them to access the protected resources
// access token is short lived, meaning it expires after a certain time
// refresh token is used to get a new access token when the access token expires
// refresh token is long lived, meaning it expires after a longer time than the access token
// so we use access token to access the protected resources and refresh token to get a new access token when the access token expires
// this way we can keep the user logged in for a longer time without asking them to log in again
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
