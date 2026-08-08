// Types for prompts.mjs (kept as .mjs so Node and the browser bundle share one copy).

export type ExplainKind = "metabolite" | "reaction" | "pathway";
export type Level = "undergrad" | "masters" | "phd";

export interface LLMRequest {
  messages: { role: "system" | "user"; content: string }[];
  maxTokens: number;
  json: boolean;
}

export declare const LEVELS: readonly Level[];
export declare const DEFAULT_LEVEL: Level;

export declare function buildRequest(
  kind: ExplainKind,
  name: string,
  context: string,
  level?: Level,
): LLMRequest;
