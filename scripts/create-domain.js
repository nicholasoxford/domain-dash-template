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

// Parse command line arguments
const args = process.argv.slice(2);
let kvIdArg;

// Look for --kv-id flag
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--kv-id" && args[i + 1]) {
    kvIdArg = args[i + 1];
    break;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const log = console.log;

const baseWranglerConfig = `#:schema node_modules/wrangler/config-schema.json
name = "{name}"
main = "../../.worker-next/index.mjs"

compatibility_date = "2024-09-26"
compatibility_flags = ["nodejs_compat"]

minify = true

assets = { directory = "../../.worker-next/assets", binding = "ASSETS" }

routes = [{ pattern = "{domain}", custom_domain = true }]

[vars]
BASE_URL = "{domain}"
TURNSTILE_SITE_KEY = "{turnstileSiteKey}"

[[kv_namespaces]]
binding = "kvcache"
id = "{kvId}"
`;

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(styles.prompt(`${question}`), resolve);
  });
}

async function deployDomain(folderName, turnstileSecretKey) {
  logger.title(`Deploying ${styles.highlight(folderName)}`);

  try {
    if (!fs.existsSync(path.join(__dirname, "..", ".worker-next"))) {
      logger.info("Building worker...");
      execSync("npm run build:worker", { stdio: "inherit" });
    }

    logger.info("Deploying to Cloudflare...");
    execSync(`npx wrangler deploy -c domains/${folderName}/wrangler.toml`, {
      stdio: "inherit",
    });

    logger.info("Setting Turnstile secret...");
    const secretCmd = `echo "${turnstileSecretKey}" | npx wrangler secret put TURNSTILE_SECRET_KEY -c domains/${folderName}/wrangler.toml`;
    execSync(secretCmd, {
      stdio: "inherit",
      shell: true,
    });

    logger.success(`Successfully deployed ${styles.highlight(folderName)}`);
    logger.divider();
    logger.info(
      `Visit your site at: ${styles.highlight(`https://${folderName}.com`)}`
    );
    logger.info(
      `Note: It may take a few minutes for DNS changes to propagate.`
    );
    logger.divider();
  } catch (error) {
    logger.error(`Failed to deploy ${styles.highlight(folderName)}`);
    throw error;
  }
}

async function createDomain() {
  try {
    logger.title("Checking Wrangler authentication...");
    try {
      execSync("npx wrangler whoami", { stdio: "inherit" });
    } catch (error) {
      logger.error("Please login to Wrangler first using: npx wrangler login");
      process.exit(1);
    }

    // Get KV namespace
    let kvId = kvIdArg;
    if (!kvId) {
      logger.divider();
      kvId = await promptUser(
        "Do you have a KV namespace ID? If yes, enter it. If no, press enter: "
      );

      if (!kvId) {
        logger.info("Creating new KV namespace...");
        try {
          const kvOutput = execSync(
            "npx wrangler@latest kv:namespace create kvcache"
          ).toString();
          const match = kvOutput.match(/id = "([^"]+)"/);
          if (!match) {
            throw new Error("Failed to extract KV namespace ID");
          }
          kvId = match[1];
          logger.success(
            `Created KV namespace with ID: ${styles.highlight(kvId)}`
          );
        } catch (error) {
          logger.error("Failed to create KV namespace");
          process.exit(1);
        }
      }
    }

    // Get domain from user
    let domain = await promptUser("\nEnter the domain (e.g., example.com): ");

    // Clean domain
    domain = domain
      .replace(/^https?:\/\//, "") // Remove http:// or https://
      .replace(/^www\./, "") // Remove www.
      .trim();

    // Get Turnstile keys
    logger.info(
      "Please visit https://dash.cloudflare.com/?to=/:account/turnstile"
    );
    logger.info(
      "Either click 'Add site' to create a new widget for your domain"
    );
    logger.info("or click 'Settings' on an existing widget to get your keys.");

    const turnstileSiteKey = await promptUser(
      "\nEnter your Turnstile Site Key: "
    );
    const turnstileSecretKey = await promptUser(
      "Enter your Turnstile Secret Key: "
    );

    if (!turnstileSiteKey || !turnstileSecretKey) {
      logger.error("Both Turnstile Site Key and Secret Key are required!");
      process.exit(1);
    }

    // Create folder name from domain
    const folderName = domain.replace(/\.[^/.]+$/, ""); // Remove TLD
    const folderPath = path.join(__dirname, "..", "domains", folderName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Create wrangler.toml (without secret key)
    const wranglerConfig = baseWranglerConfig
      .replace(/{name}/g, folderName)
      .replace(/{domain}/g, domain)
      .replace(/{kvId}/g, kvId)
      .replace(/{turnstileSiteKey}/g, turnstileSiteKey);

    fs.writeFileSync(path.join(folderPath, "wrangler.toml"), wranglerConfig);
    logger.success(`\nCreated configuration for ${domain} in ${folderPath}`);

    // Ask if they want to deploy
    const shouldDeploy = await promptUser(
      "\nWould you like to deploy this domain now? (y/n): "
    );

    if (shouldDeploy.toLowerCase() === "y") {
      await deployDomain(folderName, turnstileSecretKey);
    }

    // Ask if user wants to add another
    const addAnother = await promptUser(
      "\nWould you like to add another domain? (y/n): "
    );

    if (addAnother.toLowerCase() === "y") {
      await createDomain();
    } else {
      rl.close();
      logger.success("\nDone! All configurations have been created.");
    }
  } catch (error) {
    logger.error("An error occurred:");
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

createDomain().catch(console.error);
