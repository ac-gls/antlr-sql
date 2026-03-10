/**
 * @module SqlCaseParser
 * @description A recursive descent parser for SQL CASE statements that converts SQL syntax
 * into an Abstract Syntax Tree (AST). This parser is designed specifically for handling
 * survey question expressions in the format commonly used with Kendo UI filters.
 * 
 * The parser supports:
 * - Simple CASE...WHEN...THEN...ELSE...END expressions
 * - IN conditions with value lists: `[Q4] IN (1, 2, 3)`
 * - Equality conditions: `[Q4] = 1`
 * - Bracketed column references: `[Q4]`, `[QuestionName]`
 * - Numeric, string, and NULL values
 * 
 * @example
 * // Basic usage
 * import { SqlCaseParser } from './parsers/SqlCaseParser.js';
 * 
 * const parser = new SqlCaseParser();
 * const ast = parser.parse("CASE WHEN [Q4] IN (1, 2, 3) THEN 1 ELSE NULL END");
 * console.log(ast);
 * // Output: { type: 'CaseExpression', whenClauses: [...], elseClause: {...} }
 * 
 * @see {@link module:KendoFilterConverter} for converting the AST to Kendo UI filters
 */

/**
 * @typedef {Object} CaseExpressionAST
 * @property {'CaseExpression'} type - The AST node type identifier
 * @property {WhenClauseAST[]} whenClauses - Array of WHEN clause AST nodes
 * @property {ElseClauseAST|null} elseClause - Optional ELSE clause AST node
 * @description Represents the root AST node for a SQL CASE expression
 */

/**
 * @typedef {Object} WhenClauseAST
 * @property {'WhenClause'} type - The AST node type identifier
 * @property {ConditionAST} condition - The condition to evaluate
 * @property {ValueAST|ColumnRefAST} expression - The result expression when condition is true
 * @description Represents a WHEN...THEN clause within a CASE expression
 */

/**
 * @typedef {Object} ElseClauseAST
 * @property {'ElseClause'} type - The AST node type identifier
 * @property {ValueAST|ColumnRefAST} expression - The default result expression
 * @description Represents the ELSE clause within a CASE expression
 */

/**
 * @typedef {InConditionAST|EqualsConditionAST} ConditionAST
 * @description Union type representing the supported condition types
 */

/**
 * @typedef {Object} InConditionAST
 * @property {'InCondition'} type - The AST node type identifier
 * @property {ColumnRefAST} column - The column being tested
 * @property {ValueAST[]} values - Array of values to test against
 * @description Represents an IN condition (e.g., `[Q4] IN (1, 2, 3)`)
 */

/**
 * @typedef {Object} EqualsConditionAST
 * @property {'EqualsCondition'} type - The AST node type identifier
 * @property {ColumnRefAST} column - The column being tested
 * @property {ValueAST} value - The value to compare against
 * @description Represents an equality condition (e.g., `[Q4] = 1`)
 */

/**
 * @typedef {Object} ColumnRefAST
 * @property {'ColumnRef'} type - The AST node type identifier
 * @property {string} name - The column name (without brackets)
 * @description Represents a reference to a column/field (survey question)
 */

/**
 * @typedef {NumberValueAST|StringValueAST|NullValueAST} ValueAST
 * @description Union type representing the supported value types
 */

/**
 * @typedef {Object} NumberValueAST
 * @property {'NumberValue'} type - The AST node type identifier
 * @property {number} value - The numeric value
 * @description Represents a numeric literal value
 */

/**
 * @typedef {Object} StringValueAST
 * @property {'StringValue'} type - The AST node type identifier
 * @property {string} value - The string value (without quotes)
 * @description Represents a string literal value
 */

/**
 * @typedef {Object} NullValueAST
 * @property {'NullValue'} type - The AST node type identifier
 * @description Represents a SQL NULL value
 */

/**
 * Recursive descent parser for SQL CASE statements.
 * 
 * This class implements a tokenizer and parser that converts SQL CASE statements
 * into an Abstract Syntax Tree (AST) suitable for further processing, such as
 * conversion to Kendo UI filter expressions.
 * 
 * @class SqlCaseParser
 * @classdesc Parses SQL CASE statements commonly used in survey data processing.
 * The parser handles bracketed column references (e.g., `[Q4]`) which represent
 * survey questions, and various value types including numbers, strings, and NULL.
 * 
 * @example
 * // Parse a simple CASE statement with IN condition
 * const parser = new SqlCaseParser();
 * const ast = parser.parse("CASE WHEN [Q4] IN (1, 2, 3) THEN 1 ELSE NULL END");
 * 
 * @example
 * // Parse a CASE statement with equality condition
 * const parser = new SqlCaseParser();
 * const ast = parser.parse("CASE WHEN [SatisfactionScore] = 5 THEN 'High' ELSE 'Low' END");
 * 
 * @example
 * // Parse and inspect the AST structure
 * const parser = new SqlCaseParser();
 * const ast = parser.parse("CASE WHEN [Q1] IN (1, 2) THEN 1 ELSE NULL END");
 * // ast.whenClauses[0].condition.column.name === 'Q1'
 * // ast.whenClauses[0].condition.values[0].value === 1
 */
