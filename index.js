const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;

const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot is active.');
});

app.listen(8000, () => console.log("Webserver online"));

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account'].username,
    auth: config['bot-account'].type,
    password: config['bot-account'].password,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log("[AFK] Bot spawned.");

    const mcData = require("minecraft-data")(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));

    // Move to AFK position
    if (config.position.enabled) {
      const pos = config.position;
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }

    // human-like idle behavior loop
    setInterval(() => {
      // Small random head movement
      const yaw = bot.entity.yaw + (Math.random() * 0.6 - 0.3);
      const pitch = bot.entity.pitch + (Math.random() * 0.4 - 0.2);
      bot.look(yaw, pitch, false);

      // very small chance of taking a step
      if (Math.random() < 0.25) {
        let dir = ["forward", "back", "left", "right"][Math.floor(Math.random() * 4)];
        bot.setControlState(dir, true);
        setTimeout(() => bot.setControlState(dir, false), 300 + Math.random() * 400);
      }
    }, 30000 + Math.random() * 30000); // every 30–60 seconds
  });

  bot.on("goal_reached", () => {
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
  });

  bot.on("end", () => {
    setTimeout(createBot, config.utils["auto-recconect-delay"]);
  });

  bot.on("kicked", r => console.log("[Kick]", r));
  bot.on("error", e => console.log("[Error]", e));
}

createBot();
