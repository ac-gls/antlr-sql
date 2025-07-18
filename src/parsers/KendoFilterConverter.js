/**
 * Converts SQL CASE statement AST to Kendo UI filter expressions
 */
export class KendoFilterConverter {
  constructor() {
    this.surveyQuestions = new Map();
  }

  /**
   * Register a survey question mapping
   * @param {string} questionId - Question identifier (e.g., "Q4")
   * @param {object} questionConfig - Question configuration
   */
  registerSurveyQuestion(questionId, questionConfig) {
    this.surveyQuestions.set(questionId, questionConfig);
  }

  /**
   * Convert SQL CASE AST to Kendo UI filter
   * @param {object} caseAst - The parsed CASE statement AST
   * @returns {object} - Kendo UI filter configuration
   */
  convertToKendoFilter(caseAst) {
    if (caseAst.type !== 'CaseExpression') {
      throw new Error('Expected CaseExpression AST');
    }

    // For now, we'll handle simple cases with one WHEN clause
    if (caseAst.whenClauses.length === 0) {
      throw new Error('CASE statement must have at least one WHEN clause');
    }

    const whenClause = caseAst.whenClauses[0];
    const condition = whenClause.condition;

    const filterExpression = this.convertConditionToFilter(condition);
    
    // Return Kendo Filter widget format
    return {
      expression: filterExpression,
      fields: this.generateFieldDefinitions(condition),
      displayText: filterExpression.displayText
    };
  }

  /**
   * Convert a condition AST to Kendo UI filter
   * @param {object} condition - Condition AST
   * @returns {object} - Kendo UI filter configuration
   */
  convertConditionToFilter(condition) {
    switch (condition.type) {
      case 'InCondition':
        return this.convertInCondition(condition);
      case 'EqualsCondition':
        return this.convertEqualsCondition(condition);
      default:
        throw new Error(`Unsupported condition type: ${condition.type}`);
    }
  }

  /**
   * Convert IN condition to Kendo UI filter
   * @param {object} condition - IN condition AST
   * @returns {object} - Kendo UI filter expression
   */
  convertInCondition(condition) {
    const questionId = condition.column.name;
    const questionConfig = this.surveyQuestions.get(questionId);

    if (!questionConfig) {
      throw new Error(`Unknown survey question: ${questionId}`);
    }

    // Convert values to answer labels
    const selectedValues = condition.values.map(value => {
      if (value.type === 'NumberValue') {
        const answerConfig = questionConfig.answers.find(a => a.value === value.value);
        return answerConfig ? answerConfig.label : value.value.toString();
      }
      return value.value;
    });

    // Create Kendo UI filter expression for multiple values (OR logic)
    const filters = selectedValues.map(value => ({
      field: questionId,
      operator: 'eq',
      value: value
    }));

    const expression = {
      logic: 'or',
      filters: filters
    };

    // Add display text for human readability
    expression.displayText = this.generateDisplayText(questionConfig, selectedValues);
    expression.questionConfig = questionConfig;

    return expression;
  }

  /**
   * Convert equals condition to Kendo UI filter
   * @param {object} condition - Equals condition AST
   * @returns {object} - Kendo UI filter expression
   */
  convertEqualsCondition(condition) {
    const questionId = condition.column.name;
    const questionConfig = this.surveyQuestions.get(questionId);

    if (!questionConfig) {
      throw new Error(`Unknown survey question: ${questionId}`);
    }

    let selectedValue;
    if (condition.value.type === 'NumberValue') {
      const answerConfig = questionConfig.answers.find(a => a.value === condition.value.value);
      selectedValue = answerConfig ? answerConfig.label : condition.value.value.toString();
    } else {
      selectedValue = condition.value.value;
    }

    // Create Kendo UI filter expression for single value
    const expression = {
      logic: 'and',
      filters: [{
        field: questionId,
        operator: 'eq',
        value: selectedValue
      }]
    };

    // Add display text for human readability
    expression.displayText = this.generateDisplayText(questionConfig, [selectedValue]);
    expression.questionConfig = questionConfig;

    return expression;
  }

