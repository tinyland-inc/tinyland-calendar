






import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCalendarConfig } from './config.js';

function getSyncDir(): string {
  const config = getCalendarConfig();
  return config.dataDir || path.join(process.cwd(), 'data', 'calendar');
}

function getSyncFile(): string {
  return path.join(getSyncDir(), 'sync-status.json');
}

interface SyncStatus {
  slug: string;
  status: 'synced' | 'error' | 'pending';
  synced_at: string;
  error_message?: string;
}




export class EventSyncStatusStore {
  private statuses: Map<string, SyncStatus> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const syncDir = getSyncDir();
    const syncFile = getSyncFile();

    if (!existsSync(syncDir)) {
      await mkdir(syncDir, { recursive: true });
    }

    if (existsSync(syncFile)) {
      try {
        const data = await readFile(syncFile, 'utf-8');
        const parsed = JSON.parse(data);

        if (Array.isArray(parsed)) {
          parsed.forEach((status: SyncStatus) => {
            this.statuses.set(status.slug, status);
          });
        }
      } catch (error) {
        console.error('Failed to load sync statuses:', error);
      }
    }

    this.initialized = true;
  }

  private async save(): Promise<void> {
    const syncDir = getSyncDir();
    const syncFile = getSyncFile();

    if (!existsSync(syncDir)) {
      await mkdir(syncDir, { recursive: true });
    }

    const data = Array.from(this.statuses.values());
    await writeFile(syncFile, JSON.stringify(data, null, 2));
  }

  async updateStatus(slug: string, status: 'synced' | 'error', error?: string): Promise<void> {
    await this.initialize();

    const syncStatus: SyncStatus = {
      slug,
      status,
      synced_at: new Date().toISOString(),
      error_message: error || undefined,
    };

    this.statuses.set(slug, syncStatus);
    await this.save();
  }

  async getStatus(
    slugs: string[]
  ): Promise<Record<string, { status: string; syncedAt: Date; error?: string }>> {
    await this.initialize();

    const result: Record<string, { status: string; syncedAt: Date; error?: string }> = {};

    for (const slug of slugs) {
      const status = this.statuses.get(slug);
      if (status) {
        result[slug] = {
          status: status.status,
          syncedAt: new Date(status.synced_at),
          error: status.error_message,
        };
      }
    }

    return result;
  }

  async getAll(): Promise<SyncStatus[]> {
    await this.initialize();
    return Array.from(this.statuses.values());
  }

  async clear(): Promise<void> {
    await this.initialize();
    this.statuses.clear();
    await this.save();
  }
}


export const syncStatusStore = new EventSyncStatusStore();
