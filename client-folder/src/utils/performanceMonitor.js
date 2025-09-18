// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.renderCount = 0;
    this.apiCalls = 0;
    this.stateChanges = 0;
  }

  logRender(componentName) {
    this.renderCount++;
    console.log(`🔄 RENDER #${this.renderCount}: ${componentName}`);
  }

  logApiCall(endpoint, method = 'GET') {
    this.apiCalls++;
    console.log(`🌐 API CALL #${this.apiCalls}: ${method} ${endpoint}`);
  }

  logStateChange(stateName, newValue) {
    this.stateChanges++;
    console.log(`📊 STATE CHANGE #${this.stateChanges}: ${stateName}`, newValue);
  }

  logPerformance(label) {
    const time = performance.now();
    console.log(`⏱️ PERFORMANCE: ${label} at ${time.toFixed(2)}ms`);
  }

  getStats() {
    return {
      renders: this.renderCount,
      apiCalls: this.apiCalls,
      stateChanges: this.stateChanges
    };
  }

  reset() {
    this.renderCount = 0;
    this.apiCalls = 0;
    this.stateChanges = 0;
  }
}

export const perfMonitor = new PerformanceMonitor();

// Hook untuk monitoring component renders
export const useRenderLogger = (componentName) => {
  React.useEffect(() => {
    perfMonitor.logRender(componentName);
  });
};