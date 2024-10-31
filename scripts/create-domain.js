const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

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
    rl.question(question, resolve);
  });
}

async function deployDomain(folderName, turnstileSecretKey) {
  log(`\nDeploying ${folderName}...`);

  try {
    // Build worker (only needs to be done once)
    if (!fs.existsSync(path.join(__dirname, "..", ".worker-next"))) {
      log("\nBuilding worker...");
      execSync("npm run build:worker", { stdio: "inherit" });
    }

    // Deploy the worker
    log("\nDeploying to Cloudflare...");
    execSync(`npx wrangler deploy -c domains/${folderName}/wrangler.toml`, {
      stdio: "inherit",
    });

    // Set the secret
    console.log("\nSetting Turnstile secret...");
    const secretCmd = `echo "${turnstileSecretKey}" | npx wrangler secret put TURNSTILE_SECRET_KEY -c domains/${folderName}/wrangler.toml`;
    execSync(secretCmd, {
      stdio: "inherit",
      shell: true,
    });

    log(`✅ Successfully deployed ${folderName}`);
  } catch (error) {
    console.log(`❌ Failed to deploy ${folderName}:`, error);
    throw error;
  }
}

async function createDomain() {
  try {
    // Check wrangler auth
    log("Checking Wrangler authentication...");
    try {
      execSync("npx wrangler whoami", { stdio: "inherit" });
    } catch (error) {
      console.error("Please login to Wrangler first using: npx wrangler login");
      process.exit(1);
    }

    // Ask about KV namespace
    let kvId = await promptUser(
      "\nDo you have a KV namespace ID? If yes, enter it. If no, press enter: "
    );

    if (!kvId) {
      log("\nCreating new KV namespace...");
      try {
        const kvOutput = execSync(
          "npx wrangler@latest kv:namespace create kvcache"
        ).toString();
        const match = kvOutput.match(/id = "([^"]+)"/);
        if (!match) {
          throw new Error("Failed to extract KV namespace ID");
        }
        kvId = match[1];
        log(`Created KV namespace with ID: ${kvId}`);
      } catch (error) {
        console.error("Failed to create KV namespace:", error);
        process.exit(1);
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
    log("\nPlease visit https://dash.cloudflare.com/?to=/:account/turnstile");
    log("Either click 'Add site' to create a new widget for your domain");
    log("or click 'Settings' on an existing widget to get your keys.");

    const turnstileSiteKey = await promptUser(
      "\nEnter your Turnstile Site Key: "
    );
    const turnstileSecretKey = await promptUser(
      "Enter your Turnstile Secret Key: "
    );

    if (!turnstileSiteKey || !turnstileSecretKey) {
      console.error("Both Turnstile Site Key and Secret Key are required!");
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
    log(`\nCreated configuration for ${domain} in ${folderPath}`);

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
      log("\nDone! All configurations have been created.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    rl.close();
    process.exit(1);
  }
}

createDomain().catch(console.error);
