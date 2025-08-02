export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = url.searchParams.get('destination') || 'Barcelona';
  
  console.log('🧪 Testing Google Places API...');
  
  // Check environment variables
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 
                 process.env.GOOGLE_PLACES_API_KEY || 
                 process.env.GOOGLE_API_KEY ||
                 process.env.PLACES_API_KEY;
  
  const results = {
    timestamp: new Date().toISOString(),
    destination,
    tests: [],
    environment: {
      EXPO_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET',
      GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET',
      PLACES_API_KEY: process.env.PLACES_API_KEY ? 'SET' : 'NOT SET',
      finalKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND',
    },
  };

  // Test 1: API Key Check
  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
    results.tests.push({
      name: 'API Key Check',
      status: 'FAIL',
      details: 'No valid Google Places API key found',
      solution: 'Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key to .env file',
    });
    
    return Response.json(results);
  } else {
    results.tests.push({
      name: 'API Key Check',
      status: 'PASS',
      details: `API key found (${apiKey.length} characters)`,
    });
  }

  // Test 2: Text Search API
  try {
    console.log('🔍 Testing Text Search API...');
    const textSearchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(destination)}&key=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!textSearchResponse.ok) {
      results.tests.push({
        name: 'Text Search API',
        status: 'FAIL',
        details: `HTTP ${textSearchResponse.status}: ${textSearchResponse.statusText}`,
      });
    } else {
      const textSearchData = await textSearchResponse.json();
      
      if (textSearchData.status === 'REQUEST_DENIED') {
        results.tests.push({
          name: 'Text Search API',
          status: 'FAIL',
          details: 'Request denied - check API key permissions and billing',
          solution: 'Enable Places API in Google Cloud Console and check billing',
        });
      } else if (textSearchData.status === 'OVER_QUERY_LIMIT') {
        results.tests.push({
          name: 'Text Search API',
          status: 'FAIL',
          details: 'Query limit exceeded',
          solution: 'Check your API quota in Google Cloud Console',
        });
      } else if (textSearchData.results && textSearchData.results.length > 0) {
        results.tests.push({
          name: 'Text Search API',
          status: 'PASS',
          details: `Found ${textSearchData.results.length} results for ${destination}`,
          location: textSearchData.results[0].geometry?.location,
        });
      } else {
        results.tests.push({
          name: 'Text Search API',
          status: 'PARTIAL',
          details: `API responded but no results for ${destination}`,
        });
      }
    }
  } catch (error) {
    results.tests.push({
      name: 'Text Search API',
      status: 'ERROR',
      details: error.message,
    });
  }

  // Test 3: Nearby Search API (only if text search worked)
  const textSearchPassed = results.tests.find(t => t.name === 'Text Search API')?.status === 'PASS';
  
  if (textSearchPassed) {
    try {
      console.log('🏢 Testing Nearby Search API...');
      // Use Barcelona coordinates for testing
      const lat = 41.3851;
      const lng = 2.1734;
      
      const nearbyResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=tourist_attraction&key=${apiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!nearbyResponse.ok) {
        results.tests.push({
          name: 'Nearby Search API',
          status: 'FAIL',
          details: `HTTP ${nearbyResponse.status}: ${nearbyResponse.statusText}`,
        });
      } else {
        const nearbyData = await nearbyResponse.json();
        
        if (nearbyData.status === 'REQUEST_DENIED') {
          results.tests.push({
            name: 'Nearby Search API',
            status: 'FAIL',
            details: 'Request denied - check API permissions',
          });
        } else if (nearbyData.results && nearbyData.results.length > 0) {
          results.tests.push({
            name: 'Nearby Search API',
            status: 'PASS',
            details: `Found ${nearbyData.results.length} nearby places`,
            samplePlace: nearbyData.results[0].name,
          });
        } else {
          results.tests.push({
            name: 'Nearby Search API',
            status: 'PARTIAL',
            details: 'API responded but no nearby places found',
          });
        }
      }
    } catch (error) {
      results.tests.push({
        name: 'Nearby Search API',
        status: 'ERROR',
        details: error.message,
      });
    }
  } else {
    results.tests.push({
      name: 'Nearby Search API',
      status: 'SKIPPED',
      details: 'Text Search API must pass first',
    });
  }

  // Summary
  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const totalTests = results.tests.length;
  
  results.summary = {
    overall: passCount === totalTests ? 'ALL_PASS' : passCount > 0 ? 'PARTIAL' : 'FAIL',
    passed: passCount,
    total: totalTests,
    recommendations: [],
  };

  // Add recommendations
  if (results.tests[0]?.status !== 'PASS') {
    results.summary.recommendations.push('Get a Google Places API key from https://console.cloud.google.com/apis/credentials');
    results.summary.recommendations.push('Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key to .env file');
    results.summary.recommendations.push('Restart the development server after adding the API key');
  }
  
  if (results.tests.some(t => t.details?.includes('REQUEST_DENIED'))) {
    results.summary.recommendations.push('Enable Places API in Google Cloud Console');
    results.summary.recommendations.push('Check that billing is enabled for your Google Cloud project');
    results.summary.recommendations.push('Verify API key has Places API permissions');
  }

  if (results.summary.overall === 'ALL_PASS') {
    results.summary.recommendations.push('✅ Google Places API is working correctly!');
  }

  return Response.json(results);
}
