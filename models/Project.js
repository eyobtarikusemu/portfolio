const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String, // e.g. "Logo Design", "Branding", "Poster", "UI/UX"
    required: true,
  },
  images: {
    type: [String], // multiple image URLs (project previews)
    required: true,
  },
  tools: {
    type: [String], // e.g. ["Photoshop", "Illustrator", "Figma"]
  },
  client: {
    type: String, // Optional - client name
  },
  link: {
    type: String, // optional - external link (Behance, Dribbble, etc.)
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
