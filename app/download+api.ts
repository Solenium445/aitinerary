import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'source';
    
    const projectRoot = process.cwd();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (type === 'source') {
      // Create source code archive
      const archiveName = `travel-app-source-${timestamp}.tar.gz`;
      const archivePath = path.join('/tmp', archiveName);
      
      // Create tar archive excluding unnecessary files
      const excludePatterns = [
        '--exclude=node_modules',
        '--exclude=.expo',
        '--exclude=dist',
        '--exclude=.git',
        '--exclude=*.log',
        '--exclude=.DS_Store',
        '--exclude=ollama.log'
      ].join(' ');
      
      await execAsync(`tar -czf ${archivePath} ${excludePatterns} -C ${projectRoot} .`);
      
      // Read the file and return as response
      const fileBuffer = fs.readFileSync(archivePath);
      
      // Clean up
      fs.unlinkSync(archivePath);
      
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': `attachment; filename="${archiveName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
    } else if (type === 'build') {
      // Export web build first
      await execAsync('npm run export:web', { cwd: projectRoot });
      
      const buildArchiveName = `travel-app-build-${timestamp}.tar.gz`;
      const buildArchivePath = path.join('/tmp', buildArchiveName);
      
      // Archive the dist folder
      await execAsync(`tar -czf ${buildArchivePath} -C ${projectRoot} dist`);
      
      const fileBuffer = fs.readFileSync(buildArchivePath);
      fs.unlinkSync(buildArchivePath);
      
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': `attachment; filename="${buildArchiveName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    }
    
    return Response.json({ error: 'Invalid type parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Download error:', error);
    return Response.json({ 
      error: 'Failed to create download',
      details: error.message 
    }, { status: 500 });
  }
}