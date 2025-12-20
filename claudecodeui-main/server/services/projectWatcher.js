/**
 * Project Watcher Service
 * Monitors the Claude projects folder for changes and notifies connected clients
 */
import path from 'path';
import { WebSocket } from 'ws';
import { getProjects, clearProjectDirectoryCache } from '../projects.js';

// File system watcher for projects folder
let projectsWatcher = null;
const connectedClients = new Set();

/**
 * Get the set of connected WebSocket clients
 * @returns {Set} Set of connected WebSocket clients
 */
export function getConnectedClients() {
    return connectedClients;
}

/**
 * Add a client to the connected clients set
 * @param {WebSocket} client - WebSocket client to add
 */
export function addConnectedClient(client) {
    connectedClients.add(client);
}

/**
 * Remove a client from the connected clients set
 * @param {WebSocket} client - WebSocket client to remove
 */
export function removeConnectedClient(client) {
    connectedClients.delete(client);
}

/**
 * Setup file system watcher for Claude projects folder using chokidar
 */
export async function setupProjectsWatcher() {
    const chokidar = (await import('chokidar')).default;
    const claudeProjectsPath = path.join(process.env.HOME, '.claude', 'projects');

    if (projectsWatcher) {
        projectsWatcher.close();
    }

    try {
        // Initialize chokidar watcher with optimized settings
        projectsWatcher = chokidar.watch(claudeProjectsPath, {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/*.tmp',
                '**/*.swp',
                '**/.DS_Store'
            ],
            persistent: true,
            ignoreInitial: true,
            followSymlinks: false,
            depth: 10,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 50
            }
        });

        // Debounce function to prevent excessive notifications
        let debounceTimer;
        const debouncedUpdate = async (eventType, filePath) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    // Clear project directory cache when files change
                    clearProjectDirectoryCache();

                    // Get updated projects list
                    const updatedProjects = await getProjects();

                    // Notify all connected clients about the project changes
                    const updateMessage = JSON.stringify({
                        type: 'projects_updated',
                        projects: updatedProjects,
                        timestamp: new Date().toISOString(),
                        changeType: eventType,
                        changedFile: path.relative(claudeProjectsPath, filePath)
                    });

                    connectedClients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(updateMessage);
                        }
                    });

                } catch (error) {
                    console.error('[ERROR] Error handling project changes:', error);
                }
            }, 300);
        };

        // Set up event listeners
        projectsWatcher
            .on('add', (filePath) => debouncedUpdate('add', filePath))
            .on('change', (filePath) => debouncedUpdate('change', filePath))
            .on('unlink', (filePath) => debouncedUpdate('unlink', filePath))
            .on('addDir', (dirPath) => debouncedUpdate('addDir', dirPath))
            .on('unlinkDir', (dirPath) => debouncedUpdate('unlinkDir', dirPath))
            .on('error', (error) => {
                console.error('[ERROR] Chokidar watcher error:', error);
            })
            .on('ready', () => {
                // Watcher ready
            });

    } catch (error) {
        console.error('[ERROR] Failed to setup projects watcher:', error);
    }
}

/**
 * Close the projects watcher
 */
export function closeProjectsWatcher() {
    if (projectsWatcher) {
        projectsWatcher.close();
        projectsWatcher = null;
    }
}
