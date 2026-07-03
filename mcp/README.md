# arabicfmt-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that exposes
[`arabicfmt`](https://github.com/cc1a2b/arabicfmt) — Arabic-first formatting for numbers,
currency, Hijri dates, bidirectional text, and validation — as callable tools for AI agents
such as **Claude Desktop**, **Claude Code**, and **Cursor**.

Once connected, an agent can format Saudi Riyal amounts, convert Gregorian dates to Hijri,
spell numbers in Arabic, isolate foreign text for correct RTL rendering, validate IBANs and
Saudi IDs, and more — by calling tools directly instead of guessing.

## Run

No install or build step required — it runs straight from npm over stdio:

```bash
npx arabicfmt-mcp
```

The server speaks MCP over **stdio**. It is meant to be launched by an MCP client (see below),
not run interactively.

Requires Node.js >= 18.

## Configure your client

Add the server to your client's `mcpServers` configuration.

### Claude Desktop

Edit your config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arabicfmt": {
      "command": "npx",
      "args": ["-y", "arabicfmt-mcp"]
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (per project):

```json
{
  "mcpServers": {
    "arabicfmt": {
      "command": "npx",
      "args": ["-y", "arabicfmt-mcp"]
    }
  }
}
```

Restart the client after editing, then ask the agent to use an arabicfmt tool.

## Tools

| Tool | Description |
| --- | --- |
| `format_currency` | Format a number as an Arabic currency amount with the correct symbol and precision (e.g. `1234.5 SAR` -> `١٬٢٣٤٫٥٠ ر.س`). |
| `spell_currency` | Spell a currency amount in full Arabic words with correct grammatical agreement. |
| `format_hijri` | Format a Gregorian date as a Hijri date string (e.g. `٢٣ رمضان ١٤٤٧ هـ`). |
| `to_hijri` | Convert a Gregorian date to Hijri components `{year, month, day}`. |
| `arabic_to_words` | Convert an integer to Arabic cardinal words. |
| `arabic_ordinal` | Convert an integer to Arabic ordinal words (e.g. `25` -> `الخامس والعشرون`). |
| `format_number` | Format a number with grouping and optional Eastern Arabic numerals. |
| `format_compact` | Compact notation with Arabic scale words (e.g. `1.2 مليون`). |
| `parse_number` | Parse a Latin/Eastern-Arabic numeric string into a number. |
| `format_duration` | Format milliseconds as natural Arabic words (e.g. `ساعتان وخمس دقائق`). |
| `format_relative_time` | Format a date relative to a base date (e.g. `منذ ٣ أيام`). |
| `arabic_plural` | Select the correct Arabic plural form for a count (CLDR categories). |
| `isolate_foreign` | Wrap foreign/LTR runs in bidi isolates for correct RTL rendering. |
| `transliterate` | Transliterate Arabic text to Latin script. |
| `slugify` | Convert Arabic/mixed text into a URL-safe slug. |
| `validate_iban` | Validate an IBAN via checksum and country length. |
| `validate_saudi_id` | Validate a Saudi national/iqama ID via its checksum. |

Each tool returns its result as MCP text content. Date inputs are ISO 8601 strings
(e.g. `"2025-09-23"`). The `numerals` option accepts `"latn"`, `"arab"`, or `"arabext"`.

## Development

```bash
cd mcp
npm install
```

Tool handlers are defined in [`tools.js`](./tools.js) and exported (`tools`, `toolNames`) so
they can be unit-tested directly without a running server. [`index.js`](./index.js) wires them
into an `McpServer` (`@modelcontextprotocol/sdk`) over `StdioServerTransport`.

## License

MIT (c) cc1a2b
