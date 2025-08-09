#######################################
# IMPORTS
#######################################

from strings_with_arrows import *

import string
import os
import math
import json
import time
import sys
import io


from web3 import Web3
from eth_account import Account
import hashlib
import ast
import re
try:
  from ai import llm_convertor
  _LLM_IMPORT_ERROR = None
except Exception as _e:
  llm_convertor = None
  _LLM_IMPORT_ERROR = str(_e)
try:
  from web3_deploy.deployer import deploy_contract_from_source
  _DEPLOY_IMPORT_ERROR = None
except Exception as _e:
  deploy_contract_from_source = None
  _DEPLOY_IMPORT_ERROR = str(_e)

#######################################
# TRACE / SERIALIZATION HELPERS
#######################################

class TraceCollector:
  def __init__(self, file_name: str, source_text: str):
    self.file_name = file_name
    self.source_text = source_text
    self.start_time = time.time()
    self.end_time = None
    self.elapsed = None
    self.lexer = {
      'tokens': []
    }
    self.parser = {
      'root_repr': None
    }
    self.execution = {
      'events': [],  # chronological list of events
      'final_value': None,
      'stdout': ''
    }
    self.symbols_end = {}
    self.web3 = {}
    self._next_event_id = 1

  def add_token(self, tok):
    def pos_to_dict(p):
      return None if not p else {
        'idx': p.idx,
        'line': p.ln,
        'col': p.col
      }
    self.lexer['tokens'].append({
      'type': tok.type,
      'value': tok.value,
      'pos_start': pos_to_dict(getattr(tok, 'pos_start', None)),
      'pos_end': pos_to_dict(getattr(tok, 'pos_end', None))
    })

  def add_event(self, kind: str, data: dict):
    event = {
      'id': self._next_event_id,
      'kind': kind,
      'data': data
    }
    self.execution['events'].append(event)
    self._next_event_id += 1

  def finish(self, symbols_snapshot: dict, final_value):
    self.end_time = time.time()
    self.elapsed = self.end_time - self.start_time
    self.symbols_end = symbols_snapshot or {}
    self.execution['final_value'] = final_value

def value_to_python(v):
  # Convert runtime Values to plain Python types for JSON serialization
  try:
    from numbers import Number as PyNumber
  except Exception:
    PyNumber = (int, float)
  if v is None:
    return None
  # Our Number, String, List types
  if isinstance(v, Number):
    return v.value
  if isinstance(v, String):
    return v.value
  if isinstance(v, List):
    return [value_to_python(e) for e in v.elements]
  if isinstance(v, Function):
    return f"<function {v.name}>"
  if isinstance(v, BuiltInFunction):
    return f"<built-in function {v.name}>"
  # Fallback: try to return primitive or string
  if isinstance(v, PyNumber) or isinstance(v, str) or isinstance(v, list) or isinstance(v, dict):
    return v
  try:
    return str(v)
  except Exception:
    return '<unserializable>'

def error_to_dict(err):
  if err is None:
    return None
  def pos_to_dict(p):
    return None if not p else {
      'idx': p.idx,
      'line': p.ln,
      'col': p.col,
      'file': p.fn
    }
  return {
    'name': getattr(err, 'error_name', err.__class__.__name__),
    'details': getattr(err, 'details', ''),
    'pos_start': pos_to_dict(getattr(err, 'pos_start', None)),
    'pos_end': pos_to_dict(getattr(err, 'pos_end', None)),
    'traceback_str': err.as_string() if hasattr(err, 'as_string') else str(err)
  }


#######################################
# CONSTANTS
#######################################

DIGITS = '0123456789'
LETTERS = string.ascii_letters
LETTERS_DIGITS = LETTERS + DIGITS
PYDATA = {}
#-------------- Web3 --------------------
PROVIDER = ""
W3 =  ""
CONTRACT_ADDRESS= '0xA35725FfEfebF41B667167D0fd124cd43b59CC09'
CURRENT_PATH = os.getcwd()
ABI_OF_CONTRACT = os.path.join(CURRENT_PATH, 'Solidity','new_contract_abi.json')
PRIVATE_KEY = ""
IS_WEB3 = False
CURRENT_TRACE = None
# Default EVM RPC for deployments (optional override)
DEFAULT_EVM_RPC = "https://eth-sepolia.public.blastapi.io"
#-------------- PoW Auto ---------------
POW_ALWAYS = False
POW_BITS = 0
POW_MAX_NONCE = 1000000
#-------------- Terminal---------------
def do_line():
  SIZE = os.get_terminal_size()
  COL = SIZE.columns
  LINE = SIZE.lines
  print("-"*COL)

def word_line(word):
  SIZE = os.get_terminal_size()
  COL = SIZE.columns
  LINE = SIZE.lines
  actual_col = COL - len(word)
  halfofcol = actual_col / 2
  print("-"*int(halfofcol) + word + "-"*int(halfofcol))
#----------------- Error ---------------
ErrorMsg = True
PkErrorMsg = True


#######################################
# ERRORS
#######################################

class Error:
  def __init__(self, pos_start, pos_end, error_name, details):
    self.pos_start = pos_start
    self.pos_end = pos_end
    self.error_name = error_name
    self.details = details
  
  def as_string(self):
    result  = f'{self.error_name}: {self.details}\n'
    result += f'File {self.pos_start.fn}, line {self.pos_start.ln + 1}'
    result += '\n\n' + string_with_arrows(self.pos_start.ftxt, self.pos_start, self.pos_end)
    return result

class IllegalCharError(Error):
  def __init__(self, pos_start, pos_end, details):
    super().__init__(pos_start, pos_end, 'Illegal Character', details)

class ExpectedCharError(Error):
  def __init__(self, pos_start, pos_end, details):
    super().__init__(pos_start, pos_end, 'Expected Character', details)

class InvalidSyntaxError(Error):
  def __init__(self, pos_start, pos_end, details=''):
    super().__init__(pos_start, pos_end, 'Invalid Syntax', details)

class RTError(Error):
  def __init__(self, pos_start, pos_end, details, context):
    super().__init__(pos_start, pos_end, 'Runtime Error', details)
    self.context = context

  def as_string(self):
    result  = self.generate_traceback()
    result += f'{self.error_name}: {self.details}'
    result += '\n\n' + string_with_arrows(self.pos_start.ftxt, self.pos_start, self.pos_end)
    return result

  def generate_traceback(self):
    result = ''
    pos = self.pos_start
    ctx = self.context

    while ctx:
      result = f'  File {pos.fn}, line {str(pos.ln + 1)}, in {ctx.display_name}\n' + result
      pos = ctx.parent_entry_pos
      ctx = ctx.parent

    return 'Traceback (most recent call last):\n' + result

#######################################
# POSITION
#######################################

class Position:
  def __init__(self, idx, ln, col, fn, ftxt):
    self.idx = idx
    self.ln = ln
    self.col = col
    self.fn = fn
    self.ftxt = ftxt

  def advance(self, current_char=None):
    self.idx += 1
    self.col += 1

    if current_char == '\n':
      self.ln += 1
      self.col = 0

    return self

  def copy(self):
    return Position(self.idx, self.ln, self.col, self.fn, self.ftxt)

#######################################
# TOKENS
#######################################

TT_INT				= 'INT'
TT_FLOAT    	= 'FLOAT'
TT_STRING			= 'STRING'
TT_IDENTIFIER	= 'IDENTIFIER'
TT_KEYWORD		= 'KEYWORD'
TT_PLUS     	= 'PLUS'
TT_MINUS    	= 'MINUS'
TT_MUL      	= 'MUL'
TT_DIV      	= 'DIV'
TT_POW				= 'POW'
TT_EQ					= 'EQ'
TT_LPAREN   	= 'LPAREN'
TT_RPAREN   	= 'RPAREN'
TT_LSQUARE    = 'LSQUARE'
TT_RSQUARE    = 'RSQUARE'
TT_EE					= 'EE'
TT_NE					= 'NE'
TT_LT					= 'LT'
TT_GT					= 'GT'
TT_LTE				= 'LTE'
TT_GTE				= 'GTE'
TT_COMMA			= 'COMMA'
TT_ARROW			= 'ARROW'
TT_NEWLINE		= 'NEWLINE'
TT_EOF				= 'EOF'

KEYWORDS = [
  'var',
  'and',
  'or',
  'not',
  'if',
  'elif',
  'else',
  'for',
  'to',
  'step',
  'while',
  'fun',
  'then',
  'end',
  'return',
  'continue',
  'break',
]

class Token:
  def __init__(self, type_, value=None, pos_start=None, pos_end=None):
    self.type = type_
    self.value = value

    if pos_start:
      self.pos_start = pos_start.copy()
      self.pos_end = pos_start.copy()
      self.pos_end.advance()

    if pos_end:
      self.pos_end = pos_end.copy()

  def matches(self, type_, value):
    return self.type == type_ and self.value == value
  
  def __repr__(self):
    if self.value: return f'{self.type}:{self.value}'
    return f'{self.type}'

#######################################
# LEXER
#######################################

class Lexer:
  def __init__(self, fn, text):
    self.fn = fn
    self.text = text
    self.pos = Position(-1, 0, -1, fn, text)
    self.current_char = None
    self.advance()
  
  def advance(self):
    self.pos.advance(self.current_char)
    self.current_char = self.text[self.pos.idx] if self.pos.idx < len(self.text) else None

  def make_tokens(self):
    tokens = []

    while self.current_char != None:
      if self.current_char in ' \t':
        self.advance()
      elif self.current_char == '#':
        self.skip_comment()
      elif self.current_char in ';\n':
        tokens.append(Token(TT_NEWLINE, pos_start=self.pos))
        self.advance()
      elif self.current_char in DIGITS:
        tokens.append(self.make_number())
      elif self.current_char in LETTERS:
        tokens.append(self.make_identifier())
      elif self.current_char == '"':
        tokens.append(self.make_string())
      elif self.current_char == '+':
        tokens.append(Token(TT_PLUS, pos_start=self.pos))
        self.advance()
      elif self.current_char == '-':
        tokens.append(self.make_minus_or_arrow())
      elif self.current_char == '*':
        tokens.append(Token(TT_MUL, pos_start=self.pos))
        self.advance()
      elif self.current_char == '/':
        tokens.append(Token(TT_DIV, pos_start=self.pos))
        self.advance()
      elif self.current_char == '^':
        tokens.append(Token(TT_POW, pos_start=self.pos))
        self.advance()
      elif self.current_char == '(':
        tokens.append(Token(TT_LPAREN, pos_start=self.pos))
        self.advance()
      elif self.current_char == ')':
        tokens.append(Token(TT_RPAREN, pos_start=self.pos))
        self.advance()
      elif self.current_char == '[':
        tokens.append(Token(TT_LSQUARE, pos_start=self.pos))
        self.advance()
      elif self.current_char == ']':
        tokens.append(Token(TT_RSQUARE, pos_start=self.pos))
        self.advance()
      elif self.current_char == '!':
        token, error = self.make_not_equals()
        if error: return [], error
        tokens.append(token)
      elif self.current_char == '=':
        tokens.append(self.make_equals())
      elif self.current_char == '<':
        tokens.append(self.make_less_than())
      elif self.current_char == '>':
        tokens.append(self.make_greater_than())
      elif self.current_char == ',':
        tokens.append(Token(TT_COMMA, pos_start=self.pos))
        self.advance()
      else:
        pos_start = self.pos.copy()
        char = self.current_char
        self.advance()
        return [], IllegalCharError(pos_start, self.pos, "'" + char + "'")

    tokens.append(Token(TT_EOF, pos_start=self.pos))
    # Trace tokens if tracing active
    if CURRENT_TRACE is not None:
      for t in tokens:
        CURRENT_TRACE.add_token(t)
    return tokens, None

  def make_number(self):
    num_str = ''
    dot_count = 0
    pos_start = self.pos.copy()

    while self.current_char != None and self.current_char in DIGITS + '.':
      if self.current_char == '.':
        if dot_count == 1: break
        dot_count += 1
      num_str += self.current_char
      self.advance()

    if dot_count == 0:
      return Token(TT_INT, int(num_str), pos_start, self.pos)
    else:
      return Token(TT_FLOAT, float(num_str), pos_start, self.pos)

  def make_string(self):
    string = ''
    pos_start = self.pos.copy()
    escape_character = False
    self.advance()

    escape_characters = {
      'n': '\n',
      't': '\t'
    }

    while self.current_char != None and (self.current_char != '"' or escape_character):
      if escape_character:
        string += escape_characters.get(self.current_char, self.current_char)
      else:
        if self.current_char == '\\':
          escape_character = True
        else:
          string += self.current_char
      self.advance()
      escape_character = False
    
    self.advance()
    return Token(TT_STRING, string, pos_start, self.pos)

  def make_identifier(self):
    id_str = ''
    pos_start = self.pos.copy()

    while self.current_char != None and self.current_char in LETTERS_DIGITS + '_':
      id_str += self.current_char
      self.advance()

    tok_type = TT_KEYWORD if id_str in KEYWORDS else TT_IDENTIFIER
    return Token(tok_type, id_str, pos_start, self.pos)

  def make_minus_or_arrow(self):
    tok_type = TT_MINUS
    pos_start = self.pos.copy()
    self.advance()

    if self.current_char == '>':
      self.advance()
      tok_type = TT_ARROW

    return Token(tok_type, pos_start=pos_start, pos_end=self.pos)

  def make_not_equals(self):
    pos_start = self.pos.copy()
    self.advance()

    if self.current_char == '=':
      self.advance()
      return Token(TT_NE, pos_start=pos_start, pos_end=self.pos), None

    self.advance()
    return None, ExpectedCharError(pos_start, self.pos, "'=' (after '!')")
  
  def make_equals(self):
    tok_type = TT_EQ
    pos_start = self.pos.copy()
    self.advance()

    if self.current_char == '=':
      self.advance()
      tok_type = TT_EE

    return Token(tok_type, pos_start=pos_start, pos_end=self.pos)

  def make_less_than(self):
    tok_type = TT_LT
    pos_start = self.pos.copy()
    self.advance()

    if self.current_char == '=':
      self.advance()
      tok_type = TT_LTE

    return Token(tok_type, pos_start=pos_start, pos_end=self.pos)

  def make_greater_than(self):
    tok_type = TT_GT
    pos_start = self.pos.copy()
    self.advance()

    if self.current_char == '=':
      self.advance()
      tok_type = TT_GTE

    return Token(tok_type, pos_start=pos_start, pos_end=self.pos)

  def skip_comment(self):
    self.advance()

    while self.current_char != '\n':
      self.advance()

    self.advance()

