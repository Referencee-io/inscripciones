/**
 * Configuración de Stripe para la aplicación
 *
 * IMPORTANTE: Cambia USE_TEST_MODE a false cuando quieras usar las claves de producción
 */

const STRIPE_CONFIG = {
  // ====================================
  // CAMBIAR ESTE VALOR PARA ALTERNAR ENTRE PRUEBA Y PRODUCCIÓN
  // ====================================
  USE_TEST_MODE: false, // true = modo prueba, false = modo producción

  // ====================================
  // CONTROL DE CADUCIDAD DEL FORMULARIO
  // ====================================
  FORMULARIO_CADUCADO: true, // true = formulario vencido, false = formulario activo

  // Mensajes informativos
  getModeMessage: function () {
    return this.USE_TEST_MODE
      ? "⚠️ MODO PRUEBA ACTIVO - Usando claves de prueba de Stripe"
      : "✅ MODO PRODUCCIÓN - Usando claves reales de Stripe";
  },

  // Función para obtener el modo actual
  isTestMode: function () {
    return this.USE_TEST_MODE;
  },

  // Función para verificar si el formulario está caducado
  isFormExpired: function () {
    return this.FORMULARIO_CADUCADO;
  },
};

// Mostrar en consola el modo actual al cargar
console.log("=".repeat(60));
console.log(STRIPE_CONFIG.getModeMessage());
console.log(
  "Estado del formulario:",
  STRIPE_CONFIG.isFormExpired() ? "CADUCADO" : "ACTIVO"
);
console.log("=".repeat(60));
