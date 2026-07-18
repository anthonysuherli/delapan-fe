import type {
  InitiativeGroup,
  InitiativeRow,
  InitiativeStatus,
  ViewInitiative,
} from "./types";

const STATUS_ORDER: InitiativeStatus[] = [
  "active",
  "blocked",
  "proposed",
  "paused",
  "done",
  "dropped",
];

const BACKEND_REPO_URL = "https://github.com/anthonysuherli/delapan-be";
const FRONTEND_REPO_URL = "https://github.com/anthonysuherli/delapan-fe";

const firstParagraph = (markdown: string): string => {
  const paragraphs = markdown.trim().split(/\n\s*\n/);
  return paragraphs.find((paragraph) => paragraph.trim())?.replace(/\s+/g, " ").trim() ?? "";
};

export const extractNextStep = (bodyMd: string): string => {
  const heading = /^(?:\*\*Next step\*\*|## Next step)\s*$/im;
  const match = heading.exec(bodyMd);
  if (!match) {
    return firstParagraph(bodyMd);
  }

  return firstParagraph(bodyMd.slice(match.index + match[0].length));
};

export const linkForSpecOrPlan = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  if (value.startsWith("https://")) {
    return value;
  }
  return `${BACKEND_REPO_URL}/blob/master/${value.replace(/^\/+/, "")}`;
};

export const branchUrl = (repo: string, branch: string | null): string | null => {
  if (!branch) {
    return null;
  }
  const repositoryUrl = repo === "frontend" ? FRONTEND_REPO_URL : BACKEND_REPO_URL;
  return `${repositoryUrl}/tree/${branch}`;
};

const toViewInitiative = (row: InitiativeRow): ViewInitiative => ({
  ...row,
  nextStep: extractNextStep(row.body_md),
  specUrl: linkForSpecOrPlan(row.spec),
  planUrl: linkForSpecOrPlan(row.plan),
  branchLink: branchUrl(row.repo, row.branch),
});

export const groupInitiatives = (
  rows: InitiativeRow[],
  options: { showDropped: boolean },
): InitiativeGroup[] =>
  STATUS_ORDER.filter((status) => options.showDropped || status !== "dropped")
    .map((status) => ({
      status,
      items: rows.filter((row) => row.status === status).map(toViewInitiative),
    }))
    .filter((group) => group.items.length > 0);