#######################################
# NODES
#######################################
    
    
class NumberNode:
  def __init__(self, tok):
    self.tok = tok

    self.pos_start = self.tok.pos_start
    self.pos_end = self.tok.pos_end

  def __repr__(self):
    return f'{self.tok}'

class StringNode:
  def __init__(self, tok):
    self.tok = tok

    self.pos_start = self.tok.pos_start
    self.pos_end = self.tok.pos_end

  def __repr__(self):
    return f'{self.tok}'

class ListNode:
  def __init__(self, element_nodes, pos_start, pos_end):
    self.element_nodes = element_nodes

    self.pos_start = pos_start
    self.pos_end = pos_end

class VarAccessNode:
  def __init__(self, var_name_tok):
    self.var_name_tok = var_name_tok

    self.pos_start = self.var_name_tok.pos_start
    self.pos_end = self.var_name_tok.pos_end

class VarAssignNode:
  def __init__(self, var_name_tok, value_node):
    self.var_name_tok = var_name_tok
    self.value_node = value_node

    self.pos_start = self.var_name_tok.pos_start
    self.pos_end = self.value_node.pos_end

class BinOpNode:
  def __init__(self, left_node, op_tok, right_node):
    self.left_node = left_node
    self.op_tok = op_tok
    self.right_node = right_node

    self.pos_start = self.left_node.pos_start
    self.pos_end = self.right_node.pos_end

  def __repr__(self):
    return f'({self.left_node}, {self.op_tok}, {self.right_node})'

class UnaryOpNode:
  def __init__(self, op_tok, node):
    self.op_tok = op_tok
    self.node = node

    self.pos_start = self.op_tok.pos_start
    self.pos_end = node.pos_end

  def __repr__(self):
    return f'({self.op_tok}, {self.node})'

class IfNode:
  def __init__(self, cases, else_case):
    self.cases = cases
    self.else_case = else_case

    self.pos_start = self.cases[0][0].pos_start
    self.pos_end = (self.else_case or self.cases[len(self.cases) - 1])[0].pos_end

class ForNode:
  def __init__(self, var_name_tok, start_value_node, end_value_node, step_value_node, body_node, should_return_null):
    self.var_name_tok = var_name_tok
    self.start_value_node = start_value_node
    self.end_value_node = end_value_node
    self.step_value_node = step_value_node
    self.body_node = body_node
    self.should_return_null = should_return_null

    self.pos_start = self.var_name_tok.pos_start
    self.pos_end = self.body_node.pos_end

class WhileNode:
  def __init__(self, condition_node, body_node, should_return_null):
    self.condition_node = condition_node
    self.body_node = body_node
    self.should_return_null = should_return_null

    self.pos_start = self.condition_node.pos_start
    self.pos_end = self.body_node.pos_end

class FuncDefNode:
  def __init__(self, var_name_tok, arg_name_toks, body_node, should_auto_return):
    self.var_name_tok = var_name_tok
    self.arg_name_toks = arg_name_toks
    self.body_node = body_node
    self.should_auto_return = should_auto_return

    if self.var_name_tok:
      self.pos_start = self.var_name_tok.pos_start
    elif len(self.arg_name_toks) > 0:
      self.pos_start = self.arg_name_toks[0].pos_start
    else:
      self.pos_start = self.body_node.pos_start

    self.pos_end = self.body_node.pos_end

class CallNode:
  def __init__(self, node_to_call, arg_nodes):
    self.node_to_call = node_to_call
    self.arg_nodes = arg_nodes

    self.pos_start = self.node_to_call.pos_start

    if len(self.arg_nodes) > 0:
      self.pos_end = self.arg_nodes[len(self.arg_nodes) - 1].pos_end
    else:
      self.pos_end = self.node_to_call.pos_end

class ReturnNode:
  def __init__(self, node_to_return, pos_start, pos_end):
    self.node_to_return = node_to_return

    self.pos_start = pos_start
    self.pos_end = pos_end

class ContinueNode:
  def __init__(self, pos_start, pos_end):
    self.pos_start = pos_start
    self.pos_end = pos_end

class BreakNode:
  def __init__(self, pos_start, pos_end):
    self.pos_start = pos_start
    self.pos_end = pos_end

#######################################
# PARSE RESULT
#######################################

class ParseResult:
  def __init__(self):
    self.error = None
    self.node = None
    self.last_registered_advance_count = 0
    self.advance_count = 0
    self.to_reverse_count = 0

  def register_advancement(self):
    self.last_registered_advance_count = 1
    self.advance_count += 1

  def register(self, res):
    self.last_registered_advance_count = res.advance_count
    self.advance_count += res.advance_count
    if res.error: self.error = res.error
    return res.node

  def try_register(self, res):
    if res.error:
      self.to_reverse_count = res.advance_count
      return None
    return self.register(res)

  def success(self, node):
    self.node = node
    return self

  def failure(self, error):
    if not self.error or self.last_registered_advance_count == 0:
      self.error = error
    return self

#######################################
# PARSER
#######################################

