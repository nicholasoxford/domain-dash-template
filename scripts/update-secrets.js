const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");

// Add some styling helpers
const styles = {
  title: chalk.bold.blue,
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  prompt: chalk.magenta,
  highlight: chalk.bold.white,
};

// Create a better logger
const logger = {
  title: (msg) => console.log(styles.title(`\n🚀 ${msg}`)),
  success: (msg) => console.log(styles.success(`✅ ${msg}`)),
  error: (msg) => console.log(styles.error(`❌ ${msg}`)),
  warning: (msg) => console.log(styles.warning(`⚠️  ${msg}`)),
  info: (msg) => console.log(styles.info(`ℹ️  ${msg}`)),
  divider: () =>
    console.log(chalk.gray("\n─────────────────────────────────────\n")),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(styles.prompt(`${question}`), resolve);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
let secretKeyArg, secretValueArg;

// Look for --key and --value flags
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--key" && args[i + 1]) {
    secretKeyArg = args[i + 1];
  }
  if (args[i] === "--value" && args[i + 1]) {
    secretValueArg = args[i + 1];
  }
}

async function updateSecrets() {
  try {
    logger.title("Checking Wrangler authentication...");
    try {
      execSync("npx wrangler whoami", { stdio: "pipe" });
    } catch (error) {
      logger.error("Please login to Wrangler first using: npx wrangler login");
      process.exit(1);
    }

    // Get the secret key and value if not provided via args
    const secretKey =
      secretKeyArg ||
      (await promptUser(
        "\nEnter the secret key (e.g., TURNSTILE_SECRET_KEY): "
      ));
    const secretValue =
      secretValueArg || (await promptUser("Enter the secret value: "));

    if (!secretKey || !secretValue) {
      logger.error("Both secret key and value are required!");
      process.exit(1);
    }

    // Get all domain folders
    const domainsPath = path.join(__dirname, "..", "domains");
    const domains = fs
      .readdirSync(domainsPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (domains.length === 0) {
      logger.warning("No domains found!");
      process.exit(0);
    }

    logger.info(`Found ${styles.highlight(domains.length)} domains:`);
    domains.forEach((domain) => {
      console.log(`  ${chalk.dim("•")} ${styles.highlight(domain)}`);
    });

    const confirm = await promptUser(
      "\nUpdate secrets for all these domains? (y/n): "
    );

    if (confirm.toLowerCase() !== "y") {
      logger.info("Operation cancelled");
      process.exit(0);
    }

    logger.divider();
    logger.info("Updating secrets for all domains...");

    // Update secrets for each domain
    for (const domain of domains) {
      try {
        logger.info(`Updating ${styles.highlight(domain)}...`);
        const cmd = `echo "${secretValue}" | npx wrangler secret put ${secretKey} -c domains/${domain}/wrangler.toml`;
        execSync(cmd, { stdio: "inherit", shell: true });
        logger.success(`Updated ${domain}`);
      } catch (error) {
        logger.error(`Failed to update ${domain}: ${error.message}`);
      }
    }

    logger.divider();
    logger.success("Secret update process complete!");
  } catch (error) {
    logger.error("An error occurred:");
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Add help text if requested
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: npm run update-secrets [options]

Options:
  --key <key>      Secret key to update (e.g., TURNSTILE_SECRET_KEY)
  --value <value>  Value for the secret
  -h, --help       Show this help message

Example:
  npm run update-secrets --key TURNSTILE_SECRET_KEY --value mysecretkey
  `);
  process.exit(0);
}

updateSecrets().catch(console.error);
