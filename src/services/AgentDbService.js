import { DatabaseService } from "@agentdb/sdk";

/**
 * AgentDB Service for managing survey data using the official AgentDB SDK
 * Provides database operations for the SQL parser application
 */
export class AgentDbService {
  constructor(mockMode = false) {
    this.apiKey = 'agentdb_d02f736e6d7468d678c98241d32ebb90e59be24be7b12dedc752a8dc3d91153f';
    this.baseUrl = 'https://api.agentdb.dev';
    this.databaseToken = this.generateDatabaseToken();
    this.databaseName = 'stim-antlr'; // Your actual database name
    this.databaseType = 'sqlite';
    this.isInitialized = false;
    this.mockMode = mockMode;
    this.mockData = []; // For mock mode
    
    // Initialize AgentDB SDK
    this.agentdb = null;
    this.connection = null;
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
   * Initialize the database using AgentDB SDK
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing AgentDB connection with SDK...');
      console.log('Database Name:', this.databaseName);
      console.log('Mock Mode:', this.mockMode);

      if (this.mockMode) {
        // Initialize mock data
        this.initializeMockData();
        this.isInitialized = true;
        console.log('AgentDB mock mode initialized successfully');
        return;
      }

      // Initialize AgentDB SDK
      console.log('Creating AgentDB service instance...');
      this.agentdb = new DatabaseService(this.baseUrl, this.apiKey, true);
      
      // Generate a database token for your existing database
      // Since you created "stim-antlr", we'll use that as the database name
      console.log('Connecting to existing database:', this.databaseName);
      this.connection = this.agentdb.connect(this.databaseToken, this.databaseName, this.databaseType);

      // Test the connection with a simple query
      console.log('Testing AgentDB connection...');
      await this.connection.execute({
        sql: 'SELECT 1 as test'
      });
      
      console.log('✅ AgentDB connection successful!');

      // Create the survey responses table
      console.log('Creating survey_responses table...');
      await this.connection.execute({
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

      // Check if we need to populate sample data
      console.log('Checking for existing data...');
      const existingData = await this.connection.execute({
        sql: 'SELECT COUNT(*) as count FROM survey_responses'
      });

      const recordCount = existingData[0]?.count || 0;
      console.log(`Found ${recordCount} existing records`);

      if (recordCount === 0) {
        console.log('Populating with sample data...');
        await this.populateSampleData();
      }

      this.isInitialized = true;
      console.log('✅ AgentDB initialized successfully with SDK!');
      
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
   * Execute SQL query using AgentDB SDK
   */
  async executeSQL(query) {
    if (this.mockMode) {
      console.log('Mock mode: SQL execution skipped');
      return [];
    }

    if (!this.connection) {
      throw new Error('AgentDB connection not initialized');
    }

    try {
      console.log('Executing SQL:', query.sql);
      const result = await this.connection.execute(query);
      console.log('SQL execution successful');
      
      // The AgentDB SDK returns data in format: 
      // {results: [{rows: [...actual_data...], totalRows: n, offset: 0, limit: 100, changes: 0}]}
      // We need to extract the actual data from result.results[0].rows
      if (result && Array.isArray(result.results) && result.results.length > 0) {
        const firstResult = result.results[0];
        if (firstResult && Array.isArray(firstResult.rows)) {
          return firstResult.rows;
        }
        // Fallback to the result object itself if no rows property
        return firstResult || [];
      }
      
      // Final fallback for other response formats
      return result || [];
    } catch (error) {
      console.error('SQL execution failed:', error);
      throw error;
    }
  }

  /**
   * Populate the database with sample survey data using AgentDB SDK
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

    console.log(`✅ Inserted ${sampleData.length} sample records`);
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
