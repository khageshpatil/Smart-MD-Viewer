// Client-side Google Drive API & OAuth 2.0 Service for Smart MD Viewer
// Zero-backend, local-first integration using Google Identity Services (GIS) & Drive REST API v3

export interface GoogleUser {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  expiresAt: number;
}

const DEFAULT_CLIENT_ID_KEY = "smartmd_google_client_id";
const TOKEN_STORAGE_KEY = "smartmd_google_user";

// Scope: drive.file ONLY accesses files created or opened by this app (Privacy Preserving)
export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

let tokenClient: any = null;

export function getStoredClientId(): string {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem(DEFAULT_CLIENT_ID_KEY) ||
    ""
  );
}

export function setStoredClientId(clientId: string): void {
  localStorage.setItem(DEFAULT_CLIENT_ID_KEY, clientId);
}

export function getStoredGoogleUser(): GoogleUser | null {
  try {
    const data = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!data) return null;
    const user: GoogleUser = JSON.parse(data);
    if (Date.now() >= user.expiresAt) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function saveGoogleUser(user: GoogleUser): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(user));
}

export function clearGoogleUser(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Dynamically loads the Google Identity Services SDK script
 */
export function loadGSIClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Trigger Google OAuth 2.0 Sign-In Popup
 */
export async function requestGoogleAuth(clientIdOverride?: string): Promise<GoogleUser> {
  await loadGSIClient();

  const clientId = clientIdOverride || getStoredClientId();
  if (!clientId) {
    throw new Error("CLIENT_ID_MISSING");
  }

  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: `${DRIVE_FILE_SCOPE} https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in || "3600", 10);
          const expiresAt = Date.now() + expiresIn * 1000 - 60000; // 1 min buffer

          try {
            // Fetch User Profile
            const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const profile = await profileRes.json();

            const googleUser: GoogleUser = {
              email: profile.email || "Google User",
              name: profile.name || "Smart MD User",
              picture: profile.picture,
              accessToken,
              expiresAt,
            };

            saveGoogleUser(googleUser);
            resolve(googleUser);
          } catch (profileErr) {
            const basicUser: GoogleUser = {
              email: "Authenticated User",
              name: "Google Account",
              accessToken,
              expiresAt,
            };
            saveGoogleUser(basicUser);
            resolve(basicUser);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates a native Google Doc from HTML content using Google Drive API v3
 * Uses multipart upload with convert=true to trigger automatic HTML -> Google Doc conversion!
 */
export async function createNativeGoogleDoc(
  accessToken: string,
  title: string,
  htmlBodyContent: string
): Promise<{ id: string; webViewLink: string }> {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111; margin: 1in; }
    h1 { font-size: 22pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; color: #000; }
    h2 { font-size: 16pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #1a73e8; }
    h3 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
    p { margin-bottom: 8pt; }
    code { font-family: 'Courier New', monospace; background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 10pt; }
    pre { font-family: 'Courier New', monospace; background-color: #f4f4f4; padding: 10px; border-radius: 4px; font-size: 9.5pt; white-space: pre-wrap; }
    blockquote { border-left: 3px solid #1a73e8; padding-left: 10px; color: #555; font-style: italic; margin: 10pt 0; }
    table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
    th, td { border: 1px solid #ccc; padding: 6pt 10pt; text-align: left; }
    th { background-color: #f0f4f9; font-weight: bold; }
    tr:nth-child(even) td { background-color: #f9fbfd; }
    a { color: #1a73e8; text-decoration: underline; }
    ul, ol { margin-left: 20pt; margin-bottom: 8pt; }
  </style>
</head>
<body>
  ${htmlBodyContent}
</body>
</html>`;

  const metadata = {
    name: title,
    mimeType: "application/vnd.google-apps.document", // Automatic Google Docs conversion
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: text/html; charset=UTF-8\r\n\r\n" +
    fullHtml +
    closeDelimiter;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || "Failed to create Google Doc");
  }

  const fileData = await response.json();
  const webViewLink =
    fileData.webViewLink || `https://docs.google.com/document/d/${fileData.id}/edit`;

  return { id: fileData.id, webViewLink };
}

/**
 * Uploads raw Markdown content to Google Drive
 */
export async function uploadMarkdownFileToDrive(
  accessToken: string,
  title: string,
  markdownContent: string
): Promise<{ id: string; webViewLink: string }> {
  const fileName = title.endsWith(".md") ? title : `${title}.md`;

  const metadata = {
    name: fileName,
    mimeType: "text/markdown",
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: text/markdown; charset=UTF-8\r\n\r\n" +
    markdownContent +
    closeDelimiter;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || "Failed to upload file to Google Drive");
  }

  const fileData = await response.json();
  const webViewLink =
    fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`;

  return { id: fileData.id, webViewLink };
}
