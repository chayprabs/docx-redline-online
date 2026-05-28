export interface DocxComment {
  id: string;
  author: string;
  date: string;
  text: string;
  replies: DocxComment[];
  resolved: boolean;
}

export interface TrackedChange {
  id: string;
  kind: "ins" | "del" | "fmt" | "move";
  author: string;
  date: string;
  text: string;
}

export interface CompareResult {
  redlineDocxUrl: string;
  htmlDiffUrl: string;
  changes: TrackedChange[];
}

export interface WorkerMeta {
  name: string;
  artifactTtlSeconds: number;
  maxUploadMb: number;
}
