import * as Services from './services';
import { existsSync } from "fs";
import { CharacterRollStore } from "./CharacterRollStore";

//initialize roll store
const characterRollStore = new CharacterRollStore();

// Track next claim times by channelId
const claimTimers: Record<string, { hours: number, minutes: number }> = {};

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
const MARRIED_IDENTIFIER = /and \*\*(.+?)\*\* are now married!/i;
const DIVORCE_CONFIRMATION_IDENTIFIER = /(.*?): Do you confirm the divorce\? \(y\/n\/yes\/no\)/i;
const WISHED_BY_IDENTIFIER = /Wished by/i;


//start bot
Services.showBanner();
import { Client, Message, TextChannel } from "discord.js-selfbot-v13";
import { match } from 'assert';

const client = new Client();

//ready event
client.on('ready', async () => {
  console.log(`${client.user?.username} is ready!`);
  console.log(`Preset List: ${presetList.map((p: any) => p.name).join(', ')}`);

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
  let zeroRollsDetected = false;

  let claimAvailableMatch = content.match(NEXT_CLAIM_RESET_IDENTIFIER);
  if (claimAvailableMatch) {
    const hours = parseInt(claimAvailableMatch[1] || '0');
    const minutes = parseInt(claimAvailableMatch[2]);
    claimTimers[message.channel.id] = { hours, minutes };
    console.log(`[${matchedPreset.name}] Claim is available and next claim reset in ${claimTimers[message.channel.id].hours} hours ${claimTimers[message.channel.id].minutes} minutes.`);
  }

  let claimNotAvailableMatch = content.match(ANOTHER_CLAIM_IDENTIFER);
  if (claimNotAvailableMatch) {
    const hours = parseInt(claimNotAvailableMatch[1] || '0');
    const minutes = parseInt(claimNotAvailableMatch[2]);
    console.log(`Claim is not available, next claim reset in ${hours} hours ${minutes} minutes.`);
  }

  let rollsMatch = content.match(ROLLS_LEFT_IDENTITIFER);
  if (rollsMatch) {
    const rollsLeft = parseInt(rollsMatch[1]);
    console.log(`[${matchedPreset.name}] Detected ${rollsLeft} rolls left.`);
    if (rollsLeft <= 0) {
      console.log(`[${matchedPreset.name}] No rolls left, skipping.`);
      zeroRollsDetected = true;
    }
    else {
      //perform rolls until + 1 (to trigger the rolls done msg)
      for (let i = 0; i < rollsLeft + 1; i++) {
        await message.channel.send(matchedPreset.rollCmd);
        await Services.sleepRandomAsync();
      }
      //perform a $tu in case any rolls got left out
      await message.channel.send("$tu");
    }
  }

  //on roll msg, store it along with the channelId
  if (message.embeds && message.embeds.length > 0) {
    if (Services.isCharacterEmbed(message.embeds[0])) {
      console.log(`[${matchedPreset.name}] Detected character embed: ${message.embeds[0].author?.name}`);
      //handle character embeds
      characterRollStore.addRoll(message.channel.id, message);
    }
  }

  //on rolls done msg, process all rolls for the channelId and clear the rolls array
  if (content.includes("the roulette is limited to") || zeroRollsDetected) {
    const rolls = characterRollStore.getRolls(message.channel.id);

    let claimUsed = false;
    //claim any wished character
    for (const rollMsg of rolls) {
      console.log(`[${matchedPreset.name}] Processing stored roll for character: ${rollMsg.embeds[0].author?.name}`);
      for (const wishedChar of matchedPreset.wishedCharacters || []) {
        let wishedBySomeoneMatch = content.match(WISHED_BY_IDENTIFIER);
        if (rollMsg.embeds[0].author && rollMsg.embeds[0].author.name.includes(wishedChar) || wishedBySomeoneMatch) {
          console.log(`[${matchedPreset.name}] Matched wished character: ${wishedChar}`);
          await rollMsg.react(CLAIM_EMOJIS[Math.floor(Math.random() * CLAIM_EMOJIS.length)]);
          await Services.sleepRandomAsync();
          await rollMsg.clickButton();
          await Services.sleepRandomAsync();
          claimUsed = true;

          if (wishedBySomeoneMatch) {
            // Notify users who wished for the character
            rollMsg.mentions?.users?.forEach(async user => {
              if (user.id === client.user?.id) return;
              try {
                await user.send(`🎉 The character **${rollMsg.embeds[0].author}** you wished for has been claimed by me!`);
                await Services.sleepRandomAsync();
                console.log(`[${matchedPreset.name}] Sent DM to ${user.tag} for claiming ${rollMsg.embeds[0].author}`);
              } catch (err) {
                console.error(`❌[${matchedPreset.name}] Failed to DM ${user.tag}:`, err);
              }
            });
          }
          break;
        }
      }
      if (claimUsed) break;
    }

    //in case no wished chars were found
    if (!claimUsed) {
      console.log(`[${matchedPreset.name}] No wished characters matched in rolls for channel.`);
      const claimTime = claimTimers[message.channel.id];
      console.log(`[${matchedPreset.name}] Claim time: ${claimTime ? `${claimTime.hours} hours ${claimTime.minutes} minutes` : 'not set'}`);
      if (claimTime && claimTime.hours <= 0) {
        console.log(`[${matchedPreset.name}] Claim is available in <=1 hour, picking highest kakera`);

        let bestRoll: Message | null = null;
        let highestKakera = 0;

        console.log(`[${matchedPreset.name}] Checking ${rolls.length} rolls for highest kakera...`);
        for (const rollMsg of rolls) {
          const embed = rollMsg.embeds[0];
          console.log(`[${matchedPreset.name}] Checking roll: ${embed.author?.name}`);
          if (!embed || !embed.description) continue;
          console.log(`[${matchedPreset.name}] Description: ${embed.description}`);
          const kakeraMatch = embed.description.match(KAKERA_VALUE_MATCH_IDENTIFIER);
          console.log(`[${matchedPreset.name}] Kakera match: ${kakeraMatch}`);
          if (kakeraMatch) {
            const kakeraValue = parseInt(kakeraMatch[1].replace(/,/g, ''));
            console.log(`[${matchedPreset.name}] Kakera value: ${kakeraValue}`);
            if (kakeraValue > highestKakera) {
              highestKakera = kakeraValue;
              console.log(`[${matchedPreset.name}] New highest kakera found: ${highestKakera}`);
              bestRoll = rollMsg;
              console.log(`[${matchedPreset.name}] Best roll updated: ${bestRoll.embeds[0].author?.name}`);
            }
          }
        }
        if (bestRoll) {
          console.log(`[${matchedPreset.name}] Best roll found with ${highestKakera} kakera: ${bestRoll.embeds[0].author?.name}`);
          await bestRoll.react(CLAIM_EMOJIS[Math.floor(Math.random() * CLAIM_EMOJIS.length)]);
          await Services.sleepRandomAsync();
          await bestRoll.clickButton();
        }
      }
    }
    characterRollStore.clearRolls(message.channel.id);
    console.log(`[${matchedPreset.name}] Cleared stored rolls for channel.`);
  }

  // Check if just got married
  let marriageMatch = message.content.match(MARRIED_IDENTIFIER);
  if (marriageMatch) {
    const characterName = marriageMatch[1].trim();

    // If character is not wished, divorce immediately
    if (!matchedPreset.wishedCharacters.includes(characterName)) {
      console.log(`[${[matchedPreset.name]}] Married ${characterName}, not in wished list, divorcing...`);
      await message.channel.send(`$divorce ${characterName}`);
      await Services.sleepRandomAsync();
    }
  }

  // Check if Mudae is asking for divorce confirmation
  let divorceMatch = message.content.match(DIVORCE_CONFIRMATION_IDENTIFIER);
  if (divorceMatch) {
    console.log(`[${[matchedPreset.name]}] Confirming divorce for ${divorceMatch[1]}...`);
    await Services.sleepRandomAsync();
    await message.channel.send("y");
  }
});

client.login(config.token);
setTimeout(() => {
    process.exit(0);
}, 300000);