export const debugNetworkRequests = () => {
  // Override fetch to log all requests
  const originalFetch = window.fetch;
  
  window.fetch = async (url, options = {}) => {
    console.log('🌐 Fetch Request:', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await originalFetch(url, options);
      
      console.log('✅ Fetch Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('❌ Fetch Error:', {
        url,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };
};