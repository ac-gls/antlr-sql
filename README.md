# SQL Case to Kendo Filter Converter

A web application that converts SQL CASE statements into Kendo UI filter expressions using Stimulus.js, ANTLR-style parsing, and Kendo UI components.

## 🚀 Features

- **SQL Parser**: Custom JavaScript implementation that parses SQL CASE statements
- **Kendo UI Integration**: Converts parsed SQL to Kendo UI filter expressions
- **Interactive Demo**: Live filtering with Kendo UI widgets
- **Real-time SQL Generation**: Shows equivalent SQL statements as you modify filters
- **Fallback UI**: Works even when Kendo UI components aren't available
- **Survey Data Demo**: Realistic sample data with survey questions
- **Professional Styling**: Ocean Blue theme with responsive design

## 🛠️ Tech Stack

- **Frontend Framework**: Stimulus.js
- **Parser**: Custom ANTLR-style SQL parser
- **UI Components**: Kendo UI (Filter, Grid, DataSource)
- **Build Tool**: Vite
- **Styling**: Custom CSS with Kendo UI themes

## 🎯 Use Cases

- Converting legacy SQL filters to modern UI components
- Survey data analysis and filtering
- Business intelligence dashboards
- Data exploration tools
- Educational tool for SQL-to-filter conversion

## 📁 Project Structure

```
stim-antlr/
├── src/
│   ├── controllers/
│   │   └── sql_parser_controller.js    # Main Stimulus controller
│   ├── parsers/
│   │   ├── SqlCaseParser.js            # SQL CASE statement parser
│   │   └── KendoFilterConverter.js     # Converts AST to Kendo filter
│   ├── grammar/
│   │   └── SqlCase.g4                  # ANTLR grammar definition
│   ├── main.js                         # Application entry point
│   └── style.css                       # Custom styling
├── index.html                          # Main HTML template
├── package.json                        # Dependencies and scripts
└── README.md                           # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stim-antlr.git
cd stim-antlr
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🗄️ Database Setup (Optional)

The application currently runs in **Demo Mode** with local sample data. To use AgentDB for cloud database functionality:

### AgentDB Configuration

1. **Create AgentDB Account**:
   - Visit [agentdb.dev](https://agentdb.dev/)
   - Sign up for an account
   - Create a new database project

2. **Get API Credentials**:
   - Copy your API key from the AgentDB dashboard
   - Note the correct API endpoints for your database

3. **Update Service Configuration**:
   - Open `src/services/AgentDbService.js`
   - Update the `apiKey` with your AgentDB API key
   - Verify the `baseUrl` and endpoint formats
   - Uncomment the API testing code in the `initialize()` method

4. **Test Connection**:
   - Restart the development server
   - Check the browser console for connection status
   - The app will automatically fall back to demo mode if AgentDB is unavailable

### Demo Mode vs. AgentDB Mode

| Feature | Demo Mode | AgentDB Mode |
|---------|-----------|--------------|
| Sample Data | ✅ 15 local records | ✅ Cloud database |
| Filtering | ✅ Local filtering | ✅ Server-side SQL |
| Statistics | ✅ Calculated locally | ✅ Real-time from DB |
| Persistence | ❌ Session only | ✅ Permanent storage |
| Collaboration | ❌ Local only | ✅ Shared access |

> **Note**: The application works fully in Demo Mode. AgentDB integration is optional for production deployments.

## 💡 How It Works

### 1. SQL Parsing
The application parses SQL CASE statements like:
```sql
case when [Q4] in (1, 2, 3) then 1 else NULL end
```

### 2. AST Generation
Creates an Abstract Syntax Tree (AST) representing the SQL structure:
```javascript
{
  type: "case_statement",
  conditions: [
    {
      field: "Q4",
      operator: "in",
      values: [1, 2, 3]
    }
  ]
}
```

### 3. Kendo Filter Conversion
Converts the AST to Kendo UI filter format:
```javascript
{
  logic: "or",
  filters: [
    { field: "Q4", operator: "eq", value: 1 },
    { field: "Q4", operator: "eq", value: 2 },
    { field: "Q4", operator: "eq", value: 3 }
  ]
}
```

## 🔧 Usage Examples

### Basic SQL to Filter Conversion

```javascript
// Parse SQL
const ast = parser.parse("case when [Q4] in (1, 2, 3) then 1 else NULL end");

// Convert to Kendo filter
const filter = converter.convertToKendoFilter(ast);

// Apply to Kendo Grid
$("#grid").kendoGrid({
  dataSource: {
    data: surveyData,
    filter: filter.expression
  }
});
```

### Advanced Filter Operations

The parser supports:
- **IN operations**: `[field] in (1, 2, 3)`
- **Equality**: `[field] = value`
- **Comparison**: `[field] > value`
- **Complex logic**: `[field1] = 1 AND [field2] in (2, 3)`

## 🎨 Demo Features

### Interactive Filter Widget
- Drag-and-drop filter building
- Real-time preview
- Apply/Reset functionality
- Expression validation

### Live Data Grid
- Filtered survey responses
- Sortable columns
- Pagination support
- Export functionality

### SQL Generation
- Real-time SQL statement generation
- Reverse engineering from filter changes
- Multiple format support

## 🔄 Development Workflow

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Key Components

1. **SqlCaseParser**: Handles SQL parsing logic
2. **KendoFilterConverter**: Converts AST to Kendo format
3. **sql_parser_controller**: Main Stimulus controller
4. **Interactive Demo**: Live filtering interface

## 📊 Sample Data

The application includes sample survey data with:
- 10 respondent records
- Multiple question types (satisfaction, age, frequency)
- Realistic demographic data
- Department and date information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Stimulus.js for the reactive framework
- Kendo UI for the professional UI components
- ANTLR for parser inspiration
- Vite for the excellent build experience

---

**Built with ❤️ for data filtering and SQL conversion**

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
