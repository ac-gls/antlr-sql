import { Controller } from "@hotwired/stimulus"
import { SqlCaseParser } from "../parsers/SqlCaseParser.js"
import { KendoFilterConverter } from "../parsers/KendoFilterConverter.js"

export default class extends Controller {
  static targets = ["sqlInput", "parseResult", "kendoFilter", "filterDisplay", "errorDisplay"]
  static values = { 
    surveyQuestions: Array
  }

  connect() {
    console.log("SQL Parser controller connected")
    console.log("Available targets:", Object.keys(this.constructor.targets))
    console.log("sqlInputTarget exists:", this.hasSqlInputTarget)
    console.log("jQuery available:", typeof $ !== 'undefined')
    console.log("Kendo UI available:", typeof kendo !== 'undefined')
    
    // Initialize parser and converter
    this.parser = new SqlCaseParser()
    this.converter = new KendoFilterConverter()
    
    // Set up sample survey questions
    this.setupSampleQuestions()
    
    // Create sample survey data
    this.setupSampleData()
    
    // Set default SQL example
    if (this.hasSqlInputTarget) {
      this.sqlInputTarget.value = "case when [Q4] in (1, 2, 3) then 1 else NULL end"
      console.log("Default SQL set:", this.sqlInputTarget.value)
      
      // Auto-parse the default SQL to show example
      setTimeout(() => {
        this.parseSQL()
      }, 500)
    }
  }

  setupSampleData() {
    // Create realistic survey response data
    this.sampleData = [
      { respondentId: 1, Q1: "26-35", Q2: "Daily", Q4: "Very Satisfied", department: "Engineering", joinDate: "2023-01-15" },
      { respondentId: 2, Q1: "18-25", Q2: "Weekly", Q4: "Satisfied", department: "Marketing", joinDate: "2023-03-20" },
      { respondentId: 3, Q1: "36-45", Q2: "Monthly", Q4: "Neutral", department: "Sales", joinDate: "2022-11-10" },
      { respondentId: 4, Q1: "46-55", Q2: "Rarely", Q4: "Dissatisfied", department: "HR", joinDate: "2022-08-05" },
      { respondentId: 5, Q1: "26-35", Q2: "Daily", Q4: "Very Dissatisfied", department: "Finance", joinDate: "2023-02-28" },
      { respondentId: 6, Q1: "18-25", Q2: "Weekly", Q4: "Satisfied", department: "Engineering", joinDate: "2023-04-12" },
      { respondentId: 7, Q1: "36-45", Q2: "Monthly", Q4: "Very Satisfied", department: "Marketing", joinDate: "2022-12-03" },
      { respondentId: 8, Q1: "26-35", Q2: "Daily", Q4: "Neutral", department: "Sales", joinDate: "2023-01-08" },
      { respondentId: 9, Q1: "46-55", Q2: "Weekly", Q4: "Dissatisfied", department: "Engineering", joinDate: "2022-09-18" },
      { respondentId: 10, Q1: "18-25", Q2: "Rarely", Q4: "Very Satisfied", department: "HR", joinDate: "2023-05-22" }
    ];

    // Display sample data structure
    if (document.getElementById('sample-data-display')) {
      document.getElementById('sample-data-display').textContent = JSON.stringify(this.sampleData.slice(0, 3), null, 2);
    }
  }

  setupSampleQuestions() {
    // Define sample survey questions for demonstration
    const questions = [
      {
        id: "Q4",
        text: "How satisfied are you with our product?",
        answers: [
          { value: 1, label: "Very Satisfied" },
          { value: 2, label: "Satisfied" },
          { value: 3, label: "Neutral" },
          { value: 4, label: "Dissatisfied" },
          { value: 5, label: "Very Dissatisfied" }
        ]
      },
      {
        id: "Q1",
        text: "What is your age group?",
        answers: [
          { value: 1, label: "18-25" },
          { value: 2, label: "26-35" },
          { value: 3, label: "36-45" },
          { value: 4, label: "46-55" },
          { value: 5, label: "56+" }
        ]
      },
      {
        id: "Q2",
        text: "How often do you use our product?",
        answers: [
          { value: 1, label: "Daily" },
          { value: 2, label: "Weekly" },
          { value: 3, label: "Monthly" },
          { value: 4, label: "Rarely" },
          { value: 5, label: "Never" }
        ]
      }
    ]

    // Register questions with converter
    questions.forEach(q => {
      this.converter.registerSurveyQuestion(q.id, q)
    })
  }