class Parser:
  def __init__(self, tokens):
    self.tokens = tokens
    self.tok_idx = -1
    self.advance()

  def advance(self):
    self.tok_idx += 1
    self.update_current_tok()
    return self.current_tok

  def reverse(self, amount=1):
    self.tok_idx -= amount
    self.update_current_tok()
    return self.current_tok

  def update_current_tok(self):
    if self.tok_idx >= 0 and self.tok_idx < len(self.tokens):
      self.current_tok = self.tokens[self.tok_idx]

  def parse(self):
    res = self.statements()
    if not res.error and self.current_tok.type != TT_EOF:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        "Token cannot appear after previous tokens"
      ))
    # store a simple representation for trace
    if CURRENT_TRACE is not None and res and res.node is not None:
      try:
        CURRENT_TRACE.parser['root_repr'] = str(res.node)
      except Exception:
        CURRENT_TRACE.parser['root_repr'] = '<unserializable-ast>'
    return res

  ###################################

  def statements(self):
    res = ParseResult()
    statements = []
    pos_start = self.current_tok.pos_start.copy()

    while self.current_tok.type == TT_NEWLINE:
      res.register_advancement()
      self.advance()

    statement = res.register(self.statement())
    if res.error: return res
    statements.append(statement)

    more_statements = True

    while True:
      newline_count = 0
      while self.current_tok.type == TT_NEWLINE:
        res.register_advancement()
        self.advance()
        newline_count += 1
      if newline_count == 0:
        more_statements = False
      
      if not more_statements: break
      statement = res.try_register(self.statement())
      if not statement:
        self.reverse(res.to_reverse_count)
        more_statements = False
        continue
      statements.append(statement)

    return res.success(ListNode(
      statements,
      pos_start,
      self.current_tok.pos_end.copy()
    ))

  def statement(self):
    res = ParseResult()
    pos_start = self.current_tok.pos_start.copy()

    if self.current_tok.matches(TT_KEYWORD, 'return'):
      res.register_advancement()
      self.advance()

      expr = res.try_register(self.expr())
      if not expr:
        self.reverse(res.to_reverse_count)
      return res.success(ReturnNode(expr, pos_start, self.current_tok.pos_start.copy()))
    
    if self.current_tok.matches(TT_KEYWORD, 'continue'):
      res.register_advancement()
      self.advance()
      return res.success(ContinueNode(pos_start, self.current_tok.pos_start.copy()))
      
    if self.current_tok.matches(TT_KEYWORD, 'break'):
      res.register_advancement()
      self.advance()
      return res.success(BreakNode(pos_start, self.current_tok.pos_start.copy()))

    expr = res.register(self.expr())
    if res.error:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        "Expected 'return', 'continue', 'break', 'var', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'NOT'"
      ))
    return res.success(expr)

  def expr(self):
    res = ParseResult()

    if self.current_tok.matches(TT_KEYWORD, 'var'):
      res.register_advancement()
      self.advance()

      if self.current_tok.type != TT_IDENTIFIER:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          "Expected identifier"
        ))

      var_name = self.current_tok
      res.register_advancement()
      self.advance()

      if self.current_tok.type != TT_EQ:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          "Expected '='"
        ))

      res.register_advancement()
      self.advance()
      expr = res.register(self.expr())
      if res.error: return res
      return res.success(VarAssignNode(var_name, expr))

    node = res.register(self.bin_op(self.comp_expr, ((TT_KEYWORD, 'and'), (TT_KEYWORD, 'or'))))

    if res.error:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        "Expected 'var', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'not'"
      ))

    return res.success(node)

  def comp_expr(self):
    res = ParseResult()

    if self.current_tok.matches(TT_KEYWORD, 'not'):
      op_tok = self.current_tok
      res.register_advancement()
      self.advance()

      node = res.register(self.comp_expr())
      if res.error: return res
      return res.success(UnaryOpNode(op_tok, node))
    
    node = res.register(self.bin_op(self.arith_expr, (TT_EE, TT_NE, TT_LT, TT_GT, TT_LTE, TT_GTE)))
    
    if res.error:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        "Expected int, float, identifier, '+', '-', '(', '[', 'if', 'for', 'while', 'fun' or 'not'"
      ))

    return res.success(node)

  def arith_expr(self):
    return self.bin_op(self.term, (TT_PLUS, TT_MINUS))

  def term(self):
    return self.bin_op(self.factor, (TT_MUL, TT_DIV))

  def factor(self):
    res = ParseResult()
    tok = self.current_tok

    if tok.type in (TT_PLUS, TT_MINUS):
      res.register_advancement()
      self.advance()
      factor = res.register(self.factor())
      if res.error: return res
      return res.success(UnaryOpNode(tok, factor))

    return self.power()

  def power(self):
    return self.bin_op(self.call, (TT_POW, ), self.factor)

  def call(self):
    res = ParseResult()
    atom = res.register(self.atom())
    if res.error: return res

    if self.current_tok.type == TT_LPAREN:
      res.register_advancement()
      self.advance()
      arg_nodes = []

      if self.current_tok.type == TT_RPAREN:
        res.register_advancement()
        self.advance()
      else:
        arg_nodes.append(res.register(self.expr()))
        if res.error:
          return res.failure(InvalidSyntaxError(
            self.current_tok.pos_start, self.current_tok.pos_end,
            "Expected ')', 'var', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'NOT'"
          ))

        while self.current_tok.type == TT_COMMA:
          res.register_advancement()
          self.advance()

          arg_nodes.append(res.register(self.expr()))
          if res.error: return res

        if self.current_tok.type != TT_RPAREN:
          return res.failure(InvalidSyntaxError(
            self.current_tok.pos_start, self.current_tok.pos_end,
            f"Expected ',' or ')'"
          ))

        res.register_advancement()
        self.advance()
      return res.success(CallNode(atom, arg_nodes))
    return res.success(atom)

  def atom(self):
    res = ParseResult()
    tok = self.current_tok

    if tok.type in (TT_INT, TT_FLOAT):
      res.register_advancement()
      self.advance()
      return res.success(NumberNode(tok))

    elif tok.type == TT_STRING:
      res.register_advancement()
      self.advance()
      return res.success(StringNode(tok))

    elif tok.type == TT_IDENTIFIER:
      res.register_advancement()
      self.advance()
      return res.success(VarAccessNode(tok))

    elif tok.type == TT_LPAREN:
      res.register_advancement()
      self.advance()
      expr = res.register(self.expr())
      if res.error: return res
      if self.current_tok.type == TT_RPAREN:
        res.register_advancement()
        self.advance()
        return res.success(expr)
      else:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          "Expected ')'"
        ))

    elif tok.type == TT_LSQUARE:
      list_expr = res.register(self.list_expr())
      if res.error: return res
      return res.success(list_expr)
    
    elif tok.matches(TT_KEYWORD, 'if'):
      if_expr = res.register(self.if_expr())
      if res.error: return res
      return res.success(if_expr)

    elif tok.matches(TT_KEYWORD, 'for'):
      for_expr = res.register(self.for_expr())
      if res.error: return res
      return res.success(for_expr)

    elif tok.matches(TT_KEYWORD, 'while'):
      while_expr = res.register(self.while_expr())
      if res.error: return res
      return res.success(while_expr)

    elif tok.matches(TT_KEYWORD, 'fun'):
      func_def = res.register(self.func_def())
      if res.error: return res
      return res.success(func_def)

    return res.failure(InvalidSyntaxError(
      tok.pos_start, tok.pos_end,
      "Expected int, float, identifier, '+', '-', '(', '[', if', 'for', 'while', 'fun'"
    ))

  def list_expr(self):
    res = ParseResult()
    element_nodes = []
    pos_start = self.current_tok.pos_start.copy()

    if self.current_tok.type != TT_LSQUARE:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected '['"
      ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type == TT_RSQUARE:
      res.register_advancement()
      self.advance()
    else:
      element_nodes.append(res.register(self.expr()))
      if res.error:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          "Expected ']', 'var', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'not'"
        ))

      while self.current_tok.type == TT_COMMA:
        res.register_advancement()
        self.advance()

        element_nodes.append(res.register(self.expr()))
        if res.error: return res

      if self.current_tok.type != TT_RSQUARE:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected ',' or ']'"
        ))

      res.register_advancement()
      self.advance()

    return res.success(ListNode(
      element_nodes,
      pos_start,
      self.current_tok.pos_end.copy()
    ))

  def if_expr(self):
    res = ParseResult()
    all_cases = res.register(self.if_expr_cases('if'))
    if res.error: return res
    cases, else_case = all_cases
    return res.success(IfNode(cases, else_case))

  def if_expr_b(self):
    return self.if_expr_cases('elif')
    
  def if_expr_c(self):
    res = ParseResult()
    else_case = None

    if self.current_tok.matches(TT_KEYWORD, 'else'):
      res.register_advancement()
      self.advance()

      if self.current_tok.type == TT_NEWLINE:
        res.register_advancement()
        self.advance()

        statements = res.register(self.statements())
        if res.error: return res
        else_case = (statements, True)

        if self.current_tok.matches(TT_KEYWORD, 'end'):
          res.register_advancement()
          self.advance()
        else:
          return res.failure(InvalidSyntaxError(
            self.current_tok.pos_start, self.current_tok.pos_end,
            "Expected 'END'"
          ))
      else:
        expr = res.register(self.statement())
        if res.error: return res
        else_case = (expr, False)

    return res.success(else_case)

  def if_expr_b_or_c(self):
    res = ParseResult()
    cases, else_case = [], None

    if self.current_tok.matches(TT_KEYWORD, 'elif'):
      all_cases = res.register(self.if_expr_b())
      if res.error: return res
      cases, else_case = all_cases
    else:
      else_case = res.register(self.if_expr_c())
      if res.error: return res
    
    return res.success((cases, else_case))

  def if_expr_cases(self, case_keyword):
    res = ParseResult()
    cases = []
    else_case = None

    if not self.current_tok.matches(TT_KEYWORD, case_keyword):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected '{case_keyword}'"
      ))

    res.register_advancement()
    self.advance()

    condition = res.register(self.expr())
    if res.error: return res

    if not self.current_tok.matches(TT_KEYWORD, 'then'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'THEN'"
      ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type == TT_NEWLINE:
      res.register_advancement()
      self.advance()

      statements = res.register(self.statements())
      if res.error: return res
      cases.append((condition, statements, True))

      if self.current_tok.matches(TT_KEYWORD, 'end'):
        res.register_advancement()
        self.advance()
      else:
        all_cases = res.register(self.if_expr_b_or_c())
        if res.error: return res
        new_cases, else_case = all_cases
        cases.extend(new_cases)
    else:
      expr = res.register(self.statement())
      if res.error: return res
      cases.append((condition, expr, False))

      all_cases = res.register(self.if_expr_b_or_c())
      if res.error: return res
      new_cases, else_case = all_cases
      cases.extend(new_cases)

    return res.success((cases, else_case))

  def for_expr(self):
    res = ParseResult()

    if not self.current_tok.matches(TT_KEYWORD, 'for'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'FOR'"
      ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type != TT_IDENTIFIER:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected identifier"
      ))

    var_name = self.current_tok
    res.register_advancement()
    self.advance()

    if self.current_tok.type != TT_EQ:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected '='"
      ))
    
    res.register_advancement()
    self.advance()

    start_value = res.register(self.expr())
    if res.error: return res

    if not self.current_tok.matches(TT_KEYWORD, 'to'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'TO'"
      ))
    
    res.register_advancement()
    self.advance()

    end_value = res.register(self.expr())
    if res.error: return res

    if self.current_tok.matches(TT_KEYWORD, 'step'):
      res.register_advancement()
      self.advance()

      step_value = res.register(self.expr())
      if res.error: return res
    else:
      step_value = None

    if not self.current_tok.matches(TT_KEYWORD, 'then'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'THEN'"
      ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type == TT_NEWLINE:
      res.register_advancement()
      self.advance()

      body = res.register(self.statements())
      if res.error: return res

      if not self.current_tok.matches(TT_KEYWORD, 'end'):
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected 'END'"
        ))

      res.register_advancement()
      self.advance()

      return res.success(ForNode(var_name, start_value, end_value, step_value, body, True))
    
    body = res.register(self.statement())
    if res.error: return res

    return res.success(ForNode(var_name, start_value, end_value, step_value, body, False))

  def while_expr(self):
    res = ParseResult()

    if not self.current_tok.matches(TT_KEYWORD, 'while'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'WHILE'"
      ))

    res.register_advancement()
    self.advance()

    condition = res.register(self.expr())
    if res.error: return res

    if not self.current_tok.matches(TT_KEYWORD, 'then'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'THEN'"
      ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type == TT_NEWLINE:
      res.register_advancement()
      self.advance()

      body = res.register(self.statements())
      if res.error: return res

      if not self.current_tok.matches(TT_KEYWORD, 'end'):
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected 'END'"
        ))

      res.register_advancement()
      self.advance()

      return res.success(WhileNode(condition, body, True))
    
    body = res.register(self.statement())
    if res.error: return res

    return res.success(WhileNode(condition, body, False))

  def func_def(self):
    res = ParseResult()

    if not self.current_tok.matches(TT_KEYWORD, 'fun'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'fun'"
      ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type == TT_IDENTIFIER:
      var_name_tok = self.current_tok
      res.register_advancement()
      self.advance()
      if self.current_tok.type != TT_LPAREN:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected '('"
        ))
    else:
      var_name_tok = None
      if self.current_tok.type != TT_LPAREN:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected identifier or '('"
        ))
    
    res.register_advancement()
    self.advance()
    arg_name_toks = []

    if self.current_tok.type == TT_IDENTIFIER:
      arg_name_toks.append(self.current_tok)
      res.register_advancement()
      self.advance()
      
      while self.current_tok.type == TT_COMMA:
        res.register_advancement()
        self.advance()

        if self.current_tok.type != TT_IDENTIFIER:
          return res.failure(InvalidSyntaxError(
            self.current_tok.pos_start, self.current_tok.pos_end,
            f"Expected identifier"
          ))

        arg_name_toks.append(self.current_tok)
        res.register_advancement()
        self.advance()
      
      if self.current_tok.type != TT_RPAREN:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected ',' or ')'"
        ))
    else:
      if self.current_tok.type != TT_RPAREN:
        return res.failure(InvalidSyntaxError(
          self.current_tok.pos_start, self.current_tok.pos_end,
          f"Expected identifier or ')'"
        ))

    res.register_advancement()
    self.advance()

    if self.current_tok.type == TT_ARROW:
      res.register_advancement()
      self.advance()

      body = res.register(self.expr())
      if res.error: return res

      return res.success(FuncDefNode(
        var_name_tok,
        arg_name_toks,
        body,
        True
      ))
    
    if self.current_tok.type != TT_NEWLINE:
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected '->' or NEWLINE"
      ))

    res.register_advancement()
    self.advance()

    body = res.register(self.statements())
    if res.error: return res

    if not self.current_tok.matches(TT_KEYWORD, 'end'):
      return res.failure(InvalidSyntaxError(
        self.current_tok.pos_start, self.current_tok.pos_end,
        f"Expected 'END'"
      ))

    res.register_advancement()
    self.advance()
    
    return res.success(FuncDefNode(
      var_name_tok,
      arg_name_toks,
      body,
      False
    ))

  ###################################

  def bin_op(self, func_a, ops, func_b=None):
    if func_b == None:
      func_b = func_a
    
    res = ParseResult()
    left = res.register(func_a())
    if res.error: return res

    while self.current_tok.type in ops or (self.current_tok.type, self.current_tok.value) in ops:
      op_tok = self.current_tok
      res.register_advancement()
      self.advance()
      right = res.register(func_b())
      if res.error: return res
      left = BinOpNode(left, op_tok, right)

    return res.success(left)

#######################################
# RUNTIME RESULT
#######################################

