import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const parseObjectLiteral = (
  objectLiteralString: string,
): [string, string | undefined][] => {
  try {
    const STRING_DOUBLE = '"(?:[^"\\\\]|\\\\.)*"';
    const STRING_SINGLE = "'(?:[^'\\\\]|\\\\.)*'";
    const STRING_REGEXP = '/(?:[^/\\\\]|\\\\.)*/w*';
    const SPECIAL_CHARACTERS = ',"\'{}()/:[\\]';
    const EVERYTHING_ELSE = `[^\\s:,/][^${SPECIAL_CHARACTERS}]*[^\\s${SPECIAL_CHARACTERS}]`;
    const ONE_NOT_SPACE = '[^\\s]';
    const TOKEN_REGEX = RegExp(
      `${STRING_DOUBLE}|${STRING_SINGLE}|${STRING_REGEXP}|${EVERYTHING_ELSE}|${ONE_NOT_SPACE}`,
      'g',
    );
    const DIVISION_LOOK_BEHIND = /[\])"'A-Za-z0-9_$]+$/;
    const KEYWORD_REGEX_LOOK_BEHIND: Record<string, number> = {
      in: 1,
      return: 1,
      typeof: 1,
    };
    let stringToParse = objectLiteralString.trim();
    if (stringToParse.charCodeAt(0) === 123)
      stringToParse = stringToParse.slice(1, -1);
    const result: [string, string | undefined][] = [];
    let tokens = stringToParse.match(TOKEN_REGEX) as RegExpMatchArray;
    if (!tokens) return result;
    let key: string | undefined;
    let values = [];
    let depth = 0;
    tokens.push(',');
    for (let i = 0, token: string; (token = tokens[i]); ++i) {
      const characterCode = token.charCodeAt(0);
      if (characterCode === 44) {
        if (depth <= 0) {
          if (!key && values.length === 1) {
            key = values.pop();
          }
          if (key)
            result.push([key, values.length ? values.join('') : undefined]);
          key = undefined;
          values = [];
          depth = 0;
          continue;
        }
      } else if (characterCode === 58) {
        if (!depth && !key && values.length === 1) {
          key = values.pop();
          continue;
        }
      } else if (characterCode === 47 && i && token.length > 1) {
        const match = tokens[i - 1].match(DIVISION_LOOK_BEHIND);
        if (match && !KEYWORD_REGEX_LOOK_BEHIND[match[0]]) {
          stringToParse = stringToParse.substr(
            stringToParse.indexOf(token) + 1,
          );
          const result = stringToParse.match(TOKEN_REGEX);
          if (result) tokens = result;
          tokens.push(',');
          i = -1;
          token = '/';
        }
      } else if (
        characterCode === 40 ||
        characterCode === 123 ||
        characterCode === 91
      ) {
        ++depth;
      } else if (
        characterCode === 41 ||
        characterCode === 125 ||
        characterCode === 93
      ) {
        --depth;
      } else if (
        !key &&
        !values.length &&
        (characterCode === 34 || characterCode === 39)
      ) {
        token = token.slice(1, -1);
      }
      values.push(token);
    }
    return result;
  } catch (error) {
    console.error(
      'Error parsing object literal string',
      objectLiteralString,
      error,
    );
    return [];
  }
};

/**
 * @description Parse a string to an integer
 * @param {string} ruleValue - The string to be parsed
 * @returns {number} The parsed integer
 */
const parseStringToInt = (ruleValue: string): number => {
  if (!ruleValue.endsWith(')')) {
    return 0;
  }

  if (!ruleValue.startsWith('int(')) {
    return 0;
  }

  const arr = /\(([^)]+)\)/.exec(ruleValue);

  if (!arr || !arr[1]) {
    return 0;
  }

  return parseInt(arr[1], 10);
};

/**
 * @description Parse a string to a date
 * @param {string} ruleValue - The string to be parsed
 * @returns {string} The parsed date in ISO format
 */
