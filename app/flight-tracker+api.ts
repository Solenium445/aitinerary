export async function GET(request: Request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || 'flights';
  const query = url.searchParams.get('query') || '';
  const limit = url.searchParams.get('limit') || '10';
  
  const apiKey = process.env.EXPO_PUBLIC_AVIATION_STACK_API_KEY;
  
  if (!apiKey || apiKey === 'undefined') {
    return Response.json({
      success: false,
      error: 'Aviation Stack API key not configured',
      setup_instructions: {
        step1: 'Add EXPO_PUBLIC_AVIATION_STACK_API_KEY to your .env file',
        step2: 'Restart the development server',
        api_key: 'Get your API key from https://aviationstack.com/dashboard'
      }
    }, { status: 400 });
  }

  try {
    let apiUrl = `https://api.aviationstack.com/v1/${endpoint}?access_key=${apiKey}&limit=${limit}`;
    
    // Add specific query parameters based on endpoint
    switch (endpoint) {
      case 'flights':
        if (query) {
          // Check if query looks like a flight number
          if (/^[A-Z]{2,3}\d+$/i.test(query)) {
            apiUrl += `&flight_iata=${query.toUpperCase()}`;
          } else {
            // Assume it's an airport code
            apiUrl += `&dep_iata=${query.toUpperCase()}`;
          }
        }
        break;
      case 'airports':
        if (query) {
          apiUrl += `&search=${encodeURIComponent(query)}`;
        }
        break;
      case 'airlines':
        if (query) {
          apiUrl += `&search=${encodeURIComponent(query)}`;
        }
        break;
      case 'routes':
        if (query) {
          apiUrl += `&dep_iata=${query.toUpperCase()}`;
        }
        break;
    }

    console.log(`🛩️ Fetching from Aviation Stack: ${endpoint}`);
    
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Aviation Stack API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      return Response.json({
        success: false,
        error: data.error.message || 'Aviation Stack API error',
        code: data.error.code,
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      data: data.data || [],
      pagination: data.pagination || null,
      endpoint,
      query,
    });

  } catch (error) {
    console.error('Flight tracker API error:', error);
    
    return Response.json({
      success: false,
      error: error.message || 'Failed to fetch flight data',
    }, { status: 500 });
  }
}