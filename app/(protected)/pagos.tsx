import React from 'react';
import { View, ScrollView } from 'react-native';
import { Button } from '../../src/components/ui/button';
import { Text } from '../../src/components/ui/text';
import { Card } from '../../src/components/ui/card';

export default function PagosScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-6">
          {/* Header Section */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Gestión de Pagos
            </Text>
            <Text className="text-muted-foreground">
              Administra tus pagos, métodos de pago y historial de transacciones.
            </Text>
          </View>

          {/* Balance Summary */}
          <Card className="p-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Resumen de Cuenta
            </Text>
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground">Saldo Disponible</Text>
                <Text className="text-xl font-bold text-primary">$0.00</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground">Pagos Pendientes</Text>
                <Text className="text-lg font-semibold text-destructive">$0.00</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-muted-foreground">Total Procesado</Text>
                <Text className="text-lg font-semibold text-foreground">$0.00</Text>
              </View>
            </View>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Métodos de Pago
            </Text>
            <View className="space-y-3">
              <View className="border border-border rounded-lg p-4">
                <Text className="text-sm text-muted-foreground mb-1">
                  No hay métodos de pago registrados
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Agrega una tarjeta o cuenta bancaria para comenzar
                </Text>
              </View>
              
              <Button
                onPress={() => {
                  alert('Agregar método de pago próximamente!');
                }}
                variant="outline"
                className="w-full"
              >
                <Text>Agregar Método de Pago</Text>
              </Button>
            </View>
          </Card>

          {/* Transaction History */}
          <Card className="p-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Historial de Transacciones
            </Text>
            <View className="space-y-3">
              <View className="border border-border rounded-lg p-4">
                <Text className="text-sm text-muted-foreground text-center">
                  No hay transacciones disponibles
                </Text>
                <Text className="text-xs text-muted-foreground text-center mt-2">
                  Tus pagos y reembolsos aparecerán aquí
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Acciones Rápidas
            </Text>
            <View className="space-y-3">
              <Button
                onPress={() => {
                  alert('Función de recarga próximamente!');
                }}
                className="w-full"
              >
                <Text className="text-primary-foreground">Recargar Saldo</Text>
              </Button>
              
              <Button
                onPress={() => {
                  alert('Facturación próximamente!');
                }}
                variant="outline"
                className="w-full"
              >
                <Text>Solicitar Factura</Text>
              </Button>
              
              <Button
                onPress={() => {
                  alert('Soporte de pagos próximamente!');
                }}
                variant="outline"
                className="w-full"
              >
                <Text>Contactar Soporte</Text>
              </Button>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}