  parseSQL() {
    this.clearError()
    
    if (!this.hasSqlInputTarget) {
      this.showError("SQL input field not found")
      return
    }

    const sqlText = this.sqlInputTarget.value.trim()
    if (!sqlText) {
      this.showError("Please enter a SQL CASE statement")
      return
    }

    try {
      // Parse the SQL
      const ast = this.parser.parse(sqlText)
      console.log("Parsed AST:", ast)
      this.displayParseResult(ast)

      // Convert to Kendo UI filter
      const kendoFilter = this.converter.convertToKendoFilter(ast)
      console.log("Kendo Filter:", kendoFilter)
      this.displayKendoFilter(kendoFilter)

    } catch (error) {
      console.error("Parse error:", error)
      this.showError(`Parse error: ${error.message}`)
    }
  }

  displayParseResult(ast) {
    if (this.hasParseResultTarget) {
      this.parseResultTarget.textContent = JSON.stringify(ast, null, 2)
      this.parseResultTarget.className = 'language-json'
    }
  }

  displayKendoFilter(filter) {
    if (this.hasKendoFilterTarget) {
      // Create a complete Kendo Filter widget configuration
      const kendoFilterConfig = {
        dataSource: {
          // This would be your actual data source
          data: []
        },
        expressionPreview: true,
        applyButton: true,
        fields: filter.fields,
        expression: filter.expression
      };

      // Generate usage example
      const usageExample = this.converter.generateUsageExample(kendoFilterConfig);

      this.kendoFilterTarget.innerHTML = `
        <h3>Kendo UI Filter Configuration</h3>
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Complete Widget Configuration:</h4>
          <pre class="bg-blue-50 p-4 rounded overflow-auto text-xs"><code>$("#filter").kendoFilter(${JSON.stringify(kendoFilterConfig, null, 2)}).data("kendoFilter").applyFilter();</code></pre>
        </div>
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Expression Only:</h4>
          <pre class="bg-blue-50 p-4 rounded overflow-auto"><code>${JSON.stringify(filter.expression, null, 2)}</code></pre>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Field Definitions:</h4>
          <pre class="bg-blue-50 p-4 rounded overflow-auto"><code>${JSON.stringify(filter.fields, null, 2)}</code></pre>
        </div>
        
        <!-- Usage Example -->
        <div class="mt-6 border-t pt-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">${usageExample.title}</h4>
          ${usageExample.steps.map((step, index) => `
            <div class="mb-6">
              <h5 class="font-medium text-gray-900 mb-2">${step.step}. ${step.title}</h5>
              <p class="text-sm text-gray-600 mb-2">${step.description}</p>
              <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto"><code>${step.code}</code></pre>
            </div>
          `).join('')}
          
          <div class="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h5 class="font-medium text-yellow-800 mb-2">📝 Implementation Notes:</h5>
            <ul class="text-sm text-yellow-700 space-y-1">
              ${usageExample.notes.map(note => `<li>• ${note}</li>`).join('')}
            </ul>
          </div>
        </div>
      `
    }

    if (this.hasFilterDisplayTarget) {
      this.filterDisplayTarget.innerHTML = `
        <h3>Human-Readable Filter</h3>
        <div class="bg-green-50 p-4 rounded border-l-4 border-green-400">
          <p class="font-semibold">${filter.expression.displayText}</p>
          <p class="text-sm text-gray-600 mt-2">
            Question: ${filter.expression.questionConfig.text}
          </p>
          <div class="mt-2">
            <span class="text-sm font-medium">Selected Values:</span>
            ${this.renderSelectedValues(filter.expression)}
          </div>
        </div>
      `
    }
    
    // Initialize the live demo if available
    this.initializeLiveDemo(filter);
    
    // Debug: Log the filter expression being sent to Kendo UI
    console.log('Filter expression for Kendo UI:', JSON.stringify(filter.expression, null, 2));
  }

