const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function uploadFileToSharePoint(file) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Files must be 25 MB or smaller.');
  }

  let response;
  try {
    response = await fetch('/api/sharepoint/upload', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name)
      },
      body: file
    });
  } catch {
    throw new Error('Could not reach the upload server. Check that the app server is running.');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Upload server returned HTTP ${response.status}.`);
  }

  if (!response.ok) {
    throw new Error(result.error || `Upload server returned HTTP ${response.status}.`);
  }

  return {
    id: result.id,
    webUrl: result.webUrl,
    fileName: result.name
  };
}