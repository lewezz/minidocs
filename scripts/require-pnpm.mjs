if (!process.env.npm_config_user_agent?.startsWith("pnpm/")) {
  console.error("MiniDocs requires pnpm. Run: pnpm install");
  process.exitCode = 1;
}