export class SqlCaseParser {
  /**
   * Creates a new SqlCaseParser instance.
   * 
   * @constructor
   * @memberof SqlCaseParser
   * @example
   * const parser = new SqlCaseParser();
   */
  constructor() {
    /**
     * Array of tokens extracted from the SQL input.
     * @type {string[]}
     * @private
     */
    this.tokens = [];
    
    /**
     * Current position in the token array during parsing.
     * @type {number}
     * @private
     */
    this.position = 0;
  }

  /**
   * Parse a SQL CASE statement into an Abstract Syntax Tree (AST).
   * 
   * This is the main entry point for parsing SQL CASE statements. The method
   * tokenizes the input and then performs recursive descent parsing to produce
   * a structured AST representation.
   * 
   * @param {string} sqlCase - The SQL CASE statement to parse. Must be a complete
   *   CASE expression starting with "CASE" and ending with "END".
   * @returns {CaseExpressionAST} The AST representation of the CASE statement
   * @throws {Error} If the SQL syntax is invalid or unsupported
   * 
   * @example
   * const parser = new SqlCaseParser();
   * 
   * // Parse IN condition
   * const ast1 = parser.parse("CASE WHEN [Q4] IN (1, 2, 3) THEN 1 ELSE NULL END");
   * console.log(ast1.type); // 'CaseExpression'
   * console.log(ast1.whenClauses.length); // 1
   * console.log(ast1.whenClauses[0].condition.type); // 'InCondition'
   * 
   * @example
   * // Parse equality condition
   * const ast2 = parser.parse("CASE WHEN [Score] = 10 THEN 'Perfect' ELSE 'Other' END");
   * console.log(ast2.whenClauses[0].condition.type); // 'EqualsCondition'
   * 
   * @see {@link CaseExpressionAST} for the return type structure
   */
  parse(sqlCase) {
    this.tokenize(sqlCase);
    this.position = 0;
    return this.parseCaseExpression();
  }

  /**
   * Tokenize the input SQL string into an array of tokens.
   * 
   * The tokenizer recognizes the following token types:
   * - Keywords (CASE, WHEN, THEN, ELSE, END, IN, NULL)
   * - Bracketed identifiers ([Q4], [QuestionName])
   * - Numbers (integers and decimals)
   * - String literals ('value')
   * - Operators and punctuation (=, (, ), ,)
   * 
   * Whitespace is consumed but not included in the token array.
   * 
   * @param {string} sql - The SQL string to tokenize
   * @returns {void}
   * @private
   * @throws {Error} If the input contains unrecognized tokens
   * 
   * @example
   * // Internal tokenization example
   * this.tokenize("[Q4] IN (1, 2)");
   * // this.tokens = ['[Q4]', 'IN', '(', '1', ',', '2', ')']
   */
  tokenize(sql) {
    const tokenRegex = /(\w+|\[[\w\d_]+\]|\d+|'[^']*'|[(),=]|\s+)/gi;
    this.tokens = sql.match(tokenRegex)
      .filter(token => token.trim() !== '')
      .map(token => token.trim());
  }

  /**
   * Get the current token at the parser's position without advancing.
   * 
   * This method is used to peek at the next token to be processed without
   * consuming it. Returns null if the parser has reached the end of input.
   * 
   * @returns {string|null} The current token, or null if at end of input
   * @private
   * 
   * @example
   * // After tokenizing "CASE WHEN..."
   * this.position = 0;
   * console.log(this.currentToken()); // 'CASE'
   */
  currentToken() {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }

  /**
   * Advance the parser position to the next token.
   * 
   * This method increments the internal position counter, effectively
   * consuming the current token and moving to the next one.
   * 
   * @returns {void}
   * @private
   * 
   * @example
   * // Advance from 'CASE' to 'WHEN'
   * this.nextToken();
   */
  nextToken() {
    this.position++;
  }

