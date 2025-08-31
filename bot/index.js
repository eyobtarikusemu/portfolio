require("dotenv").config();
const { Telegraf, Markup, Scenes, session } = require("telegraf");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

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
      Markup.keyboard(
        ["Logo Design", "Branding"],
        ["Web Design", "Illustration"],
        ["UI/UX", "Poster"]
      ).oneTime()
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
          images: ctx.wizard.state.images, // array of URLs
        };

        await axios.post(
          "https://eyob-portfolio-virid.vercel.app/api/projects",
          payload
        );

        await ctx.reply(
          "✅ Project uploaded successfully!",
          Markup.removeKeyboard()
        );
      } catch (err) {
        console.error("Upload failed:", err.message);
        await ctx.reply("❌ Failed to upload project.");
      }

      return ctx.scene.leave();
    }

    if (ctx.message.photo) {
      const photoId = ctx.message.photo.pop().file_id;
      const fileLink = await ctx.telegram.getFileLink(photoId);

      try {
        // download
        const response = await axios.get(fileLink.href, {
          responseType: "arraybuffer",
        });

        // compress
        const filename = `compressed-${Date.now()}.jpg`;
        const savePath = path.join(__dirname, "/uploads", filename);

        await sharp(response.data).jpeg({ quality: 70 }).toFile(savePath);

        // build public URL (assuming express.static is serving uploads/)
        const publicUrl = `https://eyob-portfolio-virid.vercel.app/bot/uploads/${filename}`;
        ctx.wizard.state.images.push(publicUrl);

        await ctx.reply(
          `✅ Image added (${ctx.wizard.state.images.length})\nSend another or type 'finish'.`
        );
      } catch (err) {
        console.error("Image error:", err.message);
        await ctx.reply("❌ Failed to process image.");
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

const startBot = () => {
  bot.launch();
  console.log("bot started");
};

module.exports = startBot;
