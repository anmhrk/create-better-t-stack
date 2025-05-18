import { log, spinner } from "@clack/prompts";
import { consola } from "consola";
import { execa } from "execa";
import pc from "picocolors";
import type { ProjectConfig } from "../types";

async function executeStripeCommand(
  commandArgsString: string,
  spinnerText?: string
) {
  const s = spinner();
  try {
    if (spinnerText) s.start(spinnerText);
    const result = await execa(commandArgsString, { shell: true });
    if (spinnerText) s.stop(pc.green("Completed"));
    return result;
  } catch (error) {
    if (s) s.stop(pc.red(`Failed: ${spinnerText}`));
    throw error;
  }
}

async function isStripeCliInstalled(): Promise<boolean> {
  try {
    const commandArgsString = "stripe --version";
    const result = await executeStripeCommand(
      commandArgsString,
      "Checking Stripe CLI installation..."
    );
    return result.stdout.includes("stripe");
  } catch {
    return false;
  }
}

async function isStripeAuthenticated(): Promise<boolean> {
  try {
    const commandArgsString = "stripe config --list";
    const result = await executeStripeCommand(
      commandArgsString,
      "Checking Stripe authentication..."
    );

    if (!result.stdout.includes("project-name")) {
      log.error("Stripe not authenticated. Authenticating...");
      return await authenticateStripe();
    }

    return true;
  } catch {
    return false;
  }
}

async function authenticateStripe(): Promise<boolean> {
  try {
    await execa("stripe", ["login"], {
      stdio: "inherit",
      shell: true,
    });

    await new Promise((resolve) => {
      process.stdin.once("data", () => resolve(undefined));
    });

    const verifyAuth = await executeStripeCommand("stripe config --list");
    return verifyAuth.stdout.includes("project-name");
  } catch (error) {
    consola.error(pc.red("Failed to check Stripe authentication"));
    return false;
  }
}

export async function setupStripe(config: ProjectConfig): Promise<void> {
  const setupSpinner = spinner();
  setupSpinner.start("Setting up Stripe");

  try {
    const stripeCliInstalled = await isStripeCliInstalled();

    if (!stripeCliInstalled) {
      consola.error(pc.red("Stripe CLI not found"));
      log.info(
        `To continue with Stripe setup, please:
1. Install the Stripe CLI from https://stripe.com/docs/stripe-cli
2. Run \`stripe login\` command after installation`
      );
      process.exit(1);
    }

    const stripeAuthenticated = await isStripeAuthenticated();

    if (stripeAuthenticated) {
      log.success("You are authenticated with Stripe");
      return;
    }
  } catch (error) {
    setupSpinner.stop("Failed to setup Stripe");
    if (error instanceof Error) {
      log.error(error.message);
    } else {
      log.error("An unexpected error occurred");
    }
    process.exit(1);
  }
}
