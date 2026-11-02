import type { AppRole, EventPhase } from "./constants";

export type EventRow = {
  id: number;
  name: string;
  phase: EventPhase;
  phase_ends_at: string | null;
  twist_released_at: string | null;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  role: AppRole;
  team_id: string | null;
  display_name: string | null;
};

export type Team = {
  id: string;
  team_code: string;
  name: string;
  institution: string | null;
  members: { name: string; email?: string; phone?: string }[];
  contact_email: string | null;
  contact_phone: string | null;
  case_id: string | null; // unused since Escape.exe (kept so older rows still load)
  auth_user_id: string | null;
  checked_in: boolean;
  /** whole-event extension (applies to every remaining deadline) */
  extra_minutes: number;
  /** extension for one phase only (phase_extra_phase) */
  phase_extra_minutes: number;
  phase_extra_phase: EventPhase | null;
  is_dummy: boolean;
};
