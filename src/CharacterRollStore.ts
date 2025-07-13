import { Message } from "discord.js-selfbot-v13";

export class CharacterRollStore {
  private rollsMap: Record<string, Message[]> = {};

  addRoll(channelId: string, message: Message) {
    if (!this.rollsMap[channelId]) {
      this.rollsMap[channelId] = [];
    }
    this.rollsMap[channelId].push(message);
  }

  getRolls(channelId: string): Message[] {
    return this.rollsMap[channelId] || [];
  }

  clearRolls(channelId: string): void {
    this.rollsMap[channelId] = [];
  }

  hasRolls(channelId: string): boolean {
    return !!(this.rollsMap[channelId] && this.rollsMap[channelId].length > 0);
  }

  getAll(): Record<string, Message[]> {
    return this.rollsMap;
  }
}