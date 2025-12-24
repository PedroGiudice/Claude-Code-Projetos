import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
  console.log("Testing MCP connection...");
  
  // Try default port 8080 (SSE)
  const transport = new SSEClientTransport(new URL("http://localhost:8080/sse"));
  const client = new Client({
    name: "test-client",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log("Connected to MCP server via SSE!");
    
    const tools = await client.listTools();
    console.log("Available Tools:", JSON.stringify(tools, null, 2));
    
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);
  }
}

main();
