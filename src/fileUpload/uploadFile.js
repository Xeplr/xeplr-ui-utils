var _config = {
  url: '/internal/upload',
  headers: {}
};

export function configureUpload(config = {}) {
  if (config.url) _config.url = config.url;
  if (config.headers) _config.headers = config.headers;
  if (config.getHeaders) _config.getHeaders = config.getHeaders;
  // renew: async () => boolean — get a fresh sign-in token (the app's own
  // refresh, e.g. @xeplr/ui-account's renewSession). Without it an upload sent
  // with an expired token just failed with "token expired", while every other
  // request in the app renewed and carried on.
  if (config.renew) _config.renew = config.renew;
}

/** Ask the app for a fresh token, once. true when it got one. */
export async function renewSignIn() {
  if (typeof _config.renew !== 'function') return false;
  try { return Boolean(await _config.renew()); } catch (e) { return false; }
}

/**
 * fetch with the upload headers, renewing the sign-in once on a 401 and
 * asking again — the same rule the app's own authFetch follows. `init.headers`
 * are added on top of the upload headers.
 */
export async function signedFetch(url, init) {
  var opts = init || {};
  var send = function() {
    return fetch(url, Object.assign({}, opts, { headers: Object.assign(uploadHeaders(), opts.headers || {}) }));
  };
  var res = await send();
  return (await renewAndRetry(res.status, false, send)) || res;
}

/**
 * The headers every request to the app's API carries — what configureUpload
 * was given (getHeaders, called each time so a token is current, or static
 * headers). Exported so a page calling the app's JSON routes signs them the
 * same way as its uploads, without a second configuration.
 */
export function uploadHeaders() {
  return Object.assign({}, _config.getHeaders ? _config.getHeaders() : _config.headers);
}

/**
 * After a request answered `status`: when it was a 401 not yet retried, renew
 * the sign-in once and `retry()` — its promise; otherwise null (keep the
 * answer). Shared by signedFetch and uploadFile, so both follow one rule.
 */
export function renewAndRetry(status, retried, retry) {
  if (status !== 401 || retried) return null;
  return renewSignIn().then(function(ok) { return ok ? retry() : null; });
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
      // A token that ran out while the page sat open: renew once, send again.
      var again = renewAndRetry(xhr.status, options.renewed, function() { return uploadFile(files, Object.assign({}, options, { renewed: true })); });
      if (again) return again.then(function(r) { return r === null ? reject(new Error('Upload failed: sign-in expired')) : resolve(r); }, reject);
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
