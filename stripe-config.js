/**
 * Configuración de Stripe para la aplicación
 *
 * IMPORTANTE: Cambia USE_TEST_MODE a false cuando quieras usar las claves de producción
 */

const STRIPE_CONFIG = {
    // ====================================
    // CAMBIAR ESTE VALOR PARA ALTERNAR ENTRE PRUEBA Y PRODUCCIÓN
    // ====================================
    USE_TEST_MODE: false,  // true = modo prueba, false = modo producción

    // Mensajes informativos
    getModeMessage: function() {
        return this.USE_TEST_MODE
            ? "⚠️ MODO PRUEBA ACTIVO - Usando claves de prueba de Stripe"
            : "✅ MODO PRODUCCIÓN - Usando claves reales de Stripe";
    },

    // Función para obtener el modo actual
    isTestMode: function() {
        return this.USE_TEST_MODE;
    }
};

// Mostrar en consola el modo actual al cargar
console.log("=".repeat(60));
console.log(STRIPE_CONFIG.getModeMessage());
console.log("=".repeat(60));
