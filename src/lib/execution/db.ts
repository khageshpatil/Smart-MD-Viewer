/**
 * Phase 3B: IndexedDB Database
 * 
 * Initializes and manages the CORTEX planning database.
 * Uses idb (wrapper around IndexedDB) for better DX.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project, Phase, Task, Document } from './types';

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

interface CortexDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-status': string;
      'by-createdAt': number;
      'by-conversationId': string;
    };
  };
  phases: {
    key: string;
    value: Phase;
    indexes: {
      'by-projectId': string;
      'by-status': string;
      'by-order': number;
    };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-phaseId': string;
      'by-projectId': string;
      'by-status': string;
      'by-order': number;
    };
  };
  documents: {
    key: string;
    value: Document;
    indexes: {
      'by-projectId': string;
      'by-type': string;
    };
  };
}

const DB_NAME = 'cortex-planning';
const DB_VERSION = 1;

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbInstance: IDBPDatabase<CortexDB> | null = null;

/**
 * Initialize and open the database
 */
export async function initDatabase(): Promise<IDBPDatabase<CortexDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<CortexDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-status', 'status');
        projectStore.createIndex('by-createdAt', 'createdAt');
        projectStore.createIndex('by-conversationId', 'conversationId');
      }

      // Phases store
      if (!db.objectStoreNames.contains('phases')) {
        const phaseStore = db.createObjectStore('phases', { keyPath: 'id' });
        phaseStore.createIndex('by-projectId', 'projectId');
        phaseStore.createIndex('by-status', 'status');
        phaseStore.createIndex('by-order', 'order');
      }

      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-phaseId', 'phaseId');
        taskStore.createIndex('by-projectId', 'projectId');
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-order', 'order');
      }

      // Documents store
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('by-projectId', 'projectId');
        docStore.createIndex('by-type', 'type');
      }
    },
  });

  return dbInstance;
}

/**
 * Get the database instance (must be initialized first)
 */
export function getDatabase(): IDBPDatabase<CortexDB> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Clear all data (for testing/development)
 */
export async function clearDatabase(): Promise<void> {
  const db = await initDatabase();
  
  const tx = db.transaction(['projects', 'phases', 'tasks', 'documents'], 'readwrite');
  
  await Promise.all([
    tx.objectStore('projects').clear(),
    tx.objectStore('phases').clear(),
    tx.objectStore('tasks').clear(),
    tx.objectStore('documents').clear(),
  ]);
  
  await tx.done;
}
