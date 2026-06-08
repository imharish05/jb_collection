import React, { useRef, useState } from 'react';

/**
 * Reusable Image Upload Field with Drag & Drop Support
 * Used across all admin image input fields
 */
function ImageUploadField({
  label = "Image",
  imageFile,
  preview,
  fileInputRef,
  onFileChange,
  onClear,
  validation,
  accept = "image/jpeg,image/webp,image/png",
  requirements = "Recommended: 400×400px • Min: 200×200px • Max: 3MB (JPG/WebP)"
}) {
  const [dragActive, setDragActive] = useState(false);
  const dropZoneRef = useRef();

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file is an image
      if (file.type.startsWith('image/')) {
        // Create a synthetic event to match the input onChange handler
        const event = {
          target: { files: [file] }
        };
        onFileChange(event);
      }
    }
  };

  return (
    <div className="km-field km-field-full">
      <label className="km-label">
        {label} • {requirements}
      </label>
      <div className="upload-grid-wrapper">
        <div
          ref={dropZoneRef}
          className={`drop-zone-area ${imageFile ? "active-file" : ""} ${dragActive ? "drag-active" : ""}`}
          onClick={() => fileInputRef.current.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            transition: 'all 0.2s ease',
            backgroundColor: dragActive ? 'rgba(24, 26, 46, 0.08)' : 'transparent',
            borderColor: dragActive ? '#1A3A6B' : undefined,
            borderWidth: dragActive ? '2px' : undefined,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <div className="drop-zone-info">
            <div className="upload-icon text-center">
              {dragActive ? "📥" : imageFile ? "✅" : "📸"}
            </div>
            <p className="upload-text">
              {dragActive ? (
                <>Drop image here</>
              ) : imageFile ? (
                <b>{imageFile.name}</b>
              ) : (
                <>
                  Click to <b>browse</b> or <b>drag & drop</b>
                </>
              )}
            </p>
          </div>
        </div>

        {preview && (
          <div className="preview-tile fade-in">
            <img src={preview} alt="Preview" />
            <button
              type="button"
              className="preview-remove"
              onClick={onClear}
              title="Remove image"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {validation && !validation.valid && (
        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8, fontWeight: 500 }}>
          ⚠ {validation.error}
        </div>
      )}
    </div>
  );
}

export default ImageUploadField;
