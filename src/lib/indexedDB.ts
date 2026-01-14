const DB_NAME = "SmartMDWorkspace";
const DB_VERSION = 2; // Incremented for tickets store
const STORE_NAME = "documents";

export interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null; // null means root
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null means root
  createdAt: number;
}

export type TicketStatus = "todo" | "in-progress" | "in-review" | "done";
export type TicketPriority = "low" | "medium" | "high";

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

      // Create documents store
      if (!database.objectStoreNames.contains("documents")) {
        const docStore = database.createObjectStore("documents", { keyPath: "id" });
        docStore.createIndex("folderId", "folderId", { unique: false });
        docStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
        docStore.createIndex("isPinned", "isPinned", { unique: false });
        docStore.createIndex("updatedAt", "updatedAt", { unique: false });
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
