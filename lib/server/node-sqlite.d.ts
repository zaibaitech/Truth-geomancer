// Minimal ambient type declaration for Node's built-in `node:sqlite`
// module (Prompt 26). The installed @types/node (20.x) predates this
// module's introduction in Node 22, so TypeScript has no types for it out
// of the box; this repo's actual runtime is Node 22.22.2 (confirmed via
// `node -v`), where the module is available without any flag (still
// marked experimental by Node itself). Declares only the small subset of
// the real API this project actually calls — not a full API surface.
declare module 'node:sqlite' {
  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export class StatementSync {
    run(...params: unknown[]): StatementResultingChanges;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  export interface DatabaseSyncOptions {
    open?: boolean;
    readOnly?: boolean;
  }

  export class DatabaseSync {
    constructor(location: string, options?: DatabaseSyncOptions);
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
}