class RTResult:
  def __init__(self):
    self.reset()

  def reset(self):
    self.value = None
    self.error = None
    self.func_return_value = None
    self.loop_should_continue = False
    self.loop_should_break = False

  def register(self, res):
    self.error = res.error
    self.func_return_value = res.func_return_value
    self.loop_should_continue = res.loop_should_continue
    self.loop_should_break = res.loop_should_break
    return res.value

  def success(self, value):
    self.reset()
    self.value = value
    return self

  def success_return(self, value):
    self.reset()
    self.func_return_value = value
    return self
  
  def success_continue(self):
    self.reset()
    self.loop_should_continue = True
    return self

  def success_break(self):
    self.reset()
    self.loop_should_break = True
    return self

  def failure(self, error):
    self.reset()
    self.error = error
    return self

  def should_return(self):
    # Note: this will allow you to continue and break outside the current function
    return (
      self.error or
      self.func_return_value or
      self.loop_should_continue or
      self.loop_should_break
    )

#######################################
# VALUES
#######################################

class Value:
  def __init__(self):
    self.set_pos()
    self.set_context()

  def set_pos(self, pos_start=None, pos_end=None):
    self.pos_start = pos_start
    self.pos_end = pos_end
    return self

  def set_context(self, context=None):
    self.context = context
    return self

  def added_to(self, other):
    return None, self.illegal_operation(other)

  def subbed_by(self, other):
    return None, self.illegal_operation(other)

  def multed_by(self, other):
    return None, self.illegal_operation(other)

  def dived_by(self, other):
    return None, self.illegal_operation(other)

  def powed_by(self, other):
    return None, self.illegal_operation(other)

  def get_comparison_eq(self, other):
    return None, self.illegal_operation(other)

  def get_comparison_ne(self, other):
    return None, self.illegal_operation(other)

  def get_comparison_lt(self, other):
    return None, self.illegal_operation(other)

  def get_comparison_gt(self, other):
    return None, self.illegal_operation(other)

  def get_comparison_lte(self, other):
    return None, self.illegal_operation(other)

  def get_comparison_gte(self, other):
    return None, self.illegal_operation(other)

  def anded_by(self, other):
    return None, self.illegal_operation(other)

  def ored_by(self, other):
    return None, self.illegal_operation(other)

  def notted(self, other):
    return None, self.illegal_operation(other)

  def execute(self, args):
    return RTResult().failure(self.illegal_operation())

  def copy(self):
    raise Exception('No copy method defined')

  def is_true(self):
    return False

  def illegal_operation(self, other=None):
    if not other: other = self
    return RTError(
      self.pos_start, other.pos_end,
      'Illegal operation',
      self.context
    )

