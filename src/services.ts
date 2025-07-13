export function showBanner(): void {
  const banner = `
M   M  SSS  BBB 
MM MM S     B  B
M M M  SSS  BBB 
M   M     S B  B
M   M SSSS  BBB 
`;

  console.log(`\x1b[36m${banner}\x1b[0m`);
}

const minDelay = 500;
const maxDelay = 1500;

export async function sleepRandomAsync(): Promise<void> {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function isCharacterEmbed(embed: any): boolean {
  if (!embed) return false;

  const hasImage = embed.image && embed.image.url;
  const hasThumbnail = embed.thumbnail && embed.thumbnail.url;

  return !!hasImage && !hasThumbnail;
}