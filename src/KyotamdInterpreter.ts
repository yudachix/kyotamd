import { KyotamdCommand, KyotamdParser } from './KyotamdParser'

interface BaseKyotamdCommandActionInvokeContext {
  readonly interpreter: KyotamdInterpreter
}

interface ArgumentKyotamedCommandActionInvokeContext extends BaseKyotamdCommandActionInvokeContext {
  readonly type: 'argument'
  readonly parentContext: KyotamdCommandActionInvokeContext
}

interface IndexedKyotamedCommandActionInvokeContext extends BaseKyotamdCommandActionInvokeContext {
  readonly type: 'indexed'
  readonly index: number
  setIndex(index: number): void
}

type KyotamdCommandActionInvokeContext = ArgumentKyotamedCommandActionInvokeContext | IndexedKyotamedCommandActionInvokeContext
type KyotamdType = string | void
type KyotamdCommandAction = (context: KyotamdCommandActionInvokeContext, ...args: readonly KyotamdType[]) => KyotamdType
type KyotamdCommandActions = Map<string, KyotamdCommandAction>
type KyotamdCommandActionsObject = { readonly [k: string]: KyotamdCommandAction }

class KyotamdInterpreter {
  readonly #variables = new Map<string, KyotamdType>()
  readonly #labels = new Map<string, number>()

  readonly #BUILT_IN_COMMAND_ACTIONS: Readonly<KyotamdCommandActions> = new Map(Object.entries({
    ['Label'](context, identifier) {
      if (context.type === 'argument') {
        throw new SyntaxError()
      }

      if (typeof identifier === 'undefined') {
        throw new TypeError()
      }

      context.interpreter.#labels.set(identifier, context.index)
    },
    ['Goto'](context, identifier) {
      if (context.type === 'argument') {
        throw new SyntaxError()
      }

      if (typeof identifier === 'undefined') {
        throw new TypeError()
      }

      const index = context.interpreter.#labels.get(identifier)

      if (typeof index === 'undefined') {
        throw new ReferenceError()
      }

      context.setIndex(index)
    },
    ['Var'](context, identifier, value) {
      if (typeof identifier === 'undefined') {
        throw new TypeError()
      }

      if (typeof value !== 'undefined') {
        context.interpreter.#variables.set(identifier, value)
      }

      return context.interpreter.#variables.get(identifier)
    },
    ['Calc'](context, a, operator, b) {
      const x = Number(a)
      const y = Number(b)

      switch (operator) {
        case '+': return String(x + y)
        case '-': return String(x - y)
        case '*': return String(x * y)
        case '/': return String(x / y)
        case '**': return String(x ** y)
      }

      return 'NaN'
    },
    ['Cond'](context, a, operator, b) {
      const x = Number(a)
      const y = Number(b)

      switch (operator) {
        case '=': return String(a === b)
        case '>': return String(x > y)
        case '<': return String(x < y)
        case '>=': return String(x >= y)
        case '<=': return String(x <= y)
        case '&': return String(Boolean(a) && Boolean(b))
        case '|': return String(Boolean(a) || Boolean(b))
      }

      return 'false'
    },
    ['Print'](context, ...data) {
      console.log(...data)
    },
    ['If'](context, condition, labelIdentifier) {
      if (context.type === 'argument') {
        throw new SyntaxError()
      }

      if (condition !== 'true' && condition !== 'false') {
        throw new TypeError()
      }

      if (typeof labelIdentifier === 'undefined') {
        throw new TypeError()
      }

      if (condition === 'false') {
        return
      }

      const index = context.interpreter.#labels.get(labelIdentifier)

      if (typeof index === 'undefined') {
        throw new ReferenceError()
      }

      context.setIndex(index)
    }
  }))

  readonly #commandActions: KyotamdCommandActions = new Map()

  constructor(commandActions?: KyotamdCommandActionsObject) {
    if (typeof commandActions !== 'undefined') {
      this.#commandActions = new Map(Object.entries(commandActions))
    }
  }

  eval(code: string): KyotamdType {
    const commands = KyotamdParser.parse(code)
    const commandsLength = commands.length

    let result: KyotamdType

    for (let i = 0; i < commandsLength; i++) {
      const command = commands[i]

      result = this.#processCommand(command, {
        interpreter: this,
        type: 'indexed',
        index: i,
        setIndex(index) {
          i = index
        }
      })
    }

    return result
  }

  #processCommand(command: KyotamdCommand, context: KyotamdCommandActionInvokeContext): KyotamdType {
    const { name: commandName } = command

    const commandAction = this.#BUILT_IN_COMMAND_ACTIONS.get(commandName) || this.#commandActions.get(commandName)

    if (typeof commandAction === 'undefined') {
      throw new ReferenceError()
    }

    const resolvedArguments: KyotamdType[] = []

    for (const argument of command.arguments) {
      if (typeof argument === 'string') {
        resolvedArguments.push(argument)

        continue
      }

      resolvedArguments.push(this.#processCommand(argument, {
        interpreter: this,
        type: 'argument',
        parentContext: context
      }))
    }

    return commandAction(context, ...resolvedArguments)
  }
}

export { KyotamdInterpreter }