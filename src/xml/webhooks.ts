/**
 * XML API Webhooks
 *
 * Endpoints for managing webhooks.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  WebhookOptions,
  WebhookResult,
} from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
  parseXmlNumber,
} from './request.js';

/**
 * Build webhook XML options
 */
function buildWebhookOptions(options: WebhookOptions): string {
  let inner = '';

  if (options.name) {
    inner += `<name>${escapeXml(options.name)}</name>`;
  }
  if (options.url) {
    inner += `<url>${escapeXml(options.url)}</url>`;
  }
  if (options.trigger) {
    inner += `<trigger>${escapeXml(options.trigger)}</trigger>`;
  }

  return inner;
}

/**
 * Create a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-create
 *
 * @example
 * ```typescript
 * const result = await webhooksCreate(caller, 'bqtable123', {
 *   name: 'My Webhook',
 *   url: 'https://example.com/webhook',
 *   trigger: 'onInsert',
 * });
 * console.log(`Created webhook: ${result.webhookId}`);
 * ```
 */
export async function webhooksCreate(
  caller: XmlCaller,
  tableId: string,
  options: WebhookOptions
): Promise<WebhookResult> {
  const inner = buildWebhookOptions(options);
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Create', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    webhookId: parseXmlNumber(getTagContent(xml, 'webhookid')),
  };
}

/**
 * Edit a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-edit
 *
 * @example
 * ```typescript
 * await webhooksEdit(caller, 'bqtable123', 5, {
 *   name: 'Updated Name',
 *   url: 'https://example.com/new-webhook',
 * });
 * ```
 */
export async function webhooksEdit(
  caller: XmlCaller,
  tableId: string,
  webhookId: number,
  options: WebhookOptions
): Promise<void> {
  let inner = `<webhookid>${webhookId}</webhookid>`;
  inner += buildWebhookOptions(options);
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Edit', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Delete a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-delete
 *
 * @example
 * ```typescript
 * await webhooksDelete(caller, 'bqtable123', 5);
 * ```
 */
export async function webhooksDelete(
  caller: XmlCaller,
  tableId: string,
  webhookId: number
): Promise<void> {
  const inner = `<webhookid>${webhookId}</webhookid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Delete', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Activate a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-activate
 *
 * @example
 * ```typescript
 * await webhooksActivate(caller, 'bqtable123', 5);
 * ```
 */
export async function webhooksActivate(
  caller: XmlCaller,
  tableId: string,
  webhookId: number
): Promise<void> {
  const inner = `<webhookid>${webhookId}</webhookid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Activate', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Deactivate a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-deactivate
 *
 * @example
 * ```typescript
 * await webhooksDeactivate(caller, 'bqtable123', 5);
 * ```
 */
export async function webhooksDeactivate(
  caller: XmlCaller,
  tableId: string,
  webhookId: number
): Promise<void> {
  const inner = `<webhookid>${webhookId}</webhookid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Deactivate', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Copy a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-copy
 *
 * @example
 * ```typescript
 * const result = await webhooksCopy(caller, 'bqtable123', 5, 'Copied Webhook');
 * console.log(`Copied to: ${result.webhookId}`);
 * ```
 */
export async function webhooksCopy(
  caller: XmlCaller,
  tableId: string,
  webhookId: number,
  name?: string
): Promise<WebhookResult> {
  let inner = `<webhookid>${webhookId}</webhookid>`;
  if (name) {
    inner += `<name>${escapeXml(name)}</name>`;
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Copy', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    webhookId: parseXmlNumber(getTagContent(xml, 'webhookid')),
  };
}
