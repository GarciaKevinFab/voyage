import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

export default function PhotoUploader({ bookId, onCreatePage }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await onCreatePage(file);
        }
      } catch {
        // Error handling done inside onCreatePage (usePages hook)
      } finally {
        setUploading(false);
      }
    },
    [onCreatePage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    disabled: uploading,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `1px dashed ${isDragActive ? '#C9A96E' : '#E8D5A3'}`,
        backgroundColor: isDragActive ? 'rgba(201, 169, 110, 0.06)' : 'transparent',
        padding: '20px 12px',
        cursor: uploading ? 'wait' : 'pointer',
        transition: 'all 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        textAlign: 'center',
      }}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '20px',
              height: '20px',
              border: '1.5px solid #E8D5A3',
              borderTop: '1.5px solid #C9A96E',
              borderRadius: '50%',
            }}
          />
          <span
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '0.6rem',
              color: '#8A8478',
              letterSpacing: '0.15em',
            }}
          >
            UPLOADING...
          </span>
        </div>
      ) : (
        <div>
          <p
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 300,
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              color: isDragActive ? '#C9A96E' : '#8A8478',
              textTransform: 'uppercase',
              transition: 'color 300ms',
              marginBottom: '4px',
            }}
          >
            {isDragActive ? 'Soltar aqui' : 'Anadir Foto'}
          </p>
          <p
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '0.5rem',
              color: '#8A8478',
              letterSpacing: '0.1em',
              opacity: 0.7,
            }}
          >
            {isDragActive ? '' : 'Arrastra tus fotos aqui'}
          </p>
        </div>
      )}
    </div>
  );
}
