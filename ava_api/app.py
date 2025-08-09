import os
import sys
import json
import io
import zipfile
from typing import Any, Dict

from flask import Flask, request, jsonify, Response, send_file, redirect
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


# Simple API docs (served at '/' and '/docs')
_DOCS = {
    "name": "Ava Convert API",
    "version": "1.0",
    "description": "LLM-powered code and project conversion without writing to disk (serverless-friendly).",
    "endpoints": [
        {
            "method": "GET",
            "path": "/health",
            "desc": "Health check",
            "response": {"status": "ok"}
        },
        {
            "method": "POST",
            "path": "/convert-code",
            "desc": "Convert source code string into a target language (e.g., solidity, rust)",
            "body": {
                "source_code": "string (required)",
                "target_language": "string (required: 'solidity'|'rust')",
                "api_key": "string (optional: overrides default LLM key)",
                "system": "string (optional: system prompt override)"
            },
            "response": {
                "language": "string",
                "code": "string"
            }
        },
        {
            "method": "POST",
            "path": "/convert-project",
            "desc": "Generate a project manifest (files in-memory) for the target language",
            "body": {
                "source_code": "string (required)",
                "target_language": "string (required)",
                "api_key": "string (optional)",
                "preset": "string (optional preset e.g. 'hardhat', 'cargo')"
            },
            "response": {
                "projectType": "string",
                "files": "[{path: string, content: string}]",
                "nextSteps": "string[]"
            }
        },
        {
            "method": "POST",
            "path": "/convert-project-zip",
            "desc": "Return a ZIP of the generated project (built entirely in-memory)",
            "body": {
                "source_code": "string (required)",
                "target_language": "string (required)",
                "api_key": "string (optional)",
                "preset": "string (optional)"
            },
            "response": "application/zip attachment"
        }
    ],
    "notes": [
        "The API never writes files to disk; responses contain code or project structures.",
        "Use the Ava REPL built-ins in `ava_core/Basic.py` to write locally if needed: code_convert(), code_convert_project()."
    ]
}


@app.get('/')
def root_docs() -> Response:
    # Redirect to Swagger UI for a familiar FastAPI-like experience
    return redirect('/docs', code=302)


def _build_openapi() -> Dict[str, Any]:
    return {
        "openapi": "3.0.3",
        "info": {
            "title": "Ava Convert API",
            "version": "1.0.0",
            "description": "LLM-powered code and project conversion without writing to disk (serverless-friendly).",
        },
        "servers": [
            {"url": "/"}
        ],
        "paths": {
            "/health": {
                "get": {
                    "summary": "Health check",
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": {"type": "object", "properties": {"status": {"type": "string"}}},
                                    "example": {"status": "ok"}
                                }
                            }
                        }
                    }
                }
            },
            "/convert-code": {
                "post": {
                    "summary": "Convert source code string into a target language",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "source_code": {"type": "string"},
                                        "target_language": {"type": "string", "enum": ["solidity", "rust"]},
                                        "api_key": {"type": "string"},
                                        "system": {"type": "string"}
                                    },
                                    "required": ["source_code", "target_language"]
                                },
                                "example": {
                                    "source_code": "<ava code>",
                                    "target_language": "solidity",
                                    "api_key": "sk-..."
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Converted code",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "language": {"type": "string"},
                                            "code": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"description": "Invalid payload"},
                        "500": {"description": "Conversion failed"}
                    }
                }
            },
            "/convert-project": {
                "post": {
                    "summary": "Generate a project manifest for the target language",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "source_code": {"type": "string"},
                                        "target_language": {"type": "string", "enum": ["solidity", "rust"]},
                                        "api_key": {"type": "string"},
                                        "preset": {"type": "string"}
                                    },
                                    "required": ["source_code", "target_language"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Project manifest",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "projectType": {"type": "string"},
                                            "files": {"type": "array", "items": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}}},
                                            "nextSteps": {"type": "array", "items": {"type": "string"}}
                                        }
                                    }
                                }
                            }
                        },
                        "400": {"description": "Invalid payload"},
                        "500": {"description": "Project generation failed"}
                    }
                }
            },
            "/convert-project-zip": {
                "post": {
                    "summary": "Return a ZIP of the generated project (in-memory)",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "source_code": {"type": "string"},
                                        "target_language": {"type": "string", "enum": ["solidity", "rust"]},
                                        "api_key": {"type": "string"},
                                        "preset": {"type": "string"}
                                    },
                                    "required": ["source_code", "target_language"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "ZIP attachment",
                            "content": {"application/zip": {}}
                        },
                        "400": {"description": "Invalid payload"},
                        "500": {"description": "ZIP generation failed"}
                    }
                }
            }
        }
    }


_OPENAPI: Dict[str, Any] = _build_openapi()


@app.get('/openapi.json')
def openapi_spec() -> Response:
    return jsonify(_OPENAPI), 200


_SWAGGER_HTML = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Ava Convert API — Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout'
      });
    </script>
  </body>
  </html>
"""


@app.get('/docs')
def swagger_ui() -> Response:
    return Response(_SWAGGER_HTML, mimetype='text/html')


_REDOC_HTML = """
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Ava Convert API — ReDoc</title>
    <style> body { margin: 0; padding: 0; } </style>
  </head>
  <body>
    <redoc spec-url='/openapi.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
  </html>
"""


@app.get('/redoc')
def redoc_ui() -> Response:
    return Response(_REDOC_HTML, mimetype='text/html')


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
