"""Server-side Microsoft Graph access for SharePoint document uploads."""

import json
import os
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


GRAPH_ROOT = "https://graph.microsoft.com/v1.0"
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
ALLOWED_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".txt": "text/plain",
}

_token_lock = threading.Lock()
_cached_token = None
_token_expires_at = 0


class SharePointError(Exception):
    """A configuration, authentication, or SharePoint API error."""


class UploadValidationError(SharePointError):
    """An invalid file upload request."""


def _configuration():
    tenant_id = os.environ.get("SHAREPOINT_TENANT_ID", "").strip()
    client_id = os.environ.get("SHAREPOINT_CLIENT_ID", "").strip()
    client_secret = os.environ.get("SHAREPOINT_CLIENT_SECRET", "")
    site_url = os.environ.get("SHAREPOINT_SITE_URL", "").strip()

    if not all((tenant_id, client_id, client_secret, site_url)):
        raise SharePointError(
            "SharePoint server settings are missing. Configure the SHAREPOINT_* environment variables."
        )

    parsed_url = urllib.parse.urlparse(site_url)
    if (
        parsed_url.scheme != "https"
        or not parsed_url.hostname
        or not parsed_url.hostname.endswith(".sharepoint.com")
        or not parsed_url.path.strip("/")
    ):
        raise SharePointError(
            "SHAREPOINT_SITE_URL must be an HTTPS URL for a specific SharePoint site."
        )

    return tenant_id, client_id, client_secret, parsed_url


def is_configured():
    try:
        _configuration()
        return True
    except SharePointError:
        return False


def _json_request(url, method="GET", headers=None, body=None):
    request = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = response.read()
    except urllib.error.HTTPError as error:
        try:
            details = json.loads(error.read().decode("utf-8"))
            message = details.get("error", {}).get("message")
        except (ValueError, UnicodeDecodeError):
            message = None
        raise SharePointError(message or f"Microsoft Graph returned HTTP {error.code}.") from error
    except urllib.error.URLError as error:
        raise SharePointError("Could not reach Microsoft Graph.") from error

    if not payload:
        return {}
    try:
        return json.loads(payload.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as error:
        raise SharePointError("Microsoft Graph returned an unreadable response.") from error


def _get_access_token(tenant_id, client_id, client_secret):
    global _cached_token, _token_expires_at

    with _token_lock:
        if _cached_token and time.time() < _token_expires_at - 60:
            return _cached_token

        token_url = (
            f"https://login.microsoftonline.com/{urllib.parse.quote(tenant_id, safe='')}/oauth2/v2.0/token"
        )
        form_data = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }).encode("utf-8")
        response = _json_request(
            token_url,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            body=form_data,
        )
        _cached_token = response.get("access_token")
        if not _cached_token:
            raise SharePointError("Microsoft did not return an access token.")
        _token_expires_at = time.time() + int(response.get("expires_in", 3600))
        return _cached_token


def _graph_request(url, access_token, method="GET", content_type="application/json", body=None):
    headers = {"Authorization": f"Bearer {access_token}"}
    if content_type:
        headers["Content-Type"] = content_type
    return _json_request(url, method=method, headers=headers, body=body)


def _safe_filename(filename):
    name = re.split(r"[\\/]", filename or "")[-1]
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .")
    if not name or name in (".", ".."):
        raise UploadValidationError("The uploaded file needs a valid filename.")

    extension = os.path.splitext(name)[1].lower()
    if extension not in ALLOWED_TYPES:
        raise UploadValidationError("Only PDF, JPG, PNG, and TXT files can be uploaded.")

    stem, extension = os.path.splitext(name)
    return f"{stem[:100] or 'medical-report'}-{uuid.uuid4().hex}{extension}", ALLOWED_TYPES[extension]


def upload_file(filename, content, content_type=""):
    if not content or len(content) > MAX_UPLOAD_BYTES:
        raise UploadValidationError("The file must be between 1 byte and 25 MB.")

    tenant_id, client_id, client_secret, site_url = _configuration()
    upload_name, expected_type = _safe_filename(filename)
    if content_type and content_type.split(";", 1)[0].strip().lower() != expected_type:
        raise UploadValidationError("The file extension and content type do not match.")

    access_token = _get_access_token(tenant_id, client_id, client_secret)
    site_path = "/".join(
        urllib.parse.quote(urllib.parse.unquote(part), safe="")
        for part in site_url.path.split("/")
        if part
    )
    site_endpoint = f"{GRAPH_ROOT}/sites/{site_url.hostname}:/{site_path}"
    site = _graph_request(site_endpoint, access_token)
    site_id = urllib.parse.quote(site["id"], safe=",")

    folder_parts = [
        part.strip()
        for part in os.environ.get("SHAREPOINT_FOLDER_PATH", "").split("/")
        if part.strip()
    ]
    item_path = "/".join(
        urllib.parse.quote(part, safe="") for part in folder_parts + [upload_name]
    )
    upload_endpoint = f"{GRAPH_ROOT}/sites/{site_id}/drive/root:/{item_path}:/content"
    uploaded_item = _graph_request(
        upload_endpoint,
        access_token,
        method="PUT",
        content_type=expected_type,
        body=content,
    )

    return {
        "id": uploaded_item.get("id"),
        "name": uploaded_item.get("name", upload_name),
        "webUrl": uploaded_item.get("webUrl"),
    }