/**
 * Tokenizer del BEL (Fase 7): convierte una expresión en tokens.
 *
 * Lexer propio (sin librerías, sin eval). Reconoce números, textos, booleanos,
 * null, identificadores con puntos (rutas), palabras clave (operadores por
 * palabra) y símbolos. Preparado para incorporar nuevos operadores/funciones.
 */

import { BelError } from '../domain/result'

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENT' // variable o nombre de función
  | 'KEYWORD' // AND, OR, NOT, IN, WITH, IS, NULL, TRUE, FALSE…
  | 'OP' // símbolos: == != > >= < <= + - * / % ^
  | 'LPAREN' | 'RPAREN'
  | 'LBRACKET' | 'RBRACKET'
  | 'LBRACE' | 'RBRACE'
  | 'COMMA' | 'COLON'
  | 'EOF'

export interface Token {
  readonly type: TokenType
  readonly value: string
  readonly position: number
}

/** Palabras reservadas (case-insensitive). No pueden usarse como variables. */
export const KEYWORDS = new Set([
  'AND', 'OR', 'XOR', 'NOT', 'IN', 'CONTAINS', 'STARTS', 'ENDS', 'WITH',
  'MATCHES', 'LIKE', 'IS', 'NULL', 'EMPTY', 'TRUE', 'FALSE',
])

const TWO_CHAR_OPS = new Set(['==', '!=', '>=', '<=', '**'])
const ONE_CHAR_OPS = new Set(['>', '<', '+', '-', '*', '/', '%', '^'])

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_]/.test(ch)
}
function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_.]/.test(ch)
}

export function tokenize(input: string): Token[] {
  if (input.length > 10_000) {
    throw new BelError('SYNTAX_ERROR', 'La expresión excede el tamaño máximo permitido.')
  }
  const tokens: Token[] = []
  let i = 0
  const push = (type: TokenType, value: string, position: number) => tokens.push({ type, value, position })

  while (i < input.length) {
    const ch = input[i]

    // Espacios
    if (/\s/.test(ch)) { i++; continue }

    // Números (enteros y decimales)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      const start = i
      while (i < input.length && /[0-9.]/.test(input[i])) i++
      const num = input.slice(start, i)
      if ((num.match(/\./g) ?? []).length > 1) {
        throw new BelError('SYNTAX_ERROR', `Número inválido: "${num}".`, start)
      }
      push('NUMBER', num, start)
      continue
    }

    // Textos: comillas simples o dobles
    if (ch === '"' || ch === "'") {
      const start = i
      const quote = ch
      i++
      let str = ''
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) { str += input[i + 1]; i += 2; continue }
        str += input[i]; i++
      }
      if (i >= input.length) throw new BelError('SYNTAX_ERROR', 'Texto sin cerrar.', start)
      i++ // cierra comilla
      push('STRING', str, start)
      continue
    }

    // Identificadores / palabras clave
    if (isIdentStart(ch)) {
      const start = i
      while (i < input.length && isIdentPart(input[i])) i++
      const word = input.slice(start, i)
      const upper = word.toUpperCase()
      if (KEYWORDS.has(upper) && !word.includes('.')) push('KEYWORD', upper, start)
      else push('IDENT', word, start)
      continue
    }

    // Símbolos de dos caracteres
    const two = input.slice(i, i + 2)
    if (TWO_CHAR_OPS.has(two)) { push('OP', two === '**' ? '^' : two, i); i += 2; continue }

    // Símbolos de un carácter
    if (ONE_CHAR_OPS.has(ch)) { push('OP', ch, i); i++; continue }
    if (ch === '(') { push('LPAREN', ch, i); i++; continue }
    if (ch === ')') { push('RPAREN', ch, i); i++; continue }
    if (ch === '[') { push('LBRACKET', ch, i); i++; continue }
    if (ch === ']') { push('RBRACKET', ch, i); i++; continue }
    if (ch === '{') { push('LBRACE', ch, i); i++; continue }
    if (ch === '}') { push('RBRACE', ch, i); i++; continue }
    if (ch === ',') { push('COMMA', ch, i); i++; continue }
    if (ch === ':') { push('COLON', ch, i); i++; continue }
    if (ch === '=') {
      throw new BelError('SYNTAX_ERROR', 'Usa "==" para comparar igualdad.', i)
    }

    throw new BelError('SYNTAX_ERROR', `Carácter inesperado: "${ch}".`, i)
  }

  push('EOF', '', input.length)
  return tokens
}
