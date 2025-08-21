/**
 * Turso HTTP API Client for React Native
 * 
 * This client provides a React Native compatible way to interact with Turso databases
 * using the HTTP API instead of the Node.js @libsql/client that's incompatible with RN.
 */

export interface TursoConfig {
  url: string;
  authToken: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowsAffected: number;
  lastInsertRowid?: string | number;
}

export interface ExecuteResult {
  rows: Record<string, any>[];
  rowsAffected: number;
  lastInsertRowid?: string | number;
}

export interface StatementArgs {
  sql: string;
  args?: any[];
}

interface TursoHttpResponse {
  results: {
    type: 'ok' | 'error';
    response: {
      type: 'execute';
      result: {
        cols: { name: string; decltype?: string }[];
        rows: { type: string; value: string }[][];
        affected_row_count: number;
        last_insert_rowid?: string | number;
      };
    };
  }[];
}

export class TursoHttpClient {
  private config: TursoConfig;
  private baseUrl: string;

  constructor(config: TursoConfig) {
    this.config = config;
    // Convert libsql:// URL to HTTP API URL
    this.baseUrl = this.convertToHttpUrl(config.url);
  }

  private convertToHttpUrl(libsqlUrl: string): string {
    // Convert libsql://database-org.turso.io to https://database-org.turso.io
    if (libsqlUrl.startsWith('libsql://')) {
      return libsqlUrl.replace('libsql://', 'https://');
    }
    // If already HTTPS, use as is
    if (libsqlUrl.startsWith('https://')) {
      return libsqlUrl;
    }
    // Default fallback
    return `https://${libsqlUrl}`;
  }

  async execute(statement: string | StatementArgs): Promise<ExecuteResult> {
    const { sql, args } = typeof statement === 'string' 
      ? { sql: statement, args: [] }
      : statement;

    try {
      const response = await fetch(`${this.baseUrl}/v2/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            type: 'execute',
            stmt: {
              sql,
              args: (args || []).map(arg => ({
                type: typeof arg === 'number' ? 'integer' : 
                     typeof arg === 'boolean' ? 'integer' :
                     arg === null ? 'null' : 'text',
                value: arg === null ? null : String(arg)
              })),
            },
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Turso HTTP API error: ${response.status} - ${errorText}`);
      }

      const data: TursoHttpResponse = await response.json();
      const result = data.results[0];

      if (!result) {
        throw new Error('No results returned from Turso API');
      }

      if (result.type !== 'ok') {
        throw new Error('Query execution failed');
      }

      // Convert the response to match @libsql/client format
      const rows = result.response.result.rows.map(row => {
        const rowObject: Record<string, any> = {};
        result.response.result.cols.forEach((column, index) => {
          // Parse the value based on type
          const cellValue = row[index];
          let parsedValue: any = cellValue.value;
          
          // Convert string values to appropriate types
          if (cellValue.type === 'integer') {
            parsedValue = parseInt(cellValue.value, 10);
          } else if (cellValue.type === 'real') {
            parsedValue = parseFloat(cellValue.value);
          } else if (cellValue.type === 'null') {
            parsedValue = null;
          }
          
          rowObject[column.name] = parsedValue;
        });
        return rowObject;
      });

      return {
        rows,
        rowsAffected: result.response.result.affected_row_count,
        lastInsertRowid: result.response.result.last_insert_rowid,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Database execution failed: ${error.message}`);
      }
      throw new Error('Database execution failed: Unknown error');
    }
  }

  async batch(statements: StatementArgs[]): Promise<ExecuteResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: statements.map(stmt => ({
            type: 'execute',
            stmt: {
              sql: stmt.sql,
              args: (stmt.args || []).map(arg => ({
                type: typeof arg === 'number' ? 'integer' : 
                     typeof arg === 'boolean' ? 'integer' :
                     arg === null ? 'null' : 'text',
                value: arg === null ? null : String(arg)
              })),
            },
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Turso HTTP API error: ${response.status} - ${errorText}`);
      }

      const data: TursoHttpResponse = await response.json();

      return data.results.map(result => {
        if (result.type !== 'ok') {
          throw new Error('Query execution failed');
        }

        const rows = result.response.result.rows.map(row => {
          const rowObject: Record<string, any> = {};
          result.response.result.cols.forEach((column, index) => {
            // Parse the value based on type
            const cellValue = row[index];
            let parsedValue: any = cellValue.value;
            
            // Convert string values to appropriate types
            if (cellValue.type === 'integer') {
              parsedValue = parseInt(cellValue.value, 10);
            } else if (cellValue.type === 'real') {
              parsedValue = parseFloat(cellValue.value);
            } else if (cellValue.type === 'null') {
              parsedValue = null;
            }
            
            rowObject[column.name] = parsedValue;
          });
          return rowObject;
        });

        return {
          rows,
          rowsAffected: result.response.result.affected_row_count,
          lastInsertRowid: result.response.result.last_insert_rowid,
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Database batch execution failed: ${error.message}`);
      }
      throw new Error('Database batch execution failed: Unknown error');
    }
  }

  // Transaction support using batch operations
  async transaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    const tx = new TransactionClient(this);
    const result = await fn(tx);
    
    if (tx.statements.length > 0) {
      await this.batch(tx.statements);
    }
    
    return result;
  }

  // Close method for compatibility (no-op for HTTP client)
  close(): void {
    // No-op for HTTP client - no persistent connections to close
  }
}

export class TransactionClient {
  public statements: StatementArgs[] = [];

  constructor(_client: TursoHttpClient) {
    // Client reference not needed for transaction batching
  }

  async execute(statement: string | StatementArgs): Promise<void> {
    const { sql, args } = typeof statement === 'string' 
      ? { sql: statement, args: [] }
      : statement;
    
    this.statements.push({ sql, args });
  }
}

// Factory function to create Turso client
export function createTursoClient(config: TursoConfig): TursoHttpClient {
  return new TursoHttpClient(config);
}