/**
 * Validates that each string in the array is non-empty (after trimming)
 * and that the acceptedTnC flag is true.
 *
 * @param inputs - Array of input strings
 * @param acceptedTnC - Whether terms have been accepted
 * @returns true if valid; false otherwise.
 */
export function validateRegistrationInput(inputs: string[], acceptedTnC: boolean): boolean {
  for (const input of inputs) {
    if (!input || input.trim() === "") {
      return false;
    }
  }
  return acceptedTnC;
}