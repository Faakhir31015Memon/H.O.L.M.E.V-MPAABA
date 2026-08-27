/**
 * H.O.L.M.E.V Tool Audit Logger
 *
 * Records every tool execution attempt with:
 * - timestamp, tool name, arguments, permission level
 * - result (success/fail/offline/blocked)
 * - execution time, error if any
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  tool: string;
  args: Record<string, unknown>;
  permissionLevel: number;
  status: 'EXECUTED' | 'FAILED' | 'BLOCKED' | 'DEVICE_OFFLINE' | 'PERMISSION_REQUIRED' | 'CONNECTION_REFUSED';
  success: boolean;
  executionTimeMs: number;
  error?: string;
  result?: unknown;
}

export class AuditLogger {
  private entries: AuditEntry[] = [];
  private maxEntries = 500;
  private listeners: Array<(entry: AuditEntry) => void> = [];

  public log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const full: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.entries.unshift(full);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
    this.listeners.forEach((l) => {
      try { l(full); } catch { /* ignore */ }
    });
    return full;
  }

  public getEntries(limit = 50): AuditEntry[] {
    return this.entries.slice(0, limit);
  }

  public getEntriesForTool(toolName: string, limit = 20): AuditEntry[] {
    return this.entries.filter((e) => e.tool === toolName).slice(0, limit);
  }

  public clear() {
    this.entries = [];
  }

  public onEntry(listener: (entry: AuditEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getStats() {
    const total = this.entries.length;
    const succeeded = this.entries.filter((e) => e.success).length;
    const failed = this.entries.filter((e) => !e.success).length;
    const blocked = this.entries.filter((e) => e.status === 'BLOCKED').length;
    const avgMs =
      total > 0
        ? Math.round(this.entries.reduce((s, e) => s + e.executionTimeMs, 0) / total)
        : 0;
    return { total, succeeded, failed, blocked, avgMs };
  }
}

export const auditLogger = new AuditLogger();
