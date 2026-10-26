import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function recordsApiPlugin(): Plugin {
  const dataFilePath = path.resolve('data', 'records.json');
  return {
    name: 'records-api-plugin',
    configureServer(server) {
      // Ensure data directory exists
      const dataDir = path.resolve('data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Endpoint: Submit a single record (appends or updates into master records.json)
      server.middlewares.use('/api/records/submit', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const record = parsed.record;
              if (!record || !record.id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'valid record is required' }));
                return;
              }

              let currentRecords: any[] = [];
              if (fs.existsSync(dataFilePath)) {
                try {
                  const content = fs.readFileSync(dataFilePath, 'utf-8');
                  currentRecords = JSON.parse(content) || [];
                } catch {
                  currentRecords = [];
                }
              }

              const existsIndex = currentRecords.findIndex(
                (r: any) => r.id === record.id || (record.borrowDocNo && r.borrowDocNo === record.borrowDocNo)
              );

              if (existsIndex >= 0) {
                currentRecords[existsIndex] = record;
              } else {
                currentRecords.unshift(record);
              }

              fs.writeFileSync(dataFilePath, JSON.stringify(currentRecords, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                count: currentRecords.length,
                records: currentRecords,
                savedAt: new Date().toISOString() 
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });

      // Endpoint: Delete records by IDs
      server.middlewares.use('/api/records/delete', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { ids } = JSON.parse(body || '{}');
              if (Array.isArray(ids)) {
                let currentRecords: any[] = [];
                if (fs.existsSync(dataFilePath)) {
                  try {
                    currentRecords = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8')) || [];
                  } catch {
                    currentRecords = [];
                  }
                }
                const filtered = currentRecords.filter((r: any) => !ids.includes(r.id));
                fs.writeFileSync(dataFilePath, JSON.stringify(filtered, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  count: filtered.length, 
                  records: filtered, 
                  savedAt: new Date().toISOString() 
                }));
                return;
              }
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'ids array required' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });

      // Endpoint: Full /api/records GET and POST
      server.middlewares.use('/api/records', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            let records: any[] = [];
            if (fs.existsSync(dataFilePath)) {
              const content = fs.readFileSync(dataFilePath, 'utf-8');
              records = JSON.parse(content) || [];
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              records, 
              count: records.length,
              savedAt: new Date().toISOString() 
            }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
            return;
          }
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              if (Array.isArray(parsed.records)) {
                let currentRecords: any[] = [];
                if (fs.existsSync(dataFilePath)) {
                  try {
                    const content = fs.readFileSync(dataFilePath, 'utf-8');
                    currentRecords = JSON.parse(content) || [];
                  } catch {
                    currentRecords = [];
                  }
                }

                // Smart merge incoming with existing records
                const mergedMap = new Map<string, any>();
                for (const r of currentRecords) {
                  const key = r.id || r.borrowDocNo;
                  if (key) mergedMap.set(key, r);
                }
                for (const r of parsed.records) {
                  const key = r.id || r.borrowDocNo;
                  if (key) {
                    const existing = mergedMap.get(key);
                    if (!existing) {
                      mergedMap.set(key, r);
                    } else {
                      const existingTime = new Date(existing.updatedAt || 0).getTime();
                      const incomingTime = new Date(r.updatedAt || 0).getTime();
                      if (incomingTime >= existingTime) {
                        mergedMap.set(key, r);
                      }
                    }
                  }
                }

                const finalRecords = Array.from(mergedMap.values());
                fs.writeFileSync(dataFilePath, JSON.stringify(finalRecords, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  count: finalRecords.length, 
                  records: finalRecords,
                  savedAt: new Date().toISOString() 
                }));
                return;
              }
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'records array is required' }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), recordsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
