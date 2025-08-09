import basic
import os
import json
import sys
from datetime import datetime
import threading
import time
import re

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

def print_panel(title: str, body_text: str, color: str = None):
  width = _cols()
  inner = max(40, width - 2)
  title_str = f" {title} "
  if len(title_str) > inner:
    title_str = title_str[:inner]
  side = (inner - len(title_str)) // 2
  top_line = "┌" + ("─" * side) + title_str + ("─" * (inner - side - len(title_str))) + "┐"
  bot_line = "└" + ("─" * inner) + "┘"
  if color:
    print(f"{color}{top_line}{COLOR['reset']}")
  else:
    print(top_line)
  for ln in _wrap_lines(body_text, inner):
    print("│" + ln.ljust(inner) + "│")
  print(bot_line)

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

def welcome():
  info = (
    f"Version {APP_VERSION}\n"
    f"Type help() for keywords & built-ins\n"
    f"Use --no-json to hide JSON (toggle back with --json)"
  )
  print_panel(f"{APP_NAME.upper()} — {APP_TAGLINE}", info, color=COLOR['magenta'])


ARGS = sys.argv[1:]
SESSION_SUPPRESS_JSON = ('--no-json' in ARGS)


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
        def start(self, label: str):
            frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
            def run():
                i = 0
                while not self._stop.is_set():
                    frame = frames[i % len(frames)]
                    sys.stdout.write(f"\r{COLOR['dim']}{label} {frame}{COLOR['reset']}")
                    sys.stdout.flush()
                    i += 1
                    time.sleep(0.07)
            self._t = threading.Thread(target=run, daemon=True)
            self._t.start()
        def stop(self):
            self._stop.set()
            if self._t:
                self._t.join(timeout=0.2)
            # clear line
            sys.stdout.write("\r" + " " * (_cols()) + "\r")
            sys.stdout.flush()

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

    # Final Value
    if isinstance(result, dict) and 'final_value' in result:
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

    # JSON payload (optional)
    if show_json:
        try:
            json_text = json.dumps(result, indent=2, ensure_ascii=False)
        except Exception:
            json_text = str(result)
        print_panel('JSON', json_text, color=COLOR['cyan'])

    # footer spacer
    print()