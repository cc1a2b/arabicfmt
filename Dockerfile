# Runs the arabicfmt MCP server (stdio). Used by MCP hosts and by
# registry inspectors (e.g. Glama) to start the server for introspection.
FROM node:22-alpine

RUN npm install -g arabicfmt-mcp

ENTRYPOINT ["arabicfmt-mcp"]
