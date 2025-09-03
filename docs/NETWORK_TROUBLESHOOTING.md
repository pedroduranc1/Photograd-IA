# Solución de Problemas de Red - CRUD no funciona fuera de localhost

## 🔍 Problema Principal
El CRUD funciona perfectamente en localhost (desarrollo local) pero falla cuando la app se ejecuta en:
- Dispositivos físicos (iOS/Android)
- Simuladores/emuladores
- Web en diferentes dominios
- Entornos de producción

## ⚡ Solución Rápida

### 1. **Verificar Conectividad**
La app ahora incluye un indicador de estado de red que aparece automáticamente si hay problemas:

```tsx
// Ya incluido en app/_layout.tsx
<NetworkStatusIndicator showDiagnostics={true} />
```

### 2. **Ejecutar Diagnósticos**
```tsx
import { NetworkChecker } from '~/src/services/network-check';

// En cualquier componente
const runDiagnostics = async () => {
  const report = await NetworkChecker.runDiagnostics();
  console.log(report);
};
```

### 3. **Usar el Hook de Estado de Red**
```tsx
import { useNetworkStatus } from '~/src/hooks/useNetworkStatus';

function MyComponent() {
  const { canUseCRUD, status, isLoading } = useNetworkStatus();
  
  if (!canUseCRUD) {
    return <Text>CRUD no disponible - problemas de conectividad</Text>;
  }
  
  // Tu componente normal...
}
```

## 🛠️ Causas Comunes y Soluciones

### **1. Problemas de Conectividad de Red**

**Síntomas:**
- Timeouts en las operaciones CRUD
- Errores de "fetch failed" o "network error"
- El indicador muestra "BD no disponible"

**Soluciones:**
```bash
# Verificar conectividad básica
ping google.com

# En la app, revisar logs de red
console.log('Network status:', status);
```

**Configuración de Desarrollo:**
- Asegúrate de que el dispositivo esté en la misma red que tu computadora
- Verifica que no haya firewall bloqueando las conexiones
- En simuladores, reinicia la app y el simulador

### **2. Problemas de CORS (Web)**

**Síntomas:**
- Funciona en localhost pero no en dominios remotos
- Errores de CORS en la consola del navegador

**Solución:**
El cliente HTTP ahora maneja mejor los errores de red y CORS. Los errores se muestran de forma más clara.

### **3. Problemas de Autenticación**

**Síntomas:**
- Error 401 (Unauthorized)
- "Token de base de datos inválido o expirado"

**Verificación:**
```bash
# Verificar variables de entorno
echo $EXPO_PUBLIC_TURSO_AUTH_TOKEN
echo $EXPO_PUBLIC_TURSO_DATABASE_URL
```

**Solución:**
1. Regenera el token en Turso
2. Actualiza las variables de entorno
3. Reinicia el servidor de desarrollo

### **4. Configuración de Turso**

**Verificar URL de Base de Datos:**
```typescript
// Debe ser una de estas formas:
libsql://tu-db.turso.io
https://tu-db.turso.io
```

**Verificar Token:**
- El token debe ser válido y no haber expirado
- Debe tener permisos suficientes para las operaciones CRUD

## 📋 Lista de Verificación

### ✅ **Antes de Usar CRUD**
- [ ] Internet disponible en el dispositivo
- [ ] Variables de entorno configuradas correctamente
- [ ] Token de Turso válido y no expirado
- [ ] URL de base de datos correcta
- [ ] Sin restricciones de firewall

### ✅ **Durante el Desarrollo**
- [ ] Dispositivo en la misma red que la computadora
- [ ] Puerto 8081 (Metro) accesible
- [ ] No hay proxies interferiendo

### ✅ **En Producción**
- [ ] Variables de entorno de producción configuradas
- [ ] Dominio permitido en configuración de CORS
- [ ] Certificados SSL válidos

## 🔧 Herramientas de Diagnóstico

### **1. Indicador Visual**
El `NetworkStatusIndicator` muestra:
- 🟢 **Verde**: Todo funciona correctamente
- 🟠 **Naranja**: Internet OK, BD no accesible
- 🔴 **Rojo**: Sin conexión a internet

### **2. Logs Detallados**
```typescript
// Los errores ahora son más descriptivos:
❌ Error de conexión: No se pudo conectar a la base de datos
⚠️ Error de autenticación: Token inválido
⏰ Timeout: La conexión tardó demasiado
🌐 Error de red: Problemas de conectividad
```

### **3. Diagnóstico Completo**
```typescript
import { NetworkChecker } from '~/src/services/network-check';

const diagnostics = await NetworkChecker.runDiagnostics();
// Genera un reporte completo con recomendaciones específicas
```

## 🚀 Mejoras Implementadas

1. **Timeouts Inteligentes**: 15 segundos para evitar colgarse
2. **Errores Descriptivos**: Mensajes claros en español sobre qué está fallando
3. **Detección de Entorno**: Diferencia entre localhost, dispositivo, simulador
4. **Reintentos Automáticos**: Botón para reintentar conexión
5. **Diagnósticos Integrados**: Herramientas para identificar problemas específicos

## 📱 Uso en Diferentes Entornos

### **Localhost (Desarrollo)**
- Debería funcionar sin problemas
- Si falla, verificar variables de entorno

### **Dispositivo Físico**
- Verificar conectividad Wi-Fi
- Asegurar que no hay restricciones de red corporativa

### **Simulador/Emulador**
- Reiniciar el simulador si hay problemas
- Verificar configuración de red del simulador

### **Web/Producción**
- Verificar configuración de CORS
- Validar certificados SSL
- Confirmar variables de entorno de producción

## 🆘 Si Nada Funciona

1. **Ejecuta diagnósticos completos**:
   ```typescript
   await NetworkChecker.runDiagnostics();
   ```

2. **Revisa los logs de la app** para errores específicos

3. **Verifica en la consola de Turso** que la base de datos esté accesible

4. **Prueba crear un token nuevo** en Turso

5. **Contacta soporte** con el reporte de diagnósticos generado

---

La app ahora debería manejar mucho mejor los problemas de conectividad y proporcionar información clara sobre qué está fallando y cómo solucionarlo.