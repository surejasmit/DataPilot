const axios = require('axios');

class PythonAnalysisService {
  constructor() {
    this.baseURL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000/api/v1';
    this.timeout = 300000; // 5 minutes for large datasets
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async analyzeDataset(filePath, fileName, datasetId = null, projectId = null, userId = null) {
    try {
      const response = await this.client.post('/analyze', {
        file_path: filePath,
        file_name: fileName,
        dataset_id: datasetId,
        project_id: projectId,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to call Python analysis service: ${error.message}`);
    }
  }

  async cleanDataset(filePath, fileName, operation, params = {}) {
    try {
      const response = await this.client.post('/clean', {
        file_path: filePath,
        file_name: fileName,
        operation,
        params,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to call Python cleaning service: ${error.message}`);
    }
  }

  async askQuestion(filePath, fileName, question, datasetId = null, projectId = null, userId = null) {
    try {
      const response = await this.client.post('/question', {
        file_path: filePath,
        file_name: fileName,
        question,
        dataset_id: datasetId,
        project_id: projectId,
        user_id: userId,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to call Python question service: ${error.message}`);
    }
  }

  async getChartData(filePath, fileName, chartType, columns) {
    try {
      const response = await this.client.get('/chart', {
        params: { file_path: filePath, file_name: fileName, chart_type: chartType, columns: JSON.stringify(columns) },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to call Python chart service: ${error.message}`);
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async suggestQuestions(filePath, fileName) {
    try {
      const response = await this.client.post('/suggest-questions', {
        file_path: filePath,
        file_name: fileName,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Python service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to call Python suggest questions: ${error.message}`);
    }
  }

  async generateReport(filePath, fileName, projectName, datasetName) {
    try {
      const response = await this.client.post('/generate-report', {
        file_path: filePath,
        file_name: fileName,
        project_name: projectName,
        dataset_name: datasetName,
      }, {
        responseType: 'arraybuffer',
        timeout: 600000,
      });
      return response;
    } catch (error) {
      if (error.response) {
        const errData = Buffer.isBuffer(error.response.data)
          ? error.response.data.toString('utf-8')
          : JSON.stringify(error.response.data);
        throw new Error(`Python service error: ${error.response.status} - ${errData}`);
      }
      throw new Error(`Failed to call Python report service: ${error.message}`);
    }
  }
}

module.exports = new PythonAnalysisService();