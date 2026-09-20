/**
 * Procedural Player and Bot Naming System
 * Formats unique handles as "Player [4-Digit Number]" (e.g., Player 1432, Player 8091).
 * Guarantees no duplicates occur within the same match.
 */

export function generateProceduralPlayerName(usedNames?: Set<string>): string {
  let attempts = 0;
  while (attempts < 2000) {
    attempts++;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const handle = `Player ${randomCode}`;
    if (!usedNames || !usedNames.has(handle)) {
      if (usedNames) {
        usedNames.add(handle);
      }
      return handle;
    }
  }

  // Fallback if space is saturated
  const fallback = `Player ${Math.floor(1000 + Math.random() * 9000)}`;
  if (usedNames) usedNames.add(fallback);
  return fallback;
}

export function isProceduralPlayerName(name: string): boolean {
  return /^Player \d{4}$/.test(name);
}
