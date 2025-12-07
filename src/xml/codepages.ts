/**
 * XML API Code Pages
 *
 * Endpoints for managing stored code pages (HTML, XSL, etc.).
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  PageType,
  AddReplaceDBPageResult,
} from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
  xmlElementCDATA,
  parseXmlNumber,
} from './request.js';

/**
 * Get stored code page content.
 *
 * Returns the raw page content (HTML, XSL, etc.).
 *
 * @see https://help.quickbase.com/docs/api-getdbpage
 *
 * @param pageIdOrName - Page ID (number) or page name (string)
 *
 * @example
 * ```typescript
 * // By page ID
 * const content = await getDBPage(caller, 'bqapp123', 3);
 *
 * // By page name
 * const content = await getDBPage(caller, 'bqapp123', 'mystylesheet.xsl');
 * ```
 */
export async function getDBPage(
  caller: XmlCaller,
  appId: string,
  pageIdOrName: string | number
): Promise<string> {
  const inner = `<pageID>${escapeXml(String(pageIdOrName))}</pageID>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_GetDBPage', body);

  // Note: GetDBPage returns raw HTML, not XML
  // Check if it's an error response
  if (xml.includes('<errcode>') && !xml.includes('<errcode>0</errcode>')) {
    const base = parseBaseResponse(xml);
    checkError(base);
  }

  // If not an error, return the raw content
  // The response is the page content itself, not wrapped in XML
  return xml;
}

/**
 * Create or update a code page.
 *
 * Page types:
 * - 1: XSL stylesheets or HTML pages
 * - 3: Exact Forms (Word templates)
 *
 * @see https://help.quickbase.com/docs/api-addreplacedbpage
 *
 * @param pageId - Existing page ID to replace (undefined to create new)
 * @param pageName - Name for the page (required when creating new)
 *
 * @example
 * ```typescript
 * // Create a new page
 * const result = await addReplaceDBPage(
 *   caller, 'bqapp123',
 *   'mypage.html', undefined, 1,
 *   '<html><body>Hello World</body></html>'
 * );
 * console.log(`Created page ID: ${result.pageId}`);
 *
 * // Update existing page
 * await addReplaceDBPage(
 *   caller, 'bqapp123',
 *   'mypage.html', 6, 1,
 *   '<html><body>Updated content</body></html>'
 * );
 * ```
 */
export async function addReplaceDBPage(
  caller: XmlCaller,
  appId: string,
  pageName: string,
  pageId: number | undefined,
  pageType: PageType,
  pageBody: string
): Promise<AddReplaceDBPageResult> {
  let inner = '';

  if (pageId !== undefined) {
    inner += `<pageid>${pageId}</pageid>`;
  }
  inner += `<pagename>${escapeXml(pageName)}</pagename>`;
  inner += `<pagetype>${pageType}</pagetype>`;
  inner += xmlElementCDATA('pagebody', pageBody);

  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_AddReplaceDBPage', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  const resultPageId = parseXmlNumber(getTagContent(xml, 'pageID'));
  return { pageId: resultPageId };
}
