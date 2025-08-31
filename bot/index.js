require("dotenv").config();
const { Telegraf, Markup, Scenes, session } = require("telegraf");
const axios = require("axios");
const sharp = require("sharp");
const FormData = require("form-data");

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Function to upload image to ImgBB
async function uploadToImgBB(imageBuffer) {
  try {
    console.log("Uploading image to ImgBB...");

    // Convert buffer to base64
    const base64Image = imageBuffer.toString("base64");

    const formData = new FormData();
    formData.append("image", base64Image);

    // Make request to ImgBB API
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
      }
    );

    console.log("ImgBB upload successful:", response.data.data.url);
    return response.data.data.url;
  } catch (error) {
    console.error("ImgBB upload failed:", error.message);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    throw new Error("Failed to upload image to ImgBB: " + error.message);
  }
}

const projectWizard = new Scenes.WizardScene(
  "project-wizard",
  async (ctx) => {
    ctx.wizard.state.images = [];
    ctx.wizard.state.tools = [];
    await ctx.reply("Let's upload a new project!\nEnter project title:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.title = ctx.message.text;
    await ctx.reply("Enter project description:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.description = ctx.message.text;
    await ctx.reply(
      "Choose the category:",
      Markup.keyboard([
        ["Logo Design", "Branding"],
        ["Web Design", "Illustration"],
        ["UI/UX", "Poster"],
      ]).oneTime()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.category = ctx.message.text;
    await ctx.reply(
      "Select tools (send one by one, type 'done' when finished):",
      Markup.keyboard(["Photoshop", "Illustrator", "Figma"]).resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const tool = ctx.message.text;
    if (tool.toLowerCase() === "done") {
      await ctx.reply(
        "Now upload 1–3 project images.\nSend 'finish' when done."
      );
      return ctx.wizard.next();
    } else {
      ctx.wizard.state.tools.push(tool);
      await ctx.reply(`✅ Added: ${tool}\nSend another tool or type 'done'.`);
    }
  },
  async (ctx) => {
    if (ctx.message.text && ctx.message.text.toLowerCase() === "finish") {
      if (ctx.wizard.state.images.length === 0) {
        await ctx.reply(
          "⚠️ Please upload at least one image before finishing."
        );
        return;
      }

      try {
        // Prepare JSON request body
        const payload = {
          title: ctx.wizard.state.title,
          description: ctx.wizard.state.description,
          category: ctx.wizard.state.category,
          tools: ctx.wizard.state.tools,
          images: ctx.wizard.state.images, // array of URLs from ImgBB
        };

        console.log("Submitting project:", payload);

        await axios.post(
          "https://portfolio-9pxl.onrender.com/api/projects",
          payload,
          { timeout: 30000 }
        );

        await ctx.reply(
          "✅ Project uploaded successfully!",
          Markup.removeKeyboard()
        );
      } catch (err) {
        console.error("Project upload failed:", err.message);
        await ctx.reply("❌ Failed to upload project. Please try again later.");
      }

      return ctx.scene.leave();
    }

    if (ctx.message.photo) {
      try {
        const photoId = ctx.message.photo.pop().file_id;
        const fileLink = await ctx.telegram.getFileLink(photoId);

        console.log("Downloading image from Telegram...");

        // download
        const response = await axios.get(fileLink.href, {
          responseType: "arraybuffer",
          timeout: 30000,
        });

        console.log("Compressing image...");

        // compress
        const compressedImage = await sharp(response.data)
          .jpeg({ quality: 70 })
          .toBuffer();

        // upload to ImgBB
        console.log("Uploading image to ImgBB...");
        const imageUrl = await uploadToImgBB(compressedImage);

        ctx.wizard.state.images.push(imageUrl);

        await ctx.reply(
          `✅ Image added (${ctx.wizard.state.images.length}/3)\nSend another or type 'finish'.`
        );
      } catch (err) {
        console.error("Image processing error:", err.message);
        await ctx.reply("❌ Failed to process image. Please try again.");
      }
    } else {
      await ctx.reply("Please upload a photo or type 'finish'.");
    }
  }
);

const stage = new Scenes.Stage([projectWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.scene.enter("project-wizard"));

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply("An error occurred. Please try again.");
});

const startBot = () => {
  bot.launch();
  console.log("Bot started");
};

// Handle graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = startBot;
