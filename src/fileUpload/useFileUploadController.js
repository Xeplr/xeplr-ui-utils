import { useState, useRef } from 'react';
import { uploadFile } from './uploadFile.js';

/**
 * @param {object} options
 * @param {string[]} [options.allowedTypes] - MIME types: ['image/*', 'application/pdf']
 * @param {number} [options.maxSize] - Max file size in bytes
 * @param {number} [options.maxFiles=1] - Max number of files
 * @param {string} [options.url] - Upload URL override
 * @param {string} [options.fieldName='file'] - Form field name
 * @param {object} [options.extraData] - Additional form data
 * @param {function} [options.onSuccess] - Called with server response
 * @param {function} [options.onError] - Called with error
 */
export function useFileUploadController(options = {}) {
  var [files, setFiles] = useState([]);
  var [uploading, setUploading] = useState(false);
  var [progress, setProgress] = useState(0);
  var [error, setError] = useState('');
  var [result, setResult] = useState(null);
  var [dragOver, setDragOver] = useState(false);
  var inputRef = useRef(null);

  var allowedTypes = options.allowedTypes || ['*'];
  var maxSize = options.maxSize || 5 * 1024 * 1024;
  var maxFiles = options.maxFiles || 1;

  function isTypeAllowed(mimetype) {
    for (var i = 0; i < allowedTypes.length; i++) {
      var allowed = allowedTypes[i];
      if (allowed === '*') return true;
      if (allowed.endsWith('/*')) {
        var category = allowed.split('/')[0];
        if (mimetype.startsWith(category + '/')) return true;
      }
      if (allowed === mimetype) return true;
    }
    return false;
  }

  function validate(fileList) {
    var validated = [];
    for (var i = 0; i < fileList.length; i++) {
      var file = fileList[i];
      if (!isTypeAllowed(file.type)) {
        return { error: 'File type not allowed: ' + file.name };
      }
      if (file.size > maxSize) {
        return { error: 'File too large: ' + file.name };
      }
      validated.push(file);
    }
    if (validated.length > maxFiles) {
      return { error: 'Too many files. Maximum: ' + maxFiles };
    }
    return { files: validated };
  }

  function handleFiles(fileList) {
    setError('');
    setResult(null);
    var validation = validate(fileList);
    if (validation.error) {
      setError(validation.error);
      return;
    }
    setFiles(validation.files);
  }

  function handleChange(e) {
    handleFiles(Array.from(e.target.files));
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  function openFilePicker() {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }

  function removeFile(index) {
    setFiles(function(prev) {
      var next = prev.slice();
      next.splice(index, 1);
      return next;
    });
  }

  function clear() {
    setFiles([]);
    setError('');
    setResult(null);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      var response = await uploadFile(files, {
        url: options.url,
        fieldName: options.fieldName,
        extraData: options.extraData,
        onProgress: function(percent) {
          setProgress(percent);
        }
      });
      setResult(response);
      if (options.onSuccess) options.onSuccess(response);
    } catch (err) {
      setError(err.message);
      if (options.onError) options.onError(err);
    } finally {
      setUploading(false);
    }
  }

  return {
    // State
    files,
    uploading,
    progress,
    error,
    result,
    dragOver,
    inputRef,

    // Actions
    handleChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleUpload,
    openFilePicker,
    removeFile,
    clear,

    // Config (for view to read)
    allowedTypes,
    maxSize,
    maxFiles
  };
}