class Number(Value):
  def __init__(self, value):
    super().__init__()
    self.value = value

  def added_to(self, other):
    if isinstance(other, Number):
      return Number(self.value + other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def subbed_by(self, other):
    if isinstance(other, Number):
      return Number(self.value - other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def multed_by(self, other):
    if isinstance(other, Number):
      return Number(self.value * other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def dived_by(self, other):
    if isinstance(other, Number):
      if other.value == 0:
        return None, RTError(
          other.pos_start, other.pos_end,
          'Division by zero',
          self.context
        )

      return Number(self.value / other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def powed_by(self, other):
    if isinstance(other, Number):
      return Number(self.value ** other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def get_comparison_eq(self, other):
    if isinstance(other, Number):
      return Number(int(self.value == other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def get_comparison_ne(self, other):
    if isinstance(other, Number):
      return Number(int(self.value != other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def get_comparison_lt(self, other):
    if isinstance(other, Number):
      return Number(int(self.value < other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def get_comparison_gt(self, other):
    if isinstance(other, Number):
      return Number(int(self.value > other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def get_comparison_lte(self, other):
    if isinstance(other, Number):
      return Number(int(self.value <= other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def get_comparison_gte(self, other):
    if isinstance(other, Number):
      return Number(int(self.value >= other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def anded_by(self, other):
    if isinstance(other, Number):
      return Number(int(self.value and other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def ored_by(self, other):
    if isinstance(other, Number):
      return Number(int(self.value or other.value)).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def notted(self):
    return Number(1 if self.value == 0 else 0).set_context(self.context), None

  def copy(self):
    copy = Number(self.value)
    copy.set_pos(self.pos_start, self.pos_end)
    copy.set_context(self.context)
    return copy

  def is_true(self):
    return self.value != 0

  def __str__(self):
    return str(self.value)
  
  def __repr__(self):
    return str(self.value)

Number.null = Number(0)
Number.false = Number(0)
Number.true = Number(1)
Number.math_PI = Number(math.pi)

class String(Value):
  def __init__(self, value):
    super().__init__()
    self.value = value

  def added_to(self, other):
    if isinstance(other, String):
      return String(self.value + other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def multed_by(self, other):
    if isinstance(other, Number):
      return String(self.value * other.value).set_context(self.context), None
    else:
      return None, Value.illegal_operation(self, other)

  def is_true(self):
    return len(self.value) > 0

  def copy(self):
    copy = String(self.value)
    copy.set_pos(self.pos_start, self.pos_end)
    copy.set_context(self.context)
    return copy

  def __str__(self):
    return self.value

  def __repr__(self):
    return f'"{self.value}"'

class List(Value):
  def __init__(self, elements):
    super().__init__()
    self.elements = elements

  def added_to(self, other):
    new_list = self.copy()
    new_list.elements.append(other)
    return new_list, None

  def subbed_by(self, other):
    if isinstance(other, Number):
      new_list = self.copy()
      try:
        new_list.elements.pop(other.value)
        return new_list, None
      except:
        return None, RTError(
          other.pos_start, other.pos_end,
          'Element at this index could not be removed from list because index is out of bounds',
          self.context
        )
    else:
      return None, Value.illegal_operation(self, other)

  def multed_by(self, other):
    if isinstance(other, List):
      new_list = self.copy()
      new_list.elements.extend(other.elements)
      return new_list, None
    else:
      return None, Value.illegal_operation(self, other)

  def dived_by(self, other):
    if isinstance(other, Number):
      try:
        return self.elements[other.value], None
      except:
        return None, RTError(
          other.pos_start, other.pos_end,
          'Element at this index could not be retrieved from list because index is out of bounds',
          self.context
        )
    else:
      return None, Value.illegal_operation(self, other)
  
  def copy(self):
    copy = List(self.elements)
    copy.set_pos(self.pos_start, self.pos_end)
    copy.set_context(self.context)
    return copy

  def __str__(self):
    return ", ".join([str(x) for x in self.elements])

  def __repr__(self):
    return f'[{", ".join([repr(x) for x in self.elements])}]'

class BaseFunction(Value):
  def __init__(self, name):
    super().__init__()
    self.name = name or "<anonymous>"

  def generate_new_context(self):
    new_context = Context(self.name, self.context, self.pos_start)
    new_context.symbol_table = SymbolTable(new_context.parent.symbol_table)
    return new_context

  def check_args(self, arg_names, args):
    res = RTResult()

    if len(args) > len(arg_names):
      return res.failure(RTError(
        self.pos_start, self.pos_end,
        f"{len(args) - len(arg_names)} too many args passed into {self}",
        self.context
      ))
    
    if len(args) < len(arg_names):
      return res.failure(RTError(
        self.pos_start, self.pos_end,
        f"{len(arg_names) - len(args)} too few args passed into {self}",
        self.context
      ))

    return res.success(None)

  def populate_args(self, arg_names, args, exec_ctx):
    for i in range(len(args)):
      arg_name = arg_names[i]
      arg_value = args[i]
      arg_value.set_context(exec_ctx)
      exec_ctx.symbol_table.set(arg_name, arg_value)

  def check_and_populate_args(self, arg_names, args, exec_ctx):
    res = RTResult()
    res.register(self.check_args(arg_names, args))
    if res.should_return(): return res
    self.populate_args(arg_names, args, exec_ctx)
    return res.success(None)

class Function(BaseFunction):
  def __init__(self, name, body_node, arg_names, should_auto_return):
    super().__init__(name)
    self.body_node = body_node
    self.arg_names = arg_names
    self.should_auto_return = should_auto_return

  def execute(self, args):
    res = RTResult()
    interpreter = Interpreter()
    exec_ctx = self.generate_new_context()

    res.register(self.check_and_populate_args(self.arg_names, args, exec_ctx))
    if res.should_return(): return res

    value = res.register(interpreter.visit(self.body_node, exec_ctx))
    if res.should_return() and res.func_return_value == None: return res

    ret_value = (value if self.should_auto_return else None) or res.func_return_value or Number.null
    return res.success(ret_value)

  def copy(self):
    copy = Function(self.name, self.body_node, self.arg_names, self.should_auto_return)
    copy.set_context(self.context)
    copy.set_pos(self.pos_start, self.pos_end)
    return copy

  def __repr__(self):
    return f"<function {self.name}>"

class BuiltInFunction(BaseFunction):
  def __init__(self, name):
    super().__init__(name)

  def execute(self, args):
    res = RTResult()
    exec_ctx = self.generate_new_context()

    method_name = f'execute_{self.name}'
    method = getattr(self, method_name, self.no_visit_method)
    # Flexible arity support: methods may define min_args/max_args; defaults to exact len(arg_names)
    arg_names = getattr(method, 'arg_names', []) or []
    min_args = getattr(method, 'min_args', len(arg_names))
    max_args = getattr(method, 'max_args', len(arg_names))
    if len(args) < min_args:
      return res.failure(RTError(
        self.pos_start, self.pos_end,
        f"{min_args - len(args)} too few args passed into {self}",
        self.context
      ))
    if len(args) > max_args:
      return res.failure(RTError(
        self.pos_start, self.pos_end,
        f"{len(args) - max_args} too many args passed into {self}",
        self.context
      ))
    # Populate only provided args
    for i in range(min(len(args), len(arg_names))):
      arg_value = args[i]
      arg_value.set_context(exec_ctx)
      exec_ctx.symbol_table.set(arg_names[i], arg_value)

    return_value = res.register(method(exec_ctx))
    if res.should_return(): return res
    return res.success(return_value)
  
  def no_visit_method(self, node, context):
    raise Exception(f'No execute_{self.name} method defined')

  def copy(self):
    copy = BuiltInFunction(self.name)
    copy.set_context(self.context)
    copy.set_pos(self.pos_start, self.pos_end)
    return copy

  def __repr__(self):
    return f"<built-in function {self.name}>"

  #####################################

  def execute_print(self, exec_ctx):
    print(str(exec_ctx.symbol_table.get('value')))
    return RTResult().success(Number.null)
  execute_print.arg_names = ['value']
  
  def execute_print_ret(self, exec_ctx):
    return RTResult().success(String(str(exec_ctx.symbol_table.get('value'))))
  execute_print_ret.arg_names = ['value']

  def execute_pyexe(self, exec_ctx):
    print(str(exec_ctx.symbol_table.get('value')))
    exec(str(exec_ctx.symbol_table.get('value')))
    return RTResult().success(String('1'))
  execute_pyexe.arg_names = ['value']
  
  def execute_input(self, exec_ctx):
    text = input()
    return RTResult().success(String(text))
  execute_input.arg_names = []

  def execute_input_int(self, exec_ctx):
    while True:
      text = input()
      try:
        number = int(text)
        break
      except ValueError:
        print(f"'{text}' must be an integer. Try again!")
    return RTResult().success(Number(number))
  execute_input_int.arg_names = []

  def execute_clear(self, exec_ctx):
    os.system('cls' if os.name == 'nt' else 'cls') 
    return RTResult().success(Number.null)
  execute_clear.arg_names = []

  def execute_is_number(self, exec_ctx):
    is_number = isinstance(exec_ctx.symbol_table.get("value"), Number)
    return RTResult().success(Number.true if is_number else Number.false)
  execute_is_number.arg_names = ["value"]

  def execute_is_string(self, exec_ctx):
    is_number = isinstance(exec_ctx.symbol_table.get("value"), String)
    return RTResult().success(Number.true if is_number else Number.false)
  execute_is_string.arg_names = ["value"]

  def execute_is_list(self, exec_ctx):
    is_number = isinstance(exec_ctx.symbol_table.get("value"), List)
    return RTResult().success(Number.true if is_number else Number.false)
  execute_is_list.arg_names = ["value"]

  def execute_is_function(self, exec_ctx):
    is_number = isinstance(exec_ctx.symbol_table.get("value"), BaseFunction)
    return RTResult().success(Number.true if is_number else Number.false)
  execute_is_function.arg_names = ["value"]

  def execute_append(self, exec_ctx):
    list_ = exec_ctx.symbol_table.get("list")
    value = exec_ctx.symbol_table.get("value")

    if not isinstance(list_, List):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "First argument must be list",
        exec_ctx
      ))

    list_.elements.append(value)
    return RTResult().success(Number.null)
  execute_append.arg_names = ["list", "value"]

  def execute_pop(self, exec_ctx):
    list_ = exec_ctx.symbol_table.get("list")
    index = exec_ctx.symbol_table.get("index")

    if not isinstance(list_, List):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "First argument must be list",
        exec_ctx
      ))

    if not isinstance(index, Number):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Second argument must be number",
        exec_ctx
      ))

    try:
      element = list_.elements.pop(index.value)
    except:
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        'Element at this index could not be removed from list because index is out of bounds',
        exec_ctx
      ))
    return RTResult().success(element)
  execute_pop.arg_names = ["list", "index"]

  def execute_extend(self, exec_ctx):
    listA = exec_ctx.symbol_table.get("listA")
    listB = exec_ctx.symbol_table.get("listB")

    if not isinstance(listA, List):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "First argument must be list",
        exec_ctx
      ))

    if not isinstance(listB, List):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Second argument must be list",
        exec_ctx
      ))

    listA.elements.extend(listB.elements)
    return RTResult().success(Number.null)
  execute_extend.arg_names = ["listA", "listB"]

  def execute_len(self, exec_ctx):
    list_ = exec_ctx.symbol_table.get("list")

    if not isinstance(list_, List):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Argument must be list",
        exec_ctx
      ))

    return RTResult().success(Number(len(list_.elements)))
  execute_len.arg_names = ["list"]

  def execute_pow_mine(self, exec_ctx):
    data_val = exec_ctx.symbol_table.get("data")
    diff_val = exec_ctx.symbol_table.get("difficulty")
    if not isinstance(data_val, String):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "First argument must be string",
        exec_ctx
      ))
    if not isinstance(diff_val, Number):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Second argument must be number",
        exec_ctx
      ))
    difficulty_bits = int(diff_val.value)
    if difficulty_bits < 0 or difficulty_bits > 256:
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Difficulty must be between 0 and 256 bits",
        exec_ctx
      ))
    # Rust-like PoW: leading zero bits target
    # target = 2^(256 - difficulty)
    if difficulty_bits == 0:
      target = 1 << 256
    else:
      target = 1 << (256 - difficulty_bits)
    max_nonce = 1000000  # safety cap
    start_time = time.time()
    found_nonce = -1
    found_hash = ''
    iterations = 0
    data_bytes = data_val.value.encode('utf-8')
    # Progress settings: aim ~30 updates max
    progress_interval = max(1, max_nonce // 30)
    print(f"PoW start: bits={difficulty_bits}, max_nonce={max_nonce}")
    for nonce in range(max_nonce):
      iterations = nonce + 1
      content = data_bytes + str(nonce).encode('utf-8')
      digest_bytes = hashlib.sha256(content).digest()
      digest_int = int.from_bytes(digest_bytes, 'big')
      if digest_int < target:
        found_nonce = nonce
        found_hash = digest_bytes.hex()
        break
      if iterations % progress_interval == 0:
        elapsed_so_far = time.time() - start_time
        rate = iterations / elapsed_so_far if elapsed_so_far > 0 else 0.0
        print(f"PoW progress: iter={iterations}, rate={int(rate)} H/s")
    elapsed = time.time() - start_time
    if found_nonce == -1:
      # return [-1, last_hash, iterations, elapsed]
      if iterations:
        rate = iterations / elapsed if elapsed > 0 else 0.0
      else:
        rate = 0.0
      print(f"PoW not found within max_nonce. iterations={iterations}, elapsed={elapsed:.3f}s, rate={int(rate)} H/s")
      print(f"PoW result: [nonce, hash, iterations, elapsed] = [{found_nonce}, {digest_bytes.hex()}, {iterations}, {elapsed:.3f}]")
      # Surface to shell panel
      try:
        if CURRENT_TRACE is not None:
          CURRENT_TRACE.execution['pow'] = {
            'bits': difficulty_bits,
            'nonce': found_nonce,
            'hash': digest_bytes.hex(),
            'iterations': iterations,
            'elapsed': elapsed
          }
      except Exception:
        pass
      return RTResult().success(List([
        Number(found_nonce),
        String(digest_bytes.hex()),
        Number(iterations),
        Number(elapsed)
      ]))
    else:
      rate = iterations / elapsed if elapsed > 0 else 0.0
      print(f"PoW found: nonce={found_nonce}, hash={found_hash[:16]}..., iterations={iterations}, elapsed={elapsed:.3f}s, rate={int(rate)} H/s")
      print(f"PoW result: [nonce, hash, iterations, elapsed] = [{found_nonce}, {found_hash}, {iterations}, {elapsed:.3f}]")
      # Surface to shell panel
      try:
        if CURRENT_TRACE is not None:
          CURRENT_TRACE.execution['pow'] = {
            'bits': difficulty_bits,
            'nonce': found_nonce,
            'hash': found_hash,
            'iterations': iterations,
            'elapsed': elapsed
          }
      except Exception:
        pass
      return RTResult().success(List([
        Number(found_nonce),
        String(found_hash),
        Number(iterations),
        Number(elapsed)
      ]))
  execute_pow_mine.arg_names = ["data", "difficulty"]

  def execute_pow_config(self, exec_ctx):
    global POW_ALWAYS, POW_BITS
    enable_val = exec_ctx.symbol_table.get("enable")
    bits_val = exec_ctx.symbol_table.get("bits")
    if not isinstance(enable_val, Number) or not isinstance(bits_val, Number):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Arguments must be numbers: enable(0/1), bits",
        exec_ctx
      ))
    POW_ALWAYS = bool(int(enable_val.value))
    POW_BITS = int(bits_val.value)
    print(f"PoW(auto) {'enabled' if POW_ALWAYS else 'disabled'} with bits={POW_BITS}")
    return RTResult().success(Number.true if POW_ALWAYS else Number.false)
  execute_pow_config.arg_names = ["enable", "bits"]

  def execute_pow_set_max_nonce(self, exec_ctx):
    global POW_MAX_NONCE
    max_val = exec_ctx.symbol_table.get("max_nonce")
    if not isinstance(max_val, Number):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Argument must be number: max_nonce",
        exec_ctx
      ))
    POW_MAX_NONCE = max(1, int(max_val.value))
    print(f"PoW(auto) max_nonce set to {POW_MAX_NONCE}")
    return RTResult().success(Number(POW_MAX_NONCE))
  execute_pow_set_max_nonce.arg_names = ["max_nonce"]

  def execute_help(self, exec_ctx):
    # Pretty, boxed, terminal-width aware help for keywords and built-ins
    def _cols(default: int = 80) -> int:
      try:
        return os.get_terminal_size().columns
      except Exception:
        return default
    width = max(60, _cols())
    inner = max(40, width - 2)

    def _wrap(text: str, maxw: int):
      text = str(text)
      out = []
      s = text.strip()
      while len(s) > maxw:
        cut = s.rfind(' ', 0, maxw)
        if cut <= 0:
          cut = maxw
        out.append(s[:cut])
        s = s[cut:].lstrip()
      if s:
        out.append(s)
      return out

    def _grid_lines(items):
      items = [str(x) for x in items]
      if not items:
        return []
      max_len = max(len(x) for x in items)
      col_w = min(max_len + 2, max(10, inner // 2))
      cols = max(1, inner // col_w)
      rows = (len(items) + cols - 1) // cols
      lines = []
      for r in range(rows):
        parts = []
        for c in range(cols):
          idx = c * rows + r
          if idx < len(items):
            parts.append(items[idx].ljust(col_w))
        line = ''.join(parts).rstrip()
        lines.append(line)
      return lines

    def _box(title: str, lines: list):
      title = f" {title} "
      if len(title) > inner:
        title = title[:inner]
      side = (inner - len(title)) // 2
      # Rounded-style with section separators
      print("╭" + ("─" * side) + title + ("─" * (inner - side - len(title))) + "╮")
      # Add a subtle header underline
      print("│" + (" " * inner) + "│")
      for ln in lines:
        if ln.strip().endswith(":") and len(ln.strip()) < inner - 2:
          # section title inside box
          label = " " + ln.strip() + " "
          side2 = max(0, (inner - len(label)) // 2)
          print("│" + ("─" * side2) + label + ("─" * (inner - side2 - len(label))) + "│")
        else:
          for piece in _wrap(ln, inner):
            print("│" + piece.ljust(inner) + "│")
      print("╰" + ("─" * inner) + "╯")

    # Build categorized sections or detailed topic help
    topic_val = exec_ctx.symbol_table.get("topic")

    # Topic docs registry
    DOCS = {
      'if': (
        'Keyword: if',
        'Syntax:\n  if CONDITION then\n    STATEMENTS\n  elif CONDITION then\n    ...\n  else\n    ...\n  end\n\nExample:\n  var x = 5\n  if x > 3 then\n    show("gt")\n  else\n    show("le")\n  end'
      ),
      'for': (
        'Keyword: for',
        'Syntax:\n  for i = START to END step STEP then\n    BODY\n  end\n\nExample:\n  for i = 0 to 3 then\n    show(i)\n  end'
      ),
      'while': (
        'Keyword: while',
        'Syntax:\n  while CONDITION then\n    BODY\n  end'
      ),
      'fun': (
        'Keyword: fun',
        'Syntax:\n  fun name(args) -> expr\n  fun name(args)\n    body\n  end'
      ),
      'show': (
        'Function: show(value)',
        'Prints value to stdout.\nExample:\n  show("hi")'
      ),
      'print_ret': (
        'Function: print_ret(value)',
        'Returns a string of value without printing.\nExample:\n  var s = print_ret(123)'
      ),
      'clear': (
        'Function: clear()',
        'Clears the terminal (Windows: cls, Unix: clear). Alias: clr()'
      ),
      'ava_exec': (
        'Function: ava_exec(path)',
        'Runs a .x3 script file. Requires header with pk.\nExample:\n  ava_exec("code/example.ava")'
      ),
      'pow_mine': (
        'Function: pow_mine(data, bits)',
        'Finds a nonce such that sha256(data+nonce) has leading zero bits. Returns [nonce, hash, iter, time].'
      ),
      'pow_cfg': (
        'Function: pow_cfg(enable, bits)',
        'Enable automatic PoW after each execution.'
      ),
      'pow_max_nonce': (
        'Function: pow_max_nonce(n)',
        'Set max nonce for auto PoW.'
      ),
      'help': (
        'Function: help([topic])',
        'Without args shows categories. With a topic (e.g., "if" or "show") shows details.'
      ),
      'exit': (
        'Function: exit([code])',
        'Exit the REPL with optional status code.'
      ),
      'code_convert': (
        'Function: code_convert(path, lang, [api_key])',
        'Convert a .ava (or text) file into another language and write it next to the source.\n'
        'Args:\n'
        '  path: String – path to the input file (e.g., "./program.ava").\n'
        '  lang: String – target language: "solidity"|"rust" (aliases: "sol"|"rs").\n'
        '  api_key: Optional String – Groq key to use for this conversion.\n'
        'Returns: String – output file path (.sol for Solidity, .rs for Rust).'
      ),
      'code_convert_project': (
        'Function: code_convert_project(path, lang, project_root, [api_key], [preset], [overwrite])',
        'Generate a full, deploy-ready project from input code.\n'
        'Args:\n'
        '  path: String – path to input code file (.ava or text).\n'
        '  lang: String – target language: "solidity"|"rust" (aliases: "sol"|"rs").\n'
        '  project_root: String – directory to write the project into.\n'
        '  api_key: Optional String – Groq key for this conversion.\n'
        '  preset: Optional String – project preset (default by lang). For Solidity uses "solidity-hardhat"; for Rust "rust-cargo".\n'
        '  overwrite: Optional Number – 1 to overwrite existing files, 0 otherwise.\n'
        'Returns: String – JSON string with projectType, projectRoot, writtenFiles, nextSteps.'
      ),
      'deploy': (
        'Function: deploy(path, private_key, api_key, [rpc_url], [contract_name], [constructor_args])',
        'Compile & deploy a Solidity contract from an .ava source file.\n'
        'Steps: convert Ava -> Solidity using LLM, then compile & deploy.\n'
        'Args:\n'
        '  path: String – input .ava file path.\n'
        '  private_key: String – hex private key of deployer (0x or raw).\n'
        '  api_key: String – Groq API key used for conversion.\n'
        '  rpc_url: Optional String – EVM RPC endpoint (defaults to a public Sepolia RPC).\n'
        '  contract_name: Optional String – specific contract to deploy (if multiple).\n'
        '  constructor_args: Optional List – args for constructor (JSON-like).\n'
        'Returns: JSON string with address, abi, txHash, contractName, chainId.'
      ),
    }

    def _show_topic(topic: str):
      title, body = DOCS.get(topic, (None, None))
      if not title:
        return False
      _box(title, _wrap(body, inner))
      return True

    if topic_val is not None and not isinstance(topic_val, Number):
      # Accept String or BuiltInFunction
      topic_key = None
      if isinstance(topic_val, String):
        topic_key = topic_val.value
      elif isinstance(topic_val, BuiltInFunction):
        topic_key = topic_val.name
      elif isinstance(topic_val, Function):
        topic_key = topic_val.name
      if topic_key and _show_topic(topic_key):
        return RTResult().success(Number.null)

    # Categorized overview
    kw_core = ['var','if','elif','else','then','end','for','to','step','while','fun','return','continue','break','and','or','not']
    kw_lines = _grid_lines(sorted(kw_core))

    io_funcs = ['show','print_ret','input','input_int','clear','clr']
    list_funcs = ['add','pop','extend','len']
    type_funcs = ['is_num','is_str','is_list','is_fun']
    sys_funcs = ['ava_exec','help','exit','code_convert','code_convert_project','deploy']
    pow_funcs = ['pow_mine','pow_cfg','pow_max_nonce']

    content = []
    content.append('Keywords:')
    content.extend(kw_lines)
    content.append('')
    content.append('Functions (I/O):')
    content.extend(_grid_lines([f for f in io_funcs if f in global_symbol_table.symbols]))
    content.append('Functions (List):')
    content.extend(_grid_lines([f for f in list_funcs if f in global_symbol_table.symbols]))
    content.append('Functions (Type):')
    content.extend(_grid_lines([f for f in type_funcs if f in global_symbol_table.symbols]))
    content.append('Functions (System):')
    content.extend(_grid_lines([f for f in sys_funcs if f in global_symbol_table.symbols]))
    content.append('Functions (PoW):')
    content.extend(_grid_lines([f for f in pow_funcs if f in global_symbol_table.symbols]))
    content.append('')
    content.extend(_wrap('Tip: use show(value) to print, ava_exec("file.x3") to run a script. Try help("if") or help("show").', inner))

    _box('ava Language Help', content)
    return RTResult().success(Number.null)
  execute_help.arg_names = ["topic"]
  execute_help.min_args = 0
  execute_help.max_args = 1

  def execute_exit(self, exec_ctx):
    code_val = exec_ctx.symbol_table.get("code")
    try:
      code = int(code_val.value) if isinstance(code_val, Number) else 0
    except Exception:
      code = 0
    print("Goodbye.")
    sys.exit(code)
  execute_exit.arg_names = ["code"]
  execute_exit.min_args = 0
  execute_exit.max_args = 1

  def execute_code_convert(self, exec_ctx):
    """
    code_convert(path, lang, [api_key]) -> String

    Convert a .ava (or text) file into another language and write the converted
    code next to the source file. Returns the output file path.

    - path: String – input file path
    - lang: String – "solidity"|"rust" (aliases: "sol"|"rs")
    - api_key: Optional String – Groq key; if provided, used for this conversion
    """
    if llm_convertor is None:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, f"LLM module unavailable: {_LLM_IMPORT_ERROR}", exec_ctx))

    path_val = exec_ctx.symbol_table.get("path")
    lang_val = exec_ctx.symbol_table.get("lang")
    api_key_val = exec_ctx.symbol_table.get("api_key")

    if not isinstance(path_val, String) or not isinstance(lang_val, String):
      return RTResult().failure(RTError(self.pos_start, self.pos_end, "Arguments must be: path(string), lang(string), [api_key(string)]", exec_ctx))

    input_path = path_val.value
    lang = lang_val.value
    api_key = api_key_val.value if isinstance(api_key_val, String) else None
    if not api_key:
      # Fallback to environment if not provided
      api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, "Missing api_key: pass as sixth argument or set GROQ_API_KEY env var", exec_ctx))

    try:
      out_path = llm_convertor.code_convert(input_path, lang, api_key=api_key)
      return RTResult().success(String(out_path))
    except Exception as e:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, str(e), exec_ctx))
  execute_code_convert.arg_names = ["path", "lang", "api_key"]
  execute_code_convert.min_args = 2
  execute_code_convert.max_args = 3

  def execute_deploy(self, exec_ctx):
    """
    deploy(path, private_key, api_key, [rpc_url], [contract_name], [constructor_args]) -> String(JSON)

    Convert Ava source to Solidity via LLM, then compile & deploy to EVM.
    Returns JSON string of deployment info.
    """
    if llm_convertor is None:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, f"LLM module unavailable: {_LLM_IMPORT_ERROR}", exec_ctx))
    if deploy_contract_from_source is None:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, f"Deploy module unavailable: {_DEPLOY_IMPORT_ERROR}", exec_ctx))

    # Positional order: path, private_key, api_key, [rpc_url], [contract_name], [constructor_args]
    path_val = exec_ctx.symbol_table.get("path")
    pk_val = exec_ctx.symbol_table.get("private_key")
    api_key_val = exec_ctx.symbol_table.get("api_key")
    rpc_val = exec_ctx.symbol_table.get("rpc_url")
    name_val = exec_ctx.symbol_table.get("contract_name")
    ctor_val = exec_ctx.symbol_table.get("constructor_args")

    if not isinstance(path_val, String) or not isinstance(pk_val, String) or not isinstance(api_key_val, String):
      return RTResult().failure(RTError(self.pos_start, self.pos_end, "Arguments must be: path(string), private_key(string), api_key(string), [rpc_url(string)], [contract_name(string)], [constructor_args(list)]", exec_ctx))

    input_path = path_val.value
    rpc_url = rpc_val.value if isinstance(rpc_val, String) else DEFAULT_EVM_RPC
    private_key = pk_val.value
    contract_name = name_val.value if isinstance(name_val, String) else None
    # Constructor args can be a List Value or omitted
    ctor_args_py = []
    if isinstance(ctor_val, List):
      # Convert Ava List of Values -> plain Python types
      ctor_args_py = [value_to_python(e) for e in ctor_val.elements]
    api_key = api_key_val.value

    # Read .ava and convert to Solidity string
    try:
      if not os.path.isfile(input_path):
        return RTResult().failure(RTError(self.pos_start, self.pos_end, f"Input file not found: {input_path}", exec_ctx))
      with open(input_path, 'r', encoding='utf-8') as fh:
        ava_src = fh.read()
      solidity_src = llm_convertor.convert_code_to_language(ava_src, "solidity", api_key=api_key)
      # Basic sanity for pragma; add default if missing
      if "pragma solidity" not in solidity_src:
        solidity_src = "pragma solidity ^0.8.20;\n\n" + solidity_src
        
      print(solidity_src)
      # If the LLM produced a snippet (no contract/library/interface), wrap it in a minimal contract
      low = solidity_src.lower()
      if ("contract " not in low) and ("library " not in low) and ("interface " not in low):
        lines = solidity_src.splitlines()
        header, body = [], []
        for ln in lines:
          ln_stripped = ln.strip()
          if ln_stripped.startswith("// SPDX-") or ln_stripped.startswith("pragma ") or ln_stripped.startswith("import ") or ln_stripped == "":
            header.append(ln)
          else:
            body.append(ln)
        if not body:
          body = ["// TODO: add contract members"]
        solidity_src = "\n".join(header).rstrip() + ("\n\n" if header else "") + "contract Contract {\n" + "\n".join(body) + "\n}\n"
    except Exception as e:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, f"Conversion failed: {e}", exec_ctx))

    # Deploy
    try:
      info = deploy_contract_from_source(
        solidity_source=solidity_src,
        rpc_url=rpc_url,
        private_key=private_key,
        contract_name=contract_name,
        constructor_args=ctor_args_py,
      )
      return RTResult().success(String(json.dumps(info)))
    except Exception as e:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, str(e), exec_ctx))
  execute_deploy.arg_names = ["path", "private_key", "api_key", "rpc_url", "contract_name", "constructor_args"]
  execute_deploy.min_args = 3
  execute_deploy.max_args = 6

  def execute_code_convert_project(self, exec_ctx):
    """
    code_convert_project(path, lang, project_root, [api_key], [preset], [overwrite]) -> String(JSON)

    Generate a full, deploy-ready project and return a JSON string describing
    the output (projectType, projectRoot, writtenFiles, nextSteps).
    """
    if llm_convertor is None:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, f"LLM module unavailable: {_LLM_IMPORT_ERROR}", exec_ctx))

    path_val = exec_ctx.symbol_table.get("path")
    lang_val = exec_ctx.symbol_table.get("lang")
    root_val = exec_ctx.symbol_table.get("project_root")
    api_key_val = exec_ctx.symbol_table.get("api_key")
    preset_val = exec_ctx.symbol_table.get("preset")
    overwrite_val = exec_ctx.symbol_table.get("overwrite")

    if not isinstance(path_val, String) or not isinstance(lang_val, String) or not isinstance(root_val, String):
      return RTResult().failure(RTError(self.pos_start, self.pos_end, "Arguments must be: path(string), lang(string), project_root(string), [api_key(string)], [preset(string)], [overwrite(number)]", exec_ctx))

    input_path = path_val.value
    lang = lang_val.value
    project_root = root_val.value
    api_key = api_key_val.value if isinstance(api_key_val, String) else None
    preset = preset_val.value if isinstance(preset_val, String) else None
    overwrite = bool(int(overwrite_val.value)) if isinstance(overwrite_val, Number) else False

    try:
      info = llm_convertor.code_convert_project(
        input_path=input_path,
        target_language=lang,
        project_root=project_root,
        api_key=api_key,
        preset=preset,
        overwrite=overwrite,
      )
      return RTResult().success(String(json.dumps(info)))
    except Exception as e:
      return RTResult().failure(RTError(self.pos_start, self.pos_end, str(e), exec_ctx))
  execute_code_convert_project.arg_names = ["path", "lang", "project_root", "api_key", "preset", "overwrite"]
  execute_code_convert_project.min_args = 3
  execute_code_convert_project.max_args = 6

  def execute_run(self, exec_ctx):
    global W3, CONTRACT_ADDRESS, ABI_OF_CONTRACT, IS_WEB3, PRIVATE_KEY, PYDATA, PROVIDER, POW_ALWAYS, POW_BITS, CURRENT_TRACE

    fn = exec_ctx.symbol_table.get("fn")

    if not isinstance(fn, String):
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        "Second argument must be string",
        exec_ctx
      ))

    fn = fn.value

    try:
      with open(fn, "r") as f:
        script = f.read()
      firstHash = False
      header_json = {}
      for i in script.split('\n'):
        i = i.strip()
        if '#' in i and i.startswith('#'):
          firstHash=True
          raw = i.replace("#", "").strip()
          parsed = None
          # Try strict JSON first
          try:
            parsed = json.loads(raw)
          except Exception:
            # Fallback 1: Python literal (allows single quotes, trailing commas)
            try:
              parsed = ast.literal_eval(raw)
            except Exception:
              # Fallback 2: normalize booleans/null and trailing commas, then literal_eval
              try:
                norm = raw
                # Replace JSON booleans/null with Python
                norm = re.sub(r"\btrue\b", "True", norm)
                norm = re.sub(r"\bfalse\b", "False", norm)
                norm = re.sub(r"\bnull\b", "None", norm)
                # Remove trailing commas before } or ]
                norm = re.sub(r",\s*([}\]])", r"\1", norm)
                parsed = ast.literal_eval(norm)
              except Exception:
                parsed = None
              
          if isinstance(parsed, dict):
            PYDATA = parsed
            header_json = dict(PYDATA)
            # Enforce required header fieldss
            if not header_json.get('pk'):
              # attach header so shell can still read toggles
              try:
                if CURRENT_TRACE is not None:
                  CURRENT_TRACE.execution.setdefault('header', {})
                  CURRENT_TRACE.execution['header'].update(header_json)
              except Exception:
                return RTResult().failure(RTError(
                  self.pos_start, self.pos_end,
                  "Error in parsing header",
                  exec_ctx
                ))
            # Assign private key
            try:
              global PRIVATE_KEY
              PRIVATE_KEY = str(header_json.get('pk'))
            except Exception:
              pass
            # Optional toggles
            if 'pow_always' in header_json:
              POW_ALWAYS = bool(header_json.get('pow_always'))
            if 'pow_bits' in header_json:
              try:
                POW_BITS = int(header_json.get('pow_bits'))
              except Exception:
                POW_BITS = 0
          # Stop after first header line
          if firstHash:
            break
      # Enforce pk required for any ava_exec run
      if not header_json.get('pk'):
        # attach header to outer trace for shell toggles even on error
        try:
          if CURRENT_TRACE is not None:
            CURRENT_TRACE.execution.setdefault('header', {})
            CURRENT_TRACE.execution['header'].update(header_json)
        except Exception:
          pass
        return RTResult().failure(RTError(
          self.pos_start, self.pos_end,
          "Missing required 'pk' in header",
          exec_ctx
        ))
    except Exception as e:
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        f"Failed to load script \"{fn}\"\n" + str(e),
        exec_ctx
      ))

    result_obj, error = run(fn, script)
    # Attach header JSON to trace for shell visibility toggles and propagate PoW info from inner run
    try:
      if isinstance(result_obj, dict):
        result_obj.setdefault('trace', {}).setdefault('execution', {})['header'] = header_json
      # Also attach header to the outer trace so the shell can read it from the top-level run
      if CURRENT_TRACE is not None:
        CURRENT_TRACE.execution.setdefault('header', {})
        CURRENT_TRACE.execution['header'].update(header_json)
        # Propagate PoW from inner run so shell can render the PoW panel at top-level
        inner_pow = None
        if isinstance(result_obj, dict):
          inner_pow = result_obj.get('pow') or result_obj.get('trace', {}).get('execution', {}).get('pow')
        if inner_pow:
          CURRENT_TRACE.execution['pow'] = inner_pow
      # Echo inner script's stdout to current (outer) captured stdout so terminal shows file's show() output
      inner_stdout = ""
      if isinstance(result_obj, dict):
        inner_stdout = result_obj.get('stdout') or result_obj.get('trace', {}).get('execution', {}).get('stdout') or ""
      if inner_stdout:
        print(inner_stdout, end='')
    except Exception:
      pass
    
    if error:
      return RTResult().failure(RTError(
        self.pos_start, self.pos_end,
        f"Failed to finish executing script \"{fn}\"\n" +
        error.as_string(),
        exec_ctx
      ))

    return RTResult().success(Number.null)
  execute_run.arg_names = ["fn"]