  /**
   * Generate field definitions for Kendo Filter widget
   * @param {object} condition - The condition AST to extract field information from
   * @returns {array} - Array of field definitions
   */
  generateFieldDefinitions(condition) {
    const fieldNames = this.extractFieldNames(condition);
    
    return fieldNames.map(fieldName => {
      const questionConfig = this.surveyQuestions.get(fieldName);
      if (questionConfig) {
        return {
          name: fieldName,
          type: 'string', // Survey answers are treated as strings
          label: questionConfig.text || fieldName,
          values: questionConfig.answers ? questionConfig.answers.map(answer => ({
            text: answer.label,
            value: answer.label
          })) : undefined
        };
      } else {
        return {
          name: fieldName,
          type: 'string',
          label: fieldName
        };
      }
    });
  }

  /**
   * Extract field names from a condition AST
   * @param {object} condition - Condition AST
   * @returns {array} - Array of unique field names
   */
  extractFieldNames(condition) {
    const fieldNames = new Set();
    
    if (condition.type === 'InCondition' || condition.type === 'EqualsCondition') {
      fieldNames.add(condition.column.name);
    }
    // Add support for compound conditions in the future
    
    return Array.from(fieldNames);
  }

  /**
   * Generate human-readable display text for the filter
   * @param {object} questionConfig - Question configuration
   * @param {array} selectedValues - Selected answer values
   * @returns {string} - Display text
   */
  generateDisplayText(questionConfig, selectedValues) {
    const questionText = questionConfig.text || questionConfig.id;
    
    if (selectedValues.length === 1) {
      return `${questionText} is "${selectedValues[0]}"`;
    } else {
      const valueList = selectedValues.slice(0, -1).join('", "') + `" or "${selectedValues[selectedValues.length - 1]}`;
      return `${questionText} is "${valueList}"`;
    }
  }

  /**
   * Generate a complete usage example showing how to implement the Kendo Filter
   * @param {object} kendoFilterConfig - The complete Kendo Filter configuration
   * @returns {object} - Usage example with HTML, JavaScript, and implementation steps
   */
  generateUsageExample(kendoFilterConfig) {
    const htmlExample = `<div id="filter"></div>
<div id="grid"></div>`;

    const jsExample = `// 1. Initialize the Kendo Filter
$("#filter").kendoFilter(${JSON.stringify(kendoFilterConfig, null, 2)});

// 2. Get the filter instance
var filter = $("#filter").data("kendoFilter");

// 3. Apply the filter and get the expression
filter.applyFilter();
var expression = filter.expression();

// 4. Use with Kendo Grid or DataSource
$("#grid").kendoGrid({
    dataSource: {
        data: yourSurveyData,
        filter: expression // Apply the filter to your data
    },
    columns: [
        { field: "${kendoFilterConfig.fields[0]?.name || 'questionId'}", title: "${kendoFilterConfig.fields[0]?.label || 'Question'}" },
        { field: "respondentId", title: "Respondent ID" },
        { field: "answer", title: "Answer" }
    ]
});

// 5. Listen for filter changes
filter.bind("change", function(e) {
    var newExpression = e.sender.expression();
    // Update your grid or data source with the new filter
    $("#grid").data("kendoGrid").dataSource.filter(newExpression);
});`;

    const cssExample = `/* Optional: Style your filter */
#filter {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
}`;

    return {
      title: "How to Use in Your Application",
      steps: [
        {
          step: 1,
          title: "HTML Structure",
          description: "Add the required HTML elements to your page",
          code: htmlExample,
          language: "html"
        },
        {
          step: 2,
          title: "Initialize Kendo Filter",
          description: "Use the generated configuration to set up your filter widget",
          code: jsExample,
          language: "javascript"
        },
        {
          step: 3,
          title: "Optional CSS Styling",
          description: "Add custom styles to improve the appearance",
          code: cssExample,
          language: "css"
        }
      ],
      notes: [
        "Replace 'yourSurveyData' with your actual data array",
        "The filter expression can be used with any Kendo DataSource",
        "Listen to the 'change' event to react to filter modifications",
        "You can programmatically set filters using filter.expression(newExpression)"
      ]
    };
  }

  /**
   * Create a sample survey question configuration
   * @param {string} questionId - Question identifier
   * @param {string} questionText - Question text
   * @param {array} answers - Array of answer objects with value and label
   * @returns {object} - Question configuration
   */
  static createSurveyQuestion(questionId, questionText, answers) {
    return {
      id: questionId,
      text: questionText,
      type: 'multiple_choice',
      answers: answers
    };
  }
}
