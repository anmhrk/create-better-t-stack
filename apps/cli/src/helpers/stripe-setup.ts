import { exec } from "node:child_process";
import { log, spinner } from "@clack/prompts";
import { consola } from "consola";
import { execa } from "execa";
import pc from "picocolors";
import type { ProjectConfig } from "../types";

async function executeStripeCommand(
	commandArgsString: string,
	spinnerText?: string,
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
		const result = await executeStripeCommand(commandArgsString);
		return result.stdout.includes("stripe");
	} catch {
		return false;
	}
}

async function isStripeAuthenticated(): Promise<boolean> {
	try {
		let commandArgsString = "stripe config --list";
		const result = await executeStripeCommand(
			commandArgsString,
			"Checking Stripe authentication...",
		);
		if (result.stdout.includes("no such file or directory")) {
			commandArgsString = "stripe login";
			const result = await executeStripeCommand(
				commandArgsString,
				"Not authenticated. Running `stripe login`...",
			);
			// Check if the login was successful
			if (result.stdout.includes("Done! The Stripe CLI is configured")) {
				commandArgsString = "stripe config --list";
				const result = await executeStripeCommand(commandArgsString);
				return result.stdout.includes("project-name");
			}
		}

		return result.stdout.includes("project-name");
	} catch {
		return false;
	}
}

export async function setupStripe(config: ProjectConfig): Promise<void> {
	const setupSpinner = spinner();
	setupSpinner.start("Setting up Stripe");

	try {
		const stripeCliInstalled = await isStripeCliInstalled();

		if (!stripeCliInstalled) {
			log.info("Please install the Stripe CLI to continue:");
			openUrlInBrowser("https://stripe.com/docs/stripe-cli");
			return;
		}

		const stripeAuthenticated = await isStripeAuthenticated();

		if (stripeAuthenticated) {
			setupSpinner.stop("You are authenticated with Stripe!");
			return;
		}
	} catch (error) {
		setupSpinner.stop("Setting up Stripe");
		consola.error("Error setting up Stripe:", error);
		process.exit(1);
	}
}

async function openUrlInBrowser(url: string): Promise<void> {
	let command: string;

	switch (process.platform) {
		case "darwin": // macOS
			command = `open ${url}`;
			break;
		case "win32": // Windows
			command = `start ${url}`;
			break;
		default: // Linux and other platforms
			command = `xdg-open ${url}`;
	}

	exec(command, (error) => {
		if (error) {
			consola.error(`Error opening URL: ${error.message}`);
			return;
		}
	});
}
