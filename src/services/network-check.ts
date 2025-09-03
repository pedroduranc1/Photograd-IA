/**
 * Network connectivity checker for database operations
 * Helps diagnose network issues when running on different environments
 */

export interface NetworkStatus {
  isConnected: boolean;
  canReachTurso: boolean;
  error?: string;
  environment: 'localhost' | 'device' | 'simulator' | 'web';
}

export class NetworkChecker {
  private static readonly TURSO_HOST = 'photograd-db-pedropdc.aws-us-east-2.turso.io';
  private static readonly TIMEOUT_MS = 10000; // 10 seconds

  static async checkConnectivity(): Promise<NetworkStatus> {
    const environment = this.detectEnvironment();
    
    try {
      // Test basic internet connectivity first
      const isConnected = await this.testInternetConnection();
      
      if (!isConnected) {
        return {
          isConnected: false,
          canReachTurso: false,
          error: 'No hay conexión a internet',
          environment
        };
      }

      // Test Turso-specific connectivity
      const canReachTurso = await this.testTursoConnection();
      
      return {
        isConnected: true,
        canReachTurso,
        error: canReachTurso ? undefined : 'No se puede conectar a la base de datos Turso',
        environment
      };
    } catch (error) {
      return {
        isConnected: false,
        canReachTurso: false,
        error: `Error de conectividad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        environment
      };
    }
  }

  private static detectEnvironment(): NetworkStatus['environment'] {
    // Check if running on web
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Check if localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'localhost';
      }
      return 'web';
    }

    // For React Native, check if running on device/simulator
    // This is a simplified check - in practice you'd use react-native-device-info
    return 'device';
  }

  private static async testInternetConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Internet connectivity test failed:', error);
      return false;
    }
  }

  private static async testTursoConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      // Try to make a simple HTTP request to Turso's endpoint
      const response = await fetch(`https://${this.TURSO_HOST}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      
      // Even if we get a 404, it means we can reach the host
      return response.status !== 0;
    } catch (error) {
      console.warn('Turso connectivity test failed:', error);
      
      // Try alternative connectivity test
      return this.testTursoAlternative();
    }
  }

  private static async testTursoAlternative(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      // Try to connect to Turso's API endpoint directly
      const response = await fetch(`https://${this.TURSO_HOST}/v2/pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            type: 'execute',
            stmt: { sql: 'SELECT 1', args: [] }
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // We expect an auth error (401), which means the host is reachable
      return response.status === 401 || response.status === 403;
    } catch (error) {
      console.error('Alternative Turso test failed:', error);
      return false;
    }
  }

  static async runDiagnostics(): Promise<string> {
    console.log('🔍 Ejecutando diagnóstico de red...');
    
    const status = await this.checkConnectivity();
    
    let report = `📊 Reporte de Conectividad de Red\n`;
    report += `===============================\n`;
    report += `Entorno: ${status.environment}\n`;
    report += `Internet: ${status.isConnected ? '✅ Conectado' : '❌ Sin conexión'}\n`;
    report += `Base de datos: ${status.canReachTurso ? '✅ Accesible' : '❌ No accesible'}\n`;
    
    if (status.error) {
      report += `Error: ${status.error}\n`;
    }
    
    // Add environment-specific recommendations
    if (!status.canReachTurso) {
      report += `\n🔧 Recomendaciones:\n`;
      
      switch (status.environment) {
        case 'device':
          report += `- Verifica que el dispositivo tenga conexión a internet\n`;
          report += `- Asegúrate de que no haya firewall bloqueando la conexión\n`;
          report += `- Intenta reiniciar la app y verificar la conectividad\n`;
          break;
        case 'simulator':
          report += `- Verifica la configuración de red del simulador\n`;
          report += `- Reinicia el simulador si es necesario\n`;
          break;
        case 'web':
          report += `- Verifica la configuración de CORS\n`;
          report += `- Revisa la consola del navegador para errores específicos\n`;
          break;
        case 'localhost':
          report += `- El problema podría estar en la configuración local\n`;
          report += `- Verifica las variables de entorno\n`;
          break;
      }
    }
    
    console.log(report);
    return report;
  }
}