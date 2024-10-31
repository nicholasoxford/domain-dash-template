const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

// Add some styling helpers
const styles = {
  title: chalk.bold.blue,
  success: chalk.bold.green,
  error: chalk.bold.red,
  warning: chalk.yellow,
  info: chalk.cyan,
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

async function deployAll() {
  try {
    // Check wrangler auth first
    logger.title("Checking Wrangler authentication...");
    try {
      execSync("npx wrangler whoami", { stdio: "inherit" });
    } catch (error) {
      logger.error("Please login to Wrangler first using: npx wrangler login");
      process.exit(1);
    }

    // Build the worker once
    logger.title("Building worker...");
    try {
      execSync("npm run build:worker", { stdio: "inherit" });
    } catch (error) {
      logger.error("Failed to build worker");
      throw error;
    }

    // Get all domain folders
    const domainsPath = path.join(__dirname, "..", "domains");
    const domains = fs
      .readdirSync(domainsPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (domains.length === 0) {
      logger.warning("No domains found to deploy!");
      process.exit(0);
    }

    logger.info(
      `Found ${domains.length} domain(s) to deploy: ${styles.highlight(
        domains.join(", ")
      )}`
    );
    logger.divider();

    // Deploy each domain
    for (const domain of domains) {
      const wranglerPath = path.join(domainsPath, domain, "wrangler.toml");

      if (!fs.existsSync(wranglerPath)) {
        logger.warning(`Skipping ${domain}: No wrangler.toml found`);
        continue;
      }

      logger.info(`Deploying ${styles.highlight(domain)}...`);

      try {
        execSync(`npx wrangler deploy -c domains/${domain}/wrangler.toml`, {
          stdio: "inherit",
        });
        logger.success(`Deployed ${domain}`);
        logger.info(`Visit: ${styles.highlight(`https://${domain}.com`)}`);
        logger.divider();
      } catch (error) {
        logger.error(`Failed to deploy ${domain}`);
        logger.error(error.message);
        logger.divider();
      }
    }

    logger.success("Finished deploying all domains!");
  } catch (error) {
    logger.error("An error occurred during deployment:");
    console.error(error);
    process.exit(1);
  }
}

deployAll().catch(console.error);
