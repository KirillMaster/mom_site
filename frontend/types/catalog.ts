export interface ImportSummary {
  updated: number;
  created: number;
  skipped: number;
  warnings: number;
  errors: number;
  templateVersionMismatch: boolean;
}

export interface FieldChange {
  field: string;
  old: string | null;
  new: string | null;
}

export interface ImportIssue {
  level: 'error' | 'warning';
  column: string;
  message: string;
}

export interface RowReport {
  row: number;
  sheet: string;
  id: number | null;
  title: string;
  changes: FieldChange[];
  issues: ImportIssue[];
  comment: string | null;
}

export interface ImportReport {
  summary: ImportSummary;
  rows: RowReport[];
  logId: number | null;
}

export interface RollbackResult {
  restoredFields: number;
  deletedDrafts: number;
  editedAfterImport: number[];
}
