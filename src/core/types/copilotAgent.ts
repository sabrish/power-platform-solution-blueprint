/**
 * Copilot Studio Agent types
 */

/**
 * Distinguishes between modern Copilot Studio agents and legacy classic bots.
 * Set to 'Unknown' when the distinction cannot be determined from available metadata.
 */
export type AgentKind = 'CopilotAgent' | 'ClassicBot' | 'Unknown';

/**
 * A Copilot Studio AI agent (or classic PVA bot) stored in Dataverse.
 * Discovered via the `bots` entity set using Strategy B (objectid intersection),
 * as the bot component type code in solutioncomponents is not reliably documented.
 */
export interface CopilotAgent {
  id: string;
  name: string;
  schemaName: string;
  description: string | null;
  kind: AgentKind;
  isActive: boolean;
  isManaged: boolean;
  /** Total number of bot components (topics, entities, variables) associated with this agent */
  componentCount: number;
  modifiedOn: string;
  createdOn: string;
}
