const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
// Define the schema for the listing
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,  // Title is required
  },
  description: {
    type: String,
    required: true,  // Description is required
  },
  image: {
    filename: {
      type: String,
      default: "listingimage"  // Default filename
    },
    url: {
      type: String,
      default: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"  // Default URL
    }
  },
  price: {
    type: Number,
    required: true,  // Price is required
    min: [0, 'Price must be a positive number']  // Ensure price is positive
  },
  location: {
    type: String,
    required: true,  // Location is required
  },
  country: {
    type: String,
    required: true,  // Country is required
  },
  reviews:[
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    }
  ],

  owner:{
    type : Schema.Types.ObjectId,
    ref:"User",
  }
  
});

listingSchema.post("findOneAndDelete", async(listing)=>{
  if(listing){
    await Review.deleteMany({_id:{$in: listing.reviews}});
  }
  
}); 


// Create and export the Listing model
const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
