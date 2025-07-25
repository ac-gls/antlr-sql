import './style.css'
import { Application } from "@hotwired/stimulus"
import SqlParserController from "./controllers/sql_parser_controller.js"

// Set Kendo UI license key
if (typeof KendoLicensing !== 'undefined') {
  KendoLicensing.setScriptKey('141j044b041h541j4i1d542e582i511k0b1i111c0k1g10221a23171j042a5036192i501b4d284e1c552i5g475e3758355c365j3g5k3d5f404g2f103f531i4e224k1i592h5f2d5h204i1e5e280g2i0d2g0f2k0e2d042c07291a25594a051i531k4j1e532f571h5a2c0k2e092k0b2g0a290028032d16215d46011e4k234f1i4k2j5b1h4f1d4d2b122h0a2j082f09260327002a131j5c1j041h335i181k3d2413603k4i3j4i405g3e613d5g402b02290b1h0g1g1760155g3d603f20181f0620084e215e440i5i3e2f32033624431f482k3c225c2a3h1347551a382c61334c2j');
}

// Start Stimulus application
const application = Application.start()

// Register controllers
application.register("sql-parser", SqlParserController)

// Set up the main application HTML
document.querySelector('#app').innerHTML = `
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">SQL Case to Kendo Filter Converter</h1>
        <p class="text-lg text-gray-600">Parse SQL CASE statements and convert them to Kendo UI filters for survey data</p>
      </header>

      <div data-controller="sql-parser" class="space-y-6">
        <!-- Error Display -->
        <div data-sql-parser-target="errorDisplay" style="display: none;"></div>

        <!-- Database Status Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-semibold mb-4">📊 Database Connection Status</h2>
          <div id="database-status" class="mb-4">
            <div class="p-3 rounded border-l-4 bg-yellow-50 border-yellow-400 text-yellow-700">
              <div class="text-sm">Initializing database connection...</div>
            </div>
          </div>
          <div id="database-stats">
            <div class="text-sm text-gray-500">Database statistics will appear here once connected.</div>
          </div>
        </div>

        <!-- SQL Input Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-semibold mb-4">SQL CASE Statement Input</h2>
          
          <!-- Sample buttons -->
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">Try these sample statements:</p>
            <div class="flex flex-wrap gap-2">
              <button data-action="click->sql-parser#loadSample" data-sample="satisfaction" 
                      class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
                Satisfaction Filter
              </button>
              <button data-action="click->sql-parser#loadSample" data-sample="age" 
                      class="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">
                Age Group Filter
              </button>
              <button data-action="click->sql-parser#loadSample" data-sample="frequency" 
                      class="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm">
                Usage Frequency Filter
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <textarea data-sql-parser-target="sqlInput" 
                      class="w-full h-24 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your SQL CASE statement here..."></textarea>
            
            <button data-action="click->sql-parser#parseSQL" 
                    class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium">
              Parse SQL & Convert to Kendo Filter
            </button>
          </div>
        </div>

        <!-- Results Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Parse Result -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div data-sql-parser-target="parseResult">
              <h3 class="text-xl font-semibold mb-4">Parsed AST</h3>
              <p class="text-gray-500">Enter a SQL CASE statement above to see the parsed result.</p>
            </div>
          </div>

          <!-- Kendo Filter -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div data-sql-parser-target="kendoFilter">
              <h3 class="text-xl font-semibold mb-4">Kendo UI Filter Widget</h3>
              <p class="text-gray-500">The converted Kendo UI Filter configuration will appear here.</p>
            </div>
          </div>
        </div>

        <!-- Human-Readable Filter Display -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div data-sql-parser-target="filterDisplay">
            <h3 class="text-xl font-semibold mb-4">Human-Readable Filter</h3>
            <p class="text-gray-500">A user-friendly description of the filter will appear here.</p>
          </div>
        </div>

        <!-- Live Demo Section -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold mb-4">🎯 Live Demo: How to Use in Your Application</h3>
          <p class="text-gray-600 mb-6">See the generated Kendo Filter working with real survey data below:</p>
          
          <!-- Kendo Filter Demo -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-2">Interactive Kendo Filter</h4>
            <div id="demo-filter" class="border border-gray-200 rounded bg-white" style="min-height: 200px; padding: 1rem;">
              <p class="text-gray-500 text-sm">Kendo Filter will be initialized here when you parse SQL above</p>
            </div>
          </div>

          <!-- Live SQL Display -->
          <div class="mb-6">
            <div id="demo-sql-display">
              <div class="bg-gray-50 p-4 rounded border text-center">
                <p class="text-gray-500 text-sm">SQL statement will appear here when you use the filter above</p>
              </div>
            </div>
          </div>

          <!-- Filtered Data Grid -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-2">Filtered Survey Data</h4>
            <div id="demo-grid" class="border border-gray-200 rounded bg-white" style="min-height: 400px;">
              <p class="text-gray-500 text-sm p-4">Grid will show filtered survey responses here</p>
            </div>
          </div>

          <!-- Sample Data Display -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-2">Sample Survey Data Structure</h4>
            <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto"><code id="sample-data-display">// Sample data will be shown here</code></pre>
          </div>
        </div>

        <!-- Survey Questions Reference -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold mb-4">Available Survey Questions</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="font-medium text-gray-900">Q4: Satisfaction</h4>
              <p class="text-sm text-gray-600 mb-2">How satisfied are you with our service?</p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li>1: Very Dissatisfied</li>
                <li>2: Dissatisfied</li>
                <li>3: Neutral</li>
                <li>4: Satisfied</li>
                <li>5: Very Satisfied</li>
              </ul>
            </div>
            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="font-medium text-gray-900">Q1: Age Group</h4>
              <p class="text-sm text-gray-600 mb-2">What is your age group?</p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li>1: 18-25</li>
                <li>2: 26-35</li>
                <li>3: 36-45</li>
                <li>4: 46-55</li>
                <li>5: 56+</li>
              </ul>
            </div>
            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="font-medium text-gray-900">Q2: Usage Frequency</h4>
              <p class="text-sm text-gray-600 mb-2">How often do you use our product?</p>
              <ul class="text-xs text-gray-500 space-y-1">
                <li>1: Daily</li>
                <li>2: Weekly</li>
                <li>3: Monthly</li>
                <li>4: Rarely</li>
                <li>5: Never</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`
