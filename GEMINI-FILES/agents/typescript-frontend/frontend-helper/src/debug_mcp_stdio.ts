import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("🛠️ Starting MCP Stdio Debugger...");

  // Path to the executable we found
  const command = "./node_modules/.bin/chrome-devtools-mcp";

  console.log(`Spawn command: ${command}`);

  const transport = new StdioClientTransport({
    command: command,
    args: [] // Add args if the server needs them (usually default works)
  });

  const client = new Client({
    name: "debug-client",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  try {
    console.log("Connecting...");
    await client.connect(transport);
    console.log("✅ Connected via Stdio!");

    console.log("Fetching tools...");
    const tools = await client.listTools();
    
    console.log("\n--- MCP SCHEMA (TOOLS) ---\n");
    console.log(JSON.stringify(tools, null, 2));
    console.log("\n--------------------------\n");
    
    // Close cleanly
    await client.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  }
}

main();
