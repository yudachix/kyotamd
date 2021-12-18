interface CharSets {
  readonly UPPERCASE_ALPHABETS: ReadonlySet<string>
  readonly LOWERCASE_ALPHABETS: ReadonlySet<string>
  readonly DECIMAL_DIGITS: ReadonlySet<string>
  readonly SPACES: ReadonlySet<string>
}

const CharSets: CharSets = {
  UPPERCASE_ALPHABETS: new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  LOWERCASE_ALPHABETS: new Set('abcdefghijklmnopqrstuvwxyz'),
  DECIMAL_DIGITS: new Set('0123456789'),
  SPACES: new Set([
    '\u000c',
    '\u000a',
    '\u000d',
    '\u0009',
    '\u000b',
    '\u00a0',
    '\u1680',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004',
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200a',
    '\u2028',
    '\u2029',
    '\u202f',
    '\u205f',
    '\u3000',
    '\ufeff',
    '\u0020'
  ])
}

export { CharSets }