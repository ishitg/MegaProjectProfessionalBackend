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

export { app };
