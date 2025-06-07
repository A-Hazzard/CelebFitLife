export const muxConfig = {
  accessTokenId: process.env.MUX_ACCESS_TOKEN_ID!,
  secretKey: process.env.MUX_SECRET_KEY!,
};

// Validate configuration
if (!muxConfig.accessTokenId || !muxConfig.secretKey) {
  throw new Error(
    "Missing Mux credentials: MUX_ACCESS_TOKEN_ID and MUX_SECRET_KEY are required"
  );
}
