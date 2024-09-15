if(process.nextTick.NODE_ENV != "production"){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/user.js");



const listingRouter = require("./routes/listing.js"); 
const reviewRouter = require("./routes/review.js"); 
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// MongoDB connection URL
const dbUrl = process.env.ATLASDB_URL;

// Connect to MongoDB
async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connection Successful");
  } catch (err) {
    console.error("Connection Error:", err);
  }
}
main();

// App configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate); 
app.use(express.static(path.join(__dirname, "public")));



const store = MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret: process.env.SECRET,

  },
  touchAfter:24 * 3600,
});

store.on("error",(err)=>{
  console.log("Error in Mongo Session Store",err);
});

// Session configuration
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
};


// Apply middleware
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to set local variables
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Demo user route for testing
app.get("/demouser", async (req, res) => {
  try {
    let fakeUser = new User({
      email: "student@gmail.com",
      username: "delta-student"
    });

    let registeredUser = await User.register(fakeUser, "helloworld"); 
    res.send(registeredUser);
  } catch (err) {
    res.status(500).send("Error creating demo user.");
  }
});

// Use routers
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 Error handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("listings/error.ejs", { message });
});

// Start the server
app.listen(8080, (err) => {
  if (err) {
    console.error("Error starting the server:", err);
    return;
  }
  console.log("Listening To The Server on port 8080");
});
