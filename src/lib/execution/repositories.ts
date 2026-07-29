/**
 * Phase 3B: Data Repositories
 * 
 * Implements repository interfaces for persisting planning artifacts to IndexedDB.
 * Each repository provides CRUD operations for its entity type.
 */

import { initDatabase } from './db';
import type {
  Project,
  Phase,
  Task,
  Document,
  ProjectRepository,
  PhaseRepository,
  TaskRepository,
  DocumentRepository,
} from './types';

// ============================================================================
// PROJECT REPOSITORY
// ============================================================================

class ProjectRepositoryImpl implements ProjectRepository {
  async create(project: Project): Promise<void> {
    const db = await initDatabase();
    await db.add('projects', project);
  }

  async getById(id: string): Promise<Project | null> {
    const db = await initDatabase();
    const project = await db.get('projects', id);
    return project || null;
  }

  async getAll(): Promise<Project[]> {
    const db = await initDatabase();
    return await db.getAll('projects');
  }

  async update(project: Project): Promise<void> {
    const db = await initDatabase();
    await db.put('projects', project);
  }

  async delete(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('projects', id);
  }

  async getByConversationId(conversationId: string): Promise<Project[]> {
    const db = await initDatabase();
    return await db.getAllFromIndex('projects', 'by-conversationId', conversationId);
  }

  async getByStatus(status: Project['status']): Promise<Project[]> {
    const db = await initDatabase();
    return await db.getAllFromIndex('projects', 'by-status', status);
  }
}

// ============================================================================
// PHASE REPOSITORY
// ============================================================================

class PhaseRepositoryImpl implements PhaseRepository {
  async create(phase: Phase): Promise<void> {
    const db = await initDatabase();
    await db.add('phases', phase);
  }

  async getById(id: string): Promise<Phase | null> {
    const db = await initDatabase();
    const phase = await db.get('phases', id);
    return phase || null;
  }

  async getByProjectId(projectId: string): Promise<Phase[]> {
    const db = await initDatabase();
    const phases = await db.getAllFromIndex('phases', 'by-projectId', projectId);
    // Sort by order
    return phases.sort((a, b) => a.order - b.order);
  }

  async update(phase: Phase): Promise<void> {
    const db = await initDatabase();
    await db.put('phases', phase);
  }

  async delete(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('phases', id);
  }
}

// ============================================================================
// TASK REPOSITORY
// ============================================================================

class TaskRepositoryImpl implements TaskRepository {
  async create(task: Task): Promise<void> {
    const db = await initDatabase();
    await db.add('tasks', task);
  }

  async getById(id: string): Promise<Task | null> {
    const db = await initDatabase();
    const task = await db.get('tasks', id);
    return task || null;
  }

  async getByPhaseId(phaseId: string): Promise<Task[]> {
    const db = await initDatabase();
    const tasks = await db.getAllFromIndex('tasks', 'by-phaseId', phaseId);
    // Sort by order
    return tasks.sort((a, b) => a.order - b.order);
  }

  async getByProjectId(projectId: string): Promise<Task[]> {
    const db = await initDatabase();
    const tasks = await db.getAllFromIndex('tasks', 'by-projectId', projectId);
    // Sort by order
    return tasks.sort((a, b) => a.order - b.order);
  }

  async update(task: Task): Promise<void> {
    const db = await initDatabase();
    await db.put('tasks', task);
  }

  async delete(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('tasks', id);
  }
}

// ============================================================================
// DOCUMENT REPOSITORY
// ============================================================================

class DocumentRepositoryImpl implements DocumentRepository {
  async create(document: Document): Promise<void> {
    const db = await initDatabase();
    await db.add('documents', document);
  }

  async getById(id: string): Promise<Document | null> {
    const db = await initDatabase();
    const doc = await db.get('documents', id);
    return doc || null;
  }

  async getByProjectId(projectId: string): Promise<Document[]> {
    const db = await initDatabase();
    return await db.getAllFromIndex('documents', 'by-projectId', projectId);
  }

  async update(document: Document): Promise<void> {
    const db = await initDatabase();
    await db.put('documents', document);
  }

  async delete(id: string): Promise<void> {
    const db = await initDatabase();
    await db.delete('documents', id);
  }

  async getByType(projectId: string, type: Document['type']): Promise<Document | null> {
    const db = await initDatabase();
    const docs = await db.getAllFromIndex('documents', 'by-projectId', projectId);
    const doc = docs.find((d) => d.type === type);
    return doc || null;
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let projectRepo: ProjectRepository | null = null;
let phaseRepo: PhaseRepository | null = null;
let taskRepo: TaskRepository | null = null;
let documentRepo: DocumentRepository | null = null;

export function getProjectRepository(): ProjectRepository {
  if (!projectRepo) {
    projectRepo = new ProjectRepositoryImpl();
  }
  return projectRepo;
}

export function getPhaseRepository(): PhaseRepository {
  if (!phaseRepo) {
    phaseRepo = new PhaseRepositoryImpl();
  }
  return phaseRepo;
}

export function getTaskRepository(): TaskRepository {
  if (!taskRepo) {
    taskRepo = new TaskRepositoryImpl();
  }
  return taskRepo;
}

export function getDocumentRepository(): DocumentRepository {
  if (!documentRepo) {
    documentRepo = new DocumentRepositoryImpl();
  }
  return documentRepo;
}
