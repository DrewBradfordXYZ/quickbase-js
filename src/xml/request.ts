/**
 * XML API Request/Response Utilities
 *
 * Utilities for building XML requests and parsing XML responses
 * for the legacy QuickBase XML API.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type { BaseResponse } from './types.js';

/**
 * Build an XML API request body.
 * Wraps the inner XML content in <qdbapi> tags.
 *
 * @param inner - The inner XML content (without qdbapi wrapper)
 * @returns Complete XML request body
 *
 * @example
 * buildRequest('<userid>123</userid><roleid>10</roleid>')
 * // Returns: '<qdbapi><userid>123</userid><roleid>10</roleid></qdbapi>'
 */
export function buildRequest(inner: string): string {
  return `<qdbapi>${inner}</qdbapi>`;
}

/**
 * Escape special characters for safe inclusion in XML.
 *
 * @param str - The string to escape
 * @returns XML-escaped string
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract text content from a single XML tag.
 * Uses regex for simple extraction without DOM parsing.
 *
 * @param xml - The XML string to search
 * @param tag - The tag name to extract
 * @returns The text content or empty string if not found
 */
export function getTagContent(xml: string, tag: string): string {
  // Match tag with optional attributes, capture inner content
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`));
  return match?.[1] ?? '';
}

/**
 * Extract text content with CDATA support.
 * Some XML responses wrap content in CDATA blocks.
 *
 * @param xml - The XML string to search
 * @param tag - The tag name to extract
 * @returns The text content or empty string if not found
 */
export function getTagContentWithCDATA(xml: string, tag: string): string {
  // Try CDATA first
  const cdataMatch = xml.match(
    new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`)
  );
  if (cdataMatch && cdataMatch[1] !== undefined) {
    return cdataMatch[1];
  }
  // Fall back to regular content
  return getTagContent(xml, tag);
}

/**
 * Extract an attribute value from an XML element.
 *
 * @param xml - The XML element string
 * @param attr - The attribute name
 * @returns The attribute value or empty string if not found
 */
export function getAttribute(xml: string, attr: string): string {
  const match = xml.match(new RegExp(`${attr}="([^"]*)"`));
  return match?.[1] ?? '';
}

/**
 * Extract all occurrences of a tag as an array of strings.
 *
 * @param xml - The XML string to search
 * @param tag - The tag name to extract
 * @returns Array of XML element strings (including tags)
 */
export function getAllElements(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  const elements: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    elements.push(match[0]);
  }
  return elements;
}

/**
 * Parse the base response fields from an XML API response.
 *
 * @param xml - The XML response string
 * @returns BaseResponse with action, errcode, errtext, errdetail
 */
export function parseBaseResponse(xml: string): BaseResponse {
  const errdetail = getTagContent(xml, 'errdetail');
  return {
    action: getTagContent(xml, 'action'),
    errcode: parseInt(getTagContent(xml, 'errcode'), 10) || 0,
    errtext: getTagContent(xml, 'errtext'),
    errdetail: errdetail || undefined,
  };
}

/**
 * Create an XML element with content.
 * Escapes the content automatically.
 *
 * @param tag - The tag name
 * @param content - The content (will be escaped)
 * @returns XML element string
 */
export function xmlElement(tag: string, content: string | number): string {
  return `<${tag}>${escapeXml(String(content))}</${tag}>`;
}

/**
 * Create an XML element with CDATA content.
 * Use for large text content that may contain special characters.
 *
 * @param tag - The tag name
 * @param content - The content (will be wrapped in CDATA)
 * @returns XML element string with CDATA
 */
export function xmlElementCDATA(tag: string, content: string): string {
  // CDATA cannot contain the sequence ]]> - if present, split it
  const escaped = content.replace(/\]\]>/g, ']]]]><![CDATA[>');
  return `<${tag}><![CDATA[${escaped}]]></${tag}>`;
}

/**
 * Create an XML element with an attribute.
 *
 * @param tag - The tag name
 * @param attrName - The attribute name
 * @param attrValue - The attribute value
 * @param content - The content (will be escaped)
 * @returns XML element string with attribute
 */
export function xmlElementWithAttr(
  tag: string,
  attrName: string,
  attrValue: string | number,
  content: string | number
): string {
  return `<${tag} ${attrName}="${escapeXml(String(attrValue))}">${escapeXml(String(content))}</${tag}>`;
}

/**
 * Parse a boolean-like value from XML.
 * QuickBase uses "1" for true, "0" or empty for false.
 *
 * @param value - The string value to parse
 * @returns boolean
 */
export function parseXmlBool(value: string): boolean {
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * Parse a numeric value from XML.
 *
 * @param value - The string value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns number
 */
export function parseXmlNumber(value: string, defaultValue = 0): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}
