






import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCalendarConfig } from './config.js';
import type { CalendarCollection, CollectionConfig } from './types.js';

function getCollectionsDir(): string {
  const config = getCalendarConfig();
  return config.dataDir || path.join(process.cwd(), 'data', 'calendar');
}

function getCollectionsFile(): string {
  return path.join(getCollectionsDir(), 'collections.json');
}

interface StoredCollection extends Omit<CalendarCollection, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
}




export class CalendarCollectionsStore {
  private collections: Map<string, StoredCollection> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const collectionsDir = getCollectionsDir();
    const collectionsFile = getCollectionsFile();

    if (!existsSync(collectionsDir)) {
      await mkdir(collectionsDir, { recursive: true });
    }

    if (existsSync(collectionsFile)) {
      try {
        const data = await readFile(collectionsFile, 'utf-8');
        const parsed = JSON.parse(data);

        if (Array.isArray(parsed)) {
          parsed.forEach((collection: StoredCollection) => {
            this.collections.set(collection.name, collection);
          });
        }
      } catch (error) {
        console.error('Failed to load collections:', error);
      }
    }

    if (this.collections.size === 0) {
      await this.initializeDefaults();
    }

    this.initialized = true;
  }

  private async initializeDefaults(): Promise<void> {
    const defaultCollections: CollectionConfig[] = [
      {
        name: 'events',
        displayName: 'Community Events',
        description: 'Public community events and gatherings',
        color: '#FF6B6B',
        icon: 'calendar',
        isPublic: true,
      },
      {
        name: 'workshops',
        displayName: 'Workshops & Training',
        description: 'Educational workshops and skill-building sessions',
        color: '#FECA57',
        icon: 'graduation-cap',
        isPublic: true,
      },
      {
        name: 'meetings',
        displayName: 'Meetings',
        description: 'Community meetings and planning sessions',
        color: '#FF9F43',
        icon: 'users',
        isPublic: false,
      },
      {
        name: 'pride',
        displayName: 'Pride Events',
        description: 'Pride month and LGBTQ+ celebrations',
        color: '#9C88FF',
        icon: 'heart',
        isPublic: true,
      },
      {
        name: 'private',
        displayName: 'Private Calendar',
        description: 'Admin and organizer private events',
        color: '#54A0FF',
        icon: 'lock',
        isPublic: false,
      },
    ];

    for (const config of defaultCollections) {
      await this.upsert(config);
    }
  }

  private async save(): Promise<void> {
    const collectionsDir = getCollectionsDir();
    const collectionsFile = getCollectionsFile();

    if (!existsSync(collectionsDir)) {
      await mkdir(collectionsDir, { recursive: true });
    }

    const data = Array.from(this.collections.values());
    await writeFile(collectionsFile, JSON.stringify(data, null, 2));
  }

  async upsert(config: CollectionConfig): Promise<void> {
    await this.initialize();

    const now = new Date().toISOString();
    const existing = this.collections.get(config.name);

    const collection: StoredCollection = {
      id: existing?.id || Date.now(),
      name: config.name,
      displayName: config.displayName,
      description: config.description,
      color: config.color,
      icon: config.icon || 'calendar',
      isPublic: config.isPublic,
      sync_enabled: true,
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    this.collections.set(config.name, collection);
    await this.save();
  }

  async getAll(): Promise<CalendarCollection[]> {
    await this.initialize();
    return Array.from(this.collections.values())
      .map((collection) => ({
        ...collection,
        created_at: new Date(collection.created_at),
        updated_at: new Date(collection.updated_at),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async get(name: string): Promise<CalendarCollection | null> {
    await this.initialize();
    const collection = this.collections.get(name);
    if (!collection) return null;

    return {
      ...collection,
      created_at: new Date(collection.created_at),
      updated_at: new Date(collection.updated_at),
    };
  }

  async update(name: string, updates: Partial<CollectionConfig>): Promise<void> {
    await this.initialize();

    const existing = this.collections.get(name);
    if (!existing) {
      throw new Error(`Collection '${name}' not found`);
    }

    const updated: StoredCollection = {
      ...existing,
      displayName: updates.displayName || existing.displayName,
      description: updates.description || existing.description,
      color: updates.color || existing.color,
      icon: updates.icon || existing.icon,
      isPublic: updates.isPublic !== undefined ? updates.isPublic : existing.isPublic,
      updated_at: new Date().toISOString(),
    };

    this.collections.set(name, updated);
    await this.save();
  }

  async delete(name: string): Promise<void> {
    await this.initialize();

    const defaultCollections = ['events', 'workshops', 'meetings', 'pride', 'private'];
    if (defaultCollections.includes(name)) {
      throw new Error(`Cannot delete default collection '${name}'`);
    }

    if (this.collections.delete(name)) {
      await this.save();
    }
  }
}


export const collectionsStore = new CalendarCollectionsStore();
