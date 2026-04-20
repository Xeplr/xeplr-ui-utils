import './fileUpload.css';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUploadSample({
  files, uploading, progress, error, result, dragOver, inputRef,
  handleChange, handleDragOver, handleDragLeave, handleDrop,
  handleUpload, openFilePicker, removeFile, clear,
  allowedTypes, maxSize, maxFiles
}) {
  return (
    <div className="xeplr-upload-container">
      <div
        className={'xeplr-upload-dropzone' + (dragOver ? ' xeplr-upload-dragover' : '')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          multiple={maxFiles > 1}
          accept={allowedTypes.join(',')}
          className="xeplr-upload-input"
        />
        <div className="xeplr-upload-dropzone-text">
          <p>Drag & drop files here or click to browse</p>
          <p className="xeplr-upload-hint">
            Max {formatSize(maxSize)} per file
            {maxFiles > 1 ? ' · Up to ' + maxFiles + ' files' : ''}
          </p>
        </div>
      </div>

      {error && <div className="xeplr-upload-alert xeplr-upload-alert-error">{error}</div>}
      {result && <div className="xeplr-upload-alert xeplr-upload-alert-success">Upload complete</div>}

      {files.length > 0 && (
        <div className="xeplr-upload-file-list">
          {files.map(function(file, i) {
            return (
              <div key={i} className="xeplr-upload-file-item">
                <span className="xeplr-upload-file-name">{file.name}</span>
                <span className="xeplr-upload-file-size">{formatSize(file.size)}</span>
                {!uploading && (
                  <button type="button" className="xeplr-upload-file-remove" onClick={function() { removeFile(i); }}>×</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {uploading && (
        <div className="xeplr-upload-progress">
          <div className="xeplr-upload-progress-bar" style={{ width: progress + '%' }}></div>
          <span className="xeplr-upload-progress-text">{progress}%</span>
        </div>
      )}

      <div className="xeplr-upload-actions">
        <button type="button" onClick={handleUpload} disabled={uploading || files.length === 0} className="xeplr-upload-btn xeplr-upload-btn-primary">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <button type="button" onClick={clear} disabled={uploading} className="xeplr-upload-btn xeplr-upload-btn-secondary">
          Clear
        </button>
      </div>
    </div>
  );
}