const parseStringToDate = (ruleValue: string): string => {
  if (!ruleValue.endsWith(')')) {
    return '';
  }

  if (!ruleValue.startsWith('date(') && !ruleValue.startsWith('datetime(')) {
    return '';
  }

  const arr = /\(([^)]+)\)/.exec(ruleValue);

  if (!arr || !arr[1]) {
    return '';
  }

  return new Date(arr[1]).toISOString();
};

/**
 * @description Parse a string to a float
 * @param {string} ruleValue - The string to be parsed
 * @returns {number} The parsed float
 */
const parseStringToFloat = (ruleValue: string): number => {
  if (!ruleValue.endsWith(')')) {
    return 0;
  }

  if (!ruleValue.startsWith('float(')) {
    return 0;
  }

  const arr = /\(([^)]+)\)/.exec(ruleValue);

  if (!arr || !arr[1]) {
    return 0;
  }

  return parseFloat(arr[1]);
};

/**
 * @description Parse a string to a string
 * @param {string} ruleValue - The string to be parsed
 * @returns {string} The parsed string
 */
const parseStringToString = (ruleValue: string): string => {
  if (!ruleValue.endsWith(')')) {
    return '';
  }

  if (!ruleValue.startsWith('string(')) {
    return '';
  }

  const arr = /\(([^)]+)\)/.exec(ruleValue);

  if (!arr || !arr[1]) {
    return '';
  }

  return arr[1];
};

/**
 * @description Parse a string to a boolean
 * @param {string} ruleValue - The string to be parsed
 * @returns {boolean} The parsed boolean
 */
const parseStringToBoolean = (ruleValue: string): boolean => {
  if (!ruleValue.endsWith(')')) {
    return false;
  }

  if (!ruleValue.startsWith('boolean(') && !ruleValue.startsWith('bool(')) {
    return false;
  }

  const arr = /\(([^)]+)\)/.exec(ruleValue);

  if (!arr || !arr[1]) {
    return false;
  }

  return arr[1] === 'true';
};

/**
 * @description Parse a string to a value
 * @param {string} ruleValue - The string to be parsed
 * @returns {string | number | boolean | object} The parsed value
 */
const parseValue = (ruleValue: string): string | number | boolean | object => {
  if (ruleValue.startsWith('array(')) {
    const validRegExec = /\(([^]+)\)/.exec(ruleValue);

    if (validRegExec) {
      return validRegExec[1].split(',').map((value) => {
        switch (true) {
          case value.startsWith('int('):
            return parseStringToInt(value);
          case value.startsWith('date(') || value.startsWith('datetime('):
            return parseStringToDate(value);
          case value.startsWith('float('):
            return parseStringToFloat(value);
          case value.startsWith('string('):
            return parseStringToString(value);
          case value.startsWith('boolean(') || value.startsWith('bool('):
            return parseStringToBoolean(value);
          default:
            return value;
        }
      });
    }
  }

  switch (true) {
    case ruleValue.startsWith('int('):
      return parseStringToInt(ruleValue);
    case ruleValue.startsWith('date(') || ruleValue.startsWith('datetime('):
      return parseStringToDate(ruleValue);
    case ruleValue.startsWith('float('):
      return parseStringToFloat(ruleValue);
    case ruleValue.startsWith('string('):
      return parseStringToString(ruleValue);
    case ruleValue.startsWith('boolean(') || ruleValue.startsWith('bool('):
      return parseStringToBoolean(ruleValue);
    default:
      return ruleValue;
  }
};

/**
 * @description Convert a string like
 * @example "id: int(1), firstName: banana" to { id: 1, firstName: "banana" }
 * */
@Injectable()
export class CustomWherePipe implements PipeTransform {
  transform(value: string) {
    if (value == null) return undefined;

    try {
      const rules = parseObjectLiteral(decodeURIComponent(value) || value);

      return this.buildCondition(rules);
    } catch (error) {
      console.error('Error parsing query string:', error);
      throw new BadRequestException('Invalid query format');
    }
  }

