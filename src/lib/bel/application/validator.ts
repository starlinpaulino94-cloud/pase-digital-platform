/**
 * Expression Validator del BEL (Fase 7).
 *
 * Valida una expresión ANTES de evaluarla: sintaxis, paréntesis, variables
 * inexistentes (contra un comprobador —normalmente el Data Dictionary—),
 * funciones inexistentes y aridad. Devuelve mensajes claros. Nunca lanza.
 */

import type { ExpressionNode } from '../domain/ast'
import type { FunctionRegistry } from '../domain/functions'
import { BelError, type BelIssue } from '../domain/result'
import type { Compiler } from './compiler'

/** Comprueba si una ruta de variable es conocida (p. ej. está en el diccionario). */
export type VariableChecker = (path: string) => boolean

export interface ValidateOptions {
  /** Si se pasa, las variables no conocidas producen UNKNOWN_VARIABLE. */
  readonly variableChecker?: VariableChecker
}

export class Validator {
  constructor(
    private readonly compiler: Compiler,
    private readonly functions: FunctionRegistry,
  ) {}

  validate(source: string, options: ValidateOptions = {}): BelIssue[] {
    let compiled
    try {
      compiled = this.compiler.compile(source)
    } catch (err) {
      return [err instanceof BelError ? err.toIssue() : { code: 'SYNTAX_ERROR', message: String(err) }]
    }

    const issues: BelIssue[] = []

    // Variables desconocidas.
    if (options.variableChecker) {
      for (const path of compiled.variables) {
        if (!options.variableChecker(path)) {
          issues.push({ code: 'UNKNOWN_VARIABLE', message: `Variable no registrada: "${path}".` })
        }
      }
    }

    // Funciones y aridad.
    this.checkFunctions(compiled.ast, issues)

    return issues
  }

  private checkFunctions(node: ExpressionNode, issues: BelIssue[]): void {
    switch (node.kind) {
      case 'Call': {
        const fn = this.functions.get(node.name)
        if (!fn) {
          issues.push({ code: 'UNKNOWN_FUNCTION', message: `Función no registrada: "${node.name}".` })
        } else {
          const n = node.args.length
          if (n < fn.minArgs || (fn.maxArgs !== -1 && n > fn.maxArgs)) {
            const range = fn.maxArgs === -1 ? `≥ ${fn.minArgs}` : fn.minArgs === fn.maxArgs ? `${fn.minArgs}` : `${fn.minArgs}-${fn.maxArgs}`
            issues.push({ code: 'ARITY_ERROR', message: `${node.name} espera ${range} argumento(s), recibió ${n}.` })
          }
        }
        node.args.forEach((a) => this.checkFunctions(a, issues))
        break
      }
      case 'List': node.elements.forEach((e) => this.checkFunctions(e, issues)); break
      case 'Object': node.entries.forEach((e) => this.checkFunctions(e.value, issues)); break
      case 'Unary': case 'Postfix': this.checkFunctions(node.operand, issues); break
      case 'Arithmetic': case 'Comparison': case 'Logical': case 'Membership': case 'Text':
        this.checkFunctions(node.left, issues); this.checkFunctions(node.right, issues); break
    }
  }
}
