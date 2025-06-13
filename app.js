if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const DB_URL = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(DB_URL);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: DB_URL,
  crypto: {
    secret: process.env.SECRET_SESSION,
  },
  touchAfter: 24 * 3600, // touchAfter is used to avoid updating the session too frequently
  // After adding this we wont have to login again and again
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET_SESSION,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.get("/", (req, res) => {
  // res.send(
  //   "Everything is working fine!! To use this app, please visit /listings (enter /listings in the URL bar) to see all the listings."
  // );
  res.redirect("/listings");
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req, res, next) => {
  console.log("404 for URL:", req.originalUrl);
  next(new ExpressError(404, "Page Not Found"));
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something Went Wrong" } = err;

  // 🔴 Error Logging
  // console.error("🔴 ERROR OCCURRED:");
  // console.error("📄 MESSAGE:", err.message || message);
  // console.error("🧾 STACK TRACE:", err.stack);
  // console.error("🧠 FULL ERROR OBJECT:", err);

  // Render your custom error page
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log(`Server is running at port 8080`);
});

// ID and Passwords
// 1) Harshit - pass
// 2) Harsh - pass
// 3) Demo - Demo
