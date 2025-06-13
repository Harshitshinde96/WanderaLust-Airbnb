const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


// Search Route or request
router.get("/search", wrapAsync(listingController.searchListings));

router
  .route("/")
  .get(wrapAsync(listingController.index)) //Index Route or request
  .post(
    //Create Route or request
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  );

//New Route or request
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing)) // Show Route or request
  .put(
    //Update Route or request
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    //Delete Route or request
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

//Edit Route or request
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);



module.exports = router;

// /listings/ → Index

// /listings/new → New

// /listings/:id → Show

// /listings/:id/edit → Edit

// /listings (POST) → Create

// /listings/:id (PUT) → Update

// /listings/:id (DELETE) → Delete
