import bcrypt from "bcryptjs";

/**
 * Hashes a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Add basic validation
  if (!password) {
    throw new Error("Password cannot be empty.");
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a password with a hashed password
 * ONLY performs bcrypt comparison, no dev mode logic here.
 * @param password Plain text password
 * @param hashedPassword Hashed password from DB
 * @returns Boolean indicating if passwords match
 */
export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // Ensure both values are provided
  if (!password || !hashedPassword) {
    console.error("comparePasswords received missing input");
    return false;
  }
  // Only compare if the hash looks like a bcrypt hash
  if (!hashedPassword.startsWith("$2")) {
    console.warn("Attempted to compare password against a non-bcrypt hash.");
    return false; // Do not compare against non-bcrypt hashes in API context
  }
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error during bcrypt comparison:", error);
    return false; // Treat comparison errors as a mismatch
  }
}
