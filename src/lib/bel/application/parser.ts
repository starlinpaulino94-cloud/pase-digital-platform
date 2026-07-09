/**
 * Parser del BEL (Fase 7): tokens → AST.
 *
 * Precedence-climbing (Pratt) escrito a mano, sin librerías, para poder
 * evolucionar el lenguaje libremente. Convierte operadores por palabra (AND, IN,
 * STARTS WITH, IS NULL…) y símbolos en nodos tipados. Lanza `BelError` con
 * posición ante sintaxis inválida; el servicio lo convierte en resultado.
 */

import type {
  ArithmeticNode, ComparisonNode, ExpressionNode, LogicalNode,
  MembershipNode, PostfixNode, TextNode,
} from '../domain/ast'
import { BelError } from '../domain/result'
import { tokenize, type Token } from './tokenizer'

export interface ParserOptions {
  /** Profundidad máxima de anidamiento (paréntesis/operadores). */
  readonly maxDepth?: number
}

interface InfixOp {
  readonly bp: number
  readonly consume: number
  readonly rightAssoc?: boolean
  readonly build: (left: ExpressionNode, right: ExpressionNode) => ExpressionNode
  readonly postfix?: (operand: ExpressionNode) => ExpressionNode
}

const arithmeticBp: Record<string, number> = { '+': 40, '-': 40, '*': 50, '/': 50, '%': 50, '^': 60 }
const comparisonOps = new Set(['==', '!=', '>', '>=', '<', '<='])

export function parse(input: string, options: ParserOptions = {}): ExpressionNode {
  const tokens = tokenize(input)
  const parser = new Parser(tokens, options.maxDepth ?? 64)
  const node = parser.parseExpression(0)
  parser.expectEof()
  return node
}

class Parser {
  private pos = 0
  private depth = 0