  initializeLiveDemo(filter) {
    const demoFilterContainer = document.getElementById('demo-filter');
    const demoGridContainer = document.getElementById('demo-grid');
    
    if (!demoFilterContainer || !demoGridContainer) {
      return; // Demo containers not available
    }

    // Clear existing components
    demoFilterContainer.innerHTML = '';
    demoGridContainer.innerHTML = '';

    // Check if jQuery is available
    if (typeof $ === 'undefined') {
      console.error('jQuery is not loaded');
      demoFilterContainer.innerHTML = '<div class="text-red-600">Error: jQuery is not loaded. Please check CDN connection.</div>';
      return;
    }

    // Wait for Kendo UI to load if it's not immediately available
    const waitForKendo = () => {
      if (typeof kendo !== 'undefined') {
        console.log('Kendo UI is available, proceeding with demo');
        this.proceedWithDemo(filter, demoFilterContainer, demoGridContainer);
      } else {
        console.log('Kendo UI not yet available, waiting...');
        // Try again after a short delay
        setTimeout(() => {
          if (typeof kendo !== 'undefined') {
            console.log('Kendo UI loaded after delay');
            this.proceedWithDemo(filter, demoFilterContainer, demoGridContainer);
          } else {
            console.error('Kendo UI failed to load');
            demoFilterContainer.innerHTML = `
              <div class="text-orange-600 border border-orange-300 rounded p-4">
                <h4 class="font-semibold">Kendo UI Not Available</h4>
                <p class="text-sm mt-2">The Kendo UI library is not loading. This could be due to:</p>
                <ul class="text-sm mt-2 ml-4 list-disc">
                  <li>Network connectivity issues</li>
                  <li>CDN unavailability</li>
                  <li>Licensing restrictions</li>
                </ul>
                <p class="text-sm mt-2">Showing simplified demo instead...</p>
              </div>
            `;
            this.createSimpleFilterDemo(filter, demoFilterContainer, demoGridContainer);
          }
        }, 2000);
      }
    };

    waitForKendo();
  }

