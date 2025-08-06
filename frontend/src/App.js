import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dbbpripma/auto/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

const getFunctionURL = () => {
  // In local dev: use relative path
  if (process.env.NODE_ENV === 'development') {
    return '/.netlify/functions/separate-audio';
  }

  // In production: absolute URL (replace with your Netlify site name)
  return 'https://audio-separator-app.netlify.app/.netlify/functions/separate-audio';
};

function App() {
  const [file, setFile] = useState(null);
  const [vocalUrl, setVocalUrl] = useState('');
  const [instrumentalUrl, setInstrumentalUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setVocalUrl('');
    setInstrumentalUrl('');

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryRes = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      const uploadedUrl = cloudinaryRes.data.secure_url;

      // 2. Call Netlify Function
      const functionResponse = await axios.post(getFunctionURL(), {
        fileUrl: uploadedUrl,
        model: '5a7041cc9b82e5a558fea6b3d7b12dea89625e89da33f0447bd727c2d0ab9e77'
      });

      const { vocal, instrumental } = functionResponse.data;
      setVocalUrl(vocal);
      setInstrumentalUrl(instrumental);
    } catch (error) {
      console.error('Separation error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
      setFile(null);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Audio Separator</h1>
      <p style={styles.subtitle}>Separate vocals and instrumentals from any song!</p>

      <input type="file" accept="audio/*" onChange={handleFileChange} style={styles.fileInput} />

      <button
        onClick={handleSubmit}
        disabled={!file || isProcessing}
        style={{ ...styles.button, ...(isProcessing ? styles.buttonDisabled : {}) }}
      >
        {isProcessing ? 'Processing...' : 'Separate Audio'}
      </button>

      {isProcessing && (
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBar}></div>
        </div>
      )}

      {vocalUrl && instrumentalUrl && !isProcessing && (
        <div style={styles.results}>
          <h2 style={styles.sectionTitle}>Separated Tracks</h2>

          <div style={styles.trackContainer}>
            <h3>Vocals</h3>
            <audio src={vocalUrl} controls style={styles.audio}></audio>
            <br />
            <a href={vocalUrl} download style={styles.downloadLink}>Download Vocals Track</a>
          </div>

          <div style={styles.trackContainer}>
            <h3>Instrumental</h3>
            <audio src={instrumentalUrl} controls style={styles.audio}></audio>
            <br />
            <a href={instrumentalUrl} download style={styles.downloadLink}>Download Instrumental Track</a>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#121212',
    color: 'white',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #764ba2, #667eea)',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#ccc',
    marginBottom: '20px',
  },
  fileInput: {
    padding: '10px',
    margin: '20px 0',
    fontSize: '1rem',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#1f1f1f',
    color: 'white',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  progressBarContainer: {
    marginTop: '20px',
    width: '100%',
    maxWidth: '400px',
    height: '10px',
    backgroundColor: '#333',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    animation: 'progress 1.5s linear infinite',
  },
  results: {
    marginTop: '40px',
    width: '100%',
    maxWidth: '600px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    marginBottom: '20px',
  },
  trackContainer: {
    marginBottom: '30px',
  },
  audio: {
    width: '100%',
    maxWidth: '100%',
  },
  downloadLink: {
    color: '#00ffff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

export default App;
