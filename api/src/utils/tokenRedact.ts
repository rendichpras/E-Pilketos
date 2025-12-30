function uuidHex(uuid: string): string {
  return uuid.replace(/-/g, "");
}

export function redactUsedToken(tokenId: string): string {
  const hex = uuidHex(tokenId);
  return `USED-${hex.slice(0, 27)}`;
}

export function redactInvalidToken(tokenId: string): string {
  const hex = uuidHex(tokenId);
  return `INV-${hex.slice(0, 28)}`;
}
