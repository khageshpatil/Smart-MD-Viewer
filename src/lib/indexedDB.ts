// Database name kept as-is for backward compatibility
// Changing this would create a new database and lose existing user data
const DB_NAME = "SmartMDWorkspace";
const DB_VERSION = 3; // Incremented for projects and tasks stores
const STORE_NAME = "documents";

export interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null; // null means root
  projectId: string | null; // OPTIONAL - documents can belong to projects
  tags: string[];
  isPinned: boolean;
  linkedTaskIds: string[]; // NEW - link to tasks
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null means root
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string; // markdown
  status: "active" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
}

export type TicketStatus = "todo" | "in-progress" | "in-review" | "done";
export type TicketPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskType = "build" | "think" | "write" | "explore" | "fix";

export interface Ticket {
  id: string;
  title: string;
  description: string; // markdown supported
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  assignee: string | null;
  linkedPRs: string[]; // GitHub PR URLs or IDs
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  projectId: string; // REQUIRED - tasks belong to projects
  title: string;
  description: string; // markdown
  status: TaskStatus;
  type: TaskType;
  tags: string[];
  linkedDocumentIds: string[]; // link to documents
  linkedPRs: string[]; // keep GitHub PR linking
  createdAt: number;
  updatedAt: number;
}

export interface GitHubPR {
  id: string;
  number: number;
  title: string;
  url: string;
  status: "open" | "closed" | "merged";
  author: string;
  branch: string;
  repoFullName: string; // owner/repo
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
}

interface DBSchema {
  documents: Document;
  folders: Folder;
  tickets: Ticket;
  projects: Project;
  tasks: Task;
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion || 0;

