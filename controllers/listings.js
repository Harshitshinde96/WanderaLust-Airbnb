const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  id = id.trim();
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } }) // Populate reviews and their authors
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you are looking for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 2,
    })
    .send();

  let url = req.file.path; // This is for uploading image or file
  let filename = req.file.filename; // Extracting the URL and filename from the uploaded file

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename }; // This is for uploading image or file
  newListing.geometry = response.body.features[0].geometry; // Adding the geometry data to the listing

  let savedListing = await newListing.save();
  // console.log(savedListing);
  req.flash("success", "Successfully created a new listing!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  id = id.trim();
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you are looking for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  id = id.trim();
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path; // This is for uploading image or file
    let filename = req.file.filename; // Extracting the URL and filename from the uploaded file
    listing.image = { url, filename }; // This is for uploading image or file
    await listing.save();
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
  // console.log(error);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Lisitng Deleted Successfully!");

  res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
  const { q } = req.query;

  // Basic input validation
  if (!q) {
    req.flash("error", "Please enter a location or country to search");
    return res.redirect("/listings");
  }

  // Execute three database operations in parallel for better performance
  const [listings, uniqueLocations, uniqueCountries] = await Promise.all([
    // 1. Search listings matching query in either location or country fields
    Listing.find({
      $or: [
        // Case-insensitive partial match for location
        { location: { $regex: q, $options: "i" } },
        // Case-insensitive partial match for country
        { country: { $regex: q, $options: "i" } },
      ],
    }),

    // 2. Get all distinct location values for search suggestions
    Listing.distinct("location"),

    // 3. Get all distinct country values for search suggestions
    Listing.distinct("country"),
  ]);

  res.render("listings/index.ejs", {
    allListings: listings,
    searchQuery: q,
    uniqueLocations,
    uniqueCountries,
    noResults: listings.length === 0, // Flag for empty results
  });
};
// /listings/ → Index

// /listings/new → New

// /listings/:id → Show

// /listings/:id/edit → Edit

// /listings (POST) → Create

// /listings/:id (PUT) → Update

// /listings/:id (DELETE) → Delete