  constructor(private readonly tokens: Token[], private readonly maxDepth: number) {}

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)]
  }
  private next(): Token {
    return this.tokens[this.pos++]
  }

  expectEof(): void {
    const t = this.peek()
    if (t.type !== 'EOF') throw new BelError('SYNTAX_ERROR', `Token inesperado: "${t.value}".`, t.position)
  }

  parseExpression(minBp: number): ExpressionNode {
    if (++this.depth > this.maxDepth) {
      throw new BelError('DEPTH_EXCEEDED', `La expresión supera la profundidad máxima (${this.maxDepth}).`)
    }
    try {
      let left = this.parseUnary()
      for (;;) {
        const op = this.peekInfixOp()
        if (!op || op.bp < minBp) break
        this.pos += op.consume
        if (op.postfix) {
          left = op.postfix(left)
          continue
        }
        const nextMin = op.rightAssoc ? op.bp : op.bp + 1
        const right = this.parseExpression(nextMin)
        left = op.build(left, right)
      }
      return left
    } finally {
      this.depth--
    }
  }

  private parseUnary(): ExpressionNode {
    const t = this.peek()
    if (t.type === 'KEYWORD' && t.value === 'NOT') {
      this.next()
      return { kind: 'Unary', op: 'NOT', operand: this.parseUnary() }
    }
    if (t.type === 'OP' && t.value === '-') {
      this.next()
      return { kind: 'Unary', op: 'NEG', operand: this.parseUnary() }
    }
    if (t.type === 'OP' && t.value === '+') {
      this.next()
      return this.parseUnary()
    }
    return this.parsePrimary()
  }

  private parsePrimary(): ExpressionNode {
    const t = this.peek()
    switch (t.type) {
      case 'NUMBER':
        this.next()
        return { kind: 'Literal', value: Number(t.value), valueType: 'NUMBER' }
      case 'STRING':
        this.next()
        return { kind: 'Literal', value: t.value, valueType: 'STRING' }
      case 'KEYWORD':
        if (t.value === 'TRUE') { this.next(); return { kind: 'Literal', value: true, valueType: 'BOOLEAN' } }
        if (t.value === 'FALSE') { this.next(); return { kind: 'Literal', value: false, valueType: 'BOOLEAN' } }
        if (t.value === 'NULL') { this.next(); return { kind: 'Literal', value: null, valueType: 'NULL' } }
        throw new BelError('SYNTAX_ERROR', `Palabra clave inesperada: "${t.value}".`, t.position)
      case 'IDENT':
        this.next()
        if (this.peek().type === 'LPAREN') return this.parseCall(t.value)
        return { kind: 'Variable', path: t.value }
      case 'LPAREN': {
        this.next()
        const inner = this.parseExpression(0)
        this.expect('RPAREN')
        return inner
      }
      case 'LBRACKET':
        return this.parseList()
      case 'LBRACE':
        return this.parseObject()
      default:
        throw new BelError('SYNTAX_ERROR', `Se esperaba un valor, se encontró "${t.value || t.type}".`, t.position)
    }
  }

  private parseCall(name: string): ExpressionNode {
    this.expect('LPAREN')
    const args: ExpressionNode[] = []
    if (this.peek().type !== 'RPAREN') {
      args.push(this.parseExpression(0))
      while (this.peek().type === 'COMMA') { this.next(); args.push(this.parseExpression(0)) }
    }
    this.expect('RPAREN')
    return { kind: 'Call', name, args }
  }

  private parseList(): ExpressionNode {
    this.expect('LBRACKET')
    const elements: ExpressionNode[] = []
    if (this.peek().type !== 'RBRACKET') {
      elements.push(this.parseExpression(0))
      while (this.peek().type === 'COMMA') { this.next(); elements.push(this.parseExpression(0)) }
    }
    this.expect('RBRACKET')
    return { kind: 'List', elements }
  }

  private parseObject(): ExpressionNode {
    this.expect('LBRACE')
    const entries: Array<{ key: string; value: ExpressionNode }> = []
    if (this.peek().type !== 'RBRACE') {
      do {
        const keyTok = this.peek()
        if (keyTok.type !== 'IDENT' && keyTok.type !== 'STRING') {
          throw new BelError('SYNTAX_ERROR', 'Clave de objeto inválida.', keyTok.position)
        }
        this.next()
        this.expect('COLON')
        entries.push({ key: keyTok.value, value: this.parseExpression(0) })
      } while (this.peek().type === 'COMMA' && this.next())
    }
    this.expect('RBRACE')
    return { kind: 'Object', entries }
  }

  private expect(type: Token['type']): Token {
    const t = this.peek()
    if (t.type !== type) {
      const code = type === 'RPAREN' || type === 'RBRACKET' || type === 'RBRACE'
        ? 'UNBALANCED_PARENS' : 'SYNTAX_ERROR'
      throw new BelError(code, `Se esperaba "${type}", se encontró "${t.value || t.type}".`, t.position)
    }
    return this.next()
  }

  /** Inspecciona (sin consumir) si sigue un operador infijo/postfijo y lo describe. */
  private peekInfixOp(): InfixOp | null {
    const t = this.peek()

    if (t.type === 'OP') {
      if (comparisonOps.has(t.value)) {
        return { bp: 30, consume: 1, build: (l, r) => comparison(t.value, l, r) }
      }
      const bp = arithmeticBp[t.value]
      if (bp) return { bp, consume: 1, rightAssoc: t.value === '^', build: (l, r) => arithmetic(t.value, l, r) }
      return null
    }

    if (t.type !== 'KEYWORD') return null
    const n1 = this.peek(1)

    switch (t.value) {
      case 'OR': return { bp: 10, consume: 1, build: (l, r) => logical('OR', l, r) }
      case 'XOR': return { bp: 10, consume: 1, build: (l, r) => logical('XOR', l, r) }
      case 'AND': return { bp: 20, consume: 1, build: (l, r) => logical('AND', l, r) }
      case 'IN': return { bp: 30, consume: 1, build: (l, r) => membership('IN', l, r) }
      case 'CONTAINS': return { bp: 30, consume: 1, build: (l, r) => membership('CONTAINS', l, r) }
      case 'MATCHES': return { bp: 30, consume: 1, build: (l, r) => text('MATCHES', l, r) }
      case 'LIKE': return { bp: 30, consume: 1, build: (l, r) => text('LIKE', l, r) }
      case 'EMPTY': return { bp: 35, consume: 1, postfix: (o) => postfix('EMPTY', o), build: passthrough }
      case 'STARTS':
        if (n1.value === 'WITH') return { bp: 30, consume: 2, build: (l, r) => text('STARTS_WITH', l, r) }
        return null
      case 'ENDS':
        if (n1.value === 'WITH') return { bp: 30, consume: 2, build: (l, r) => text('ENDS_WITH', l, r) }
        return null
      case 'NOT':
        if (n1.value === 'IN') return { bp: 30, consume: 2, build: (l, r) => membership('NOT_IN', l, r) }
        if (n1.value === 'CONTAINS') return { bp: 30, consume: 2, build: (l, r) => membership('NOT_CONTAINS', l, r) }
        if (n1.value === 'EMPTY') return { bp: 35, consume: 2, postfix: (o) => postfix('NOT_EMPTY', o), build: passthrough }
        return null
      case 'IS': {
        if (n1.value === 'NULL') return { bp: 35, consume: 2, postfix: (o) => postfix('IS_NULL', o), build: passthrough }
        if (n1.value === 'NOT' && this.peek(2).value === 'NULL') {
          return { bp: 35, consume: 3, postfix: (o) => postfix('IS_NOT_NULL', o), build: passthrough }
        }
        return null
      }
      default:
        return null
    }
  }
}

// ── Constructores de nodos ───────────────────────────────────────────────────
const passthrough = (l: ExpressionNode): ExpressionNode => l

function arithmetic(op: string, left: ExpressionNode, right: ExpressionNode): ArithmeticNode {
  return { kind: 'Arithmetic', op: op as ArithmeticNode['op'], left, right }
}
function comparison(op: string, left: ExpressionNode, right: ExpressionNode): ComparisonNode {
  return { kind: 'Comparison', op: op as ComparisonNode['op'], left, right }
}
function logical(op: LogicalNode['op'], left: ExpressionNode, right: ExpressionNode): LogicalNode {
  return { kind: 'Logical', op, left, right }
}
function membership(op: MembershipNode['op'], left: ExpressionNode, right: ExpressionNode): MembershipNode {
  return { kind: 'Membership', op, left, right }
}
function text(op: TextNode['op'], left: ExpressionNode, right: ExpressionNode): TextNode {
  return { kind: 'Text', op, left, right }
}
function postfix(op: PostfixNode['op'], operand: ExpressionNode): PostfixNode {
  return { kind: 'Postfix', op, operand }
}