BuiltInFunction.print       = BuiltInFunction("print")
BuiltInFunction.pyexe       = BuiltInFunction("pyexe")
BuiltInFunction.print_ret   = BuiltInFunction("print_ret")
BuiltInFunction.input       = BuiltInFunction("input")
BuiltInFunction.input_int   = BuiltInFunction("input_int")
BuiltInFunction.clear       = BuiltInFunction("clear")
BuiltInFunction.is_number   = BuiltInFunction("is_number")
BuiltInFunction.is_string   = BuiltInFunction("is_string")
BuiltInFunction.is_list     = BuiltInFunction("is_list")
BuiltInFunction.is_function = BuiltInFunction("is_function")
BuiltInFunction.append      = BuiltInFunction("append")
BuiltInFunction.pop         = BuiltInFunction("pop")
BuiltInFunction.extend      = BuiltInFunction("extend")
BuiltInFunction.len					= BuiltInFunction("len")
BuiltInFunction.run					= BuiltInFunction("run")
BuiltInFunction.pow_mine       = BuiltInFunction("pow_mine")
BuiltInFunction.pow_config     = BuiltInFunction("pow_config")
BuiltInFunction.pow_set_max_nonce = BuiltInFunction("pow_set_max_nonce")
BuiltInFunction.help          = BuiltInFunction("help")
BuiltInFunction.exit          = BuiltInFunction("exit")
BuiltInFunction.code_convert  = BuiltInFunction("code_convert")
BuiltInFunction.code_convert_project = BuiltInFunction("code_convert_project")
BuiltInFunction.deploy       = BuiltInFunction("deploy")

