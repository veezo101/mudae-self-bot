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

const minDelay = 250;
const maxDelay = 1500;

export async function sleepRandomAsync(): Promise<void> {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
}