const { spawn } = require("child_process");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(prefix, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${prefix}:${colors.reset} ${message}`);
}

function startProcess(name, command, args, cwd, color) {
  const process = spawn(command, args, {
    cwd,
    stdio: "pipe",
    shell: true,
  });

  process.stdout.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());
    lines.forEach((line) => log(name, line, color));
  });

  process.stderr.on("data", (data) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim());
    lines.forEach((line) => log(name, line, colors.red));
  });

  process.on("close", (code) => {
    log(
      name,
      `Process exited with code ${code}`,
      code === 0 ? colors.green : colors.red
    );
  });

  process.on("error", (error) => {
    log(name, `Error: ${error.message}`, colors.red);
  });

  return process;
}

async function main() {
  console.log(
    `${colors.bright}${colors.cyan}🚀 Starting CelebFitLife Development Environment${colors.reset}\n`
  );

  // Start the streaming server
  log("SETUP", "Starting streaming server...", colors.yellow);
  const streamingServer = startProcess(
    "STREAMING",
    "npm",
    ["run", "dev"],
    path.join(__dirname, "..", "streaming-server"),
    colors.magenta
  );

  // Wait a bit for the streaming server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Start the Next.js app
  log("SETUP", "Starting Next.js application...", colors.yellow);
  const nextApp = startProcess(
    "NEXT.JS",
    "pnpm",
    ["dev"],
    path.join(__dirname, ".."),
    colors.blue
  );

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log(
      `\n${colors.yellow}🛑 Shutting down development environment...${colors.reset}`
    );

    streamingServer.kill("SIGTERM");
    nextApp.kill("SIGTERM");

    setTimeout(() => {
      streamingServer.kill("SIGKILL");
      nextApp.kill("SIGKILL");
      process.exit(0);
    }, 5000);
  });

  process.on("SIGTERM", () => {
    streamingServer.kill("SIGTERM");
    nextApp.kill("SIGTERM");
  });

  console.log(
    `${colors.green}✅ Development environment started!${colors.reset}`
  );
  console.log(
    `${colors.dim}📱 Next.js App: http://localhost:3000${colors.reset}`
  );
  console.log(
    `${colors.dim}🎥 Streaming Server: http://localhost:3001${colors.reset}`
  );
  console.log(
    `${colors.dim}🏥 Health Check: http://localhost:3001/health${colors.reset}`
  );
  console.log(
    `${colors.dim}Press Ctrl+C to stop all services${colors.reset}\n`
  );
}

main().catch((error) => {
  console.error(
    `${colors.red}Failed to start development environment:${colors.reset}`,
    error
  );
  process.exit(1);
});
