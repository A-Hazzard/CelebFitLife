/**
 * Mux server configuration
 */
export const muxConfig = {
  serverUrl: process.env.NEXT_PUBLIC_MUX_SERVER_URL || 'http://localhost:4000',
} as const;