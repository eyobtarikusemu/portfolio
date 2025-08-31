const Project = require("../models/Project");
const axios = require("axios");

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).select('-images.data');
    res.status(200).json({ projects });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
};

const getProjectImage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project  !project.images[req.params.imageIndex]) {
      return res.status(404).json({ msg: "Image not found" });
    }

    const image = project.images[req.params.imageIndex];
    res.set('Content-Type', image.contentType);
    res.set('Content-Length', image.size);
    res.set('Content-Disposition', `inline; filename="${image.filename}"`);
    res.send(image.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
};

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);

    // Prepare message
    const message = `
🚀 *New Project Uploaded!*  
📌 *Title:* ${project.title}  
🖼 *Category:* ${project.category}  
🛠 *Tools:* ${project.tools?.join(", ")  "N/A"}  
👤 *Client:* ${project.client || "N/A"}  
    `;

    // Send to telegram
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }
    );

    res.status(201).json({ 
      project: {
        ...project.toObject(),
        images: project.images.map(img => ({
          _id: img._id,
          contentType: img.contentType,
          filename: img.filename,
          size: img.size
        }))
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
};

module.exports = { getProjects, createProject, getProjectImage };
