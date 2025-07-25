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
      // Generate the SQL statement that would produce this filter
      const generatedSQL = this.generateSQLFromFilter(filter.expression);
      console.log('Generated SQL:', generatedSQL);
      console.log('Filter expression for SQL generation:', filter.expression);
      
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
        
        <!-- SQL Preview -->
        <div class="mt-4 bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <h4 class="font-medium text-blue-900 mb-2">🔄 Equivalent SQL Statement</h4>
          <p class="text-sm text-blue-700 mb-2">This filter would be generated from the following SQL CASE statement:</p>
          <pre class="bg-white p-3 rounded border text-sm font-mono overflow-auto"><code>${generatedSQL}</code></pre>
          <p class="text-xs text-blue-600 mt-2">
            ℹ️ This shows the reverse transformation: from Kendo filter back to SQL
          </p>
        </div>
      `
    } else {
      console.log('filterDisplayTarget not available');
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
    if (typeof kendo !== 'undefined') {
      console.log('Kendo UI is available, proceeding with demo');
      this.proceedWithDemo(filter, demoFilterContainer, demoGridContainer);
    } else {
      console.log('Kendo UI not available, showing fallback demo');
      demoFilterContainer.innerHTML = `
        <div class="text-orange-600 border border-orange-300 rounded p-4">
          <h4 class="font-semibold">⚠️ Kendo UI Not Available</h4>
          <p class="text-sm mt-2">The Kendo UI library failed to load from CDN. This could be due to:</p>
          <ul class="text-sm mt-2 ml-4 list-disc">
            <li>Network connectivity issues</li>
            <li>CDN unavailability or rate limiting</li>
            <li>Corporate firewall blocking the CDN</li>
            <li>Ad blockers interfering with script loading</li>
          </ul>
          <p class="text-sm mt-2 font-medium">Showing simplified demo with manual filtering instead:</p>
        </div>
      `;
      this.createSimpleFilterDemo(filter, demoFilterContainer, demoGridContainer);
    }
  }

  proceedWithDemo(filter, demoFilterContainer, demoGridContainer) {
    // Clear existing content and ensure clean containers
    demoFilterContainer.innerHTML = '';
    demoGridContainer.innerHTML = '';
    
    // Add some styling to ensure proper layout
    demoFilterContainer.style.minHeight = '200px';
    demoFilterContainer.style.padding = '1rem';
    demoFilterContainer.style.backgroundColor = '#ffffff';
    
    demoGridContainer.style.minHeight = '400px';
    demoGridContainer.style.backgroundColor = '#ffffff';

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
    console.log('kendoFilter available:', !!$.fn.kendoFilter);
    console.log('Demo containers found:', {
      filter: !!document.getElementById('demo-filter'),
      grid: !!document.getElementById('demo-grid')
    });

    try {
      // Check if kendoFilter is available
      if (!$.fn.kendoFilter) {
        console.log('kendoFilter not available, using Grid with built-in filtering');
        demoFilterContainer.innerHTML = `
          <div class="text-orange-600 border border-orange-300 rounded p-4">
            <h4 class="font-semibold">⚠️ Kendo Filter Widget Not Available</h4>
            <p class="text-sm mt-2">The kendoFilter widget is not included in this Kendo UI version.</p>
            <p class="text-sm mt-1">This usually means:</p>
            <ul class="text-sm mt-2 ml-4 list-disc">
              <li>Filter widget requires a commercial license</li>
              <li>Using Kendo UI Core (free) instead of Kendo UI Professional</li>
              <li>Filter widget not included in the CDN bundle</li>
            </ul>
            <p class="text-sm mt-2 font-medium">Showing Grid with built-in filtering instead:</p>
          </div>
        `;
        this.createGridOnlyDemo(filter, demoFilterContainer, demoGridContainer);
        return;
      }

      // Create the filter widget with better styling
      console.log('Creating Kendo Filter with expression:', JSON.stringify(filter.expression, null, 2));
      
      // Use jQuery to ensure proper initialization
      const $filterContainer = $(demoFilterContainer);
      
      const filterWidget = $filterContainer.kendoFilter({
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
          this.lastKnownExpression = e.expression; // Store the latest expression
          this.updateGridFilter(e.expression);
          this.updateSQLDisplay(e.expression);
        },
        apply: (e) => {
          console.log('Filter applied via apply event:', e.expression);
          this.lastKnownExpression = e.expression; // Store the latest expression
          this.updateGridFilter(e.expression);
          this.updateSQLDisplay(e.expression);
        }
      }).data('kendoFilter');

      // Apply the initial filter
      if (filterWidget) {
        filterWidget.applyFilter();
        console.log('Filter widget initialized and applied');
        
        // Debug: Log available methods and properties
        console.log('FilterWidget methods and properties:', Object.getOwnPropertyNames(filterWidget));
        console.log('FilterWidget prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(filterWidget)));
        console.log('FilterWidget expression type:', typeof filterWidget.expression);
        console.log('FilterWidget has expression property:', 'expression' in filterWidget);
        
        // Initialize the SQL display with the initial filter
        this.updateSQLDisplay(filter.expression);
        
        // Store the expression for later reference
        this.lastKnownExpression = filter.expression;
        
        // Add event listener for Apply button clicks directly
        setTimeout(() => {
          const applyButton = $filterContainer.find('.k-filter-apply');
          if (applyButton.length > 0) {
            console.log('Found apply button, attaching click handler');
            applyButton.on('click', () => {
              console.log('Apply button clicked directly');
              setTimeout(() => {
                try {
                  // Try different methods to get the current expression
                  let currentExpression;
                  
                  if (typeof filterWidget.expression === 'function') {
                    currentExpression = filterWidget.expression();
                  } else if (filterWidget.expression) {
                    currentExpression = filterWidget.expression;
                  } else if (filterWidget.dataSource && filterWidget.dataSource.filter) {
                    currentExpression = filterWidget.dataSource.filter();
                  } else {
                    console.log('Using last known expression as fallback');
                    currentExpression = this.lastKnownExpression;
                  }
                  
                  console.log('Current filter expression after apply:', currentExpression);
                  this.updateSQLDisplay(currentExpression);
                } catch (error) {
                  console.error('Error getting filter expression:', error);
                  // Fallback to stored expression
                  this.updateSQLDisplay(this.lastKnownExpression);
                }
              }, 100);
            });
          } else {
            console.log('Apply button not found, searching for .k-button');
            const buttons = $filterContainer.find('.k-button');
            console.log('Found buttons:', buttons.length);
            buttons.each((index, button) => {
              const $btn = $(button);
              console.log(`Button ${index}:`, $btn.text(), $btn.attr('class'));
              if ($btn.text().toLowerCase().includes('apply') || $btn.hasClass('k-filter-apply')) {
                $btn.on('click', () => {
                  console.log('Apply button clicked (found via search)');
                  setTimeout(() => {
                    try {
                      // Try different methods to get the current expression
                      let currentExpression;
                      
                      if (typeof filterWidget.expression === 'function') {
                        currentExpression = filterWidget.expression();
                      } else if (filterWidget.expression) {
                        currentExpression = filterWidget.expression;
                      } else if (filterWidget.dataSource && filterWidget.dataSource.filter) {
                        currentExpression = filterWidget.dataSource.filter();
                      } else {
                        console.log('Using last known expression as fallback');
                        currentExpression = this.lastKnownExpression;
                      }
                      
                      console.log('Current filter expression after apply:', currentExpression);
                      this.updateSQLDisplay(currentExpression);
                    } catch (error) {
                      console.error('Error getting filter expression:', error);
                      // Fallback to stored expression
                      this.updateSQLDisplay(this.lastKnownExpression);
                    }
                  }, 100);
                });
              }
            });
          }
        }, 500);
        
        // Add some custom styling after initialization
        setTimeout(() => {
          $filterContainer.find('.k-filter').css({
            'background': '#ffffff',
            'border': '1px solid #d1d5db',
            'border-radius': '0.5rem',
            'padding': '1rem'
          });
        }, 100);
      }

      // Create grid with shared datasource and better styling
      const $gridContainer = $(demoGridContainer);
      
      const gridWidget = $gridContainer.kendoGrid({
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
      
      // Ensure proper styling after widgets are rendered
      setTimeout(() => {
        $gridContainer.find('.k-grid').css({
          'border': '1px solid #d1d5db',
          'border-radius': '0.5rem',
          'overflow': 'hidden'
        });
      }, 100);
      
    } catch (error) {
      console.error('Error initializing live demo:', error);
      demoFilterContainer.innerHTML = '<div class="text-red-600 p-4">Error initializing demo: ' + error.message + '</div>';
    }
  }

  testKendoAvailability(container) {
    // Test if we can create a simple Kendo widget first
    try {
      // Try creating a simple button to test Kendo UI
      const testDiv = $('<div>').appendTo('body');
      const testButton = testDiv.kendoButton({ content: "Test" });
      if (testButton.data('kendoButton')) {
        console.log('Kendo UI widgets working - Button created successfully');
        testDiv.remove();
      }
    } catch (error) {
      console.error('Basic Kendo UI test failed:', error);
      container.innerHTML = `
        <div class="text-red-600 border border-red-300 rounded p-4">
          <h4 class="font-semibold">Kendo UI Test Failed</h4>
          <p class="text-sm mt-2">Basic Kendo UI widgets are not working: ${error.message}</p>
        </div>
      `;
    }
  }

  createSimpleFilterDemo(filter, demoFilterContainer, demoGridContainer) {
    // Create a more interactive demo even without Kendo UI
    demoFilterContainer.innerHTML = `
      <div class="border border-gray-300 rounded p-4 bg-green-50">
        <h4 class="font-semibold mb-2">✅ SQL-to-Filter Translation Working</h4>
        <div class="text-sm space-y-2">
          <div><strong>Original SQL:</strong> <code class="bg-white px-2 py-1 rounded">${this.sqlInputTarget.value}</code></div>
          <div><strong>Parsed Expression:</strong> ${filter.expression.displayText || 'Complex filter applied'}</div>
          <div><strong>Kendo Filter JSON:</strong> 
            <pre class="mt-1 p-2 bg-white rounded text-xs overflow-auto">${JSON.stringify(filter.expression, null, 2)}</pre>
          </div>
          <div class="text-xs text-gray-600 mt-2">
            ✨ Your SQL parsing and Kendo filter conversion is working perfectly! 
            The table below shows filtered data using your parsed expression.
          </div>
        </div>
      </div>
    `;

    // Apply the filter to sample data and show results
    const filteredData = this.applyFilterToData(filter.expression);
    
    // Create an enhanced table with better styling
    const tableHTML = `
      <div class="border border-gray-300 rounded p-4 bg-white">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-semibold">📊 Filtered Survey Data (${filteredData.length} of ${this.sampleData.length} records)</h4>
          <div class="text-sm text-gray-600">
            Filter: <span class="font-mono bg-blue-100 px-2 py-1 rounded">${filter.expression.displayText}</span>
          </div>
        </div>
        <div class="overflow-auto max-h-96">
          <table class="min-w-full text-sm border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-3 py-2 text-left">ID</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Age Group</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Usage Frequency</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Satisfaction</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Department</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Join Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.length > 0 ? filteredData.map(row => `
                <tr class="hover:bg-gray-50">
                  <td class="border border-gray-300 px-3 py-2">${row.respondentId}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.Q1}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.Q2}</td>
                  <td class="border border-gray-300 px-3 py-2 font-medium">${row.Q4}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.department}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.joinDate}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" class="border border-gray-300 px-3 py-4 text-center text-gray-500">
                    No records match the current filter criteria
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <!-- Show all data button -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex gap-2">
            <button onclick="window.showAllData()" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Show All Data (${this.sampleData.length} records)
            </button>
            <button onclick="window.reapplyFilter()" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
              Re-apply SQL Filter (${filteredData.length} records)
            </button>
          </div>
        </div>
      </div>
    `;
    
    demoGridContainer.innerHTML = tableHTML;
    
    // Add global functions for the buttons
    window.showAllData = () => {
      const allDataTable = tableHTML.replace(`(${filteredData.length} of ${this.sampleData.length} records)`, `(${this.sampleData.length} records - All Data)`);
      const newTableHTML = allDataTable.replace(
        filteredData.length > 0 ? filteredData.map(row => `<tr class="hover:bg-gray-50">`) : [''],
        this.sampleData.map(row => `
          <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-3 py-2">${row.respondentId}</td>
            <td class="border border-gray-300 px-3 py-2">${row.Q1}</td>
            <td class="border border-gray-300 px-3 py-2">${row.Q2}</td>
            <td class="border border-gray-300 px-3 py-2 font-medium">${row.Q4}</td>
            <td class="border border-gray-300 px-3 py-2">${row.department}</td>
            <td class="border border-gray-300 px-3 py-2">${row.joinDate}</td>
          </tr>
        `)
      );
      
      // Simpler approach - just rebuild with all data
      this.rebuildTable(this.sampleData, "All Data");
    };
    
    window.reapplyFilter = () => {
      this.rebuildTable(filteredData, filter.expression.displayText);
    };
    
    // Store reference for rebuilding
    this.currentFilter = filter;
  }

  rebuildTable(data, filterDesc) {
    const demoGridContainer = document.getElementById('demo-grid');
    if (!demoGridContainer) return;
    
    const tableHTML = `
      <div class="border border-gray-300 rounded p-4 bg-white">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-semibold">📊 Survey Data (${data.length} of ${this.sampleData.length} records)</h4>
          <div class="text-sm text-gray-600">
            Filter: <span class="font-mono bg-blue-100 px-2 py-1 rounded">${filterDesc}</span>
          </div>
        </div>
        <div class="overflow-auto max-h-96">
          <table class="min-w-full text-sm border-collapse border border-gray-300">
            <thead class="bg-gray-100">
              <tr>
                <th class="border border-gray-300 px-3 py-2 text-left">ID</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Age Group</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Usage Frequency</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Satisfaction</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Department</th>
                <th class="border border-gray-300 px-3 py-2 text-left">Join Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.length > 0 ? data.map(row => `
                <tr class="hover:bg-gray-50">
                  <td class="border border-gray-300 px-3 py-2">${row.respondentId}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.Q1}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.Q2}</td>
                  <td class="border border-gray-300 px-3 py-2 font-medium">${row.Q4}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.department}</td>
                  <td class="border border-gray-300 px-3 py-2">${row.joinDate}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" class="border border-gray-300 px-3 py-4 text-center text-gray-500">
                    No records match the current filter criteria
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <!-- Show all data button -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex gap-2">
            <button onclick="window.showAllData()" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Show All Data (${this.sampleData.length} records)
            </button>
            <button onclick="window.reapplyFilter()" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
              Re-apply SQL Filter
            </button>
          </div>
        </div>
      </div>
    `;
    
    demoGridContainer.innerHTML = tableHTML;
  }

  createGridOnlyDemo(filter, demoFilterContainer, demoGridContainer) {
    // Show filter configuration with more interactivity
    demoFilterContainer.innerHTML = `
      <div class="border border-gray-300 rounded p-4 bg-blue-50">
        <h4 class="font-semibold mb-2">🔍 SQL-to-Kendo Filter Translation</h4>
        <div class="text-sm space-y-2">
          <div><strong>Parsed Expression:</strong> ${filter.expression.displayText || 'Complex filter applied'}</div>
          <div><strong>Kendo Filter Logic:</strong> 
            <pre class="mt-1 p-2 bg-white rounded text-xs overflow-auto">${JSON.stringify(filter.expression, null, 2)}</pre>
          </div>
          <div class="text-xs text-gray-600 mt-2">
            ℹ️ The Kendo Grid below is filtered using your parsed SQL expression. 
            Try the different sample buttons above to see how different SQL statements translate to filters.
          </div>
        </div>
        
        <!-- Add some manual filter controls -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <h5 class="font-medium mb-2">Manual Filter Test:</h5>
          <div class="flex gap-2 items-center">
            <select id="manual-field" class="border rounded px-2 py-1 text-sm">
              <option value="Q4">Satisfaction</option>
              <option value="Q1">Age Group</option>
              <option value="Q2">Usage Frequency</option>
              <option value="department">Department</option>
            </select>
            <select id="manual-operator" class="border rounded px-2 py-1 text-sm">
              <option value="eq">Equals</option>
              <option value="contains">Contains</option>
              <option value="neq">Not Equal</option>
            </select>
            <input id="manual-value" type="text" placeholder="Value" class="border rounded px-2 py-1 text-sm">
            <button onclick="window.sqlParserController.applyManualFilter()" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              Apply Filter
            </button>
            <button onclick="window.sqlParserController.clearManualFilter()" class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
              Clear
            </button>
          </div>
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
      
      // Store reference globally for manual filter controls
      window.sqlParserController = this;
      
      console.log('Grid-only demo initialized successfully');
    } catch (error) {
      console.error('Error creating grid demo:', error);
      demoGridContainer.innerHTML = '<div class="text-red-600">Error creating grid: ' + error.message + '</div>';
    }
  }

  applyManualFilter() {
    const field = document.getElementById('manual-field').value;
    const operator = document.getElementById('manual-operator').value;
    const value = document.getElementById('manual-value').value;
    
    if (!value.trim()) {
      alert('Please enter a value to filter by');
      return;
    }
    
    const manualFilter = {
      logic: 'and',
      filters: [{
        field: field,
        operator: operator,
        value: value
      }]
    };
    
    if (this.demoGrid) {
      this.demoGrid.dataSource.filter(manualFilter);
      console.log('Applied manual filter:', manualFilter);
    }
  }

  clearManualFilter() {
    if (this.demoGrid) {
      this.demoGrid.dataSource.filter({});
      document.getElementById('manual-value').value = '';
      console.log('Cleared manual filter');
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

  updateSQLDisplay(expression) {
    // Update the SQL display with the current filter expression
    const sqlContainer = document.getElementById('demo-sql-display');
    if (!sqlContainer) {
      console.log('SQL container not found');
      return; // SQL display container not available
    }

    try {
      const generatedSQL = this.generateSQLFromFilter(expression);
      console.log('Generated SQL for display:', generatedSQL);
      
      sqlContainer.innerHTML = `
        <div class="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <h4 class="font-medium text-blue-900 mb-2">🔄 Current Filter as SQL</h4>
          <p class="text-sm text-blue-700 mb-2">This filter expression as SQL CASE statement:</p>
          <pre class="bg-white p-3 rounded border text-sm font-mono overflow-auto"><code>${generatedSQL}</code></pre>
          <p class="text-xs text-blue-600 mt-2">
            ✨ SQL updates automatically as you modify the filter above
          </p>
          <div class="mt-3 pt-3 border-t border-blue-200">
            <button onclick="window.sqlParserController.refreshSQL()" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              🔄 Refresh SQL
            </button>
            <span class="text-xs text-blue-600 ml-2">Click to manually update SQL if automatic updates aren't working</span>
          </div>
        </div>
      `;
      
      // Store reference globally for manual refresh
      window.sqlParserController = this;
      
    } catch (error) {
      console.error('Error generating SQL display:', error);
      sqlContainer.innerHTML = `
        <div class="bg-red-50 p-4 rounded border-l-4 border-red-400">
          <h4 class="font-medium text-red-900 mb-2">⚠️ SQL Generation Error</h4>
          <p class="text-sm text-red-700">Error generating SQL: ${error.message}</p>
        </div>
      `;
    }
  }

  refreshSQL() {
    // Manual refresh method for the SQL display
    console.log('Manual SQL refresh triggered');
    if (this.demoFilter) {
      try {
        // Try different methods to get the current expression
        let currentExpression;
        
        if (typeof this.demoFilter.expression === 'function') {
          currentExpression = this.demoFilter.expression();
        } else if (this.demoFilter.expression) {
          currentExpression = this.demoFilter.expression;
        } else if (this.demoFilter.dataSource && this.demoFilter.dataSource.filter) {
          currentExpression = this.demoFilter.dataSource.filter();
        } else {
          console.log('Using last known expression as fallback');
          currentExpression = this.lastKnownExpression;
        }
        
        console.log('Current filter expression from widget:', currentExpression);
        this.updateSQLDisplay(currentExpression);
      } catch (error) {
        console.error('Error getting current expression:', error);
        // Fallback to stored expression
        if (this.lastKnownExpression) {
          this.updateSQLDisplay(this.lastKnownExpression);
        }
      }
    } else {
      console.log('No demo filter available for refresh');
      // Use the last known expression
      if (this.lastKnownExpression) {
        this.updateSQLDisplay(this.lastKnownExpression);
      }
    }
  }

  renderSelectedValues(filterExpression) {
    // Extract values from the filter expression
    const values = filterExpression.filters.map(f => f.value);
    
    return values.map(value => 
      `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-1 mt-1">${value}</span>`
    ).join('');
  }

  generateSQLFromFilter(filterExpression) {
    // Convert the Kendo filter expression back to SQL CASE statement format
    console.log('generateSQLFromFilter called with:', JSON.stringify(filterExpression, null, 2));
    
    if (!filterExpression || !filterExpression.filters || filterExpression.filters.length === 0) {
      console.log('No filters found, returning default SQL');
      return "case when [field] = value then 1 else NULL end";
    }

    const field = filterExpression.filters[0].field;
    const operator = filterExpression.filters[0].operator;
    const logic = filterExpression.logic || 'and';

    console.log('Filter details:', { field, operator, logic, filterCount: filterExpression.filters.length });

    // Handle different operators and logic combinations
    if (filterExpression.filters.length === 1) {
      const filter = filterExpression.filters[0];
      
      switch (filter.operator) {
        case 'eq':
          return `case when [${filter.field}] = ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
        case 'neq':
          return `case when [${filter.field}] <> ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
        case 'gt':
          return `case when [${filter.field}] > ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
        case 'gte':
          return `case when [${filter.field}] >= ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
        case 'lt':
          return `case when [${filter.field}] < ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
        case 'lte':
          return `case when [${filter.field}] <= ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
        case 'contains':
          return `case when [${filter.field}] like '%${filter.value}%' then 1 else NULL end`;
        default:
          return `case when [${filter.field}] = ${this.formatSQLValue(filter.value)} then 1 else NULL end`;
      }
    } else {
      // Handle multiple filters (IN clause or complex conditions)
      const firstField = filterExpression.filters[0].field;
      const allSameField = filterExpression.filters.every(f => f.field === firstField);
      const allEqualOperator = filterExpression.filters.every(f => f.operator === 'eq');

      if (allSameField && allEqualOperator && logic === 'or') {
        // Convert to IN clause
        const values = filterExpression.filters.map(f => this.formatSQLValue(f.value)).join(', ');
        return `case when [${firstField}] in (${values}) then 1 else NULL end`;
      } else {
        // Build complex condition
        const conditions = filterExpression.filters.map(filter => {
          switch (filter.operator) {
            case 'eq':
              return `[${filter.field}] = ${this.formatSQLValue(filter.value)}`;
            case 'neq':
              return `[${filter.field}] <> ${this.formatSQLValue(filter.value)}`;
            case 'gt':
              return `[${filter.field}] > ${this.formatSQLValue(filter.value)}`;
            case 'gte':
              return `[${filter.field}] >= ${this.formatSQLValue(filter.value)}`;
            case 'lt':
              return `[${filter.field}] < ${this.formatSQLValue(filter.value)}`;
            case 'lte':
              return `[${filter.field}] <= ${this.formatSQLValue(filter.value)}`;
            case 'contains':
              return `[${filter.field}] like '%${filter.value}%'`;
            default:
              return `[${filter.field}] = ${this.formatSQLValue(filter.value)}`;
          }
        }).join(` ${logic.toUpperCase()} `);
        
        return `case when ${conditions} then 1 else NULL end`;
      }
    }
  }

  formatSQLValue(value) {
    // Format values for SQL based on type
    if (typeof value === 'string') {
      // If it looks like a numeric string, don't quote it
      if (/^\d+$/.test(value)) {
        return value;
      }
      // Quote string values
      return `'${value.replace(/'/g, "''")}'`;
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (value === null || value === undefined) {
      return 'NULL';
    } else {
      return `'${value.toString().replace(/'/g, "''")}'`;
    }
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