  private buildCondition(rules: [string, string | undefined][]): any {
    const condition: any = {};
    const operations = this.getOperations();

    rules.forEach(([ruleKey, ruleValueRaw]) => {
      if (!ruleValueRaw) return;

      const ruleValue = parseValue(ruleValueRaw);
      const key = ruleKey.toUpperCase();
      if (key === 'OR' || key === 'AND') {
        let subConditions;
        if (ruleValueRaw?.includes('array(')) {
          let chainWithoutbrackets = ruleValueRaw.slice(1, -1);
          let result = [];
          let regexArray = /(\w+):in array\((.*?)\)/g;
          let match;
          while ((match = regexArray.exec(chainWithoutbrackets)) !== null) {
            result.push([match[1], `in array(${match[2]})`]);
            chainWithoutbrackets = chainWithoutbrackets.replace(match[0], '');
          }
          let pairsRestants = chainWithoutbrackets.split(',');
          pairsRestants.forEach((par) => {
            let [clave, valor] = par.trim().split(':');
            result.push([clave, valor]);
          });
          function isEmpty(elemento) {
            return (
              elemento === '' || elemento === undefined || elemento === null
            );
          }
          for (let i = 0; i < result.length; ) {
            let subarreglo = result[i];
            let tieneElementoVacio = subarreglo.some((subelemento) =>
              isEmpty(subelemento),
            );
            if (tieneElementoVacio) {
              result.splice(i, 1);
            } else {
              i++;
            }
          }
          subConditions = result.map((subRules) => {
            return this.buildCondition([subRules]);
          });
        } else {
          subConditions = ruleValueRaw
            .slice(1, -1)
            .split(',')
            .map((cond) => parseObjectLiteral(cond.trim()))
            .map((subRules) => this.buildCondition(subRules));
        }

        condition[key] = subConditions;
      } else if (key === 'NOT') {
        const subRules = parseObjectLiteral(ruleValueRaw.trim());

        condition[key] = this.buildCondition(subRules);
      } else {
        let operation;

        for (const op of operations) {
          if (ruleValueRaw.startsWith(`${op} `)) {
            operation = op;
            break;
          }
        }

        if (operation) {
          const parsedValue = parseValue(
            ruleValueRaw.replace(`${operation} `, ''),
          );

          const keys = ruleKey.split('.');
          let currentLevel = condition;

          for (let i = 0; i < keys.length; i++) {
            const currentKey = keys[i];

            if (i > 0) {
              currentLevel['is'] = currentLevel['is'] || {};
              currentLevel = currentLevel['is'];
            }

            if (i !== keys.length - 1) {
              currentLevel[currentKey] = currentLevel[currentKey] || {};
              currentLevel = currentLevel[currentKey];
            }
          }

          const lastKey = keys[keys.length - 1];
          currentLevel[lastKey] = currentLevel[lastKey] || {};
          currentLevel[lastKey][operation] = parsedValue;
          const rawValue = ruleValueRaw.replace(`${operation} `, '');
          if (
            rawValue.startsWith('date(') ||
            rawValue.startsWith('datetime(') ||
            rawValue.startsWith('int(') ||
            rawValue.startsWith('float(') ||
            rawValue.startsWith('bool(')
          ) {
            return;
          }
          if (
            typeof ruleValue === 'string' &&
            !['id', 'companies', 'tuuri', 'categories'].includes(lastKey)
          ) {
            currentLevel[lastKey]['mode'] = 'insensitive';
          }
        } else {
          const keys = ruleKey.split('.');
          let currentLevel = condition;
          for (let i = 0; i < keys.length; i++) {
            const currentKey = keys[i];
            if (i > 0) {
              currentLevel['is'] = currentLevel['is'] || {};
              currentLevel = currentLevel['is'];
            }

            if (i !== keys.length - 1) {
              currentLevel[currentKey] = currentLevel?.[currentKey] || {};
              currentLevel = currentLevel[currentKey];
            }
          }

          const lastKey = keys[keys.length - 1];
          currentLevel[lastKey] = ruleValue;
        }
      }
    });
    return condition;
  }

  private getOperations(): string[] {
    return [
      'lt',
      'lte',
      'gt',
      'gte',
      'equals',
      'not',
      'contains',
      'startsWith',
      'endsWith',
      'every',
      'some',
      'none',
      'in',
      'has',
      'hasEvery',
      'hasSome',
    ];
  }
}
