const User = require("../models/user");

// This all are Callback functions

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    //   console.log(registeredUser);

    // Automatically log in the user after registration
    // req.login is a Passport method that logs in the user
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      } // Pass error to error handler
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", "Welome Back to Wanderlust!");
  res.redirect(res.locals.redirectUrl || "/listings"); // Redirect to the saved URL
  // If no redirect URL is saved, it will default to "/listings"
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logged you out successfully!");
    res.redirect("/listings");  
  });
};
