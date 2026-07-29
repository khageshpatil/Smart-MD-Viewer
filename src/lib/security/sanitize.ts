/**
 * HTML Sanitization Utilities
 * Uses DOMPurify to prevent XSS attacks in user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS attacks
 * Used for markdown rendering and user-generated content
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Allow common safe tags for markdown
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      'hr',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'img',
      'div',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'title', 'src', 'alt', 'class', 'id'],
    // Disallow scripts and dangerous attributes
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Strip all HTML tags, leaving only text
 * Useful for extracting plain text from HTML
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }

  return url;
}

/**
 * Sanitize markdown content before rendering
 * More lenient than sanitizeHtml but still safe
 */
export function sanitizeMarkdown(markdown: string): string {
  return DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'del',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
      'hr',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'img',
      'div',
      'span',
      'input', // For checkboxes in markdown
    ],
    ALLOWED_ATTR: [
      'href',
      'title',
      'src',
      'alt',
      'class',
      'id',
      'type',
      'checked',
      'disabled',
      'rel',
      'target',
    ],
    // Allow target="_blank" for external links
    ADD_ATTR: ['target'],
  });
}

/**
 * Configure DOMPurify hooks for additional security
 */
export function configureDOMPurify(): void {
  // Add rel="noopener noreferrer" to all external links
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const anchor = node as HTMLAnchorElement;
      if (anchor.hasAttribute('href')) {
        const href = anchor.getAttribute('href') || '';
        // If external link, add noopener noreferrer
        if (href.startsWith('http://') || href.startsWith('https://')) {
          anchor.setAttribute('rel', 'noopener noreferrer');
          anchor.setAttribute('target', '_blank');
        }
      }
    }
  });
}

// Initialize DOMPurify configuration on import
configureDOMPurify();
