/**
 * Generates a room ID in the format XXX-XXXX-XXX
 * @returns A formatted room ID string
 */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  
  // Generate 3 characters
  for (let i = 0; i < 3; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  id += '-';
  
  // Generate 4 characters
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  id += '-';
  
  // Generate 3 characters
  for (let i = 0; i < 3; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Validates if a room code matches the XXX-XXXX-XXX format
 * @param code - The room code to validate
 * @returns true if valid, false otherwise
 */
export function isValidRoomCodeFormat(code: string): boolean {
  const pattern = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/;
  return pattern.test(code);
}

/**
 * Removes formatting from a room code (removes dashes)
 * @param code - The formatted room code
 * @returns The unformatted code
 */
export function unformatRoomCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase();
}

