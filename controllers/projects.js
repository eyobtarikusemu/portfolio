const Project = require("../models/Project");
const axios = require("axios");

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({});
    res.status(200).json({ projects });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
};

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // Replace with your channel id

const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);

    // prepare message
    const message = `
🚀 *New Project Uploaded!*  
📌 *Title:* ${project.title}  
🖼️ *Category:* ${project.category}  
🛠️ *Tools:* ${project.tools?.join(", ") || "N/A"}  
👤 *Client:* ${project.client || "N/A"}  
🔗 [View Project](${project.link || "#"})  
    `;

    // send to telegram
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }
    );

    // send images too (optional)
    if (project.images && project.images.length > 0) {
      for (const img of project.images) {
        await axios.post(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
          {
            chat_id: TELEGRAM_CHANNEL_ID,
            photo: img,
            caption: project.title,
          }
        );
      }
    }

    res.status(201).json({ project });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
};

module.exports = { getProjects, createProject };
