/**
 * ATELIER VÉRITÉ — HTML Sanitizer for Enterprise Policy Management
 * Protects against Stored XSS and malicious script execution.
 * Allows safe semantic tags: headings, paragraphs, lists, links, tables, blockquotes.
 * Disallows script, iframe, object, embed, style, event handlers (onload, onerror, etc.), javascript: URLs.
 */

const ALLOWED_TAGS = new Set([
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'P', 'DIV', 'SPAN', 'BR', 'HR',
  'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL',
  'UL', 'OL', 'LI',
  'BLOCKQUOTE', 'PRE', 'CODE',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
  'A',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  '*': new Set(['class', 'style']),
  'A': new Set(['href', 'target', 'rel', 'title']),
  'TH': new Set(['colspan', 'rowspan', 'scope']),
  'TD': new Set(['colspan', 'rowspan']),
};

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';

  // In browser or DOM environments
  if (typeof document !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Remove dangerous root tags
    const dangerousElements = doc.querySelectorAll('script, iframe, object, embed, applet, link, style, base, form, input, button');
    dangerousElements.forEach((el) => el.remove());

    const cleanNode = (node: Node) => {
      // If it's an element node
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toUpperCase();

        if (!ALLOWED_TAGS.has(tagName)) {
          // Replace disallowed tag with its text or child nodes
          const parent = element.parentNode;
          if (parent) {
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
          }
          return;
        }

        // Filter attributes
        const allowedForTag = ALLOWED_ATTRIBUTES[tagName] || new Set();
        const globalAllowed = ALLOWED_ATTRIBUTES['*'];

        const attributes = Array.from(element.attributes);
        for (const attr of attributes) {
          const attrName = attr.name.toLowerCase();

          // Block all inline event handlers like onclick, onerror, onload
          if (attrName.startsWith('on')) {
            element.removeAttribute(attr.name);
            continue;
          }

          if (globalAllowed.has(attrName) || allowedForTag.has(attrName)) {
            // Check dangerous URLs in href
            if (attrName === 'href') {
              const val = attr.value.trim().toLowerCase();
              if (val.startsWith('javascript:') || val.startsWith('data:') || val.startsWith('vbscript:')) {
                element.removeAttribute(attr.name);
                continue;
              }
              // Force safe target rel
              if (element.getAttribute('target') === '_blank') {
                element.setAttribute('rel', 'noopener noreferrer');
              }
            }
          } else {
            element.removeAttribute(attr.name);
          }
        }

        // Recursively clean children
        const children = Array.from(element.childNodes);
        children.forEach(cleanNode);
      }
    };

    const bodyChildren = Array.from(doc.body.childNodes);
    bodyChildren.forEach(cleanNode);

    return doc.body.innerHTML;
  }

  // Fallback string-based strip
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s*on\w+\s*=\s*(["'])?.*?\1/gi, '')
    .replace(/javascript:/gi, '');
}
