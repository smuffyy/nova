/** Shared product copy for template experiments. */
import { agentsForMarketing } from "@/lib/agents";

export const PORTAL_AGENTS = agentsForMarketing();

export type PortalAgent = (typeof PORTAL_AGENTS)[number];
