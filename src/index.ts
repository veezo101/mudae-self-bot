//load bot configs
import { existsSync } from "fs";

let config = require("../config.json");

if (existsSync("./config.local.json")) {
  const localConfig = require("../config.local.json");
  config = { ...config, ...localConfig };
}

//start bot
import { Client } from "discord.js-selfbot-v13";

const client = new Client();

client.on('ready', async () => {
  console.log(`${client.user?.username} is ready!`);
})

client.on("messageCreate", (message) => {
  if (message.channel.id !== "1390420546071691334") return;
  if (message.content === "test") {
    message.reply("dumass");
  }
});

client.login(config.token);