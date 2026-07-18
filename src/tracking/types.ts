export type InitiativeStatus =
  | "proposed"
  | "active"
  | "blocked"
  | "paused"
  | "done"
  | "dropped";

export type TrackingRepo = "backend" | "frontend" | "both";

export interface InitiativeRow {
  slug: string;
  title: string;
  status: InitiativeStatus;
  repo: TrackingRepo;
  blocked_by: string[];
  spec: string | null;
  plan: string | null;
  branch: string | null;
  body_md: string;
  updated: string;
}

export interface BacklogRow {
  position: number;
  text: string;
  repo: TrackingRepo;
  initiative_slug: string | null;
}

export interface ViewInitiative extends InitiativeRow {
  nextStep: string;
  specUrl: string | null;
  planUrl: string | null;
  branchLink: string | null;
}

export interface InitiativeGroup {
  status: InitiativeStatus;
  items: ViewInitiative[];
}
