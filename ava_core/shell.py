import basic
import os
import json
import sys
import multiprocessing as mp
from datetime import datetime
import threading
import time
import re
import urllib.request
import urllib.error
from typing import Any, Dict

# Optional rich input (syntax-highlight prompt)
try:
    from prompt_toolkit import PromptSession
    from prompt_toolkit.lexers import Lexer as PTLexer
    from prompt_toolkit.styles import Style as PTStyle
    from prompt_toolkit.formatted_text import HTML
    PTK_AVAILABLE = True
except Exception:
    PTK_AVAILABLE = False

# Optional colors (works on Windows if colorama is installed)
try:
    from colorama import init as colorama_init, Fore, Style
    colorama_init()
    COLOR = {
        'reset': Style.RESET_ALL,
        'bold': Style.BRIGHT,
        'dim': Style.DIM,
        'green': Fore.GREEN,
        'yellow': Fore.YELLOW,
        'red': Fore.RED,
        'cyan': Fore.CYAN,
        'blue': Fore.BLUE,
        'magenta': Fore.MAGENTA,
        'white': Fore.WHITE,
    }
except Exception:
    COLOR = {k: '' for k in ['reset','bold','dim','green','yellow','red','cyan','blue','magenta','white']}

APP_NAME = "ava"
APP_TAGLINE = "The Decentralized Programming Language"
APP_VERSION = "0.1.0"
STORE_API_URL = os.environ.get('AVA_STORE_API', 'https://ava-backend-718i40di9-gokkull04s-projects.vercel.app/api/store-ipfs')
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb+srv://gokkull04:gokul%40123@cluster0.pe15z0t.mongodb.net/ava-lang')

# Optional MongoDB client
try:
  from pymongo import MongoClient  # type: ignore
  PYMONGO_AVAILABLE = True
except Exception:
  PYMONGO_AVAILABLE = False


def _cols(default: int = 80) -> int:
  try:
    return os.get_terminal_size().columns
  except Exception:
    return default

def do_line(char: str = '─'):
  col = _cols()
  print(char * col)

