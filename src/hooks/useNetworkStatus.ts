import { useState, useEffect } from 'react';
import { NetworkChecker, NetworkStatus } from '~/src/services/network-check';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkNetwork = async () => {
    setIsLoading(true);
    try {
      const networkStatus = await NetworkChecker.checkConnectivity();
      setStatus(networkStatus);
    } catch (error) {
      console.error('Error checking network status:', error);
      setStatus({
        isConnected: false,
        canReachTurso: false,
        error: 'Error verificando conectividad',
        environment: 'device'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnostics = async () => {
    return await NetworkChecker.runDiagnostics();
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  return {
    status,
    isLoading,
    checkNetwork,
    runDiagnostics,
    isOnline: status?.isConnected ?? false,
    canUseCRUD: status?.canReachTurso ?? false,
  };
}