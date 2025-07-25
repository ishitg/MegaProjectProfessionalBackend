import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);
// its like informing express that this is how we'll be handling json data

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// this is informing express that we've to handle URL encoded data which is like how data is passed in urls, with things like
// space being replaced by %20 on google,etc

app.use(express.static("public"));
// this is when we want to store some files on the server itself, like if we get images,pdf from user

// When this middleware is set up, any request for a file that matches a file in the `public` directory will be served
// automatically, without needing to define a specific route for each file. For example, if there is a file called `logo.png`
// inside the `public` folder, a browser can access it directly at `http://yourdomain.com/logo.png`.

app.use(cookieParser());
// this is used to set cookies or secured cookies in user's browser.

// *****Routes Import**********

import userRouter from "./routes/user.route.js";
import healthcheckRouter from "./routes/healthcheck.route.js";
import tweetRouter from "./routes/tweet.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
// ******Routes Declaration*******

// previously we used to do app.get,app.post,app.put,app.delete
// app.get("/")
// but now we are using a router and there's segregation of router,so now we've to use middleware to bring the router
app.use("/api/v1/users", userRouter);
// whenever a request comes to /users, the control is passed to userRouter
// so its like
// http://localhost:8000/api/v1/users/register
// now if we wanna add login, there's nothing to be changed here in app.js
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

export { app };
