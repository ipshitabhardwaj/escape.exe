import type { EventPhase } from "@/lib/constants";

export type RunStatus = "ready" | "running" | "escaped" | "timeout" | "stopped";
export type StageKind = "digital" | "physical" | "hybrid";

export type ClueView = { label: string; text: string; mono: boolean; notes: string[]; scanner: boolean; stack: boolean };
export type InputSpec = { mode: "text" | "code"; length?: number; placeholder?: string };

/** One stage as the team sees it (from the database function escape_state). */
export type StageView = {
  code: string;
  order: number;
  title: string;
  kind: StageKind;
  zone: string;
  story: string;
  clue: ClueView;
  prompt: string;
  input: InputSpec;
  solved: boolean;
  solved_at: string | null;
  solve_seconds: number | null;
  solved_message: string | null;
  fragment: string | null;
  hints_total: number;
  hints_used: string[];
};

export type RunView = {
  status: RunStatus;
  slot_label: string;
  started_at: string | null;
  ends_at: string | null;
  finished_at: string | null;
  stages_cleared: number;
  hints_used: number;
  wrong_attempts: number;
  extra_minutes: number;
  penalty_seconds: number;
  elapsed_seconds: number;
  total_seconds: number;
};

export type EscapeState = {
  server_now: string;
  phase: EventPhase;
  config: { duration_minutes: number; hint_penalty_seconds: number };
  total_stages: number;
  run: RunView | null;
  stages: StageView[];
};

/** One row of the organiser's live board (database function escape_board). */
export type BoardRow = {
  team_id: string;
  team_code: string;
  name: string;
  institution: string | null;
  is_dummy: boolean;
  checked_in: boolean;
  has_login: boolean;
  slot_label: string;
  status: RunStatus;
  started_at: string | null;
  finished_at: string | null;
  stages_cleared: number;
  hints_used: number;
  wrong_attempts: number;
  extra_minutes: number;
  last_activity: string | null;
  elapsed_seconds: number;
  penalty_seconds: number;
  total_seconds: number;
  ends_at: string | null;
  current_stage: string | null;
};