  /**
   * Check if the current token matches the expected token (case-insensitive).
   * 
   * This method performs a case-insensitive comparison between the current
   * token and the expected token. Useful for matching SQL keywords which
   * can appear in any case.
   * 
   * @param {string} expected - The expected token to match against
   * @returns {boolean} True if the current token matches (case-insensitive), false otherwise
   * @private
   * 
   * @example
   * // Check if current token is 'WHEN' or 'when' or 'When'
   * if (this.matchToken('when')) {
   *   // Process WHEN clause
   * }
   */
  matchToken(expected) {
    const current = this.currentToken();
    return current && current.toLowerCase() === expected.toLowerCase();
  }

  /**
   * Attempt to consume a token if it matches the expected value.
   * 
   * If the current token matches the expected token (case-insensitive),
   * the parser advances to the next token and returns true. Otherwise,
   * the parser position remains unchanged and false is returned.
   * 
   * @param {string} expected - The expected token to consume
   * @returns {boolean} True if the token was consumed, false otherwise
   * @private
   * 
   * @example
   * // Consume 'CASE' keyword
   * if (!this.consumeToken('case')) {
   *   throw new Error('Expected CASE keyword');
   * }
   */
  consumeToken(expected) {
    if (this.matchToken(expected)) {
      this.nextToken();
      return true;
    }
    return false;
  }

