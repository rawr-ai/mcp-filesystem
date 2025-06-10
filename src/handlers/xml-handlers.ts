import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { Transform } from 'stream';
import * as xpath from 'xpath';
// DOMParser is available globally in Bun
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
    // Check file size before creating stream
    const stats = await fs.stat(validPath);
    const effectiveMaxBytes = parsed.maxBytes ?? (10 * 1024); // Default 10KB (though schema makes it mandatory)
    if (stats.size > effectiveMaxBytes) {
      throw new Error(`File size (${stats.size} bytes) exceeds the maximum allowed size (${effectiveMaxBytes} bytes).`);
    }

    // Create a streaming parser to handle large files up to maxBytes
    const stream = createReadStream(validPath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024, // 64KB chunks
      end: effectiveMaxBytes // Read up to the limit
    });

    return new Promise((resolve, reject) => {
      let xmlContent = '';
      
      const transform = new Transform({
        transform(chunk, encoding, callback) {
          xmlContent += chunk;
          callback();
        }
      });

      stream.pipe(transform)
        .on('finish', () => {
          try {
            const result = processXmlContent(
              xmlContent,
              parsed.query,
              parsed.structureOnly,
              parsed.includeAttributes
            );
            resolve(result);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            reject(new Error(`Failed to process XML: ${errorMessage}`));
          }
        })
        .on('error', reject);
    });
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
    // Check file size before creating stream
    const stats = await fs.stat(validPath);
    const effectiveMaxBytes = parsed.maxBytes ?? (10 * 1024); // Default 10KB (though schema makes it mandatory)
    if (stats.size > effectiveMaxBytes) {
      throw new Error(`File size (${stats.size} bytes) exceeds the maximum allowed size (${effectiveMaxBytes} bytes).`);
    }
    
    let xmlContent = '';
    const stream = createReadStream(validPath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024,
      end: effectiveMaxBytes // Read up to the limit
    });

    return new Promise((resolve, reject) => {
      const transform = new Transform({
        transform(chunk, encoding, callback) {
          xmlContent += chunk;
          callback();
        }
      });

      stream.pipe(transform)
        .on('finish', () => {
          try {
            const parser = new DOMParser();
            
            const doc = parser.parseFromString(xmlContent, 'text/xml');
            const structure = extractXmlStructure(
              doc,
              parsed.maxDepth,
              parsed.includeAttributes
            );

            resolve({
              content: [{
                type: "text",
                text: JSON.stringify(structure, null, 2)
              }]
            });
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            reject(new Error(`Failed to extract XML structure: ${errorMessage}`));
          }
        })
        .on('error', reject);
    });
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
  includeAttributes = true
): { content: Array<{ type: string; text: string }> } {
  const parser = new DOMParser();

  const doc = parser.parseFromString(xmlContent, 'text/xml');

  if (structureOnly) {
    // Extract only structure information
    const tags = new Set<string>();
    const structureQuery = "//*";
    const nodes = xpath.select(structureQuery, doc);
    
    if (!Array.isArray(nodes)) {
      throw new Error('Unexpected XPath result type');
    }

    nodes.forEach((node: Node) => {
      if (node.nodeName) {
        tags.add(node.nodeName);
      }
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          tags: Array.from(tags),
          count: nodes.length,
          rootElement: doc.documentElement?.nodeName
        }, null, 2)
      }]
    };
  } else if (query) {
    // Execute specific XPath query
    const nodes = xpath.select(query, doc);
    const results = Array.isArray(nodes)
      ? nodes.map(node => formatNode(node, includeAttributes))
      : [formatNode(nodes, includeAttributes)];

    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2)
      }]
    };
  } else {
    throw new Error('Either structureOnly or query must be specified');
  }
}

/**
 * Format a DOM node for output
 */
function formatNode(node: any, includeAttributes = true): XmlNode {
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return { type: 'text', value: String(node) };
  }

  if (!node || !node.nodeType) {
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
    const result: XmlNode = {
      type: 'element',
      name: node.nodeName,
      value: node.textContent?.trim()
    };

    if (includeAttributes && node.attributes && node.attributes.length > 0) {
      result.attributes = Array.from(node.attributes).map((attr: any) => ({
        name: attr.nodeName,
        value: attr.nodeValue
      }));
    }

    return result;
  }

  // Attribute node
  if (node.nodeType === 2) {
    return {
      type: 'attribute',
      name: node.nodeName,
      value: node.nodeValue
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
function extractXmlStructure(doc: Document, maxDepth = 2, includeAttributes = true) {
  const structure: any = {
    rootElement: doc.documentElement?.nodeName,
    elements: {},
    attributes: includeAttributes ? {} : undefined,
    namespaces: extractNamespaces(doc),
  };

  // Get all element names and counts
  const elementQuery = "//*";
  const elements = xpath.select(elementQuery, doc) as Node[];

  elements.forEach((element: any) => {
    const name = element.nodeName;
    structure.elements[name] = (structure.elements[name] || 0) + 1;

    if (includeAttributes && element.attributes && element.attributes.length > 0) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
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
function extractNamespaces(doc: Document) {
  const namespaces: Record<string, string> = {};
  const nsQuery = "//*[namespace-uri()]";

  try {
    const nsNodes = xpath.select(nsQuery, doc) as Node[];
    nsNodes.forEach((node: any) => {
      if (node.namespaceURI) {
        const prefix = node.prefix || '';
        namespaces[prefix] = node.namespaceURI;
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
function buildHierarchy(element: Node, maxDepth: number, currentDepth = 0): any {
  if (currentDepth >= maxDepth) {
    return { name: element.nodeName, hasChildren: element.childNodes.length > 0 };
  }

  const result: any = {
    name: element.nodeName,
    children: []
  };

  // Only process element nodes (type 1)
  const childElements = Array.from(element.childNodes)
    .filter(node => node.nodeType === 1);

  if (childElements.length > 0) {
    const processedChildren = new Set<string>();

    childElements.forEach(child => {
      // Only add unique child element types
      if (!processedChildren.has(child.nodeName)) {
        processedChildren.add(child.nodeName);
        result.children.push(
          buildHierarchy(child, maxDepth, currentDepth + 1)
        );
      }
    });
  }

  return result;
} 