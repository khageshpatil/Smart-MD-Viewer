/**
 * PHASE Ω: Artifact Index (Reality Lock)
 * 
 * CORTEX must never hallucinate what exists.
 * This module reads ONLY from IndexedDB.
 * Ground truth only. No inference. No guessing.
 * 
 * PHASE Ω FINAL — DO NOT EXTEND WITHOUT DESIGN REVIEW
 */

import { getProjectRepository } from '@/lib/execution/repositories';
import type { Project } from '@/lib/execution/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ArtifactSummary {
  projectCount: number;
  lastActiveProject: Project | null;
  conversationLinks: Map<string, Project[]>; // conversationId → projects
}

// ============================================================================
// ARTIFACT INDEX
// ============================================================================

class ArtifactIndexImpl {
  /**
   * Get all projects from IndexedDB
   */
  async getAllProjects(): Promise<Project[]> {
    const repo = getProjectRepository();
    return await repo.getAll();
  }

  /**
   * Get last active project (most recently created)
   */
  async getLastActiveProject(): Promise<Project | null> {
    const projects = await this.getAllProjects();
    
    if (projects.length === 0) {
      return null;
    }

    // Sort by createdAt descending
    projects.sort((a, b) => b.createdAt - a.createdAt);
    
    return projects[0];
  }

  /**
   * Get all projects linked to a conversation
   */
  async getProjectsByConversation(conversationId: string): Promise<Project[]> {
    const repo = getProjectRepository();
    return await repo.getByConversationId(conversationId);
  }

  /**
   * Get summary of all artifacts
   */
  async getSummary(): Promise<ArtifactSummary> {
    const projects = await this.getAllProjects();
    const lastActiveProject = projects.length > 0
      ? projects.sort((a, b) => b.createdAt - a.createdAt)[0]
      : null;

    // Build conversation links
    const conversationLinks = new Map<string, Project[]>();
    for (const project of projects) {
      const existing = conversationLinks.get(project.conversationId) || [];
      conversationLinks.set(project.conversationId, [...existing, project]);
    }

    return {
      projectCount: projects.length,
      lastActiveProject,
      conversationLinks,
    };
  }

  /**
   * Check if any artifacts exist
   */
  async hasAnyArtifacts(): Promise<boolean> {
    const projects = await this.getAllProjects();
    return projects.length > 0;
  }

  /**
   * Check if conversation has artifacts
   */
  async hasArtifactsForConversation(conversationId: string): Promise<boolean> {
    const projects = await this.getProjectsByConversation(conversationId);
    return projects.length > 0;
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    const repo = getProjectRepository();
    return await repo.getById(id);
  }

  /**
   * Get active projects (status = 'active')
   */
  async getActiveProjects(): Promise<Project[]> {
    const repo = getProjectRepository();
    return await repo.getByStatus('active');
  }

  /**
   * Count projects by status
   */
  async countByStatus(status: 'active' | 'completed' | 'archived'): Promise<number> {
    const repo = getProjectRepository();
    const projects = await repo.getByStatus(status);
    return projects.length;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let artifactIndexInstance: ArtifactIndexImpl | null = null;

export function getArtifactIndex(): ArtifactIndexImpl {
  if (!artifactIndexInstance) {
    artifactIndexInstance = new ArtifactIndexImpl();
  }
  return artifactIndexInstance;
}

// ============================================================================
// CONVENIENCE HOOKS (for React components)
// ============================================================================

import { useState, useEffect } from 'react';

export function useArtifactSummary() {
  const [summary, setSummary] = useState<ArtifactSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const index = getArtifactIndex();
    index.getSummary().then((s) => {
      setSummary(s);
      setLoading(false);
    });
  }, []);

  return { summary, loading, refresh: async () => {
    setLoading(true);
    const index = getArtifactIndex();
    const s = await index.getSummary();
    setSummary(s);
    setLoading(false);
  }};
}

export function useHasAnyArtifacts() {
  const [hasArtifacts, setHasArtifacts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const index = getArtifactIndex();
    index.hasAnyArtifacts().then((has) => {
      setHasArtifacts(has);
      setLoading(false);
    });
  }, []);

  return { hasArtifacts, loading };
}
