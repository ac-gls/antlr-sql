# SQL Case to Kendo Filter Converter

A web application built with Stimulus.js and ANTLR that parses SQL CASE statements and converts them to Kendo UI filter expressions for survey data analysis.

## Features

- **SQL CASE Statement Parsing**: Parse SQL statements like `case when [Q4] in (1, 2, 3) then 1 else NULL end`
- **Survey Question Mapping**: Maps question identifiers (e.g., Q4) to human-readable survey questions
- **Kendo UI Filter Generation**: Converts parsed SQL to Kendo UI filter configuration objects
- **Human-Readable Display**: Shows filter conditions in plain English
- **Interactive Web Interface**: Built with Stimulus.js for reactive behavior

## Technology Stack

- **Vite**: Fast build tool and development server
- **Stimulus.js**: Modest JavaScript framework for progressive enhancement
- **ANTLR**: Custom SQL parser for CASE statements
- **Kendo UI**: Target filter format for survey data
- **Vanilla CSS**: Custom utility classes for styling

## Project Structure

```
src/
├── controllers/           # Stimulus controllers
│   └── sql_parser_controller.js
├── grammar/              # ANTLR grammar files
│   └── SqlCase.g4
├── parsers/              # Parser and converter classes
│   ├── SqlCaseParser.js
│   └── KendoFilterConverter.js
├── main.js               # Application entry point
└── style.css             # Application styles
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Enter a SQL CASE Statement**: Type or paste a SQL CASE statement in the input area
2. **Use Sample Statements**: Click the sample buttons to load pre-configured examples
3. **Parse and Convert**: Click the "Parse SQL & Convert to Kendo Filter" button
4. **View Results**: 
   - See the parsed AST (Abstract Syntax Tree)
   - View the generated Kendo UI filter object
   - Read the human-friendly filter description

## Supported SQL Syntax

The parser currently supports:

- `CASE WHEN ... THEN ... ELSE ... END` statements
- `IN (value1, value2, ...)` conditions
- `= value` conditions
- Bracketed column references: `[Q4]`
- Numeric values: `1`, `2.5`
- String values: `'text'`
- NULL values

## Survey Questions

The application comes with sample survey questions:

- **Q4**: Satisfaction rating (1-5 scale)
- **Q1**: Age groups (1-5 categories)
- **Q2**: Usage frequency (1-5 scale)

## Examples

### Input SQL
```sql
case when [Q4] in (1, 2, 3) then 1 else NULL end
```

### Generated Kendo Filter
```javascript
{
  "field": "Q4",
  "operator": "eq",
  "value": ["Very Dissatisfied", "Dissatisfied", "Neutral"],
  "logic": "or",
  "filters": [
    {"field": "Q4", "operator": "eq", "value": "Very Dissatisfied"},
    {"field": "Q4", "operator": "eq", "value": "Dissatisfied"},
    {"field": "Q4", "operator": "eq", "value": "Neutral"}
  ]
}
```

### Human-Readable Output
"How satisfied are you with our service? is "Very Dissatisfied", "Dissatisfied" or "Neutral""

## Extending the Application

### Adding New Survey Questions

1. Modify the `setupSampleQuestions()` method in `sql_parser_controller.js`
2. Add question configuration with ID, text, and answer mappings
3. Register the question with the converter

### Supporting New SQL Syntax

1. Update the `SqlCaseParser.js` to handle new syntax patterns
2. Extend the AST node types as needed
3. Update the `KendoFilterConverter.js` to convert new node types

## Architecture

### SQL Parser (`SqlCaseParser.js`)
- Tokenizes SQL input using regex patterns
- Builds an Abstract Syntax Tree (AST) representing the SQL structure
- Handles CASE, WHEN, THEN, ELSE, END keywords
- Supports IN conditions and equality conditions

### Kendo Filter Converter (`KendoFilterConverter.js`)
- Takes the SQL AST and converts it to Kendo UI filter format
- Maps survey question IDs to human-readable question text
- Converts numeric answer values to descriptive labels
- Generates display text for user-friendly filter descriptions

### Stimulus Controller (`sql_parser_controller.js`)
- Manages the web interface and user interactions
- Coordinates between parser and converter
- Handles error display and result formatting
- Provides sample SQL statements for testing

## License

This project is open source and available under the MIT License.
