/**
 * Simple SQL CASE statement parser for converting to Kendo UI filters
 */
export class SqlCaseParser {
  constructor() {
    this.tokens = [];
    this.position = 0;
  }

  /**
   * Parse a SQL CASE statement into an AST
   * @param {string} sqlCase - The SQL CASE statement to parse
   * @returns {object} - AST representation of the CASE statement
   */
  parse(sqlCase) {
    this.tokenize(sqlCase);
    this.position = 0;
    return this.parseCaseExpression();
  }

  /**
   * Tokenize the input SQL string
   * @param {string} sql - The SQL string to tokenize
   */
  tokenize(sql) {
    const tokenRegex = /(\w+|\[[\w\d_]+\]|\d+|'[^']*'|[(),=]|\s+)/gi;
    this.tokens = sql.match(tokenRegex)
      .filter(token => token.trim() !== '')
      .map(token => token.trim());
  }

  /**
   * Get the current token
   * @returns {string} - Current token
   */
  currentToken() {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }

  /**
   * Move to the next token
   */
  nextToken() {
    this.position++;
  }

  /**
   * Check if current token matches expected token (case insensitive)
   * @param {string} expected - Expected token
   * @returns {boolean} - True if tokens match
   */
  matchToken(expected) {
    const current = this.currentToken();
    return current && current.toLowerCase() === expected.toLowerCase();
  }

  /**
   * Consume a token if it matches expected
   * @param {string} expected - Expected token
   * @returns {boolean} - True if token was consumed
   */
  consumeToken(expected) {
    if (this.matchToken(expected)) {
      this.nextToken();
      return true;
    }
    return false;
  }

  /**
   * Parse CASE expression
   * @returns {object} - Case expression AST
   */
  parseCaseExpression() {
    if (!this.consumeToken('case')) {
      throw new Error('Expected CASE keyword');
    }

    const whenClauses = [];
    while (this.matchToken('when')) {
      whenClauses.push(this.parseWhenClause());
    }

    let elseClause = null;
    if (this.matchToken('else')) {
      elseClause = this.parseElseClause();
    }

    if (!this.consumeToken('end')) {
      throw new Error('Expected END keyword');
    }

    return {
      type: 'CaseExpression',
      whenClauses,
      elseClause
    };
  }

  /**
   * Parse WHEN clause
   * @returns {object} - When clause AST
   */
  parseWhenClause() {
    if (!this.consumeToken('when')) {
      throw new Error('Expected WHEN keyword');
    }

    const condition = this.parseCondition();

    if (!this.consumeToken('then')) {
      throw new Error('Expected THEN keyword');
    }

    const expression = this.parseExpression();

    return {
      type: 'WhenClause',
      condition,
      expression
    };
  }

  /**
   * Parse ELSE clause
   * @returns {object} - Else clause AST
   */
  parseElseClause() {
    if (!this.consumeToken('else')) {
      throw new Error('Expected ELSE keyword');
    }

    const expression = this.parseExpression();

    return {
      type: 'ElseClause',
      expression
    };
  }

  /**
   * Parse condition (e.g., [Q4] IN (1, 2, 3))
   * @returns {object} - Condition AST
   */
  parseCondition() {
    const left = this.parseColumnRef();

    if (this.matchToken('in')) {
      this.nextToken();
      if (!this.consumeToken('(')) {
        throw new Error('Expected opening parenthesis after IN');
      }
      const values = this.parseValueList();
      if (!this.consumeToken(')')) {
        throw new Error('Expected closing parenthesis');
      }

      return {
        type: 'InCondition',
        column: left,
        values
      };
    } else if (this.consumeToken('=')) {
      const value = this.parseValue();
      return {
        type: 'EqualsCondition',
        column: left,
        value
      };
    }

    throw new Error('Unsupported condition type');
  }

  /**
   * Parse column reference (e.g., [Q4] or Q4)
   * @returns {object} - Column reference AST
   */
  parseColumnRef() {
    const token = this.currentToken();
    if (!token) {
      throw new Error('Expected column reference');
    }

    if (token.startsWith('[') && token.endsWith(']')) {
      this.nextToken();
      return {
        type: 'ColumnRef',
        name: token.slice(1, -1) // Remove brackets
      };
    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
      this.nextToken();
      return {
        type: 'ColumnRef',
        name: token
      };
    }

    throw new Error('Invalid column reference');
  }

  /**
   * Parse value list (e.g., 1, 2, 3)
   * @returns {array} - Array of value ASTs
   */
  parseValueList() {
    const values = [];
    values.push(this.parseValue());

    while (this.consumeToken(',')) {
      values.push(this.parseValue());
    }

    return values;
  }

  /**
   * Parse value (number, string, or NULL)
   * @returns {object} - Value AST
   */
  parseValue() {
    const token = this.currentToken();
    if (!token) {
      throw new Error('Expected value');
    }

    if (token.toLowerCase() === 'null') {
      this.nextToken();
      return {
        type: 'NullValue'
      };
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      this.nextToken();
      return {
        type: 'NumberValue',
        value: parseFloat(token)
      };
    } else if (token.startsWith("'") && token.endsWith("'")) {
      this.nextToken();
      return {
        type: 'StringValue',
        value: token.slice(1, -1) // Remove quotes
      };
    }

    throw new Error('Invalid value');
  }

  /**
   * Parse expression (value or column reference)
   * @returns {object} - Expression AST
   */
  parseExpression() {
    const token = this.currentToken();
    if (!token) {
      throw new Error('Expected expression');
    }

    // Try to parse as value first
    try {
      return this.parseValue();
    } catch {
      // If that fails, try to parse as column reference
      return this.parseColumnRef();
    }
  }
}
