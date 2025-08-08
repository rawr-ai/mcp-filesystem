import fs from 'fs/promises';
import * as xpath from 'xpath';
import { DOMParser as XmldomDOMParser } from '@xmldom/xmldom';
import { validatePath } from '../utils/path-utils.js';
import { parseArgs } from '../utils/schema-utils.js';
import {
  XmlQueryArgsSchema,
  XmlStructureArgsSchema,
  type XmlQueryArgs,
  type XmlStructureArgs
} from '../schemas/utility-operations.js';

// Define interfaces for type safety
interface XmlNode {
  type: 'element' | 'text' | 'attribute' | 'unknown';
  name?: string;
  value?: string;
  attributes?: Array<{ name: string; value: string }>;
  children?: XmlNode[];
  nodeType?: number;
}

interface HierarchyNode {
  name: string;
  hasChildren?: boolean;
  children?: HierarchyNode[];
}

interface XmlStructureInfo {
  rootElement: string | undefined;
  elements: Record<string, number>;
  attributes?: Record<string, number>;
  namespaces: Record<string, string>;
  hierarchy?: HierarchyNode;
}

/**
 * Handler for executing XPath queries on XML files
 */
export async function handleXmlQuery(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const parsed = parseArgs(XmlQueryArgsSchema, args, 'xml_query');

  const validPath = await validatePath(
    parsed.path,
    allowedDirectories,
    symlinksMap,
    noFollowSymlinks
  );

  try {
    const xmlContent = await fs.readFile(validPath, 'utf8');

    try {
      const responseLimit =
        (parsed as any).maxResponseBytes ?? parsed.maxBytes ?? 200 * 1024; // 200KB default
      const result = processXmlContent(
        xmlContent,
        parsed.query,
        parsed.structureOnly,
        parsed.includeAttributes,
        responseLimit
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to process XML: ${errorMessage}`);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to query XML file: ${errorMessage}`);
  }
}

/**
 * Handler for extracting XML structure information
 */
export async function handleXmlStructure(
  args: unknown,
  allowedDirectories: string[],
  symlinksMap: Map<string, string>,
  noFollowSymlinks: boolean
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const parsed = parseArgs(XmlStructureArgsSchema, args, 'xml_structure');

  const validPath = await validatePath(
    parsed.path,
    allowedDirectories,
    symlinksMap,
    noFollowSymlinks
  );

  try {
    const xmlContent = await fs.readFile(validPath, 'utf8');

    try {
      const parser = new XmldomDOMParser();
      const doc: any = parser.parseFromString(xmlContent, 'text/xml');
      const structure = extractXmlStructure(
        doc,
        parsed.maxDepth,
        parsed.includeAttributes
      );

      const responseLimit = (parsed as any).maxResponseBytes ?? parsed.maxBytes ?? 200 * 1024; // 200KB default
      let json = JSON.stringify(structure, null, 2);

      if (typeof responseLimit === 'number' && responseLimit > 0) {
        const size = Buffer.byteLength(json, 'utf8');
        if (size > responseLimit) {
          // Fallback to a summarized structure to respect response limit
          const summary = {
            rootElement: structure.rootElement,
            namespaces: structure.namespaces,
            elementTypeCount: Object.keys(structure.elements).length,
            attributeKeyCount: structure.attributes ? Object.keys(structure.attributes).length : 0,
            hierarchy: structure.hierarchy ? { name: structure.hierarchy.name, hasChildren: structure.hierarchy.hasChildren, childrenCount: structure.hierarchy.children?.length ?? 0 } : undefined,
            _meta: {
              truncated: true,
              note: `Full structure omitted to fit response limit of ${responseLimit} bytes`
            }
          };
          json = JSON.stringify(summary, null, 2);
        }
      }

      return {
        content: [{
          type: 'text',
          text: json
        }]
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to extract XML structure: ${errorMessage}`);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to analyze XML structure: ${errorMessage}`);
  }
}

/**
 * Process XML content with XPath or structure analysis
 */
function processXmlContent(
  xmlContent: string,
  query?: string,
  structureOnly = false,
  includeAttributes = true,
  maxResponseBytes?: number
): { content: Array<{ type: string; text: string }> } {
  const parser = new XmldomDOMParser();
  const doc: any = parser.parseFromString(xmlContent, 'text/xml');

  if (structureOnly) {
    // Extract only structure information
    const tags = new Set<string>();
    const structureQuery = "//*";
    const nodes = xpath.select(structureQuery, doc as any);
    
    if (!Array.isArray(nodes)) {
      throw new Error('Unexpected XPath result type');
    }

    nodes.forEach((node: Node) => {
      if (node.nodeName) {
        tags.add(node.nodeName);
      }
    });

    const base = {
      tags: Array.from(tags),
      count: nodes.length,
      rootElement: doc.documentElement?.nodeName
    };

    let json = JSON.stringify(base, null, 2);
    if (typeof maxResponseBytes === 'number' && maxResponseBytes > 0) {
      if (Buffer.byteLength(json, 'utf8') > maxResponseBytes) {
        // Trim tags list progressively until it fits
        const all = base.tags;
        let lo = 0;
        let hi = all.length;
        let best = 0;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          const candidate = { ...base, tags: all.slice(0, mid) };
          const s = JSON.stringify(candidate, null, 2);
          if (Buffer.byteLength(s, 'utf8') <= maxResponseBytes) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        const truncated = {
          ...base,
          tags: all.slice(0, best),
          _meta: {
            truncated: true,
            omittedTagCount: all.length - best
          }
        } as const;
        json = JSON.stringify(truncated, null, 2);
      }
    }

    return {
      content: [{ type: 'text', text: json }]
    };
  } else if (query) {
    // Execute specific XPath query
    const nodes = xpath.select(query, doc as any);

    const asArray: any[] = Array.isArray(nodes) ? nodes as any[] : [nodes as any];
    const results: XmlNode[] = [];
    let omittedCount = 0;
    let currentJson = JSON.stringify(results, null, 2);
    const limit = typeof maxResponseBytes === 'number' && maxResponseBytes > 0 ? maxResponseBytes : undefined;

    for (let i = 0; i < asArray.length; i++) {
      const formatted = formatNode(asArray[i] as any, includeAttributes);
      const tentative = [...results, formatted];
      const serialized = JSON.stringify(tentative, null, 2);
      if (limit && Buffer.byteLength(serialized, 'utf8') > limit) {
        omittedCount = asArray.length - i;
        break;
      }
      results.push(formatted);
      currentJson = serialized;
    }

    if (omittedCount > 0) {
      const meta = { type: 'meta', value: `truncated: omitted ${omittedCount} result(s)` } as const;
      const tentative = [...results, meta as any];
      const serialized = JSON.stringify(tentative, null, 2);
      if (!limit || Buffer.byteLength(serialized, 'utf8') <= limit) {
        currentJson = serialized;
      }
    }

    return {
      content: [{ type: 'text', text: currentJson }]
    };
  } else {
    throw new Error('Either structureOnly or query must be specified');
  }
}

/**
 * Format a DOM node for output
 */
function formatNode(node: Node | string | number | boolean | null | undefined, includeAttributes = true): XmlNode {
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return { type: 'text', value: String(node) };
  }

  if (!node || typeof node !== 'object' || !('nodeType' in node)) {
    return { type: 'unknown', value: String(node) };
  }

  // Text node
  if (node.nodeType === 3) {
    return {
      type: 'text',
      value: node.nodeValue?.trim()
    };
  }

  // Element node
  if (node.nodeType === 1) {
    const element = node as Element;
    const result: XmlNode = {
      type: 'element',
      name: element.nodeName,
      value: element.textContent?.trim()
    };

    if (includeAttributes && element.attributes && element.attributes.length > 0) {
      result.attributes = Array.from(element.attributes).map((attr) => ({
        name: attr.nodeName,
        value: attr.nodeValue ?? ''
      }));
    }

    return result;
  }

  // Attribute node
  if (node.nodeType === 2) {
    return {
      type: 'attribute',
      name: (node as Attr).nodeName,
      value: (node as Attr).nodeValue ?? ''
    };
  }

  return {
    type: 'unknown',
    nodeType: node.nodeType,
    value: node.toString()
  };
}

/**
 * Extract structured information about XML document
 */
function extractXmlStructure(doc: any, maxDepth = 2, includeAttributes = true): XmlStructureInfo {
  const structure: XmlStructureInfo = {
    rootElement: doc.documentElement?.nodeName,
    elements: {},
    attributes: includeAttributes ? {} : undefined,
    namespaces: extractNamespaces(doc),
  };

  // Get all element names and counts
  const elementQuery = "//*";
  const elements = xpath.select(elementQuery, doc) as any[];

  elements.forEach((element) => {
    const el = element as any;
    const name = el.nodeName;
    structure.elements[name] = (structure.elements[name] || 0) + 1;

    if (includeAttributes && el.attributes && el.attributes.length > 0) {
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        const attrKey = `${name}@${attr.nodeName}`;
        if (structure.attributes) {
          structure.attributes[attrKey] = (structure.attributes[attrKey] || 0) + 1;
        }
      }
    }
  });

  // Get child relationship structure up to maxDepth
  if (maxDepth > 0 && doc.documentElement) {
    structure.hierarchy = buildHierarchy(doc.documentElement, maxDepth);
  }

  return structure;
}

