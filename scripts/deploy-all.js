const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const cliProgress = require("cli-progress");

// We'll create an async init function to handle the ora import
async function init() {
  const ora = (await import("ora")).default;

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

  function executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { ...options, shell: true });
      let output = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        output += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}\n${output}`));
        }
      });
    });
  }

  async function deployDomain(domain, totalDomains) {
    let success = false;
    let error = null;

    try {
      await executeCommand("npx", [
        "wrangler",
        "deploy",
        "-c",
        `domains/${domain}/wrangler.toml`,
      ]);
      success = true;
    } catch (err) {
      error = err;
    }

    return {
      domain,
      success,
      error,
    };
  }

  async function deployAll() {
    try {
      console.log(); // Empty line for better spacing
      logger.title("Domain Deployment Service");
      logger.info(
        chalk.dim("Preparing to deploy your domains to Cloudflare Workers")
      );
      console.log(); // Empty line for better spacing

      // Check wrangler auth first
      const authSpinner = ora({
        text: chalk.dim("Verifying Cloudflare credentials..."),
        spinner: "dots",
      }).start();

      try {
        await executeCommand("npx", ["wrangler", "whoami"]);
        authSpinner.succeed(chalk.green("Cloudflare authentication verified"));
      } catch (error) {
        authSpinner.fail(chalk.red("Authentication failed"));
        logger.error(
          `Please run ${chalk.cyan(
            "npx wrangler login"
          )} to authenticate with Cloudflare`
        );
        process.exit(1);
      }

      // Build the worker once for all domains
      const buildSpinner = ora({
        text: chalk.dim("Building worker..."),
        spinner: "dots",
      }).start();

      try {
        await executeCommand("npm", ["run", "build:worker"]);
        buildSpinner.succeed(chalk.green("Worker built successfully"));
      } catch (error) {
        buildSpinner.fail(chalk.red("Worker build failed"));
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

      console.log(); // Empty line for spacing
      logger.info(
        `Found ${chalk.bold(domains.length)} domain${
          domains.length === 1 ? "" : "s"
        } to deploy:`
      );
      domains.forEach((domain) => {
        console.log(`  ${chalk.dim("•")} ${chalk.cyan(domain)}`);
      });
      console.log(); // Empty line for spacing

      logger.info(chalk.dim("Starting deployments..."));
      console.log();

      const deploymentSpinner = ora({
        text: chalk.dim(`Deploying ${domains.length} domains in parallel...`),
        spinner: "dots",
      }).start();

      // Deploy all domains in parallel but collect results silently
      const deploymentPromises = domains.map((domain) =>
        deployDomain(domain, domains.length)
      );

      // Update the main spinner with more accurate status messages
      const deploymentStages = [
        "Uploading assets and configuring workers...",
        "Setting up domain configurations...",
        "Preparing Cloudflare workers...",
        "Publishing to Cloudflare network...",
        "Finalizing deployments and verifying...",
      ];

      let currentStage = 0;
      const updateInterval = setInterval(() => {
        if (currentStage < deploymentStages.length) {
          deploymentSpinner.text = chalk.dim(deploymentStages[currentStage]);
          currentStage++;
        }
      }, 8000); // Longer intervals between status updates

      const results = await Promise.all(deploymentPromises);

      clearInterval(updateInterval);
      // Make sure we show the final stage if we haven't yet
      if (currentStage < deploymentStages.length) {
        deploymentSpinner.text = chalk.dim(
          deploymentStages[deploymentStages.length - 1]
        );
      }
      deploymentSpinner.succeed(chalk.green("Deployment process complete"));
      console.log();

      // Now output all results in a clean, organized way
      logger.title("Deployment Results");

      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Output successful deployments
      successful.forEach(({ domain }) => {
        console.log(
          `${chalk.green("✓")} ${styles.highlight(domain)} ${chalk.dim(
            "•"
          )} ${chalk.green("Deployed successfully")}`
        );
        console.log(`  ${chalk.dim("└")} ${chalk.cyan(`https://${domain}`)}`);
      });

      // Output failed deployments with errors
      if (failed.length > 0) {
        console.log(); // Spacing between successful and failed
        failed.forEach(({ domain, error }) => {
          console.log(
            `${chalk.red("✗")} ${styles.highlight(domain)} ${chalk.dim(
              "•"
            )} ${chalk.red("Deployment failed")}`
          );
          console.log(
            `  ${chalk.dim("└")} ${chalk.red(error.message.split("\n")[0])}`
          );
        });
      }

      // Final summary
      console.log();
      logger.title("Deployment Summary");
      console.log(`  Total domains: ${chalk.bold(domains.length)}`);
      console.log(`  Successful: ${chalk.green(successful.length)}`);
      console.log(`  Failed: ${chalk.red(failed.length)}`);
      console.log();

      if (failed.length === 0) {
        logger.success(chalk.bold("All domains deployed successfully! 🎉"));
      } else {
        logger.warning(
          chalk.bold(
            `Deployment completed with ${failed.length} error${
              failed.length === 1 ? "" : "s"
            }`
          )
        );
      }
      console.log();

      if (failed.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.log();
      logger.error(chalk.bold("Deployment process failed:"));
      console.error(chalk.red(`  ${error.message}`));
      console.log();
      process.exit(1);
    }
  }

  await deployAll();
}

// Call the init function
init().catch(console.error);
