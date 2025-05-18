import { cancel, confirm, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { DEFAULT_CONFIG } from "../constants";
import type { ProjectBackend } from "../types";

export async function getPaymentsChoice(
	payments: boolean | undefined,
	hasDatabase: boolean,
	backend?: ProjectBackend,
): Promise<boolean> {
	if (backend === "none") {
		return false;
	}

	if (!hasDatabase) return false;

	if (payments !== undefined) return payments;

	const response = await confirm({
		message: "Add payments integration with Stripe?",
		initialValue: DEFAULT_CONFIG.payments,
	});

	if (isCancel(response)) {
		cancel(pc.red("Operation cancelled"));
		process.exit(0);
	}

	return response;
}