  proceedWithDemo(filter, demoFilterContainer, demoGridContainer) {
    // Create DataSource with proper schema
    const dataSource = new kendo.data.DataSource({
      data: this.sampleData,
      schema: {
        model: {
          fields: {
            respondentId: { type: "number" },
            Q1: { type: "string" },
            Q2: { type: "string" },
            Q4: { type: "string" },
            department: { type: "string" },
            joinDate: { type: "date" }
          }
        }
      }
    });

    // Log available Kendo UI components for debugging
    console.log('Available Kendo UI components:', Object.keys($.fn).filter(key => key.startsWith('kendo')));

    try {
      // Check if kendoFilter is available
      if (!$.fn.kendoFilter) {
        console.log('kendoFilter not available, using Grid with built-in filtering');
        this.createGridOnlyDemo(filter, demoFilterContainer, demoGridContainer);
        return;
      }

      // Test with a simple filter first to make sure it works
      console.log('Creating Kendo Filter with expression:', JSON.stringify(filter.expression, null, 2));
      
      const filterWidget = $("#" + demoFilterContainer.id).kendoFilter({
        dataSource: dataSource,
        expressionPreview: true,
        applyButton: true,
        fields: [
          { name: "Q1", type: "string", label: "Age Group" },
          { name: "Q2", type: "string", label: "Usage Frequency" },
          { name: "Q4", type: "string", label: "Satisfaction Level" },
          { name: "department", type: "string", label: "Department" }
        ],
        expression: filter.expression,
        change: (e) => {
          console.log('Filter changed:', e.expression);
          this.updateGridFilter(e.expression);
        }
      }).data('kendoFilter');

      // Apply the initial filter
      if (filterWidget) {
        filterWidget.applyFilter();
      }

      // Create grid with shared datasource
      const gridWidget = $("#" + demoGridContainer.id).kendoGrid({
        dataSource: dataSource,
        columns: [
          { field: 'respondentId', title: 'ID', width: 80 },
          { field: 'Q1', title: 'Age Group', width: 120 },
          { field: 'Q2', title: 'Usage Frequency', width: 140 },
          { field: 'Q4', title: 'Satisfaction', width: 120 },
          { field: 'department', title: 'Department', width: 120 },
          { field: 'joinDate', title: 'Join Date', width: 120 }
        ],
        height: 400,
        filterable: true,
        sortable: true,
        pageable: {
          pageSize: 5
        }
      }).data('kendoGrid');

      // Store references for updates
      this.demoFilter = filterWidget;
      this.demoGrid = gridWidget;
      this.sharedDataSource = dataSource;

      console.log('Live demo initialized successfully with proper Kendo Filter');
    } catch (error) {
      console.error('Error initializing live demo:', error);
      demoFilterContainer.innerHTML = '<div class="text-red-600">Error initializing demo: ' + error.message + '</div>';
    }
  }

  createSimpleFilterDemo(filter, demoFilterContainer, demoGridContainer) {
    // Create a visual representation of the filter instead of the widget
    demoFilterContainer.innerHTML = `
      <div class="border border-gray-300 rounded p-4 bg-gray-50">
        <h4 class="font-semibold mb-2">Filter Configuration Preview</h4>
        <div class="text-sm">
          <strong>Expression:</strong> ${filter.expression.displayText || 'No display text available'}
        </div>
        <div class="text-sm mt-2">
          <strong>Logic:</strong> ${JSON.stringify(filter.expression, null, 2)}
        </div>
        <div class="text-xs text-gray-600 mt-2">
          Note: Full Kendo Filter widget not available. Showing configuration preview.
        </div>
      </div>
    `;

    // Apply the filter to sample data and show results
    const filteredData = this.applyFilterToData(filter.expression);
    
    // Create a simple table instead of Kendo Grid
    const tableHTML = `
      <div class="border border-gray-300 rounded p-4">
        <h4 class="font-semibold mb-2">Filtered Results (${filteredData.length} records)</h4>
        <div class="overflow-auto max-h-96">
          <table class="min-w-full text-sm border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-2 py-1">ID</th>
                <th class="border border-gray-300 px-2 py-1">Age Group</th>
                <th class="border border-gray-300 px-2 py-1">Usage</th>
                <th class="border border-gray-300 px-2 py-1">Satisfaction</th>
                <th class="border border-gray-300 px-2 py-1">Department</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(row => `
                <tr>
                  <td class="border border-gray-300 px-2 py-1">${row.respondentId}</td>
                  <td class="border border-gray-300 px-2 py-1">${row.Q1}</td>
                  <td class="border border-gray-300 px-2 py-1">${row.Q2}</td>
                  <td class="border border-gray-300 px-2 py-1">${row.Q4}</td>
                  <td class="border border-gray-300 px-2 py-1">${row.department}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    demoGridContainer.innerHTML = tableHTML;
  }

