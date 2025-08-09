import os
import sys
import json
import io
import zipfile
from typing import Any, Dict

from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS

# Ensure project root on sys.path so we can import from ava_core
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from llm.llm_core import (
    convert_code_to_language,
    convert_code_to_project_manifest,
)


app = Flask(__name__)
CORS(app)


def _json_error(msg: str, code: int = 400) -> Response:
    return jsonify({"error": msg}), code


@app.get('/health')
def health() -> Response:
    return jsonify({"status": "ok"}), 200


@app.post('/convert-code')
def api_convert_code() -> Response:
    try:
        payload: Dict[str, Any] = request.get_json(force=True, silent=False) or {}
    except Exception:
        return _json_error("Invalid JSON payload", 400)

    source_code = payload.get('source_code')
    target_language = payload.get('target_language') or payload.get('lang')
    api_key = payload.get('api_key')
    system = payload.get('system')

    if not isinstance(source_code, str) or not source_code.strip():
        return _json_error("'source_code' is required (string)")
    if not isinstance(target_language, str) or not target_language.strip():
        return _json_error("'target_language' is required (string: 'solidity'|'rust')")

    try:
        code_out = convert_code_to_language(
            source_code=source_code,
            target_language=target_language,
            system=system,
            api_key=api_key,
        )
        return jsonify({
            "language": target_language,
            "code": code_out,
        }), 200
    except Exception as e:
        return _json_error(f"Conversion failed: {e}", 500)


@app.post('/convert-project')
def api_convert_project() -> Response:
    try:
        payload: Dict[str, Any] = request.get_json(force=True, silent=False) or {}
    except Exception:
        return _json_error("Invalid JSON payload", 400)

    source_code = payload.get('source_code')
    target_language = payload.get('target_language') or payload.get('lang')
    api_key = payload.get('api_key')
    preset = payload.get('preset')

    if not isinstance(source_code, str) or not source_code.strip():
        return _json_error("'source_code' is required (string)")
    if not isinstance(target_language, str) or not target_language.strip():
        return _json_error("'target_language' is required (string: 'solidity'|'rust')")

    # Serverless/Vercel mode: do not write to disk. Return manifest (in-memory)
    try:
        manifest = convert_code_to_project_manifest(
            source_code=source_code,
            target_language=target_language,
            preset=preset,
            api_key=api_key,
        )
        # Normalize files to strings (safety)
        files = []
        for f in manifest.get('files', []):
            path = f.get('path', '')
            content = f.get('content')
            if isinstance(content, (dict, list)):
                content = json.dumps(content, indent=2)
            elif content is None:
                content = ''
            else:
                content = str(content)
            files.append({"path": path, "content": content})

        resp = {
            "projectType": manifest.get('projectType'),
            "files": files,
            "nextSteps": manifest.get('nextSteps') or [],
        }
        return jsonify(resp), 200
    except Exception as e:
        return _json_error(f"Project generation failed: {e}", 500)


@app.post('/convert-project-zip')
def api_convert_project_zip() -> Response:
    try:
        payload: Dict[str, Any] = request.get_json(force=True, silent=False) or {}
    except Exception:
        return _json_error("Invalid JSON payload", 400)

    source_code = payload.get('source_code')
    target_language = payload.get('target_language') or payload.get('lang')
    api_key = payload.get('api_key')
    preset = payload.get('preset')

    if not isinstance(source_code, str) or not source_code.strip():
        return _json_error("'source_code' is required (string)")
    if not isinstance(target_language, str) or not target_language.strip():
        return _json_error("'target_language' is required (string: 'solidity'|'rust')")

    try:
        manifest = convert_code_to_project_manifest(
            source_code=source_code,
            target_language=target_language,
            preset=preset,
            api_key=api_key,
        )
        files = []
        for f in manifest.get('files', []):
            path = (f.get('path') or '').lstrip('/\\')
            content = f.get('content')
            if isinstance(content, (dict, list)):
                content = json.dumps(content, indent=2)
            elif content is None:
                content = ''
            else:
                content = str(content)
            files.append({"path": path, "content": content})

        mem = io.BytesIO()
        with zipfile.ZipFile(mem, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                arcname = f["path"].replace('\\', '/')
                if not arcname:
                    continue
                zf.writestr(arcname, f["content"])
        mem.seek(0)

        filename = (manifest.get('projectType') or 'project') + '.zip'
        return send_file(
            mem,
            mimetype='application/zip',
            as_attachment=True,
            download_name=filename,
            max_age=0,
        )
    except Exception as e:
        return _json_error(f"Project ZIP generation failed: {e}", 500)


# Note on storage behavior:
# - When invoked via this API (serverless/Vercel), we DO NOT write to disk; we return the
#   code/manifest in the response.
# - When invoked from the Ava language runtime (Basic REPL), the built-ins defined in
#   ava_core/Basic.py (code_convert, code_convert_project) will write to the local storage
#   as requested there.


if __name__ == '__main__':
    # Local development server
    app.run(host='0.0.0.0', port=8000, debug=True)
