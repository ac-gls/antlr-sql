/**
 * AgentDB Service for managing survey data
 * Provides database operations for the SQL parser application
 */
export class AgentDbService {
  constructor() {
    this.apiKey = 'agentdb_d02f736e6d7468d678c98241d32ebb90e59be24be7b12dedc752a8dc3d91153f';
    this.baseUrl = 'https://api.agentdb.dev';
    this.databaseToken = this.generateDatabaseToken();
    this.databaseName = 'survey_responses_db';
    this.databaseType = 'sqlite';
    this.isInitialized = false;
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
      throw error;
    }
  }

  /**
   * Execute SQL query against the database
   */
  async executeSQL(query) {
    const url = `${this.baseUrl}/database/${this.databaseToken}/${this.databaseName}/${this.databaseType}/execute`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AgentDB query failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.rows || result;
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
   * Update an existing survey response
   */
  async updateResponse(respondentId, updates) {
    try {
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
   * Get database statistics
   */
  async getStatistics() {
    try {
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
   * Get the database download URL
   */
  async getDownloadUrl() {
    try {
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

  /**
   * Apply Kendo filter to get filtered survey responses
   */
  async applyKendoFilter(filterExpression) {
    try {
      const { condition, params } = this.convertKendoFilterToSQL(filterExpression);
      return await this.getFilteredResponses(condition, params);
    } catch (error) {
      console.error('Failed to apply Kendo filter:', error);
      throw error;
    }
  }
}