  /**
   * Parse a complete CASE expression into an AST node.
   * 
   * This method parses the full CASE...WHEN...THEN...ELSE...END structure.
   * It expects the parser to be positioned at the 'CASE' keyword and will
   * consume all tokens through the closing 'END' keyword.
   * 
   * Grammar:
   * ```
   * CaseExpression ::= 'CASE' WhenClause+ [ElseClause] 'END'
   * ```
   * 
   * @returns {CaseExpressionAST} The parsed CASE expression AST
   * @throws {Error} If 'CASE' keyword is not found at current position
   * @throws {Error} If 'END' keyword is missing at the end
   * @private
   * 
   * @example
   * // Internal parsing
   * const ast = this.parseCaseExpression();
   * // Returns: { type: 'CaseExpression', whenClauses: [...], elseClause: ... }
   * 
   * @see {@link parseWhenClause} for WHEN clause parsing
   * @see {@link parseElseClause} for ELSE clause parsing
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
   * Parse a WHEN...THEN clause into an AST node.
   * 
   * This method parses a single WHEN clause including its condition and
   * the THEN result expression. Expects the parser to be positioned at
   * the 'WHEN' keyword.
   * 
   * Grammar:
   * ```
   * WhenClause ::= 'WHEN' Condition 'THEN' Expression
   * ```
   * 
   * @returns {WhenClauseAST} The parsed WHEN clause AST
   * @throws {Error} If 'WHEN' keyword is not found
   * @throws {Error} If 'THEN' keyword is missing after condition
   * @private
   * 
   * @example
   * // Parsing "WHEN [Q4] IN (1, 2) THEN 1"
   * const whenAst = this.parseWhenClause();
   * // Returns: { type: 'WhenClause', condition: {...}, expression: {...} }
   * 
   * @see {@link parseCondition} for condition parsing
   * @see {@link parseExpression} for expression parsing
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
   * Parse an ELSE clause into an AST node.
   * 
   * This method parses the optional ELSE clause that provides a default
   * value when no WHEN conditions match. Expects the parser to be
   * positioned at the 'ELSE' keyword.
   * 
   * Grammar:
   * ```
   * ElseClause ::= 'ELSE' Expression
   * ```
   * 
   * @returns {ElseClauseAST} The parsed ELSE clause AST
   * @throws {Error} If 'ELSE' keyword is not found
   * @private
   * 
   * @example
   * // Parsing "ELSE NULL"
   * const elseAst = this.parseElseClause();
   * // Returns: { type: 'ElseClause', expression: { type: 'NullValue' } }
   * 
   * @see {@link parseExpression} for expression parsing
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
   * Parse a condition expression into an AST node.
   * 
   * Supports two types of conditions:
   * - **IN conditions**: `[Column] IN (value1, value2, ...)`
   * - **Equality conditions**: `[Column] = value`
   * 
   * Grammar:
   * ```
   * Condition ::= ColumnRef 'IN' '(' ValueList ')'
   *             | ColumnRef '=' Value
   * ```
   * 
   * @returns {ConditionAST} The parsed condition AST (InConditionAST or EqualsConditionAST)
   * @throws {Error} If the condition type is not supported
   * @throws {Error} If parentheses are missing for IN conditions
   * @private
   * 
   * @example
   * // Parsing "[Q4] IN (1, 2, 3)"
   * const inCondition = this.parseCondition();
   * // Returns: {
   * //   type: 'InCondition',
   * //   column: { type: 'ColumnRef', name: 'Q4' },
   * //   values: [{ type: 'NumberValue', value: 1 }, ...]
   * // }
   * 
   * @example
   * // Parsing "[Q4] = 5"
   * const eqCondition = this.parseCondition();
   * // Returns: {
   * //   type: 'EqualsCondition',
   * //   column: { type: 'ColumnRef', name: 'Q4' },
   * //   value: { type: 'NumberValue', value: 5 }
   * // }
   * 
   * @see {@link parseColumnRef} for column reference parsing
   * @see {@link parseValueList} for value list parsing
   * @see {@link parseValue} for single value parsing
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
   * Parse a column reference into an AST node.
   * 
   * Column references can be specified in two formats:
   * - **Bracketed**: `[Q4]`, `[QuestionName]` - recommended for names with special characters
   * - **Unbracketed**: `Q4`, `QuestionName` - for simple alphanumeric names
   * 
   * In the context of survey data, column references typically represent
   * survey question identifiers (e.g., Q1, Q2, SatisfactionScore).
   * 
   * Grammar:
   * ```
   * ColumnRef ::= '[' Identifier ']'
   *             | Identifier
   * ```
   * 
   * @returns {ColumnRefAST} The parsed column reference AST
   * @throws {Error} If no valid column reference is found
   * @throws {Error} If the column reference format is invalid
   * @private
   * 
   * @example
   * // Parsing bracketed reference "[Q4]"
   * const colRef = this.parseColumnRef();
   * // Returns: { type: 'ColumnRef', name: 'Q4' }
   * 
   * @example
   * // Parsing unbracketed reference "Score"
   * const colRef = this.parseColumnRef();
   * // Returns: { type: 'ColumnRef', name: 'Score' }
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
   * Parse a comma-separated list of values into an array of AST nodes.
   * 
   * Used for parsing the values within an IN condition. Each value in the
   * list is parsed individually and collected into an array.
   * 
   * Grammar:
   * ```
   * ValueList ::= Value (',' Value)*
   * ```
   * 
   * @returns {ValueAST[]} Array of parsed value AST nodes
   * @throws {Error} If any value in the list is invalid
   * @private
   * 
   * @example
   * // Parsing "1, 2, 3" after IN (
   * const values = this.parseValueList();
   * // Returns: [
   * //   { type: 'NumberValue', value: 1 },
   * //   { type: 'NumberValue', value: 2 },
   * //   { type: 'NumberValue', value: 3 }
   * // ]
   * 
   * @see {@link parseValue} for individual value parsing
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
   * Parse a single value literal into an AST node.
   * 
   * Supports three types of values:
   * - **NULL**: The SQL NULL keyword (case-insensitive)
   * - **Numbers**: Integer or decimal values (e.g., `42`, `3.14`)
   * - **Strings**: Single-quoted strings (e.g., `'Yes'`, `'Strongly Agree'`)
   * 
   * Grammar:
   * ```
   * Value ::= 'NULL'
   *         | Number
   *         | String
   * ```
   * 
   * @returns {ValueAST} The parsed value AST (NullValueAST, NumberValueAST, or StringValueAST)
   * @throws {Error} If no valid value is found at current position
   * @throws {Error} If the value format is invalid
   * @private
   * 
   * @example
   * // Parsing NULL
   * const nullVal = this.parseValue();
   * // Returns: { type: 'NullValue' }
   * 
   * @example
   * // Parsing a number
   * const numVal = this.parseValue();
   * // Returns: { type: 'NumberValue', value: 42 }
   * 
   * @example
   * // Parsing a string
   * const strVal = this.parseValue();
   * // Returns: { type: 'StringValue', value: 'Yes' }
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
   * Parse an expression that can be either a value or a column reference.
   * 
   * Expressions appear in the THEN and ELSE clauses of CASE statements.
   * This method attempts to parse the current position as a value first,
   * and falls back to parsing as a column reference if that fails.
   * 
   * Grammar:
   * ```
   * Expression ::= Value
   *              | ColumnRef
   * ```
   * 
   * @returns {ValueAST|ColumnRefAST} The parsed expression AST
   * @throws {Error} If neither a value nor column reference can be parsed
   * @private
   * 
   * @example
   * // Parsing "1" as expression
   * const expr = this.parseExpression();
   * // Returns: { type: 'NumberValue', value: 1 }
   * 
   * @example
   * // Parsing "NULL" as expression
   * const expr = this.parseExpression();
   * // Returns: { type: 'NullValue' }
   * 
   * @example
   * // Parsing "[Q4]" as expression
   * const expr = this.parseExpression();
   * // Returns: { type: 'ColumnRef', name: 'Q4' }
   * 
   * @see {@link parseValue} for value parsing
   * @see {@link parseColumnRef} for column reference parsing
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
