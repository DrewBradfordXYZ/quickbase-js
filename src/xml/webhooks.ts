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
  WebhooksCreateOptions,
  WebhooksEditOptions,
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
 * Build webhook XML from create options
 */
function buildWebhookCreateXml(options: WebhooksCreateOptions): string {
  let inner = `<label>${escapeXml(options.label)}</label>`;
  inner += `<WebhookURL>${escapeXml(options.webhookUrl)}</WebhookURL>`;

  if (options.description) {
    inner += `<Description>${escapeXml(options.description)}</Description>`;
  }
  if (options.query) {
    inner += `<Query>${escapeXml(options.query)}</Query>`;
  }
  if (options.workflowWhen) {
    inner += `<WorkflowWhen>${escapeXml(options.workflowWhen)}</WorkflowWhen>`;
  }
  if (options.headers && options.headers.length > 0) {
    inner += `<WebhookHeaderCount>${options.headers.length}</WebhookHeaderCount>`;
    options.headers.forEach((h, i) => {
      inner += `<WebhookHeaderKey${i + 1}>${escapeXml(h.key)}</WebhookHeaderKey${i + 1}>`;
      inner += `<WebhookHeaderValue${i + 1}>${escapeXml(h.value)}</WebhookHeaderValue${i + 1}>`;
    });
  }
  if (options.message) {
    inner += `<WebhookMessage>${escapeXml(options.message)}</WebhookMessage>`;
  }
  if (options.messageFormat) {
    inner += `<WebhookMessageFormat>${options.messageFormat}</WebhookMessageFormat>`;
  }
  if (options.httpVerb) {
    inner += `<WebhookHTTPVerb>${options.httpVerb}</WebhookHTTPVerb>`;
  }
  if (options.triggerFields && options.triggerFields.length > 0) {
    inner += '<tfidsWhich>TRUE</tfidsWhich>';
    for (const fid of options.triggerFields) {
      inner += `<tfids>${fid}</tfids>`;
    }
  }

  return inner;
}

/**
 * Build webhook XML from edit options
 */
function buildWebhookEditXml(actionId: string, options: WebhooksEditOptions): string {
  let inner = `<actionId>${escapeXml(actionId)}</actionId>`;
  inner += buildWebhookCreateXml(options);

  // Handle clearing trigger fields
  if (options.clearTriggerFields) {
    // Remove any tfidsWhich/tfids we just added and replace with clear
    inner = inner.replace(/<tfidsWhich>TRUE<\/tfidsWhich>/, '');
    inner = inner.replace(/<tfids>\d+<\/tfids>/g, '');
    inner += '<tfidsWhich>tfidsAny</tfidsWhich>';
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
 * await webhooksCreate(caller, 'bqtable123', {
 *   label: 'Notify on new records',
 *   webhookUrl: 'https://example.com/webhook',
 *   workflowWhen: 'a',
 *   messageFormat: 'JSON',
 *   headers: [{ key: 'Content-Type', value: 'application/json' }],
 * });
 * ```
 */
export async function webhooksCreate(
  caller: XmlCaller,
  tableId: string,
  options: WebhooksCreateOptions
): Promise<void> {
  const inner = buildWebhookCreateXml(options);
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Create', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Edit a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-edit
 *
 * @example
 * ```typescript
 * await webhooksEdit(caller, 'bqtable123', '15', {
 *   label: 'Updated webhook name',
 *   webhookUrl: 'https://example.com/new-endpoint',
 *   messageFormat: 'JSON',
 * });
 * ```
 */
export async function webhooksEdit(
  caller: XmlCaller,
  tableId: string,
  actionId: string,
  options: WebhooksEditOptions
): Promise<void> {
  const inner = buildWebhookEditXml(actionId, options);
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Edit', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Delete webhooks.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-delete
 *
 * @example
 * ```typescript
 * const result = await webhooksDelete(caller, 'bqtable123', ['15', '16']);
 * console.log(`Deleted ${result.numChanged} webhooks`);
 * ```
 */
export async function webhooksDelete(
  caller: XmlCaller,
  tableId: string,
  actionIds: string[]
): Promise<{ numChanged: number }> {
  if (actionIds.length === 0) {
    throw new Error('actionIds array cannot be empty');
  }
  const inner = `<actionIDList>${actionIds.join(',')}</actionIDList>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Delete', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    numChanged: parseXmlNumber(getTagContent(xml, 'numChanged')),
  };
}

/**
 * Activate webhooks.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-activate
 *
 * @example
 * ```typescript
 * const result = await webhooksActivate(caller, 'bqtable123', ['15']);
 * console.log(`Activated ${result.numChanged} webhooks`);
 * ```
 */
export async function webhooksActivate(
  caller: XmlCaller,
  tableId: string,
  actionIds: string[]
): Promise<{ numChanged: number }> {
  if (actionIds.length === 0) {
    throw new Error('actionIds array cannot be empty');
  }
  const inner = `<actionIDList>${actionIds.join(',')}</actionIDList>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Activate', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    numChanged: parseXmlNumber(getTagContent(xml, 'numChanged')),
  };
}

/**
 * Deactivate webhooks.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-deactivate
 *
 * @example
 * ```typescript
 * const result = await webhooksDeactivate(caller, 'bqtable123', ['15']);
 * console.log(`Deactivated ${result.numChanged} webhooks`);
 * ```
 */
export async function webhooksDeactivate(
  caller: XmlCaller,
  tableId: string,
  actionIds: string[]
): Promise<{ numChanged: number }> {
  if (actionIds.length === 0) {
    throw new Error('actionIds array cannot be empty');
  }
  const inner = `<actionIDList>${actionIds.join(',')}</actionIDList>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Deactivate', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    numChanged: parseXmlNumber(getTagContent(xml, 'numChanged')),
  };
}

/**
 * Copy a webhook.
 *
 * @see https://help.quickbase.com/docs/api-webhooks-copy
 *
 * @example
 * ```typescript
 * const result = await webhooksCopy(caller, 'bqtable123', '15');
 * console.log(`Created webhook copy with ID: ${result.actionId}`);
 * ```
 */
export async function webhooksCopy(
  caller: XmlCaller,
  tableId: string,
  actionId: string
): Promise<{ actionId: string }> {
  const inner = `<actionId>${escapeXml(actionId)}</actionId>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_Webhooks_Copy', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    actionId: getTagContent(xml, 'actionId'),
  };
}
