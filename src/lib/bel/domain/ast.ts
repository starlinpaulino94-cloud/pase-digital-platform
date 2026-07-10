/**
 * AST del Business Expression Language (Fase 7).
 *
 * Representación interna OFICIAL de una expresión BEL. Cada nodo es un tipo
 * discriminado por `kind`. El parser produce estos nodos y el evaluador los
 * recorre. No hay ejecución de código: solo estructura de datos.
 */

/** Tipo de dato literal reconocido por el lenguaje. */
export type LiteralType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'NULL'

export interface LiteralNode {
  readonly kind: 'Literal'
  readonly value: number | string | boolean | null
  readonly valueType: LiteralType
}

/** Variable: ruta del diccionario/contexto, ej. "cliente.edad". */
export interface VariableNode {
  readonly kind: 'Variable'
  readonly path: string
}

export interface ListNode {
  readonly kind: 'List'
  readonly elements: readonly ExpressionNode[]
}

export interface ObjectNode {
  readonly kind: 'Object'
  readonly entries: ReadonlyArray<{ key: string; value: ExpressionNode }>
}

/** Unario: negación lógica (NOT) o numérica (NEG). */
export interface UnaryNode {
  readonly kind: 'Unary'
  readonly op: 'NOT' | 'NEG'
  readonly operand: ExpressionNode
}

/** Operación matemática. */
export interface ArithmeticNode {
  readonly kind: 'Arithmetic'
  readonly op: '+' | '-' | '*' | '/' | '%' | '^'
  readonly left: ExpressionNode
  readonly right: ExpressionNode
}

/** Comparación. */
export interface ComparisonNode {
  readonly kind: 'Comparison'
  readonly op: '==' | '!=' | '>' | '>=' | '<' | '<='
  readonly left: ExpressionNode
  readonly right: ExpressionNode
}

/** Expresión lógica. */
export interface LogicalNode {
  readonly kind: 'Logical'
  readonly op: 'AND' | 'OR' | 'XOR'
  readonly left: ExpressionNode
  readonly right: ExpressionNode
}

/** Pertenencia a listas. */
export interface MembershipNode {
  readonly kind: 'Membership'
  readonly op: 'IN' | 'NOT_IN' | 'CONTAINS' | 'NOT_CONTAINS'
  readonly left: ExpressionNode
  readonly right: ExpressionNode
}

/** Operaciones de texto. */
export interface TextNode {
  readonly kind: 'Text'
  readonly op: 'STARTS_WITH' | 'ENDS_WITH' | 'MATCHES' | 'LIKE'
  readonly left: ExpressionNode
  readonly right: ExpressionNode
}

/** Predicados de nulidad/vacío (postfijos, un solo operando). */
export interface PostfixNode {
  readonly kind: 'Postfix'
  readonly op: 'IS_NULL' | 'IS_NOT_NULL' | 'EMPTY' | 'NOT_EMPTY'
  readonly operand: ExpressionNode
}

/** Llamada a función registrada. */
export interface CallNode {
  readonly kind: 'Call'
  readonly name: string
  readonly args: readonly ExpressionNode[]
}

export type ExpressionNode =
  | LiteralNode
  | VariableNode
  | ListNode
  | ObjectNode
  | UnaryNode
  | ArithmeticNode
  | ComparisonNode
  | LogicalNode
  | MembershipNode
  | TextNode
  | PostfixNode
  | CallNode

/** Recorre el AST y devuelve todas las variables referenciadas. */
export function collectVariables(node: ExpressionNode, out: Set<string> = new Set()): Set<string> {
  switch (node.kind) {
    case 'Variable':
      out.add(node.path)
      break
    case 'List':
      node.elements.forEach((e) => collectVariables(e, out))
      break
    case 'Object':
      node.entries.forEach((e) => collectVariables(e.value, out))
      break
    case 'Unary':
    case 'Postfix':
      collectVariables(node.operand, out)
      break
    case 'Arithmetic':
    case 'Comparison':
    case 'Logical':
    case 'Membership':
    case 'Text':
      collectVariables(node.left, out)
      collectVariables(node.right, out)
      break
    case 'Call':
      node.args.forEach((a) => collectVariables(a, out))
      break
  }
  return out
}

/** Recorre el AST y devuelve todas las funciones llamadas. */
export function collectFunctions(node: ExpressionNode, out: Set<string> = new Set()): Set<string> {
  if (node.kind === 'Call') {
    out.add(node.name)
    node.args.forEach((a) => collectFunctions(a, out))
  } else {
    switch (node.kind) {
      case 'List': node.elements.forEach((e) => collectFunctions(e, out)); break
      case 'Object': node.entries.forEach((e) => collectFunctions(e.value, out)); break
      case 'Unary': case 'Postfix': collectFunctions(node.operand, out); break
      case 'Arithmetic': case 'Comparison': case 'Logical': case 'Membership': case 'Text':
        collectFunctions(node.left, out); collectFunctions(node.right, out); break
    }
  }
  return out
}

/** ¿El nodo es constante (sin variables ni funciones no deterministas)? */
export function isConstant(node: ExpressionNode): boolean {
  return collectVariables(node).size === 0 && collectFunctions(node).size === 0
}
