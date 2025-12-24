import { Tool, SchemaType } from "@google/generative-ai";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const PROJECT_ROOT = join(process.cwd(), "../../../..//"); 

async function toolReadFile(args: { relativePath: string }): Promise<string> {
    try {
        const fullPath = join(PROJECT_ROOT, args.relativePath);
        return await readFile(fullPath, 'utf-8');
    } catch (e: any) {
        return `Error reading file ${args.relativePath}: ${e.message}`;
    }
}

async function toolWriteFile(args: { relativePath: string, content: string }): Promise<string> {
    try {
        const fullPath = join(PROJECT_ROOT, args.relativePath);
        await mkdir(dirname(fullPath), { recursive: true });
        await writeFile(fullPath, args.content, 'utf-8');
        return `Successfully wrote to ${args.relativePath}`;
    } catch (e: any) {
        return `Error writing file ${args.relativePath}: ${e.message}`;
    }
}

async function toolListFiles(args: { dirPath: string }): Promise<string> {
    try {
        const fullPath = join(PROJECT_ROOT, args.dirPath);
        const files = await readdir(fullPath);
        return JSON.stringify(files);
    } catch (e: any) {
        return `Error listing files in ${args.dirPath}: ${e.message}`;
    }
}

async function toolSearchCodebase(args: { pattern: string, path?: string }): Promise<string> {
    try {
        const relativeSearchPath = args.path || ".";
        const safePattern = args.pattern.replace(/"/g, '\\"');
        const { stdout, stderr } = await execAsync(`mgrep "${safePattern}" "${relativeSearchPath}"`, { cwd: PROJECT_ROOT });
        if (stderr) return `mgrep warning: ${stderr}\nOutput: ${stdout}`;
        return stdout || "No matches found.";
    } catch (e: any) {
        return `Error searching codebase: ${e.message}`;
    }
}

export const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "read_file",
        description: "Reads a file from the project.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { relativePath: { type: SchemaType.STRING, description: "Path relative to project root" } },
          required: ["relativePath"]
        }
      },
      {
        name: "write_file",
        description: "Writes content to a file.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { 
              relativePath: { type: SchemaType.STRING, description: "Path relative to project root" },
              content: { type: SchemaType.STRING, description: "Full content" }
          },
          required: ["relativePath", "content"]
        }
      },
      {
        name: "list_files",
        description: "Lists files in a directory.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { dirPath: { type: SchemaType.STRING, description: "Directory path" } },
          required: ["dirPath"]
        }
      },
      {
        name: "search_codebase",
        description: "Searches text in codebase using mgrep.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: { 
              pattern: { type: SchemaType.STRING, description: "Regex pattern" },
              path: { type: SchemaType.STRING, description: "Search path (default: .)" }
          },
          required: ["pattern"]
        }
      }
    ]
  }
];

export const functions: Record<string, Function> = {
  "read_file": toolReadFile,
  "write_file": toolWriteFile,
  "list_files": toolListFiles,
  "search_codebase": toolSearchCodebase
};