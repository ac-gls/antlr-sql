/**
 * AgentDB Service for managing survey data
 * Provides database operations for the SQL parser application
 * 
 * SETUP REQUIRED:
 * To use AgentDB instead of demo mode, you need to:
 * 1. Visit https://agentdb.dev/ and create an account
 * 2. Create a new database project
 * 3. Get the correct API endpoints and authentication
 * 4. Update the API key and endpoints in this service
 * 5. Uncomment the API testing code in the initialize() method
 * 
 * Currently running in DEMO MODE with local sample data.
 */
export class AgentDbService {
  constructor(mockMode = false) {
    this.apiKey = 'agentdb_d02f736e6d7468d678c98241d32ebb90e59be24be7b12dedc752a8dc3d91153f';
    this.baseUrl = 'https://api.agentdb.dev';
    this.databaseToken = this.generateDatabaseToken();
    this.databaseName = 'survey_responses_db';
    this.databaseType = 'sqlite';
    this.isInitialized = false;
    this.mockMode = mockMode;
    this.mockData = []; // For mock mode
  }

  /**
   * Enable mock mode for development/testing
   */
  setMockMode(enabled) {
    this.mockMode = enabled;
    if (enabled) {
      console.log('AgentDB Service running in mock mode');
    }
  }

  /**
   * Generate a unique database token
   */
  generateDatabaseToken() {
    // Generate a UUID-like string for the database token
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Initialize the database and create tables
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing AgentDB connection...');
      console.log('Database Token:', this.databaseToken);
      console.log('Mock Mode:', this.mockMode);

      if (this.mockMode) {
        // Initialize mock data
        this.initializeMockData();
        this.isInitialized = true;
        console.log('AgentDB mock mode initialized successfully');
        return;
      }

      // For now, let's skip the API testing and go straight to demo mode
      // until we can properly configure AgentDB
      console.log('⚠️ AgentDB API endpoints are not yet configured - using demo mode');
      throw new Error('AgentDB API configuration pending - using demo mode for now');

      // TODO: Uncomment this when AgentDB is properly set up
      /*
      // Test if the API supports the operations we need
      const apiAvailable = await this.testApiConnection();
      
      if (!apiAvailable) {
        throw new Error('AgentDB API does not support required operations - falling back to demo mode');
      }

      // Skip database creation and go straight to table creation
      console.log('✅ API endpoints available, proceeding with table setup...');
      */

      // Create the survey responses table
      await this.executeSQL({
        sql: `CREATE TABLE IF NOT EXISTS survey_responses (
          respondentId INTEGER PRIMARY KEY,
          Q1 TEXT NOT NULL,
          Q2 TEXT NOT NULL,
          Q4 TEXT NOT NULL,
          department TEXT NOT NULL,
          joinDate TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      });

      // Insert sample data if table is empty
      const existingData = await this.executeSQL({
        sql: 'SELECT COUNT(*) as count FROM survey_responses'
      });

      if (existingData.length === 0 || existingData[0].count === 0) {
        await this.populateSampleData();
      }

      this.isInitialized = true;
      console.log('AgentDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AgentDB:', error);
      
      // Automatically fall back to mock mode
      console.log('Falling back to mock mode...');
      this.mockMode = true;
      this.initializeMockData();
      this.isInitialized = true;
      
      // Re-throw with more specific error for the controller to handle
      throw new Error(`AgentDB connection failed: ${error.message}. Using mock mode.`);
    }
  }

  /**
   * Test if the AgentDB API is available with the specific endpoints we need
   */
  async testApiConnection() {
    try {
      console.log('Testing AgentDB API connection...');
      
      // Instead of testing POST endpoints (which might create unwanted side effects),
      // let's test if we can execute a simple, safe SQL query
      const testEndpoints = [
        `${this.baseUrl}/execute`,
        `${this.baseUrl}/database/execute`,
        `${this.baseUrl}/databases/${this.databaseToken}/execute`,
        `${this.baseUrl}/v1/database/${this.databaseToken}/execute`,
        `${this.baseUrl}/api/database/${this.databaseToken}/execute`
      ];
      
      for (const url of testEndpoints) {
        try {
          console.log(`Testing SQL execution endpoint: ${url}`);
          
          // Try a simple SELECT query that should work on any SQL database
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sql: 'SELECT 1 as test',
              params: []
            })
          });
          
          // If we get a non-404 response, this endpoint exists
          if (response.status !== 404) {
            console.log(`✅ Found working SQL endpoint: ${url} (status: ${response.status})`);
            return true;
          } else {
            console.log(`✗ Endpoint not found: ${url}`);
          }
          
        } catch (error) {
          console.log(`✗ Endpoint test failed: ${url} - ${error.message}`);
        }
      }
      
      console.log('❌ No working AgentDB SQL endpoints found');
      return false;
      
    } catch (error) {
      console.log('❌ AgentDB API connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Initialize mock data for development/testing
   */
  initializeMockData() {
    this.mockData = [
      { respondentId: 1, Q1: "26-35", Q2: "Daily", Q4: "Very Satisfied", department: "Engineering", joinDate: "2023-01-15" },
      { respondentId: 2, Q1: "18-25", Q2: "Weekly", Q4: "Satisfied", department: "Marketing", joinDate: "2023-03-20" },
      { respondentId: 3, Q1: "36-45", Q2: "Monthly", Q4: "Neutral", department: "Sales", joinDate: "2022-11-10" },
      { respondentId: 4, Q1: "46-55", Q2: "Rarely", Q4: "Dissatisfied", department: "HR", joinDate: "2022-08-05" },
      { respondentId: 5, Q1: "26-35", Q2: "Daily", Q4: "Very Dissatisfied", department: "Finance", joinDate: "2023-02-28" },
      { respondentId: 6, Q1: "18-25", Q2: "Weekly", Q4: "Satisfied", department: "Engineering", joinDate: "2023-04-12" },
      { respondentId: 7, Q1: "36-45", Q2: "Monthly", Q4: "Very Satisfied", department: "Marketing", joinDate: "2022-12-03" },
      { respondentId: 8, Q1: "26-35", Q2: "Daily", Q4: "Neutral", department: "Sales", joinDate: "2023-01-08" },
      { respondentId: 9, Q1: "46-55", Q2: "Weekly", Q4: "Dissatisfied", department: "Engineering", joinDate: "2022-09-18" },
      { respondentId: 10, Q1: "18-25", Q2: "Rarely", Q4: "Very Satisfied", department: "HR", joinDate: "2023-05-22" },
      { respondentId: 11, Q1: "36-45", Q2: "Daily", Q4: "Satisfied", department: "Finance", joinDate: "2023-06-10" },
      { respondentId: 12, Q1: "26-35", Q2: "Weekly", Q4: "Very Satisfied", department: "Marketing", joinDate: "2023-04-05" },
      { respondentId: 13, Q1: "56+", Q2: "Monthly", Q4: "Neutral", department: "Engineering", joinDate: "2022-10-18" },
      { respondentId: 14, Q1: "18-25", Q2: "Daily", Q4: "Dissatisfied", department: "Sales", joinDate: "2023-07-22" },
      { respondentId: 15, Q1: "46-55", Q2: "Rarely", Q4: "Very Dissatisfied", department: "HR", joinDate: "2022-09-30" }
    ];
    console.log(`Mock data initialized with ${this.mockData.length} records`);
  }

  /**
   * Create or connect to the database (optional operation)
   */
  async createDatabase() {
    try {
      console.log('Attempting optional database creation/connection...');
      
      // Try different API endpoint formats based on the documentation
      const createUrl = `${this.baseUrl}/database`;
      
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          token: this.databaseToken,
          name: this.databaseName,
          type: this.databaseType
        })
      });

      if (response.ok) {
        console.log('✅ Database created/connected successfully');
      } else {
        const responseText = await response.text();
        console.log(`ℹ️ Database creation response: ${response.status} - ${responseText}`);
        
        // 404 just means the endpoint doesn't exist, which is fine
        if (response.status === 404) {
          console.log('ℹ️ Database creation endpoint not available - assuming database exists');
        } else {
          console.log('ℹ️ Database creation returned non-success status - continuing anyway');
        }
      }
    } catch (error) {
      console.log('ℹ️ Database creation attempt failed (this is usually fine):', error.message);
      // Don't throw - database creation is optional
    }
  }

  /**
   * Execute SQL query against the database - try multiple endpoint formats
   */
  async executeSQL(query) {
    const possibleEndpoints = [
      `${this.baseUrl}/execute`,
      `${this.baseUrl}/database/execute`,
      `${this.baseUrl}/databases/${this.databaseToken}/execute`,
      `${this.baseUrl}/v1/database/${this.databaseToken}/execute`,
      `${this.baseUrl}/api/database/${this.databaseToken}/execute`
    ];

    let lastError;

    for (const url of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-Key': this.apiKey,
            'X-Database-Token': this.databaseToken,
            'X-Database-Name': this.databaseName,
            'X-Database-Type': this.databaseType
          },
          body: JSON.stringify({
            ...query,
            token: this.databaseToken,
            database: this.databaseName,
            type: this.databaseType
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`Success with endpoint: ${url}`);
          return result.rows || result.data || result;
        } else {
          const errorText = await response.text();
          console.log(`Endpoint ${url} failed:`, response.status, errorText);
          lastError = new Error(`${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.log(`Endpoint ${url} error:`, error.message);
        lastError = error;
      }
    }

    // If all endpoints fail, throw the last error
    throw new Error(`All AgentDB endpoints failed. Last error: ${lastError.message}`);
  }

  /**
   * Populate the database with sample survey data
   */
  async populateSampleData() {
    console.log('Populating sample survey data...');

    const sampleData = [
      { respondentId: 1, Q1: "26-35", Q2: "Daily", Q4: "Very Satisfied", department: "Engineering", joinDate: "2023-01-15" },
      { respondentId: 2, Q1: "18-25", Q2: "Weekly", Q4: "Satisfied", department: "Marketing", joinDate: "2023-03-20" },
      { respondentId: 3, Q1: "36-45", Q2: "Monthly", Q4: "Neutral", department: "Sales", joinDate: "2022-11-10" },
      { respondentId: 4, Q1: "46-55", Q2: "Rarely", Q4: "Dissatisfied", department: "HR", joinDate: "2022-08-05" },
      { respondentId: 5, Q1: "26-35", Q2: "Daily", Q4: "Very Dissatisfied", department: "Finance", joinDate: "2023-02-28" },
      { respondentId: 6, Q1: "18-25", Q2: "Weekly", Q4: "Satisfied", department: "Engineering", joinDate: "2023-04-12" },
      { respondentId: 7, Q1: "36-45", Q2: "Monthly", Q4: "Very Satisfied", department: "Marketing", joinDate: "2022-12-03" },
      { respondentId: 8, Q1: "26-35", Q2: "Daily", Q4: "Neutral", department: "Sales", joinDate: "2023-01-08" },
      { respondentId: 9, Q1: "46-55", Q2: "Weekly", Q4: "Dissatisfied", department: "Engineering", joinDate: "2022-09-18" },
      { respondentId: 10, Q1: "18-25", Q2: "Rarely", Q4: "Very Satisfied", department: "HR", joinDate: "2023-05-22" },
      { respondentId: 11, Q1: "36-45", Q2: "Daily", Q4: "Satisfied", department: "Finance", joinDate: "2023-06-10" },
      { respondentId: 12, Q1: "26-35", Q2: "Weekly", Q4: "Very Satisfied", department: "Marketing", joinDate: "2023-04-05" },
      { respondentId: 13, Q1: "56+", Q2: "Monthly", Q4: "Neutral", department: "Engineering", joinDate: "2022-10-18" },
      { respondentId: 14, Q1: "18-25", Q2: "Daily", Q4: "Dissatisfied", department: "Sales", joinDate: "2023-07-22" },
      { respondentId: 15, Q1: "46-55", Q2: "Rarely", Q4: "Very Dissatisfied", department: "HR", joinDate: "2022-09-30" }
    ];

    for (const record of sampleData) {
      await this.executeSQL({
        sql: `INSERT INTO survey_responses (respondentId, Q1, Q2, Q4, department, joinDate) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        params: [record.respondentId, record.Q1, record.Q2, record.Q4, record.department, record.joinDate]
      });
    }

    console.log(`Inserted ${sampleData.length} sample records`);
  }

  /**
   * Get all survey responses
   */
  async getAllResponses() {
    try {
      if (this.mockMode) {
        return [...this.mockData]; // Return copy of mock data
      }
      
      const data = await this.executeSQL({
        sql: 'SELECT * FROM survey_responses ORDER BY respondentId'
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch survey responses:', error);
      throw error;
    }
  }

  /**
   * Get survey responses with a custom filter
   */
  async getFilteredResponses(sqlCondition, params = []) {
    try {
      if (this.mockMode) {
        // Simple mock filtering - just return all data for now
        console.log('Mock filtering with condition:', sqlCondition);
        return this.mockData.filter(row => {
          // Very basic mock filtering for common cases
          if (sqlCondition.includes('Q4') && sqlCondition.includes('=')) {
            const match = sqlCondition.match(/Q4\s*=\s*['"]([^'"]+)['"]/);
            if (match) {
              return row.Q4 === match[1];
            }
          }
          return true; // Default: return all data
        });
      }
      
      const sql = `SELECT * FROM survey_responses WHERE ${sqlCondition} ORDER BY respondentId`;
      const data = await this.executeSQL({
        sql: sql,
        params: params
      });
      return data;
    } catch (error) {
      console.error('Failed to fetch filtered responses:', error);
      throw error;
    }
  }

  /**
   * Add a new survey response
   */
  async addResponse(response) {
    try {
      if (this.mockMode) {
        const newRecord = { ...response };
        this.mockData.push(newRecord);
        console.log('Mock: Survey response added successfully');
        return;
      }
      
      await this.executeSQL({
        sql: `INSERT INTO survey_responses (respondentId, Q1, Q2, Q4, department, joinDate) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        params: [response.respondentId, response.Q1, response.Q2, response.Q4, response.department, response.joinDate]
      });
      console.log('Survey response added successfully');
    } catch (error) {
      console.error('Failed to add survey response:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics() {
    try {
      if (this.mockMode) {
        const totalCount = this.mockData.length;
        
        const departmentCounts = {};
        const satisfactionCounts = {};
        
        this.mockData.forEach(row => {
          departmentCounts[row.department] = (departmentCounts[row.department] || 0) + 1;
          satisfactionCounts[row.Q4] = (satisfactionCounts[row.Q4] || 0) + 1;
        });
        
        const byDepartment = Object.entries(departmentCounts).map(([department, count]) => ({
          department, count
        })).sort((a, b) => b.count - a.count);
        
        const bySatisfaction = Object.entries(satisfactionCounts).map(([satisfaction, count]) => ({
          satisfaction, count
        })).sort((a, b) => b.count - a.count);
        
        return {
          total: totalCount,
          byDepartment,
          bySatisfaction
        };
      }

      const totalCount = await this.executeSQL({
        sql: 'SELECT COUNT(*) as total FROM survey_responses'
      });

      const departmentStats = await this.executeSQL({
        sql: 'SELECT department, COUNT(*) as count FROM survey_responses GROUP BY department ORDER BY count DESC'
      });

      const satisfactionStats = await this.executeSQL({
        sql: 'SELECT Q4 as satisfaction, COUNT(*) as count FROM survey_responses GROUP BY Q4 ORDER BY count DESC'
      });

      return {
        total: totalCount[0]?.total || 0,
        byDepartment: departmentStats,
        bySatisfaction: satisfactionStats
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  /**
   * Apply Kendo filter to get filtered survey responses
   */
  async applyKendoFilter(filterExpression) {
    try {
      if (this.mockMode) {
        console.log('Mock: Applying Kendo filter', filterExpression);
        
        if (!filterExpression || !filterExpression.filters || filterExpression.filters.length === 0) {
          return [...this.mockData];
        }

        return this.mockData.filter(row => {
          // Apply the filter logic based on the expression
          for (const filter of filterExpression.filters) {
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
      
      const { condition, params } = this.convertKendoFilterToSQL(filterExpression);
      return await this.getFilteredResponses(condition, params);
    } catch (error) {
      console.error('Failed to apply Kendo filter:', error);
      throw error;
    }
  }

  /**
   * Update an existing survey response
   */
  async updateResponse(respondentId, updates) {
    try {
      if (this.mockMode) {
        const index = this.mockData.findIndex(row => row.respondentId === respondentId);
        if (index >= 0) {
          this.mockData[index] = { ...this.mockData[index], ...updates };
          console.log('Mock: Survey response updated successfully');
        } else {
          throw new Error(`Response with ID ${respondentId} not found`);
        }
        return;
      }
      
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      await this.executeSQL({
        sql: `UPDATE survey_responses SET ${setClause} WHERE respondentId = ?`,
        params: [...values, respondentId]
      });
      console.log('Survey response updated successfully');
    } catch (error) {
      console.error('Failed to update survey response:', error);
      throw error;
    }
  }

  /**
   * Delete a survey response
   */
  async deleteResponse(respondentId) {
    try {
      if (this.mockMode) {
        const index = this.mockData.findIndex(row => row.respondentId === respondentId);
        if (index >= 0) {
          this.mockData.splice(index, 1);
          console.log('Mock: Survey response deleted successfully');
        } else {
          throw new Error(`Response with ID ${respondentId} not found`);
        }
        return;
      }
      
      await this.executeSQL({
        sql: 'DELETE FROM survey_responses WHERE respondentId = ?',
        params: [respondentId]
      });
      console.log('Survey response deleted successfully');
    } catch (error) {
      console.error('Failed to delete survey response:', error);
      throw error;
    }
  }

  /**
   * Get the database download URL
   */
  async getDownloadUrl() {
    try {
      if (this.mockMode) {
        return {
          url: '#mock-download-not-available',
          message: 'Download not available in mock mode'
        };
      }
      
      const url = `${this.baseUrl}/database/${this.databaseToken}/${this.databaseName}/${this.databaseType}/download`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get download URL: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw error;
    }
  }

  /**
   * Convert Kendo filter expression to SQL WHERE clause
   */
  convertKendoFilterToSQL(filterExpression) {
    if (!filterExpression || !filterExpression.filters || filterExpression.filters.length === 0) {
      return { condition: '1=1', params: [] };
    }

    const conditions = [];
    const params = [];

    for (const filter of filterExpression.filters) {
      switch (filter.operator) {
        case 'eq':
          conditions.push(`${filter.field} = ?`);
          params.push(filter.value);
          break;
        case 'neq':
          conditions.push(`${filter.field} != ?`);
          params.push(filter.value);
          break;
        case 'gt':
          conditions.push(`${filter.field} > ?`);
          params.push(filter.value);
          break;
        case 'gte':
          conditions.push(`${filter.field} >= ?`);
          params.push(filter.value);
          break;
        case 'lt':
          conditions.push(`${filter.field} < ?`);
          params.push(filter.value);
          break;
        case 'lte':
          conditions.push(`${filter.field} <= ?`);
          params.push(filter.value);
          break;
        case 'contains':
          conditions.push(`${filter.field} LIKE ?`);
          params.push(`%${filter.value}%`);
          break;
        default:
          conditions.push(`${filter.field} = ?`);
          params.push(filter.value);
      }
    }

    const logic = filterExpression.logic || 'and';
    const condition = conditions.join(` ${logic.toUpperCase()} `);

    return { condition, params };
  }
}

export default AgentDbService;
