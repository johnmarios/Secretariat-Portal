import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_FILES_DIR = path.join(process.cwd(), 'public', 'files');

export async function clearDuplicateFilesInDirectory(directoryPath = DEFAULT_FILES_DIR) {
    const deletedFiles = [];
    const seen = new Map();

    let entries = [];
    try {
        entries = await fs.readdir(directoryPath, { withFileTypes: true });
    } catch (error) {
        if (error?.code === 'ENOENT') {
            return { ok: true, scanned: 0, deleted: 0, deletedFiles };
        }
        throw error;
    }

    const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

    for (const fileName of files) {
        const filePath = path.join(directoryPath, fileName);
        const stats = await fs.stat(filePath);
        const canonicalName = fileName.replace(/-\d+-\d+(\.[^.]+)$/, '$1');
        const duplicateKey = `${canonicalName}-${stats.size}`;

        if (seen.has(duplicateKey)) {
            await fs.unlink(filePath);
            deletedFiles.push(fileName);
        } else {
            seen.set(duplicateKey, true);
        }
    }

    return {
        ok: true,
        scanned: files.length,
        deleted: deletedFiles.length,
        deletedFiles,
    };
}