/**
 * Extract namespaces used in the document
 */
function extractNamespaces(doc: any) {
  const namespaces: Record<string, string> = {};
  const nsQuery = "//*[namespace-uri()]";

  try {
    const nsNodes = xpath.select(nsQuery, doc) as any[];
    nsNodes.forEach((node) => {
      const el = node as any;
      if (el.namespaceURI) {
        const prefix = el.prefix || '';
        namespaces[prefix] = el.namespaceURI;
      }
    });
  } catch (err) {
    // Some documents might not support namespace queries
    console.error('Error extracting namespaces:', err instanceof Error ? err.message : String(err));
  }

  return namespaces;
}

/**
 * Build element hierarchy up to maxDepth
 */
function buildHierarchy(element: any, maxDepth: number, currentDepth = 0): HierarchyNode {
  if (currentDepth >= maxDepth) {
    return { name: element.nodeName, hasChildren: element.childNodes.length > 0 };
  }

  const result: HierarchyNode = {
    name: element.nodeName,
    children: []
  };

  // Only process element nodes (type 1)
  const childElements = Array.from(element.childNodes as any[])
    .filter((node: any) => node && node.nodeType === 1) as any[];

  if (childElements.length > 0) {
    const processedChildren = new Set<string>();

    childElements.forEach((child: any) => {
      // Only add unique child element types
      if (!processedChildren.has(child.nodeName)) {
        processedChildren.add(child.nodeName);
        result.children!.push(
          buildHierarchy(child, maxDepth, currentDepth + 1)
        );
      }
    });
  }

  return result;
}
