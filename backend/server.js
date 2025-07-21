const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// ✅ Enable CORS
app.use(cors());

// Middleware to parse incoming files
const upload = multer({ dest: 'uploads/' });

// Route to handle file uploads
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = path.resolve(__dirname, '../output'); // Absolute path

    console.log(`Input Path: ${inputPath}`);
    console.log(`Output Path: ${outputPath}`);

    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Call the Python script
    await separateAudio(inputPath, outputPath);

    res.json({
      message: 'Audio separation completed successfully.',
      vocalUrl: `/output/vocals.mp3`,
      instrumentalUrl: `/output/instrumental.mp3`
    });
  } catch (error) {
    console.error('Error processing audio:', error.message);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

// Function to separate audio using Demucs
async function separateAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../demucs_separate.py'),
      inputPath,
      outputPath
    ]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Demucs process finished successfully.');
        resolve();
      } else {
        console.error(`Demucs process exited with code ${code}`);
        reject(new Error(`Demucs process failed with exit code ${code}`));
      }
    });
  });
}

// ✅ Secure download route (handles file existence and avoids header crash)
app.get('/output/:filename', (req, res) => {
  const filePath = path.resolve(__dirname, '../output', req.params.filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File not found:', filePath);
      return res.status(404).send('File not found');
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          return res.status(500).send('Failed to download file');
        }
      }
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});