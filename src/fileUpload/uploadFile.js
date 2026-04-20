var _config = {
  url: '/internal/upload',
  headers: {}
};

export function configureUpload(config = {}) {
  if (config.url) _config.url = config.url;
  if (config.headers) _config.headers = config.headers;
  if (config.getHeaders) _config.getHeaders = config.getHeaders;
}

/**
 * Upload files to the server.
 * @param {File[]} files - Files to upload
 * @param {object} [options]
 * @param {string} [options.url] - Override upload URL
 * @param {string} [options.fieldName='file'] - Form field name
 * @param {object} [options.extraData] - Additional form fields
 * @param {function} [options.onProgress] - Progress callback: (percent, loaded, total)
 * @returns {Promise<object>} Server response
 */
export function uploadFile(files, options = {}) {
  return new Promise(function(resolve, reject) {
    var url = options.url || _config.url;
    var fieldName = options.fieldName || 'file';
    var formData = new FormData();

    var fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(function(file) {
      formData.append(fieldName, file);
    });

    if (options.extraData) {
      Object.keys(options.extraData).forEach(function(key) {
        formData.append(key, options.extraData[key]);
      });
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    // Apply headers
    var headers = _config.getHeaders ? _config.getHeaders() : _config.headers;
    Object.keys(headers).forEach(function(key) {
      xhr.setRequestHeader(key, headers[key]);
    });

    if (options.onProgress) {
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          var percent = Math.round((e.loaded / e.total) * 100);
          options.onProgress(percent, e.loaded, e.total);
        }
      };
    }

    xhr.onload = function() {
      try {
        var response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Upload failed'));
        }
      } catch (e) {
        reject(new Error('Upload failed: ' + xhr.statusText));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Upload failed: network error'));
    };

    xhr.send(formData);
  });
}
