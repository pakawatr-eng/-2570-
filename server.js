import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distPath = path.join(__dirname, 'dist');
const dataFilePath = path.join(__dirname, 'data', 'records.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function getStoredRecords() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading records file:', err);
  }
  return [];
}

function saveStoredRecords(records) {
  fs.writeFileSync(dataFilePath, JSON.stringify(records, null, 2), 'utf-8');
}

// Health check endpoints for Cloud Run deployment health checks
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/_health', (_req, res) => {
  res.status(200).send('OK');
});

// API: Get records from persistent storage
app.get('/api/records', (_req, res) => {
  try {
    const records = getStoredRecords();
    res.json({
      success: true,
      records,
      count: records.length,
      savedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save updated records to persistent storage
app.post('/api/records', (req, res) => {
  try {
    const records = req.body?.records;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'records array is required' });
    }
    saveStoredRecords(records);
    res.json({
      success: true,
      count: records.length,
      savedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Reset records to default
app.post('/api/records/reset', (_req, res) => {
  try {
    const seedPath = path.join(__dirname, 'data', 'records.json');
    let seedRecords = [];
    if (fs.existsSync(seedPath)) {
      seedRecords = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    }
    res.json({
      success: true,
      records: seedRecords,
      savedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static assets from Vite build output directory
app.use(express.static(distPath));

// Single Page Application (SPA) fallback: serve index.html for client-side routing
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application build not found. Please run npm run build.');
  }
});

// Determine port to listen on:
// Cloud Run injects process.env.PORT (typically 8080)
const targetPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = app.listen(targetPort, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${targetPort}`);
});

server.on('error', (err) => {
  console.error(`Server error on port ${targetPort}:`, err);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