def word_line(word, color: str = None):
  col = _cols()
  label = f" {word} "
  side = max(0, (col - len(label)) // 2)
  left = '─' * side
  right = '─' * max(0, col - side - len(label))
  if color:
    print(f"{color}{left}{label}{right}{COLOR['reset']}")
  else:
    print(f"{left}{label}{right}")

def section(title: str, color: str = None):
  word_line(title, color=color)

def _wrap_lines(text: str, width: int):
  lines = []
  for raw in str(text).split('\n'):
    s = raw.rstrip('\r')
    while len(s) > width:
      cut = s.rfind(' ', 0, width)
      if cut <= 0:
        cut = width
      lines.append(s[:cut])
      s = s[cut:].lstrip()
    lines.append(s)
  return lines

def _read_file_text(path: str) -> str:
  # Try a set of common encodings with BOM handling and a final permissive fallback
  candidate_encodings = [
    'utf-8',
    'utf-8-sig',
    'utf-16',
    'utf-16-le',
    'utf-16-be',
    'latin-1',
  ]
  for enc in candidate_encodings:
    try:
      with open(path, 'r', encoding=enc) as fh:
        return fh.read()
    except UnicodeDecodeError:
      continue
    except Exception:
      # If other IO errors, break so they surface later
      break
  # Last resort: replace undecodable bytes to avoid crashing
  try:
    with open(path, 'r', encoding='utf-8', errors='replace') as fh:
      return fh.read()
  except Exception as e:
    raise e

def _child_run_program(fn: str, text: str, out_q):
  try:
    result, error = basic.run(fn, text)
    # Convert error to dict if present to ensure picklable
    if isinstance(result, dict):
      res_obj = result
    else:
      res_obj = {'file': fn, 'error': str(error) if error else None}
    try:
      err_obj = basic.error_to_dict(error) if error else None
    except Exception:
      err_obj = {'name': 'Error', 'details': str(error)} if error else None
    out_q.put((res_obj, err_obj))
  except Exception as e:
    out_q.put(({'file': fn, 'error': str(e)}, {'name': 'Error', 'details': str(e)}))

def print_panel(title: str, body_text: str, color: str = None):
  # Fallback to ASCII borders and no color when not a TTY to avoid Unicode/ANSI issues
  try:
    is_tty = bool(getattr(sys.stdout, 'isatty', lambda: False)())
  except Exception:
    is_tty = False
  is_windows = (os.name == 'nt')
  enc = (getattr(sys.stdout, 'encoding', '') or '').lower()
  # Allow unicode only on non-Windows, or Windows with UTF-8 code page, unless AVA_ASCII is set
  use_unicode = (os.environ.get('AVA_ASCII', '').strip() == '') and is_tty and ((not is_windows) or enc == 'utf-8')
  width = _cols()
  inner = max(40, width - 2)
  title_str = f" {title} "
  if len(title_str) > inner:
    title_str = title_str[:inner]
  side = (inner - len(title_str)) // 2
  if use_unicode:
    tl, tr, bl, br, hz, vt = "┌", "┐", "└", "┘", "─", "│"
  else:
    tl, tr, bl, br, hz, vt = "+", "+", "+", "+", "-", "|"
    color = None
  top_line = tl + (hz * side) + title_str + (hz * (inner - side - len(title_str))) + tr
  bot_line = bl + (hz * inner) + br
  try:
    if color:
      print(f"{color}{top_line}{COLOR['reset']}")
    else:
      print(top_line)
  except Exception:
    print(top_line)
  for ln in _wrap_lines(body_text, inner):
    line = vt + ln.ljust(inner) + vt
    try:
      print(line)
    except Exception:
      # Best-effort print without special chars
      print("|" + ln.ljust(inner) + "|")
  try:
    print(bot_line)
  except Exception:
    print("+" + ("-" * inner) + "+")

def _looks_like_box_art(text: str) -> bool:
  if not text:
    return False
  box_starts = ("┌", "│", "└", "┬", "┴", "├", "┤", "╭", "╰")
  checked = 0
  for line in text.splitlines():
    s = line.strip()
    if not s:
      continue
    checked += 1
    if s.startswith(box_starts):
      return True
    if checked >= 3:
      break
  return False

def _strip_pow_from_stdout(text: str) -> str:
  if not text:
    return text
  try:
    lines = text.splitlines()
    kept = []
    for ln in lines:
      # Drop any line containing PoW prints (manual or auto)
      if 'PoW' in ln:
        continue
      kept.append(ln)
    # Preserve trailing newline if original had it
    out = "\n".join(kept)
    if text.endswith('\n') and not out.endswith('\n'):
      out += '\n'
    return out
  except Exception:
    return text

def _usage_text() -> str:
  return (
    "Commands:\n"
    "  help()               Show language keywords & built-ins\n"
    "  clear | clr          Clear screen\n"
    "  exit                 Quit the REPL\n\n"
    "Flags (per session):\n"
    "  --no-json            Hide JSON panels (toggle back with --json)\n"
    "  --json               Show JSON panels again\n"
    "  --no-spinner         Disable loading animation for this session\n\n"
    "Environment:\n"
    "  AVA_NO_SPINNER=1     Disable loading animation globally\n"
  )

def _post_result_to_api(result_obj: dict, src_name: str = '<stdin>') -> str:
  try:
    # Store the actual execution data to IPFS, not just metadata
    now_iso = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # The main data to store is the execution result itself
    payload = {
      'data': result_obj,  # Store the actual execution data
      'name': f"ava-execution-{int(time.time())}"
    }
    req = urllib.request.Request(
      STORE_API_URL,
      data=json.dumps(payload).encode('utf-8'),
      headers={'Content-Type': 'application/json'},
      method='POST'
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
      return resp.read().decode('utf-8', errors='replace')
  except Exception as e:
    return f"ERROR: {e}"

def _extract_block_identifier(resp_obj: Dict[str, Any]) -> str:
  try:
    # Prefer txHash, then blockHash, then blockNumber
    bc = resp_obj.get('blockchain') or {}
    txh = bc.get('txHash') or resp_obj.get('txHash')
    if txh:
      return str(txh)
    bh = bc.get('blockHash') or resp_obj.get('blockHash')
    if bh:
      return str(bh)
    bn = bc.get('blockNumber') or resp_obj.get('blockNumber')
    if bn is not None:
      return str(bn)
    # As a very last resort, use IPFS hash as identifier
    ipfs = (resp_obj.get('ipfs') or {}).get('ipfsHash') or resp_obj.get('ipfsHash')
    if ipfs:
      return str(ipfs)
  except Exception:
    pass
  return ''

def _store_api_result_mongo(api_response_text: str, src_name: str = '<stdin>') -> str:
  if not api_response_text:
    return 'skipped: empty response'
  if not PYMONGO_AVAILABLE:
    return 'skipped: pymongo not installed'
  uri = MONGODB_URI
  if not uri:
    return 'skipped: MONGODB_URI not set'
  # Parse response JSON if possible
  parsed: Dict[str, Any] = {}
  try:
    parsed = json.loads(api_response_text)
  except Exception:
    parsed = {}
  try:
    ident = _extract_block_identifier(parsed) if parsed else ''
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    try:
      db = client.get_default_database() or client["ava-lang"]
    except Exception:
      db = client["ava-lang"]
    coll = db["responses"]
    doc = {
      'id': ident or f"{int(time.time())}",
      'json_value_of_response': api_response_text,
      'source': str(src_name),
      'createdAt': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    }
    ins = coll.insert_one(doc)
    return f"ok: inserted {str(ins.inserted_id)}"
  except Exception as e:
    return f"error: {e}"

def welcome():
  info = (
    f"Version {APP_VERSION}\n"
    f"Type help() for keywords & built-ins\n"
    f"Use --no-json to hide JSON (toggle back with --json)\n"
    f"Use --no-spinner (or AVA_NO_SPINNER=1) to disable loading animation"
  )
  print_panel(f"{APP_NAME.upper()} — {APP_TAGLINE}", info, color=COLOR['magenta'])
  print_panel('Usage', _usage_text(), color=COLOR['blue'])


if __name__ == "__main__":
  ARGS = sys.argv[1:]
  SESSION_SUPPRESS_JSON = ('--no-json' in ARGS)
  # Allow disabling spinner globally via CLI or env
  NO_SPINNER = ('--no-spinner' in ARGS) or (os.environ.get('AVA_NO_SPINNER', '').strip() not in ('', '0', 'false', 'False'))

  # Early --help support for shell flags
  if '--help' in ARGS or '-h' in ARGS:
    print_panel('Usage', _usage_text(), color=COLOR['blue'])
    sys.exit(0)

  # If a positional argument (file) is provided, run that file and exit
  file_args = [a for a in ARGS if not a.startswith('-')]
  if file_args:
    file_path = file_args[0]
    # Support reading from stdin via '-'
    if file_path == '-':
      src = sys.stdin.read()
      src_name = '<stdin>'
    else:
      if not os.path.isfile(file_path):
        print_panel('Error', f'File not found: {file_path}', color=COLOR['red'])
        sys.exit(1)
      src = _read_file_text(file_path)
      src_name = file_path
    
    # Execute once with timeout guard
    result, error = None, None
    timeout_s = float(os.environ.get('AVA_EXEC_TIMEOUT', '15'))
    out_q = mp.Queue()
    p = mp.Process(target=_child_run_program, args=(src_name, src, out_q))
    p.daemon = True
    p.start()
    p.join(timeout_s)
    if p.is_alive():
      try:
        p.terminate()
      except Exception:
        pass
      error = {'name': 'Timeout', 'details': f'Execution exceeded {timeout_s}s and was terminated.'}
      result = {
        'file': src_name,
        'elapsed': 0,
        'trace': {'execution': {'stdout': ''}},
        'error': error
      }
    else:
      try:
        result, err_obj = out_q.get_nowait()
        # normalize error back to simple object; basic.run interface expects error-like or None
        error = err_obj
      except Exception:
        result, error = {'file': src_name, 'error': 'No result from child'}, {'name': 'Error', 'details': 'No result from child'}
    
    # Minimal output: mirror REPL panels
    show_json = not SESSION_SUPPRESS_JSON
    header = {}
    if isinstance(result, dict):
      header = result.get('trace', {}).get('execution', {}).get('header', {}) or {}
      if isinstance(header, dict) and 'show_json' in header:
        try:
          show_json = show_json and bool(header.get('show_json'))
        except Exception:
          pass
    status_ok = error is None and (isinstance(result, dict) and not result.get('error'))
    elapsed = result.get('elapsed') if isinstance(result, dict) else None
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    icon = '✓' if status_ok else '✗'
    summary = []
    summary.append(f"time    : {now}")
    summary.append(f"status  : {icon} {'OK' if status_ok else 'ERROR'}")
    if elapsed is not None:
      summary.append(f"elapsed : {elapsed:.3f}s")
    if isinstance(header, dict) and header:
      json_flag = 'off' if (SESSION_SUPPRESS_JSON or not bool(header.get('show_json', True))) else 'on'
      pow_bits = header.get('pow_bits')
      pow_always = header.get('pow_always')
      hdr_parts = [f"json:{json_flag}"]
      if pow_always is not None:
        hdr_parts.append(f"pow:{'on' if pow_always else 'off'}")
      if pow_bits:
        hdr_parts.append(f"bits:{pow_bits}")
      if hdr_parts:
        summary.append("config  : " + ", ".join(hdr_parts))
    print_panel('Execution Summary', "\n".join(summary), color=COLOR['cyan'])
    
    # ALWAYS POST to API (regardless of JSON display settings) and show response
    api_resp = _post_result_to_api(result or {}, src_name)
    print_panel('Store API Response', api_resp, color=COLOR['green'])
    # Store to MongoDB
    mongo_status = _store_api_result_mongo(api_resp, src_name)
    print_panel('MongoDB Store', mongo_status, color=COLOR['blue'])
    
    pow_obj = None
    if isinstance(result, dict):
      pow_obj = result.get('pow') or result.get('trace', {}).get('execution', {}).get('pow')
    if pow_obj:
      try:
        bits = pow_obj.get('bits')
        nonce = pow_obj.get('nonce')
        hsh = pow_obj.get('hash') or ''
        iters = pow_obj.get('iterations') or 0
        pelapsed = pow_obj.get('elapsed') or 0.0
        hprefix = (hsh[:24] + '...') if isinstance(hsh, str) and len(hsh) > 27 else hsh
        rate = int(iters / pelapsed) if pelapsed else 0
        body = []
        body.append(f"bits   : {bits}")
        body.append(f"nonce  : {nonce}")
        body.append(f"hash   : {hprefix}")
        body.append(f"iter   : {iters}")
        body.append(f"time   : {pelapsed:.3f}s")
        body.append(f"rate   : {rate} H/s")
        print_panel('Proof-of-Work ⛏️', "\n".join(body), color=COLOR['magenta'])
      except Exception:
        pass
    
    # Only show JSON panel if not suppressed
    if show_json:
      try:
        json_text = json.dumps(result, indent=2, ensure_ascii=False)
      except Exception:
        json_text = str(result)
      print_panel('JSON', json_text, color=COLOR['cyan'])
    
    prog_out = ''
    if isinstance(result, dict):
      prog_out = result.get('stdout') or result.get('trace', {}).get('execution', {}).get('stdout') or ''
      if pow_obj and prog_out:
        prog_out = _strip_pow_from_stdout(prog_out)
    if prog_out:
      if _looks_like_box_art(prog_out):
        section('Stdout', color=COLOR['white'])
        print(prog_out, end='' if prog_out.endswith('\n') else '\n')
      else:
        print_panel('Stdout', prog_out, color=COLOR['white'])
    else:
      print_panel('Stdout', '<empty>', color=COLOR['white'])
    if error:
      err_txt = None
      try:
        err_txt = error.as_string()
      except Exception:
        try:
          err_txt = json.dumps({'error': basic.error_to_dict(error)}, indent=2)
        except Exception:
          err_txt = str(error)
      print_panel('Error', err_txt, color=COLOR['red'])
      sys.exit(1)
    sys.exit(0)

  # No file provided: start interactive shell
  welcome()

  # Build prompt: avoid ANSI when using prompt_toolkit to prevent escape artifacts
  PROMPT_ANSI = f"{COLOR['magenta']}[{APP_NAME}]{COLOR['reset']} {COLOR['dim']}»{COLOR['reset']} "
  PROMPT_PLAIN = f"[{APP_NAME}] » "
  PROMPT = PROMPT_PLAIN if PTK_AVAILABLE else PROMPT_ANSI
  if PTK_AVAILABLE:
    PROMPT_FT = HTML('<ansimagenta>[ava]</ansimagenta> <ansibrightblack>»</ansibrightblack> ')

  # Syntax highlighting for input (optional)
  KNOWN_KEYWORDS = set(getattr(basic, 'KEYWORDS', []))
  def _get_builtins():
      try:
          return {name for name, val in basic.global_symbol_table.symbols.items() if isinstance(val, basic.BuiltInFunction)}
      except Exception:
          return set()
  KNOWN_BUILTINS = _get_builtins()
  KNOWN_VARIABLES = set()
  KNOWN_FUNCTIONS = set()

  def _refresh_known_symbols():
    global KNOWN_VARIABLES, KNOWN_FUNCTIONS, KNOWN_BUILTINS
    try:
      KNOWN_BUILTINS = {name for name, val in basic.global_symbol_table.symbols.items() if isinstance(val, basic.BuiltInFunction)}
      KNOWN_FUNCTIONS = {name for name, val in basic.global_symbol_table.symbols.items() if isinstance(val, basic.Function)}
      KNOWN_VARIABLES = {name for name, val in basic.global_symbol_table.symbols.items() if not isinstance(val, (basic.BuiltInFunction, basic.Function))}
    except Exception:
      pass

  if PTK_AVAILABLE:
      class X3Lexer(PTLexer):
          def lex_document(self, document):
              text = document.text
              # Pre-tokenize with regex
              token_specs = [
                  ('COMMENT', r'#.*$'),
                  ('STRING', r'"(?:\\.|[^"\\])*"'),
                  ('NUMBER', r'\b\d+(?:\.\d+)?\b'),
                  ('IDENT',  r'\b[a-zA-Z_][a-zA-Z0-9_]*\b'),
                  ('OP',     r'[+\-*/^=]'),
                  ('PUNCT',  r'[(),\[\];]'),
                  ('SPACE',  r'\s+'),
              ]
              master = re.compile('|'.join(f'(?P<{n}>{p})' for n,p in token_specs))

              styles = []
              pos = 0
              for m in master.finditer(text):
                  start, end = m.start(), m.end()
                  if start > pos:
                      # unknown chunk
                      styles.append(('class:plain', text[pos:start]))
                  kind = m.lastgroup
                  value = m.group()
                  if kind == 'COMMENT':
                      styles.append(('class:comment', value))
                  elif kind == 'STRING':
                      styles.append(('class:string', value))
                  elif kind == 'NUMBER':
                      styles.append(('class:number', value))
                  elif kind == 'IDENT':
                      if value in KNOWN_KEYWORDS:
                          styles.append(('class:keyword', value))
                      elif value in KNOWN_BUILTINS or value in KNOWN_FUNCTIONS:
                          styles.append(('class:function', value))
                      elif value in KNOWN_VARIABLES:
                          styles.append(('class:variable', value))
                      else:
                          styles.append(('class:ident', value))
                  elif kind == 'OP':
                      styles.append(('class:operator', value))
                  elif kind == 'PUNCT':
                      styles.append(('class:punct', value))
                  else:
                      styles.append(('class:plain', value))
                  pos = end
              if pos < len(text):
                  styles.append(('class:plain', text[pos:]))

              def get_line(i):
                  # prompt_toolkit expects a callable returning list of (style, text)
                  return styles
              return get_line

      # Use prompt_toolkit's color names (not ANSI escapes)
      PT_STYLE = PTStyle.from_dict({
          'plain': '',
          'comment': 'ansibrightblack',
          'string': 'ansimagenta',
          'number': 'ansiyellow',
          'keyword': 'ansicyan bold',
          'function': 'ansigreen bold',
          'variable': 'ansiblue',
          'ident': '',
          'operator': 'ansiwhite',
          'punct': 'ansiwhite',
      })
      SESSION = PromptSession(lexer=X3Lexer(), style=PT_STYLE)

  # Interactive shell loop
  while True:
      try:
          if PTK_AVAILABLE:
              text = SESSION.prompt(PROMPT_FT)
          else:
              text = input(PROMPT)
      except EOFError:
          print()
          break
      if text.strip() == "":
          continue

      # Per-command flags
      line_suppress_json = False
      stripped = text.strip()
      if stripped == '--no-json':
          SESSION_SUPPRESS_JSON = True
          print(f" {COLOR['yellow']}JSON output disabled for this session{COLOR['reset']}")
          continue
      if stripped == '--json':
          SESSION_SUPPRESS_JSON = False
          print(f" {COLOR['green']}JSON output enabled for this session{COLOR['reset']}")
          continue
      # Convenience commands without parentheses
      if stripped in ('clear', 'clr', 'exit', 'help'):
          text = stripped + '()'
          stripped = text
      if stripped.startswith('--no-json'):
          # apply only for this execution
          line_suppress_json = True
          # remove the flag token
          parts = stripped.split(None, 1)
          text = parts[1] if len(parts) > 1 else ''
          if not text:
              continue

      # Spinner while running
      class _Spinner:
          def __init__(self):
              self._stop = threading.Event()
              self._t = None
              self._enabled = (not NO_SPINNER) and bool(getattr(sys.stderr, 'isatty', lambda: False)()) and bool(getattr(sys.stdout, 'isatty', lambda: False)())
              self._last_len = 0
          def start(self, label: str):
              if not self._enabled:
                  return
              # Modern braille spinner with subtle color cycling
              frames = ['⠋ ','⠙ ','⠹ ','⠸ ','⠼ ','⠴ ','⠦ ','⠧ ','⠇ ','⠏ ']
              colors = [
                  COLOR.get('cyan', ''),
                  COLOR.get('magenta', ''),
                  COLOR.get('blue', ''),
                  COLOR.get('green', ''),
                  COLOR.get('yellow', ''),
              ]
              reset = COLOR.get('reset', '')
              def run():
                  i = 0
                  while not self._stop.is_set():
                      frame = frames[i % len(frames)]
                      col = colors[i % len(colors)]
                      out = f"{col}{label} {frame}{reset}"
                      try:
                          pad = max(0, self._last_len - len(out))
                          sys.stderr.write("\r" + out + (" " * pad))
                          sys.stderr.flush()
                          self._last_len = len(out)
                      except Exception:
                          break
                      i += 1
                      time.sleep(0.08)
              self._t = threading.Thread(target=run, daemon=True)
              self._t.start()
          def stop(self):
              if not self._enabled:
                  return
              self._stop.set()
              if self._t:
                  self._t.join()
              try:
                  sys.stderr.write("\r" + (" " * self._last_len) + "\r")
                  sys.stderr.flush()
              except Exception:
                  pass

      spinner = _Spinner()
      label = 'Running'
      if 'pow_mine' in stripped:
          label = 'Mining'
      spinner.start(label)
      try:
          result, error = basic.run('<stdin>', text)
      finally:
          spinner.stop()

      # Update known symbols for next input highlighting
      _refresh_known_symbols()

      # Header flags
      show_json = not (SESSION_SUPPRESS_JSON or line_suppress_json)
      header = {}
      if isinstance(result, dict):
          header = result.get('trace', {}).get('execution', {}).get('header', {}) or {}
          if isinstance(header, dict) and 'show_json' in header:
              # Header can only further hide JSON; CLI --no-json overrides header True
              try:
                  show_json = show_json and bool(header.get('show_json'))
              except Exception:
                  pass

      # Execution Summary panel
      status_ok = error is None and (isinstance(result, dict) and not result.get('error'))
      elapsed = result.get('elapsed') if isinstance(result, dict) else None
      now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
      icon = '✓' if status_ok else '✗'
      summary = []
      summary.append(f"time    : {now}")
      summary.append(f"status  : {icon} {'OK' if status_ok else 'ERROR'}")
      if elapsed is not None:
          summary.append(f"elapsed : {elapsed:.3f}s")
      # Header flags snapshot
      if isinstance(header, dict) and header:
          json_flag = 'off' if (SESSION_SUPPRESS_JSON or line_suppress_json or not bool(header.get('show_json', True))) else 'on'
          pow_bits = header.get('pow_bits')
          pow_always = header.get('pow_always')
          hdr_parts = [f"json:{json_flag}"]
          if pow_always is not None:
              hdr_parts.append(f"pow:{'on' if pow_always else 'off'}")
          if pow_bits:
              hdr_parts.append(f"bits:{pow_bits}")
          if hdr_parts:
              summary.append("config  : " + ", ".join(hdr_parts))
      print_panel('Execution Summary', "\n".join(summary), color=COLOR['cyan'])
      
      # Always POST to API and show response
      api_resp = _post_result_to_api(result or {}, '<stdin>')
      print_panel('Store API Response', api_resp, color=COLOR['green'])
      # Store to MongoDB
      mongo_status = _store_api_result_mongo(api_resp, '<stdin>')
      print_panel('MongoDB Store', mongo_status, color=COLOR['blue'])

      # Proof-of-Work summary (if present)
      pow_obj = None
      if isinstance(result, dict):
          pow_obj = result.get('pow') or result.get('trace', {}).get('execution', {}).get('pow')
      if pow_obj:
          try:
              bits = pow_obj.get('bits')
              nonce = pow_obj.get('nonce')
              hsh = pow_obj.get('hash') or ''
              iters = pow_obj.get('iterations') or 0
              pelapsed = pow_obj.get('elapsed') or 0.0
              hprefix = (hsh[:24] + '...') if isinstance(hsh, str) and len(hsh) > 27 else hsh
              rate = int(iters / pelapsed) if pelapsed else 0
              body = []
              body.append(f"bits   : {bits}")
              body.append(f"nonce  : {nonce}")
              body.append(f"hash   : {hprefix}")
              body.append(f"iter   : {iters}")
              body.append(f"time   : {pelapsed:.3f}s")
              body.append(f"rate   : {rate} H/s")
              print_panel('Proof-of-Work ⛏️', "\n".join(body), color=COLOR['magenta'])
          except Exception:
              pass
          
      # JSON payload (only if not suppressed)
      if show_json:
          try:
              json_text = json.dumps(result, indent=2, ensure_ascii=False)
          except Exception:
              json_text = str(result)
          print_panel('JSON', json_text, color=COLOR['cyan'])
          
      # Final Value (only if not suppressed)
      if show_json and isinstance(result, dict) and 'final_value' in result:
          fv = result.get('final_value')
          try:
              fv_text = json.dumps(fv, ensure_ascii=False)
          except Exception:
              fv_text = str(fv)
          print_panel('Final Value', fv_text, color=COLOR['blue'])
          
      # Stdout (program output)
      prog_out = ''
      if isinstance(result, dict):
          prog_out = result.get('stdout') or result.get('trace', {}).get('execution', {}).get('stdout') or ''
          # If PoW panel is present, remove PoW progress/result lines from Stdout
          if pow_obj and prog_out:
              prog_out = _strip_pow_from_stdout(prog_out)

      if prog_out:
          if _looks_like_box_art(prog_out):
              # Print raw if content contains its own frame
              section('Stdout', color=COLOR['white'])
              print(prog_out, end='' if prog_out.endswith('\n') else '\n')
          else:
              print_panel('Stdout', prog_out, color=COLOR['white'])
      else:
          print_panel('Stdout', '<empty>', color=COLOR['white'])

      # Error details (if any)
      if error:
          err_txt = None
          try:
              err_txt = error.as_string()
          except Exception:
              try:
                  err_txt = json.dumps({'error': basic.error_to_dict(error)}, indent=2)
              except Exception:
                  err_txt = str(error)
          print_panel('Error', err_txt, color=COLOR['red'])
      # footer spacer
      print()