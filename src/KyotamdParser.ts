import { KyotamdSyntaxError } from './errors'
import { CharSets } from './utils'

type KyotamdCommandArgument = string | KyotamdCommand
type KyotamdCommandArguments = readonly KyotamdCommandArgument[]
type WritableKyotamdCommandArguments = KyotamdCommandArgument[]

interface KyotamdCommand {
  readonly name: string;
  readonly arguments: KyotamdCommandArguments;
}

type KyotamdCommands = readonly KyotamdCommand[]
type WritableKyotamdCommands = KyotamdCommand[]

interface KyotamdParenthesis {
  readonly command: KyotamdCommand
  readonly indexCount: number
}

interface KyotamdStringLiteral {
  readonly value: string
  readonly indexCount: number
}

interface KyotamdParser {
  getStartSpacesOffset(input: string): number
  parseCommandName(input: string): string
  parseParenthesis(input: string, inputOffset: number): KyotamdParenthesis
  parseStringLiteral(input: string, inputOffset: number): KyotamdStringLiteral
  parseCommandArguments(input: string, inputOffset: number): KyotamdCommandArguments
  parseCommand(input: string): KyotamdCommand
  isIgnoreLine(input: string): boolean
  parse(input: string): KyotamdCommands
}

const KyotamdParser: KyotamdParser = {
  getStartSpacesOffset(input) {
    let startSpacesOffset = 0

    for (const char of input) {
      if (!CharSets.SPACES.has(char)) {
        break
      }

      startSpacesOffset++
    }

    return startSpacesOffset
  },
  parseCommandName(input) {
    const startSpacesOffset = this.getStartSpacesOffset(input)
    const firstChar = input[startSpacesOffset]

    if (!CharSets.UPPERCASE_ALPHABETS.has(firstChar)) {
      throw new KyotamdSyntaxError('Command names must start with an uppercase letter')
    }

    let commandName = firstChar
    const inputLength = input.length

    for (let i = startSpacesOffset + 1; i < inputLength; i++) {
      const char = input[i]

      if (CharSets.SPACES.has(char)) {
        break
      }

      if (CharSets.UPPERCASE_ALPHABETS.has(char) && input[i - 1] !== '-') {
        throw new KyotamdSyntaxError('The words in the command name must be hyphenated')
      }

      const nextChar = input[i + 1]

      if (
        char === '-' &&
        !CharSets.UPPERCASE_ALPHABETS.has(nextChar) &&
        !CharSets.DECIMAL_DIGITS.has(nextChar)
      ) {
        throw new KyotamdSyntaxError('Words in the command name must start with a number or an uppercase letter')
      }

      commandName += char
    }

    return commandName
  },
  parseParenthesis(input, inputOffset) {
    let parenthesisCount = 1
    let indexCount = 1
    let rawCommand = ''
    const inputLength = input.length

    for (let i = inputOffset + 1; i < inputLength; i++) {
      const char = input[i]

      if (char === '(') {
        parenthesisCount++
      } else if (char === ')') {
        parenthesisCount--

        if (parenthesisCount === 0) {
          indexCount++

          break
        }
      }

      rawCommand += char
    }

    indexCount += rawCommand.length

    return {
      command: this.parseCommand(rawCommand),
      indexCount
    }
  },
  parseStringLiteral(input, inputOffset) {
    let value = ''
    let backslashCount = 0
    const inputLength = input.length

    for (let i = inputOffset + 1; i < inputLength; i++) {
      const char = input[i]

      if (char === '\\') {
        backslashCount++

        const nextChar = input[++i]

        if (nextChar === 'n') {
          value += '\n'
        } else {
          value += nextChar
        }

        continue
      }

      if (char === '"') {
        break
      }

      value += char
    }

    return {
      value,
      indexCount: value.length + backslashCount + 2
    }
  },
  parseCommandArguments(input, inputOffset) {
    const commandArguments: WritableKyotamdCommandArguments = []
    const inputLength = input.length

    for (let i = inputOffset; i < inputLength; i++) {
      const char = input[i]

      if (CharSets.SPACES.has(char)) {
        continue
      }

      if (char === '(') {
        const { command, indexCount } = this.parseParenthesis(input, i)

        commandArguments.push(command)
        i += indexCount

        continue
      }

      if (char === '"') {
        const { value, indexCount } = this.parseStringLiteral(input, i)

        commandArguments.push(value)
        i += indexCount

        continue
      }

      let value = ''

      while (i < inputLength) {
        const char = input[i]

        if (CharSets.SPACES.has(char)) {
          break
        }

        value += char
        i++
      }

      commandArguments.push(value)
    }

    return commandArguments
  },
  parseCommand(input) {
    const commandName = this.parseCommandName(input)

    return {
      name: commandName,
      arguments: this.parseCommandArguments(input, commandName.length + 1)
    }
  },
  isIgnoreLine(input) {
    const inputLength = input.length

    for (let i = 0; i < inputLength; i++) {
      const char = input[i]

      if (CharSets.UPPERCASE_ALPHABETS.has(char)) {
        return false
      }

      if (char === '#') {
        return true
      }
    }

    return true
  },
  parse(input) {
    const rawCommands = input.split('\n')
    const commands: WritableKyotamdCommands = []

    for (const rawCommand of rawCommands) {
      if (!this.isIgnoreLine(rawCommand)) {
        commands.push(this.parseCommand(rawCommand))
      }
    }

    return commands
  }
}

export {
  KyotamdCommandArgument,
  KyotamdCommandArguments,
  KyotamdCommand,
  KyotamdCommands,
  KyotamdParenthesis,
  KyotamdStringLiteral,
  KyotamdParser
}