  createGridOnlyDemo(filter, demoFilterContainer, demoGridContainer) {
    // Show filter configuration
    demoFilterContainer.innerHTML = `
      <div class="border border-gray-300 rounded p-4 bg-blue-50">
        <h4 class="font-semibold mb-2">🔍 Applied Filter</h4>
        <div class="text-sm">
          <strong>Filter Expression:</strong> ${filter.expression.displayText || 'Complex filter applied'}
        </div>
        <div class="text-xs text-gray-600 mt-2">
          The Kendo Grid below shows data filtered according to your SQL expression.
        </div>
      </div>
    `;

    try {
      // Create grid with filtered data using Kendo Grid
      const gridWidget = $(demoGridContainer).kendoGrid({
        dataSource: {
          data: this.sampleData,
          filter: filter.expression // Apply the parsed filter
        },
        columns: [
          { field: 'respondentId', title: 'ID', width: 80 },
          { field: 'Q1', title: 'Age Group', width: 120 },
          { field: 'Q2', title: 'Usage Frequency', width: 140 },
          { field: 'Q4', title: 'Satisfaction', width: 120 },
          { field: 'department', title: 'Department', width: 120 },
          { field: 'joinDate', title: 'Join Date', width: 120 }
        ],
        height: 400,
        filterable: {
          mode: "row"
        },
        sortable: true,
        pageable: {
          pageSize: 5
        },
        toolbar: ["excel"],
        excel: {
          fileName: "Filtered_Survey_Data.xlsx"
        }
      }).data('kendoGrid');

      this.demoGrid = gridWidget;
      console.log('Grid-only demo initialized successfully');
    } catch (error) {
      console.error('Error creating grid demo:', error);
      demoGridContainer.innerHTML = '<div class="text-red-600">Error creating grid: ' + error.message + '</div>';
    }
  }

  applyFilterToData(expression) {
    // Simple filter application based on our expression structure
    if (!expression || !expression.filters) {
      return this.sampleData;
    }

    return this.sampleData.filter(row => {
      // Apply the filter logic based on the expression
      for (const filter of expression.filters) {
        const fieldValue = row[filter.field];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'eq':
            if (fieldValue == filterValue) return true;
            break;
          case 'neq':
            if (fieldValue != filterValue) return true;
            break;
          default:
            // For 'in' operations or other complex logic
            if (Array.isArray(filterValue)) {
              if (filterValue.includes(fieldValue)) return true;
            } else {
              if (fieldValue == filterValue) return true;
            }
        }
      }
      return false;
    });
  }

  updateGridFilter(expression) {
    if (this.sharedDataSource) {
      // Update the shared datasource filter
      this.sharedDataSource.filter(expression);
    } else if (this.demoGrid) {
      // Fallback to updating grid directly
      this.demoGrid.dataSource.filter(expression);
    }
  }

  renderSelectedValues(filterExpression) {
    // Extract values from the filter expression
    const values = filterExpression.filters.map(f => f.value);
    
    return values.map(value => 
      `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-1 mt-1">${value}</span>`
    ).join('');
  }

  showError(message) {
    if (this.hasErrorDisplayTarget) {
      this.errorDisplayTarget.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> ${message}
        </div>
      `
      this.errorDisplayTarget.style.display = 'block'
    }
  }

  clearError() {
    if (this.hasErrorDisplayTarget) {
      this.errorDisplayTarget.style.display = 'none'
      this.errorDisplayTarget.innerHTML = ''
    }
  }

  // Sample SQL statements for testing
  loadSample(event) {
    console.log("loadSample called with:", event.target.dataset.sample)
    const sampleType = event.target.dataset.sample
    let sql = ""

    switch (sampleType) {
      case "satisfaction":
        sql = "case when [Q4] in (1, 2, 3) then 1 else NULL end"
        break
      case "age":
        sql = "case when [Q1] = 2 then 1 else NULL end"
        break
      case "frequency":
        sql = "case when [Q2] in (1, 2) then 1 else NULL end"
        break
      default:
        sql = "case when [Q4] in (1, 2, 3) then 1 else NULL end"
    }

    console.log("Setting SQL to:", sql)
    this.sqlInputTarget.value = sql
    this.parseSQL()
  }

  // Method to trigger demo with custom SQL
  runDemoWithSQL(sqlStatement) {
    if (this.sqlInputTarget) {
      this.sqlInputTarget.value = sqlStatement;
      this.parseSQL();
    }
  }
}
