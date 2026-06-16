#!/usr/bin/env node
// arabicfmt MCP server (stdio transport).
//
// Exposes arabicfmt's Arabic-first formatting functions as MCP tools so AI
// agents (Claude Desktop, Cursor, etc.) can call them directly. Tool logic
// lives in ./tools.js; this file only wires those handlers into an McpServer
// and connects it over stdio.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { tools } from './tools.js';

export function createServer() {
  const server = new McpServer({
    name: 'arabicfmt-mcp',
    version: '0.1.0',
  });

  for (const [name, def] of Object.entries(tools)) {
    server.registerTool(
      name,
      {
        description: def.description,
        inputSchema: def.inputSchema,
      },
      async (args) => {
        try {
          const result = await def.handler(args ?? {});
          return { content: [{ type: 'text', text: String(result) }] };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            isError: true,
            content: [{ type: 'text', text: `Error in ${name}: ${message}` }],
          };
        }
      }
    );
  }

  return server;
}

export async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep the process attached to stdio; the SDK handles the read loop.
  process.stderr.write('arabicfmt-mcp server running on stdio\n');
}

// Run only when invoked directly (not when imported by tests).
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

const isMain = (() => {
  try {
    const entry = process.argv[1] ? realpathSync(process.argv[1]) : '';
    return entry && fileURLToPath(import.meta.url) === entry;
  } catch {
    return false;
  }
})();

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`arabicfmt-mcp fatal: ${err?.stack || err}\n`);
    process.exit(1);
  });
}