#######################################
# CONTEXT
#######################################

class Context:
  def __init__(self, display_name, parent=None, parent_entry_pos=None):
    self.display_name = display_name
    self.parent = parent
    self.parent_entry_pos = parent_entry_pos
    self.symbol_table = None

#######################################
# SYMBOL TABLE
#######################################

class SymbolTable:
  def __init__(self, parent=None):
    self.symbols = {}
    self.parent = parent

  def get(self, name):
    value = self.symbols.get(name, None)
    if value == None and self.parent:
      return self.parent.get(name)
    return value

  def set(self, name, value):
    self.symbols[name] = value

  def remove(self, name):
    del self.symbols[name]

  def get_all_data(self):
        all_data = {}
        # Add symbols from the current symbol table
        all_data.update(self.symbols)
        # Recursively add symbols from the parent symbol tables
        if self.parent:
            all_data.update(self.parent.get_all_data())
        return all_data

#######################################
# INTERPRETER
#######################################

class Interpreter:
  def visit(self, node, context):
    global CURRENT_TRACE
    # Pre-event
    if CURRENT_TRACE is not None and node is not None:
      CURRENT_TRACE.add_event('enter_node', {
        'node_type': type(node).__name__,
        'pos_start': {
          'idx': getattr(getattr(node, 'pos_start', None), 'idx', None),
          'line': getattr(getattr(node, 'pos_start', None), 'ln', None),
          'col': getattr(getattr(node, 'pos_start', None), 'col', None),
        },
        'pos_end': {
          'idx': getattr(getattr(node, 'pos_end', None), 'idx', None),
          'line': getattr(getattr(node, 'pos_end', None), 'ln', None),
          'col': getattr(getattr(node, 'pos_end', None), 'col', None),
        },
      })
    method_name = f'visit_{type(node).__name__}'
    method = getattr(self, method_name, self.no_visit_method)
    res = method(node, context)
    # Post-event
    if CURRENT_TRACE is not None and node is not None:
      CURRENT_TRACE.add_event('exit_node', {
        'node_type': type(node).__name__,
        'result': value_to_python(getattr(res, 'value', None)),
        'error': error_to_dict(getattr(res, 'error', None))
      })
    return res

  def no_visit_method(self, node, context):
    raise Exception(f'No visit_{type(node).__name__} method defined')

  ###################################

  def visit_NumberNode(self, node, context):
    return RTResult().success(
      Number(node.tok.value).set_context(context).set_pos(node.pos_start, node.pos_end)
    )

  def visit_StringNode(self, node, context):
    return RTResult().success(
      String(node.tok.value).set_context(context).set_pos(node.pos_start, node.pos_end)
    )

  def visit_ListNode(self, node, context):
    res = RTResult()
    elements = []

    for element_node in node.element_nodes:
      elements.append(res.register(self.visit(element_node, context)))
      if res.should_return(): return res

    return res.success(
      List(elements).set_context(context).set_pos(node.pos_start, node.pos_end)
    )

  def visit_VarAccessNode(self, node, context):
    res = RTResult()
    var_name = node.var_name_tok.value
    value = context.symbol_table.get(var_name)

    if not value:
      return res.failure(RTError(
        node.pos_start, node.pos_end,
        f"'{var_name}' is not defined",
        context
      ))

    value = value.copy().set_pos(node.pos_start, node.pos_end).set_context(context)
    return res.success(value)

  def visit_VarAssignNode(self, node, context):
    res = RTResult()
    var_name = node.var_name_tok.value
    value = res.register(self.visit(node.value_node, context))
    if res.should_return(): return res

    context.symbol_table.set(var_name, value)
    if CURRENT_TRACE is not None:
      CURRENT_TRACE.add_event('var_assign', {
        'name': var_name,
        'value': value_to_python(value)
      })
    return res.success(value)

  def visit_BinOpNode(self, node, context):
    res = RTResult()
    left = res.register(self.visit(node.left_node, context))
    if res.should_return(): return res
    right = res.register(self.visit(node.right_node, context))
    if res.should_return(): return res

    if node.op_tok.type == TT_PLUS:
      result, error = left.added_to(right)
    elif node.op_tok.type == TT_MINUS:
      result, error = left.subbed_by(right)
    elif node.op_tok.type == TT_MUL:
      result, error = left.multed_by(right)
    elif node.op_tok.type == TT_DIV:
      result, error = left.dived_by(right)
    elif node.op_tok.type == TT_POW:
      result, error = left.powed_by(right)
    elif node.op_tok.type == TT_EE:
      result, error = left.get_comparison_eq(right)
    elif node.op_tok.type == TT_NE:
      result, error = left.get_comparison_ne(right)
    elif node.op_tok.type == TT_LT:
      result, error = left.get_comparison_lt(right)
    elif node.op_tok.type == TT_GT:
      result, error = left.get_comparison_gt(right)
    elif node.op_tok.type == TT_LTE:
      result, error = left.get_comparison_lte(right)
    elif node.op_tok.type == TT_GTE:
      result, error = left.get_comparison_gte(right)
    elif node.op_tok.matches(TT_KEYWORD, 'and'):
      result, error = left.anded_by(right)
    elif node.op_tok.matches(TT_KEYWORD, 'or'):
      result, error = left.ored_by(right)

    if error:
      return res.failure(error)
    else:
      return res.success(result.set_pos(node.pos_start, node.pos_end))

  def visit_UnaryOpNode(self, node, context):
    res = RTResult()
    number = res.register(self.visit(node.node, context))
    if res.should_return(): return res

    error = None

    if node.op_tok.type == TT_MINUS:
      number, error = number.multed_by(Number(-1))
    elif node.op_tok.matches(TT_KEYWORD, 'not'):
      number, error = number.notted()

    if error:
      return res.failure(error)
    else:
      return res.success(number.set_pos(node.pos_start, node.pos_end))

  def visit_IfNode(self, node, context):
    res = RTResult()

    for condition, expr, should_return_null in node.cases:
      condition_value = res.register(self.visit(condition, context))
      if res.should_return(): return res

      if condition_value.is_true():
        expr_value = res.register(self.visit(expr, context))
        if res.should_return(): return res
        return res.success(Number.null if should_return_null else expr_value)

    if node.else_case:
      expr, should_return_null = node.else_case
      expr_value = res.register(self.visit(expr, context))
      if res.should_return(): return res
      return res.success(Number.null if should_return_null else expr_value)

    return res.success(Number.null)

  def visit_ForNode(self, node, context):
    res = RTResult()
    elements = []

    start_value = res.register(self.visit(node.start_value_node, context))
    if res.should_return(): return res

    end_value = res.register(self.visit(node.end_value_node, context))
    if res.should_return(): return res

    if node.step_value_node:
      step_value = res.register(self.visit(node.step_value_node, context))
      if res.should_return(): return res
    else:
      step_value = Number(1)

    i = start_value.value

    if step_value.value >= 0:
      condition = lambda: i < end_value.value
    else:
      condition = lambda: i > end_value.value
    
    while condition():
      context.symbol_table.set(node.var_name_tok.value, Number(i))
      i += step_value.value

      value = res.register(self.visit(node.body_node, context))
      if res.should_return() and res.loop_should_continue == False and res.loop_should_break == False: return res
      
      if res.loop_should_continue:
        continue
      
      if res.loop_should_break:
        break

      elements.append(value)

    return res.success(
      Number.null if node.should_return_null else
      List(elements).set_context(context).set_pos(node.pos_start, node.pos_end)
    )

  def visit_WhileNode(self, node, context):
    res = RTResult()
    elements = []

    while True:
      condition = res.register(self.visit(node.condition_node, context))
      if res.should_return(): return res

      if not condition.is_true():
        break

      value = res.register(self.visit(node.body_node, context))
      if res.should_return() and res.loop_should_continue == False and res.loop_should_break == False: return res

      if res.loop_should_continue:
        continue
      
      if res.loop_should_break:
        break

      elements.append(value)

    return res.success(
      Number.null if node.should_return_null else
      List(elements).set_context(context).set_pos(node.pos_start, node.pos_end)
    )

  def visit_FuncDefNode(self, node, context):
    res = RTResult()

    func_name = node.var_name_tok.value if node.var_name_tok else None
    body_node = node.body_node
    arg_names = [arg_name.value for arg_name in node.arg_name_toks]
    func_value = Function(func_name, body_node, arg_names, node.should_auto_return).set_context(context).set_pos(node.pos_start, node.pos_end)
    
    if node.var_name_tok:
      context.symbol_table.set(func_name, func_value)

    return res.success(func_value)

  def visit_CallNode(self, node, context):
    res = RTResult()
    args = []

    value_to_call = res.register(self.visit(node.node_to_call, context))
    if res.should_return(): return res
    value_to_call = value_to_call.copy().set_pos(node.pos_start, node.pos_end)

    for arg_node in node.arg_nodes:
      args.append(res.register(self.visit(arg_node, context)))
      if res.should_return(): return res

    if CURRENT_TRACE is not None:
      CURRENT_TRACE.add_event('call', {
        'callable': str(value_to_call),
        'args': [value_to_python(a) for a in args]
      })
    return_value = res.register(value_to_call.execute(args))
    if res.should_return(): return res
    return_value = return_value.copy().set_pos(node.pos_start, node.pos_end).set_context(context)
    if CURRENT_TRACE is not None:
      CURRENT_TRACE.add_event('return', {
        'value': value_to_python(return_value)
      })
    return res.success(return_value)

  def visit_ReturnNode(self, node, context):
    res = RTResult()

    if node.node_to_return:
      value = res.register(self.visit(node.node_to_return, context))
      if res.should_return(): return res
    else:
      value = Number.null
    
    return res.success_return(value)

  def visit_ContinueNode(self, node, context):
    return RTResult().success_continue()

  def visit_BreakNode(self, node, context):
    return RTResult().success_break()