      // Create documents store
      if (!database.objectStoreNames.contains("documents")) {
        const docStore = database.createObjectStore("documents", { keyPath: "id" });
        docStore.createIndex("folderId", "folderId", { unique: false });
        docStore.createIndex("projectId", "projectId", { unique: false });
        docStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
        docStore.createIndex("isPinned", "isPinned", { unique: false });
        docStore.createIndex("updatedAt", "updatedAt", { unique: false });
      } else if (oldVersion < 3) {
        // Add projectId index when upgrading from version 2 to 3
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const docStore = transaction.objectStore("documents");
          if (!docStore.indexNames.contains("projectId")) {
            docStore.createIndex("projectId", "projectId", { unique: false });
          }
        }
      }

      // Create folders store
      if (!database.objectStoreNames.contains("folders")) {
        const folderStore = database.createObjectStore("folders", { keyPath: "id" });
        folderStore.createIndex("parentId", "parentId", { unique: false });
      }

      // Create tickets store
      if (!database.objectStoreNames.contains("tickets")) {
        const ticketStore = database.createObjectStore("tickets", { keyPath: "id" });
        ticketStore.createIndex("status", "status", { unique: false });
        ticketStore.createIndex("priority", "priority", { unique: false });
        ticketStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
        ticketStore.createIndex("assignee", "assignee", { unique: false });
        ticketStore.createIndex("updatedAt", "updatedAt", { unique: false });
        ticketStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create projects store
      if (!database.objectStoreNames.contains("projects")) {
        const projectStore = database.createObjectStore("projects", { keyPath: "id" });
        projectStore.createIndex("status", "status", { unique: false });
        projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // Create tasks store
      if (!database.objectStoreNames.contains("tasks")) {
        const taskStore = database.createObjectStore("tasks", { keyPath: "id" });
        taskStore.createIndex("projectId", "projectId", { unique: false });
        taskStore.createIndex("status", "status", { unique: false });
        taskStore.createIndex("type", "type", { unique: false });
        taskStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
        taskStore.createIndex("updatedAt", "updatedAt", { unique: false });
        taskStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
};

// Document operations
export const saveDocument = async (doc: Document): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readwrite");
    const store = transaction.objectStore("documents");
    const request = store.put(doc);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDocument = async (id: string): Promise<Document | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllDocuments = async (): Promise<Document[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getDocumentsByFolder = async (folderId: string | null): Promise<Document[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const index = store.index("folderId");
    const request = index.getAll(folderId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getDocumentsByTag = async (tag: string): Promise<Document[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const index = store.index("tags");
    const request = index.getAll(tag);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getPinnedDocuments = async (): Promise<Document[]> => {
  const allDocs = await getAllDocuments();
  return allDocs.filter(doc => doc.isPinned);
};

export const deleteDocument = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readwrite");
    const store = transaction.objectStore("documents");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const searchDocuments = async (query: string): Promise<Document[]> => {
  const docs = await getAllDocuments();
  const lowerQuery = query.toLowerCase();
  return docs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
  );
};

// Folder operations
export const saveFolder = async (folder: Folder): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["folders"], "readwrite");
    const store = transaction.objectStore("folders");
    const request = store.put(folder);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getFolder = async (id: string): Promise<Folder | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["folders"], "readonly");
    const store = transaction.objectStore("folders");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllFolders = async (): Promise<Folder[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["folders"], "readonly");
    const store = transaction.objectStore("folders");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFoldersByParent = async (parentId: string | null): Promise<Folder[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["folders"], "readonly");
    const store = transaction.objectStore("folders");
    const index = store.index("parentId");
    const request = index.getAll(parentId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFolder = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["folders"], "readwrite");
    const store = transaction.objectStore("folders");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Export all workspace
export const exportWorkspace = async (): Promise<{ documents: Document[]; folders: Folder[] }> => {
  const documents = await getAllDocuments();
  const folders = await getAllFolders();
  return { documents, folders };
};

// Import workspace
export const importWorkspace = async (data: { documents: Document[]; folders: Folder[] }): Promise<void> => {
  const database = await initDB();
  
  const transaction = database.transaction(["documents", "folders"], "readwrite");
  const docStore = transaction.objectStore("documents");
  const folderStore = transaction.objectStore("folders");

  // Import folders first
  for (const folder of data.folders) {
    await new Promise((resolve, reject) => {
      const request = folderStore.put(folder);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  // Import documents
  for (const doc of data.documents) {
    await new Promise((resolve, reject) => {
      const request = docStore.put(doc);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }
};

// ============================================
// PROJECT OPERATIONS
// ============================================

export const saveProject = async (project: Project): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readwrite");
    const store = transaction.objectStore("projects");
    const request = store.put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readonly");
    const store = transaction.objectStore("projects");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllProjects = async (): Promise<Project[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readonly");
    const store = transaction.objectStore("projects");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getProjectsByStatus = async (status: Project["status"]): Promise<Project[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readonly");
    const store = transaction.objectStore("projects");
    const index = store.index("status");
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getActiveProject = async (): Promise<Project | undefined> => {
  const activeProjects = await getProjectsByStatus("active");
  return activeProjects.length > 0 ? activeProjects[0] : undefined;
};

export const deleteProject = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["projects"], "readwrite");
    const store = transaction.objectStore("projects");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// ============================================
// TICKET OPERATIONS
// ============================================

export const createTicket = async (ticket: Ticket): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readwrite");
    const store = transaction.objectStore("tickets");
    const request = store.add(ticket);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateTicket = async (ticket: Ticket): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readwrite");
    const store = transaction.objectStore("tickets");
    const request = store.put(ticket);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getTicket = async (id: string): Promise<Ticket | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readonly");
    const store = transaction.objectStore("tickets");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllTickets = async (): Promise<Ticket[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readonly");
    const store = transaction.objectStore("tickets");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTicketsByStatus = async (status: TicketStatus): Promise<Ticket[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readonly");
    const store = transaction.objectStore("tickets");
    const index = store.index("status");
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTicketsByPriority = async (priority: TicketPriority): Promise<Ticket[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readonly");
    const store = transaction.objectStore("tickets");
    const index = store.index("priority");
    const request = index.getAll(priority);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTicketsByTag = async (tag: string): Promise<Ticket[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readonly");
    const store = transaction.objectStore("tickets");
    const index = store.index("tags");
    const request = index.getAll(tag);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTicket = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tickets"], "readwrite");
    const store = transaction.objectStore("tickets");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const searchTickets = async (query: string): Promise<Ticket[]> => {
  const tickets = await getAllTickets();
  const lowerQuery = query.toLowerCase();
  return tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(lowerQuery) ||
      ticket.description.toLowerCase().includes(lowerQuery) ||
      ticket.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// ============================================
// TASK OPERATIONS
// ============================================

export const createTask = async (task: Task): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    const request = store.add(task);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateTask = async (task: Task): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    const request = store.put(task);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getTask = async (id: string): Promise<Task | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteTask = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllTasks = async (): Promise<Task[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTasksByProject = async (projectId: string): Promise<Task[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");
    const index = store.index("projectId");
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");
    const index = store.index("status");
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getTasksByType = async (type: TaskType): Promise<Task[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");
    const index = store.index("type");
    const request = index.getAll(type);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const searchTasks = async (query: string): Promise<Task[]> => {
  const tasks = await getAllTasks();
  const lowerQuery = query.toLowerCase();
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.description.toLowerCase().includes(lowerQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// ============================================
// TASK-DOCUMENT LINKING OPERATIONS
// ============================================

export const linkTaskToDocument = async (taskId: string, documentId: string): Promise<void> => {
  const database = await initDB();
  
  // Get both entities
  const task = await getTask(taskId);
  const document = await getDocument(documentId);
  
  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }
  if (!document) {
    throw new Error(`Document with id ${documentId} not found`);
  }
  
  // Update task's linkedDocumentIds
  if (!task.linkedDocumentIds.includes(documentId)) {
    const updatedTask: Task = {
      ...task,
      linkedDocumentIds: [...task.linkedDocumentIds, documentId],
      updatedAt: Date.now(),
    };
    await updateTask(updatedTask);
  }
  
  // Update document's linkedTaskIds (handle backward compatibility)
  const currentLinkedTaskIds = document.linkedTaskIds || [];
  if (!currentLinkedTaskIds.includes(taskId)) {
    const updatedDocument: Document = {
      ...document,
      linkedTaskIds: [...currentLinkedTaskIds, taskId],
      updatedAt: Date.now(),
    };
    await saveDocument(updatedDocument);
  }
};

export const unlinkTaskFromDocument = async (taskId: string, documentId: string): Promise<void> => {
  const database = await initDB();
  
  // Get both entities
  const task = await getTask(taskId);
  const document = await getDocument(documentId);
  
  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }
  if (!document) {
    throw new Error(`Document with id ${documentId} not found`);
  }
  
  // Remove from task's linkedDocumentIds
  if (task.linkedDocumentIds.includes(documentId)) {
    const updatedTask: Task = {
      ...task,
      linkedDocumentIds: task.linkedDocumentIds.filter(id => id !== documentId),
      updatedAt: Date.now(),
    };
    await updateTask(updatedTask);
  }
  
  // Remove from document's linkedTaskIds (handle backward compatibility)
  const currentLinkedTaskIds = document.linkedTaskIds || [];
  if (currentLinkedTaskIds.includes(taskId)) {
    const updatedDocument: Document = {
      ...document,
      linkedTaskIds: currentLinkedTaskIds.filter(id => id !== taskId),
      updatedAt: Date.now(),
    };
    await saveDocument(updatedDocument);
  }
};

export const getTasksByDocument = async (documentId: string): Promise<Task[]> => {
  const document = await getDocument(documentId);
  if (!document) {
    return [];
  }
  
  // Handle backward compatibility - documents created before schema change won't have linkedTaskIds
  const linkedTaskIds = document.linkedTaskIds || [];
  if (linkedTaskIds.length === 0) {
    return [];
  }
  
  const tasks: Task[] = [];
  for (const taskId of linkedTaskIds) {
    const task = await getTask(taskId);
    if (task) {
      tasks.push(task);
    }
  }
  return tasks;
};

export const getDocumentsByTask = async (taskId: string): Promise<Document[]> => {
  const task = await getTask(taskId);
  if (!task || task.linkedDocumentIds.length === 0) {
    return [];
  }
  
  const documents: Document[] = [];
  for (const documentId of task.linkedDocumentIds) {
    const document = await getDocument(documentId);
    if (document) {
      documents.push(document);
    }
  }
  return documents;
};

// ============================================
// MIGRATION HELPERS
// ============================================

export const migrateTicketToTask = async (ticketId: string, projectId: string): Promise<Task> => {
  const ticket = await getTicket(ticketId);
  if (!ticket) {
    throw new Error(`Ticket with id ${ticketId} not found`);
  }
  
  // Map ticket status to task status
  const statusMap: Record<TicketStatus, TaskStatus> = {
    "todo": "todo",
    "in-progress": "in-progress",
    "in-review": "review",
    "done": "done",
  };
  
  const newTask: Task = {
    id: crypto.randomUUID(),
    projectId,
    title: ticket.title,
    description: ticket.description,
    status: statusMap[ticket.status],
    type: "build", // Default type, user can change later
    tags: [...ticket.tags],
    linkedDocumentIds: [],
    linkedPRs: [...ticket.linkedPRs],
    createdAt: ticket.createdAt,
    updatedAt: Date.now(),
  };
  
  await createTask(newTask);
  return newTask;
};

export const getUnassignedDocuments = async (): Promise<Document[]> => {
  const allDocs = await getAllDocuments();
  // Handle backward compatibility - documents created before schema change will have projectId as undefined
  return allDocs.filter(doc => doc.projectId === null || doc.projectId === undefined);
};

export const getUnassignedTickets = async (): Promise<Ticket[]> => {
  // All tickets are unassigned (they don't have projectId)
  return await getAllTickets();
};

export const getDocumentsByProject = async (projectId: string): Promise<Document[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const index = store.index("projectId");
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
