import { Controller } from "@hotwired/stimulus"
import { SqlCaseParser } from "../parsers/SqlCaseParser.js"
import { KendoFilterConverter } from "../parsers/KendoFilterConverter.js"
import { AgentDbService } from "../services/AgentDbService.js"

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
    
    // Initialize AgentDB service
    this.agentDb = new AgentDbService()
    this.sampleData = [] // Will be populated from AgentDB
    
    // Set up sample survey questions
    this.setupSampleQuestions()
    
    // Initialize database and load data
    this.initializeDatabase()
    
    // Set default SQL example
    if (this.hasSqlInputTarget) {
      this.sqlInputTarget.value = "case when [Q4] in (1, 2, 3) then 1 else NULL end"
      console.log("Default SQL set:", this.sqlInputTarget.value)
      
      // Auto-parse the default SQL to show example after data loads
      setTimeout(() => {
        this.parseSQL()
      }, 1000) // Increased timeout to allow for database initialization
    }
  }

  async initializeDatabase() {
    try {
      console.log('Initializing AgentDB...')
      this.showDatabaseStatus('Connecting to AgentDB...', 'loading')
      
      // Set a timeout for the database initialization
      const initPromise = this.agentDb.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      );
      
      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise]);
      
      // Load sample data from database
      await this.loadSampleDataFromDatabase()
      
      this.showDatabaseStatus('Connected to AgentDB ✓', 'success')
      console.log('AgentDB initialization complete')
      
      // Display database statistics
      await this.displayDatabaseStats()
      
    } catch (error) {
      console.error('Failed to initialize AgentDB:', error)
      
      // Show specific error message
      if (error.message.includes('timeout')) {
        this.showDatabaseStatus('Database connection timeout - using local data', 'warning')
      } else if (error.message.includes('404')) {
        this.showDatabaseStatus('AgentDB API endpoint not found - using local data', 'warning')
      } else if (error.message.includes('401') || error.message.includes('403')) {
        this.showDatabaseStatus('Database authentication failed - check API key', 'error')
      } else {
        this.showDatabaseStatus(`Database Error: ${error.message}`, 'error')
      }
      
      // Fallback to hardcoded data
      console.log('Falling back to hardcoded sample data')
      this.setupFallbackSampleData()
      
      // Show fallback status
      setTimeout(() => {
        this.showDatabaseStatus('Using local fallback data (AgentDB unavailable)', 'warning')
      }, 2000)
    }
  }

  async loadSampleDataFromDatabase() {
    try {
      this.sampleData = await this.agentDb.getAllResponses()
      console.log(`Loaded ${this.sampleData.length} records from AgentDB`)
      
      // Display sample data structure
      if (document.getElementById('sample-data-display')) {
        document.getElementById('sample-data-display').textContent = 
          JSON.stringify(this.sampleData.slice(0, 3), null, 2);
      }
    } catch (error) {
      console.error('Failed to load data from AgentDB:', error)
      throw error
    }
  }

  async displayDatabaseStats() {
    try {
      const stats = await this.agentDb.getStatistics()
      console.log('Database Statistics:', stats)
      
      // Update UI with stats if element exists
      const statsContainer = document.getElementById('database-stats')
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h4 class="font-medium text-blue-900 mb-2">📊 AgentDB Statistics</h4>
            <div class="text-sm text-blue-700 space-y-1">
              <div><strong>Total Records:</strong> ${stats.total}</div>
              <div><strong>Departments:</strong> ${stats.byDepartment.map(d => `${d.department} (${d.count})`).join(', ')}</div>
              <div><strong>Database Token:</strong> <code class="text-xs">${this.agentDb.databaseToken}</code></div>
            </div>
          </div>
        `
      }
    } catch (error) {
      console.error('Failed to get database statistics:', error)
    }
  }

  showDatabaseStatus(message, type = 'info') {
    const colors = {
      loading: 'bg-yellow-50 border-yellow-400 text-yellow-700',
      success: 'bg-green-50 border-green-400 text-green-700',
      error: 'bg-red-50 border-red-400 text-red-700',
      warning: 'bg-orange-50 border-orange-400 text-orange-700',
      info: 'bg-blue-50 border-blue-400 text-blue-700'
    }
    
    // Update status in UI if element exists
    const statusContainer = document.getElementById('database-status')
    if (statusContainer) {
      statusContainer.innerHTML = `
        <div class="p-3 rounded border-l-4 ${colors[type] || colors.info}">
          <div class="text-sm">${message}</div>
        </div>
      `
    }
    
    console.log(`Database Status [${type}]: ${message}`)
  }

  setupFallbackSampleData() {
    // Fallback to hardcoded data if AgentDB fails
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

  async createSimpleFilterDemo(filter, demoFilterContainer, demoGridContainer) {
    // Create a visual representation of the filter instead of the widget
    demoFilterContainer.innerHTML = `
      <div class="border border-gray-300 rounded p-4 bg-green-50">
        <h4 class="font-semibold mb-2">✅ SQL-to-Filter Translation Working</h4>
        <div class="text-sm space-y-2">
          <div><strong>Original SQL:</strong> <code class="bg-white px-2 py-1 rounded">${this.sqlInputTarget.value}</code></div>
          <div><strong>Parsed Expression:</strong> ${filter.expression.displayText || 'Complex filter applied'}</div>
          <div><strong>Data Source:</strong> ${this.agentDb && this.agentDb.isInitialized ? 'AgentDB (Live Database)' : 'Local Fallback Data'}</div>
          <div class="text-xs text-gray-600 mt-2">
            ✨ Your SQL parsing and Kendo filter conversion is working perfectly! 
            The table below shows filtered data using your parsed expression.
          </div>
        </div>
      </div>
    `;

    // Apply the filter to sample data and show results
    const filteredData = await this.applyFilterToData(filter.expression);
    
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
            ${this.agentDb && this.agentDb.isInitialized ? `
              <button onclick="window.downloadDatabase()" class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                📥 Download Database
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    demoGridContainer.innerHTML = tableHTML;
    
    // Add global functions for the buttons
    window.showAllData = async () => {
      await this.rebuildTable(this.sampleData, "All Data");
    };
    
    window.reapplyFilter = async () => {
      const filteredData = await this.applyFilterToData(filter.expression);
      await this.rebuildTable(filteredData, filter.expression.displayText);
    };
    
    window.downloadDatabase = async () => {
      if (this.agentDb && this.agentDb.isInitialized) {
        try {
          const downloadInfo = await this.agentDb.getDownloadUrl();
          window.open(downloadInfo.downloadUrl, '_blank');
        } catch (error) {
          alert('Failed to get database download: ' + error.message);
        }
      }
    };
    
    // Store reference for rebuilding
    this.currentFilter = filter;
  }

  async rebuildTable(data, filterDesc) {
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
            ${this.agentDb && this.agentDb.isInitialized ? `
              <button onclick="window.addSampleRecord()" class="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600">
                ➕ Add Record
              </button>
              <button onclick="window.downloadDatabase()" class="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                📥 Download DB
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    demoGridContainer.innerHTML = tableHTML;
    
    // Add new global function for adding records
    window.addSampleRecord = async () => {
      if (this.agentDb && this.agentDb.isInitialized) {
        try {
          const newRecord = {
            respondentId: this.sampleData.length + 1,
            Q1: "26-35",
            Q2: "Daily", 
            Q4: "Very Satisfied",
            department: "IT",
            joinDate: new Date().toISOString().split('T')[0]
          };
          
          await this.agentDb.addResponse(newRecord);
          
          // Reload data
          await this.loadSampleDataFromDatabase();
          
          // Refresh display
          await this.rebuildTable(this.sampleData, "All Data (Refreshed)");
          
          alert('New record added successfully!');
        } catch (error) {
          alert('Failed to add record: ' + error.message);
        }
      }
    };
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

  async applyFilterToData(expression) {
    // Try to use AgentDB for filtering if available
    if (this.agentDb && this.agentDb.isInitialized) {
      try {
        console.log('Applying filter using AgentDB...')
        const filteredData = await this.agentDb.applyKendoFilter(expression)
        console.log(`AgentDB returned ${filteredData.length} filtered records`)
        return filteredData
      } catch (error) {
        console.error('AgentDB filtering failed, falling back to local filtering:', error)
        // Fall through to local filtering
      }
    }

    // Fallback to local filtering
    console.log('Using local data filtering...')
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