#######################################
# RUN
#######################################

global_symbol_table = SymbolTable()
global_symbol_table.set("null", Number.null)
global_symbol_table.set("false", Number.false)
global_symbol_table.set("true", Number.true)
global_symbol_table.set("math_PI", Number.math_PI)
global_symbol_table.set("show", BuiltInFunction.print)
global_symbol_table.set("pyexe", BuiltInFunction.pyexe)
global_symbol_table.set("print_ret", BuiltInFunction.print_ret)
global_symbol_table.set("get", BuiltInFunction.input)
global_symbol_table.set("get_int", BuiltInFunction.input_int)
global_symbol_table.set("clear", BuiltInFunction.clear)
global_symbol_table.set("clr", BuiltInFunction.clear)
global_symbol_table.set("is_num", BuiltInFunction.is_number)
global_symbol_table.set("is_str", BuiltInFunction.is_string)
global_symbol_table.set("is_list", BuiltInFunction.is_list)
global_symbol_table.set("is_fun", BuiltInFunction.is_function)
global_symbol_table.set("add", BuiltInFunction.append)
global_symbol_table.set("pop", BuiltInFunction.pop)
global_symbol_table.set("extend", BuiltInFunction.extend)
global_symbol_table.set("len", BuiltInFunction.len)
global_symbol_table.set("ava_exec", BuiltInFunction.run)
global_symbol_table.set("pow_mine", BuiltInFunction.pow_mine)
global_symbol_table.set("pow_cfg", BuiltInFunction.pow_config)
global_symbol_table.set("pow_max_nonce", BuiltInFunction.pow_set_max_nonce)
global_symbol_table.set("help", BuiltInFunction.help)
global_symbol_table.set("exit", BuiltInFunction.exit)
global_symbol_table.set("code_convert", BuiltInFunction.code_convert)
global_symbol_table.set("code_convert_project", BuiltInFunction.code_convert_project)
global_symbol_table.set("deploy", BuiltInFunction.deploy)


"""
Lex :Object(string)
tokens: list[string]
full_code:string
ast: object(string)
parser: object(string)
result :object(string)
context object(string)
symbol_table: [value:object(string)]
ExecutionTime: int
result: value

"""

def run(fn, text):
    global W3, CONTRACT_ADDRESS, ABI_OF_CONTRACT, IS_WEB3, PRIVATE_KEY, PYDATA, PROVIDER, ErrorMsg, PkErrorMsg, CURRENT_TRACE, POW_ALWAYS, POW_BITS, POW_MAX_NONCE
    # Generate tokens (make tracing re-entrant safe)
    prev_trace = CURRENT_TRACE
    CURRENT_TRACE = TraceCollector(fn, text)
    lexer = Lexer(fn, text)
    tokens, error = lexer.make_tokens()

    if error:
      result_obj = {
        'file': fn,
        'elapsed': 0,
        'trace': {
          'lexer': CURRENT_TRACE.lexer,
          'parser': CURRENT_TRACE.parser,
          'execution': CURRENT_TRACE.execution
        },
        'symbols_end': {},
        'web3': {},
        'error': error_to_dict(error)
      }
      CURRENT_TRACE = prev_trace
      return result_obj, error
    # print(tokens)
    
    # Generate AST
    parser = Parser(tokens)
    ast = parser.parse()
    # print(parser, ast, global_symbol_table.get_all_data())
    if ast.error:
      result_obj = {
        'file': fn,
        'elapsed': 0,
        'trace': {
          'lexer': CURRENT_TRACE.lexer,
          'parser': CURRENT_TRACE.parser,
          'execution': CURRENT_TRACE.execution
        },
        'symbols_end': {},
        'web3': {},
        'error': error_to_dict(ast.error)
      }
      CURRENT_TRACE = prev_trace
      return result_obj, ast.error


    # Run program
    interpreter = Interpreter()
    context = Context('<program>')
    # print(context)
    context.symbol_table = global_symbol_table

    # Capture stdout during execution
    original_stdout = sys.stdout
    stdout_buffer = io.StringIO()
    sys.stdout = stdout_buffer
    try:
      result = interpreter.visit(ast.node, context)
      # Optional: perform automatic PoW for every execution when enabled
      if POW_ALWAYS and POW_BITS > 0:
        print(f"PoW(auto) start: bits={POW_BITS}, max_nonce={POW_MAX_NONCE}")
        data_bytes = (fn + ':' + text).encode('utf-8')
        difficulty_bits = int(POW_BITS)
        target = 1 << (256 - difficulty_bits) if difficulty_bits > 0 else (1 << 256)
        progress_interval = max(1, POW_MAX_NONCE // 30)
        start_time_pow = time.time()
        found_nonce = -1
        found_hash = ''
        iterations = 0
        last_digest_bytes = b''
        for nonce in range(POW_MAX_NONCE):
          iterations = nonce + 1
          content = data_bytes + str(nonce).encode('utf-8')
          digest_bytes = hashlib.sha256(content).digest()
          last_digest_bytes = digest_bytes
          if int.from_bytes(digest_bytes, 'big') < target:
            found_nonce = nonce
            found_hash = digest_bytes.hex()
            break
          if iterations % progress_interval == 0:
            elapsed_so_far = time.time() - start_time_pow
            rate = iterations / elapsed_so_far if elapsed_so_far > 0 else 0.0
            print(f"PoW(auto) progress: iter={iterations}, rate={int(rate)} H/s")
        elapsed_pow = time.time() - start_time_pow
        if found_nonce == -1:
          rate = iterations / elapsed_pow if elapsed_pow > 0 else 0.0
          print(f"PoW(auto) not found within max_nonce. iterations={iterations}, elapsed={elapsed_pow:.3f}s, rate={int(rate)} H/s")
          print(f"PoW(auto) result: [nonce, hash, iterations, elapsed] = [{found_nonce}, {last_digest_bytes.hex()}, {iterations}, {elapsed_pow:.3f}]")
          CURRENT_TRACE.execution['pow'] = {
            'bits': difficulty_bits,
            'nonce': found_nonce,
            'hash': last_digest_bytes.hex(),
            'iterations': iterations,
            'elapsed': elapsed_pow
          }
        else:
          rate = iterations / elapsed_pow if elapsed_pow > 0 else 0.0
          print(f"PoW(auto) found: nonce={found_nonce}, hash={found_hash[:16]}..., iterations={iterations}, elapsed={elapsed_pow:.3f}s, rate={int(rate)} H/s")
          print(f"PoW(auto) result: [nonce, hash, iterations, elapsed] = [{found_nonce}, {found_hash}, {iterations}, {elapsed_pow:.3f}]")
          CURRENT_TRACE.execution['pow'] = {
            'bits': difficulty_bits,
            'nonce': found_nonce,
            'hash': found_hash,
            'iterations': iterations,
            'elapsed': elapsed_pow
          }
    finally:
      sys.stdout = original_stdout
    # Prepare final trace with captured stdout
    CURRENT_TRACE.execution['stdout'] = stdout_buffer.getvalue()
    CURRENT_TRACE.finish(
      symbols_snapshot=context.symbol_table.get_all_data(),
      final_value=value_to_python(getattr(result, 'value', None))
    )

    # do_line()
    if IS_WEB3:
      if PYDATA.get("account"):
        if PYDATA.get("pk"):
          CURRENT_TRACE.web3 = {"ABI_OF_CONTRACT":ABI_OF_CONTRACT, "CONTRACT_ADDRESS":CONTRACT_ADDRESS, "PROVIDER":PROVIDER, "PRIVATE_KEY":PYDATA.get("pk")}
        elif PkErrorMsg and PYDATA.get("ack"):
          PkErrorMsg = False
          print("Private Key Not Found: Please add Private Key of your wallet")
      elif ErrorMsg and PYDATA.get("ack"):
        ErrorMsg = False
        print("Account Not Found: Please add account of your sender")
    result_obj = {
      'file': fn,
      'elapsed': CURRENT_TRACE.elapsed,
      'trace': {
        'lexer': CURRENT_TRACE.lexer,
        'parser': CURRENT_TRACE.parser,
        'execution': CURRENT_TRACE.execution
      },
      'stdout': CURRENT_TRACE.execution.get('stdout', ''),
      'final_value': CURRENT_TRACE.execution.get('final_value'),
      'pow': CURRENT_TRACE.execution.get('pow'),
      'symbols_end': {k: value_to_python(v) for k, v in CURRENT_TRACE.symbols_end.items()},
      'web3': CURRENT_TRACE.web3,
      'error': error_to_dict(getattr(result, 'error', None))
    }
    CURRENT_TRACE = prev_trace
    return result_obj, result.error
