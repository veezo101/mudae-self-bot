import * as Services from './services';
import { existsSync } from "fs";

//load bot configs
let config = require("../config.json");
if (existsSync("./config.local.json")) {
  const localConfig = require("../config.local.json");
  config = { ...config, ...localConfig };
}

//load presets
let presets = require("../presets.json");
if (existsSync("./presets.local.json")) {
  const localPresets = require("../presets.local.json");
  // presets = { ...presets, ...localPresets };
  //only use local for now, don't sync
  presets = localPresets;
}
const presetList = presets.presets.filter((preset: any) => preset.isEnabled);

//regex to match
const ROLLS_LEFT_IDENTITIFER = /You have \*\*(\d+)\*\* rolls left/i;
const NEXT_CLAIM_RESET_IDENTIFIER = /next claim reset .*?\*\*(\d+h)?\s*(\d+)\*\* min/i;
const ANOTHER_CLAIM_IDENTIFER = /another \*\*(\d+)?h?\s*(\d+)\*\* min/i;
const KAKERA_VALUE_MATCH_IDENTIFIER = /\*\*([\d,]+)\*\*<:kakera:/i;

//start bot
Services.showBanner();
import { Client, TextChannel } from "discord.js-selfbot-v13";

const client = new Client();

//ready event
client.on('ready', async () => {
  console.log(`${client.user?.username} is ready!`);

  for (const preset of presetList) {
    console.log(`[${preset.name}] Performing dailies`);

    const channel = await client.channels.fetch(preset.channelId) as TextChannel;
    // await channel.send("$dk");
    await Services.sleepRandomAsync();
    //await channel.send("$daily");
    await Services.sleepRandomAsync();

    console.log(`[${preset.name}] Performing $tu`)
    //check status
    await channel.send("$tu");
  }
})

const CLAIM_EMOJIS = ['💖', '💗', '💘', '❤️', '💓', '💕', '♥️', '🪐']
const KAKERA_EMOJIS = ['kakeraY', 'kakeraO', 'kakeraR', 'kakeraW', 'kakeraL', 'kakeraP']

client.on("messageCreate", async (message) => {
  const matchedPreset = presetList.find((p: any) => p.channelId === message.channel.id);
  if (!matchedPreset) return;

  if (message.content === "!ping") {
    await message.channel.send("shut up!");
  }

  if (message.author.id !== config.mudaeId) return;
  //process mudae messages
  console.log(`[${matchedPreset.name}] Processing mudae messages...`);
  const content = message.content;

  let rollsMatch = content.match(ROLLS_LEFT_IDENTITIFER);
  if (rollsMatch) {
    const rollsLeft = parseInt(rollsMatch[1]);
    console.log(`Detected ${rollsLeft} rolls left.`);
    //perform rolls
    for (let i = 0; i < rollsLeft; i++) {
      await message.channel.send(matchedPreset.rollCmd);
      await Services.sleepRandomAsync();
    }
  }

  let claimAvailableMatch = content.match(NEXT_CLAIM_RESET_IDENTIFIER);
  if (claimAvailableMatch) {
    const hours = parseInt(claimAvailableMatch[1] || '0');
    const minutes = parseInt(claimAvailableMatch[2]);
    console.log(`Claim is available and next claim reset in ${hours} hours ${minutes} minutes.`);
  }

  let claimNotAvailableMatch = content.match(ANOTHER_CLAIM_IDENTIFER);
  if (claimNotAvailableMatch) {
    const hours = parseInt(claimNotAvailableMatch[1] || '0');
    const minutes = parseInt(claimNotAvailableMatch[2]);
    console.log(`Claim is not available, next claim reset in ${hours} hours ${minutes} minutes.`);
  }
});

client.login(config.token);