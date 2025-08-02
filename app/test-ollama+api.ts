export async function GET(request: Request) {
  const ollamaUrl = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
  const ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2:3b';
  const includeGeneration = new URL(request.url).searchParams.get('full') === 'true';
  
  console.log('🔧 Testing Ollama connection...');
  console.log('📍 URL:', ollamaUrl);
  console.log('🤖 Model:', ollamaModel);
  console.log('🔧 Environment variables:', {
    EXPO_PUBLIC_OLLAMA_URL: process.env.EXPO_PUBLIC_OLLAMA_URL,
    EXPO_PUBLIC_OLLAMA_MODEL: process.env.EXPO_PUBLIC_OLLAMA_MODEL
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    config: {
      url: ollamaUrl,
      model: ollamaModel,
    },
    tests: [],
  };
  
  let ollamaWorking = false;

  // Test 1: Basic connectivity
  try {
    console.log('🔗 Test 1: Basic connectivity...');
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      results.tests.push({
        name: 'Basic Connectivity',
        status: 'PASS',
        details: `Connected successfully. Found ${data.models?.length || 0} models.`,
        models: data.models?.map(m => ({ name: m.name, size: m.size })) || [],
      });
      ollamaWorking = true;
    } else {
      results.tests.push({
        name: 'Basic Connectivity',
        status: 'FAIL',
        details: `HTTP ${response.status}: ${response.statusText}`,
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Basic Connectivity',
      status: 'ERROR',
      details: error.message,
    });
  }

  // Test 2: Model availability
  try {
    console.log('🤖 Test 2: Model availability...');
    const response = await fetch(`${ollamaUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ollamaModel }),
    });
    
    if (response.ok) {
      const data = await response.json();
      results.tests.push({
        name: 'Model Availability',
        status: 'PASS',
        details: `Model ${ollamaModel} is available`,
        modelInfo: {
          name: data.modelfile || 'Unknown',
          parameters: data.parameters || {},
        },
      });
    } else {
      results.tests.push({
        name: 'Model Availability',
        status: 'FAIL',
        details: `Model ${ollamaModel} not found or not accessible`,
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Model Availability',
      status: 'ERROR',
      details: error.message,
    });
  }

  // Test 3: Simple generation (only if basic tests pass and full test requested)
  if (ollamaWorking && includeGeneration) {
    try {
    console.log('💬 Test 3: Simple generation...');
    const testPrompt = 'Respond with JSON: {"message": "Hello from Mistral!", "status": "working"}';
    console.log('🎯 Test prompt:', testPrompt);
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: testPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 100,
        },
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📥 Full response data:', data);
      results.tests.push({
        name: 'Simple Generation',
        status: 'PASS',
        details: 'Model responded successfully',
        response: data.response?.substring(0, 200) + (data.response?.length > 200 ? '...' : ''),
        responseLength: data.response?.length || 0,
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Generation test failed:', errorText);
      results.tests.push({
        name: 'Simple Generation',
        status: 'FAIL',
        details: `HTTP ${response.status}: ${errorText}`,
      });
    }
    } catch (error) {
    results.tests.push({
      name: 'Simple Generation',
      status: 'ERROR',
      details: error.message,
    });
    }
  } else if (!includeGeneration) {
    results.tests.push({
      name: 'Simple Generation',
      status: 'SKIPPED',
      details: 'Add ?full=true to test generation capabilities',
    });
  }

  // Test 4: JSON generation capability (only if generation test passes)
  if (ollamaWorking && includeGeneration && results.tests.find(t => t.name === 'Simple Generation')?.status === 'PASS') {
    try {
    console.log('📋 Test 4: JSON generation...');
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `Generate a simple travel recommendation in JSON format:
{
  "destination": "Paris",
  "activity": "Visit the Eiffel Tower",
  "cost": 25,
  "duration": 2
}

Respond ONLY with valid JSON, no other text.`,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 100,
        },
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      try {
        // Try to parse the response as JSON
        const jsonResponse = data.response.trim();
        const parsed = JSON.parse(jsonResponse);
        results.tests.push({
          name: 'JSON Generation',
          status: 'PASS',
          details: 'Model can generate valid JSON',
          parsedResponse: parsed,
        });
      } catch (parseError) {
        results.tests.push({
          name: 'JSON Generation',
          status: 'PARTIAL',
          details: 'Model responded but JSON parsing failed',
          response: data.response?.substring(0, 200),
          parseError: parseError.message,
        });
      }
    } else {
      results.tests.push({
        name: 'JSON Generation',
        status: 'FAIL',
        details: `HTTP ${response.status}`,
      });
    }
    } catch (error) {
    results.tests.push({
      name: 'JSON Generation',
      status: 'ERROR',
      details: error.message,
    });
    }
  } else {
    results.tests.push({
      name: 'JSON Generation',
      status: 'SKIPPED',
      details: 'Requires basic connectivity and generation test to pass',
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

  // Add quick restart recommendation if Ollama seems stuck
  if (results.tests[0]?.status === 'PASS' && results.tests[2]?.status === 'ERROR') {
    results.summary.recommendations.push('Ollama may be stuck - try: `pkill ollama && ollama serve`');
  }
  
  // Add recommendations based on test results
  if (results.tests[0]?.status !== 'PASS') {
    results.summary.recommendations.push('Check if Ollama server is running: `ollama serve`');
    results.summary.recommendations.push('Verify the URL is correct in your .env file');
  }
  
  if (results.tests[1]?.status !== 'PASS') {
    results.summary.recommendations.push(`Install the model: \`ollama pull ${ollamaModel}\``);
    results.summary.recommendations.push('Check available models: `ollama list`');
  }
  
  if (results.tests[2]?.status !== 'PASS') {
    results.summary.recommendations.push('Model may be loading or have insufficient resources');
    results.summary.recommendations.push('Try a smaller model like `llama3.2:3b` for testing');
  }

  // Add performance tip
  if (results.summary.overall === 'ALL_PASS') {
    results.summary.recommendations.push('✅ Ollama is working! For faster responses, consider using a smaller model');
  }
  
  console.log('🔧 Test results:', results);
  
  return Response.json(results);
}
