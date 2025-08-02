import { jsonrepair } from 'jsonrepair';

export async function POST(request: Request) {
  let tripData: any = null;
  
  try {
    tripData = await request.json();
    console.log('📝 Received trip data:', tripData);
    
    // Validate required fields
    if (!tripData.destination || !tripData.startDate || !tripData.endDate || !tripData.budget || !tripData.group) {
      return Response.json({
        success: false,
        error: 'Missing required trip information',
      }, { status: 400 });
    }

    // Calculate trip duration
    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);
    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (tripDuration <= 0) {
      return Response.json({
        success: false,
        error: 'Invalid date range',
      }, { status: 400 });
    }

    // Limit AI generation to prevent timeouts - max 7 days for tinyllama
    const aiMaxDuration = Math.min(tripDuration, 3); // Reduce AI generation to 3 days max for reliability
    const actualDuration = tripDuration;
    
    console.log('🚀 Starting itinerary generation for:', {
      destination: tripData.destination,
      actualDuration: actualDuration,
      aiDuration: aiMaxDuration,
      budget: tripData.budget,
      group: tripData.group,
      interests: tripData.interests
    });

    // Get real places data first using Google Places API
    const realPlaces = await fetchRealPlacesForItinerary(tripData.destination, tripData.interests);

    // Get Ollama configuration from environment variables
    const ollamaUrl = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2:3b';
    console.log(`🔗 Connecting to Ollama at ${ollamaUrl} using model ${ollamaModel}`);

    // Try AI generation with very limited scope to prevent timeouts
    try {
      const aiResult = await generateWithOllamaAndRealPlaces(ollamaUrl, ollamaModel, tripData, aiMaxDuration, realPlaces);
      if (aiResult) {
        // Extend AI result to full duration using sample data
        console.log(`🔄 Extending AI result from ${aiResult.days?.length || aiMaxDuration} days to full ${actualDuration} days`);
        const extendedResult = extendItineraryToFullDuration(aiResult, tripData, actualDuration, realPlaces);
        console.log(`✅ Extended itinerary now has ${extendedResult.days.length} days`);
        return Response.json({
          success: true,
          itinerary: extendedResult,
          destination: tripData.destination,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          duration: actualDuration,
          location: tripData.destination, // Add for compatibility
          message: `Your ${actualDuration}-day personalized itinerary has been generated successfully!`,
          ai_powered: true,
          real_places: realPlaces.length > 0,
          debug_info: {
            ollama_url: ollamaUrl,
            model: ollamaModel,
            ai_days: aiMaxDuration,
            total_days: actualDuration,
            places_found: realPlaces.length,
          }
        });
      }
    } catch (aiError) {
      console.error('💥 AI generation failed:', aiError.message);
      // Continue to fallback
    }

    // Fallback to sample data with full duration
    console.log('🔄 Using sample itinerary with real places as fallback');
    const fallbackItinerary = generateSampleItineraryWithRealPlaces(tripData, actualDuration, realPlaces);
    console.log('📋 Generated fallback itinerary with', fallbackItinerary.days.length, 'days and', realPlaces.length, 'real places');
    
    return Response.json({
      success: true,
      itinerary: fallbackItinerary,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      duration: actualDuration,
      location: tripData.destination, // Add for compatibility
      message: `Your ${actualDuration}-day itinerary has been created with ${realPlaces.length > 0 ? 'real places from Google' : 'curated recommendations'}!`,
      ai_powered: false,
      real_places: realPlaces.length > 0,
      debug_info: {
        places_found: realPlaces.length,
        google_api_working: realPlaces.length > 0,
        ollama_attempted: true,
        ollama_failed: true,
      }
    });

  } catch (error) {
    console.error('💥 Error in main handler:', error);
    
    // Emergency fallback with default data
    const fallbackData = tripData || {
      destination: 'Barcelona, Spain',
      interests: ['food', 'culture'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      group: 'couple',
      budget: 'mid-range'
    };
    
    const emergencyDuration = tripData ? Math.ceil((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 3;
    
    console.log('🔄 Emergency fallback with default data');
    const emergencyItinerary = generateSampleItinerary(fallbackData, emergencyDuration);
    console.log('🚨 Emergency itinerary generated with', emergencyItinerary.days.length, 'days (basic template)');
    
    return Response.json({
      success: true,
      itinerary: emergencyItinerary,
      destination: fallbackData.destination,
      startDate: fallbackData.startDate,
      endDate: fallbackData.endDate,
      duration: emergencyDuration,
      location: fallbackData.destination, // Add for compatibility
      message: `Your ${emergencyDuration}-day itinerary has been created! (Basic template used due to service issues)`,
      ai_powered: false,
      error_details: error.message,
    });
  }
}

function extendItineraryToFullDuration(aiItinerary: any, tripData: any, fullDuration: number, realPlaces: any[]) {
  console.log('🔄 Extending AI itinerary from', aiItinerary.days.length, 'to', fullDuration, 'days');
  
  if (!aiItinerary.days || aiItinerary.days.length === 0) {
    console.warn('⚠️ AI itinerary has no days, falling back to sample generation');
    return generateSampleItineraryWithRealPlaces(tripData, fullDuration, realPlaces);
  }
  
  const startDate = new Date(tripData.startDate);
  const extendedDays = [...aiItinerary.days];
  
  // Ensure we have the correct number of days
  console.log(`📊 Current days: ${extendedDays.length}, Target: ${fullDuration}`);
  
  // Generate additional days using sample data pattern
  for (let i = aiItinerary.days.length; i < fullDuration; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    console.log(`🏗️ Generating day ${i + 1} for date ${currentDate.toISOString().split('T')[0]}`);
    
    // Cycle through real places if available
    const placeIndex1 = (i * 2) % realPlaces.length;
    const placeIndex2 = (i * 2 + 1) % realPlaces.length;
    const availablePlaces = [];
    
    if (realPlaces.length > 0) {
      if (placeIndex1 < realPlaces.length) availablePlaces.push(realPlaces[placeIndex1]);
      if (placeIndex2 < realPlaces.length && placeIndex2 !== placeIndex1) {
        availablePlaces.push(realPlaces[placeIndex2]);
      }
    }
    
    const activities = [];
    
    // Morning activity
    if (availablePlaces.length > 0) {
      const place = availablePlaces[0];
      activities.push({
        id: `day${i + 1}_real_${place.id}`,
        time: '09:00',
        title: place.name,
        description: place.description,
        location: place.location,
        type: 'morning',
        confidence: Math.floor(place.rating * 20),
        estimated_cost_gbp: place.estimated_cost_gbp,
        duration_hours: place.duration_hours,
        booking_required: place.booking_required,
        local_tip: `Highly rated local spot with ${place.rating}/5 stars`,
      });
    } else {
      activities.push({
        id: `day${i + 1}_activity1`,
        time: '09:00',
        title: `Explore ${tripData.destination} - Day ${i + 1}`,
        description: `Continue discovering the hidden gems and local culture of ${tripData.destination}.`,
        location: `${tripData.destination} District`,
        type: 'morning',
        confidence: 88,
        estimated_cost_gbp: 20,
        duration_hours: 2,
        booking_required: false,
        local_tip: 'Ask locals for their favorite spots',
      });
    }
    
    // Afternoon activity
    if (availablePlaces.length > 1) {
      const place = availablePlaces[1];
      activities.push({
        id: `day${i + 1}_real_${place.id}`,
        time: '14:00',
        title: place.name,
        description: place.description,
        location: place.location,
        type: 'afternoon',
        confidence: Math.floor(place.rating * 20),
        estimated_cost_gbp: place.estimated_cost_gbp,
        duration_hours: place.duration_hours,
        booking_required: place.booking_required,
        local_tip: `Popular destination with ${place.rating}/5 stars`,
      });
    } else {
      activities.push({
        id: `day${i + 1}_activity2`,
        time: '14:00',
        title: `Local Experience - Day ${i + 1}`,
        description: `Immerse yourself in the local lifestyle and discover what makes ${tripData.destination} special.`,
        location: `${tripData.destination} Center`,
        type: 'afternoon',
        confidence: 85,
        estimated_cost_gbp: 30,
        duration_hours: 2.5,
        booking_required: false,
        local_tip: 'Try something new and adventurous',
      });
    }
    
    // Evening activity for longer days
    if (i % 3 === 0 || fullDuration > 7) { // Add evening activities every 3rd day or for longer trips
      activities.push({
        id: `day${i + 1}_activity3`,
        time: '19:00',
        title: `Evening in ${tripData.destination}`,
        description: 'Experience the nightlife and evening atmosphere of the city.',
        location: `${tripData.destination} Entertainment District`,
        type: 'evening',
        confidence: 82,
        estimated_cost_gbp: 40,
        duration_hours: 3,
        booking_required: false,
        local_tip: 'Check local event listings for special happenings',
      });
    }
    
    extendedDays.push({
      date: currentDate.toISOString().split('T')[0],
      day_number: i + 1,
      activities,
    });
  }
  
  console.log(`✅ Extended itinerary completed with ${extendedDays.length} days`);
  
  // Update total cost
  const totalCost = extendedDays.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, activity) => daySum + (activity.estimated_cost_gbp || 0), 0);
  }, 0);
  
  const result = {
    ...aiItinerary,
    days: extendedDays,
    total_estimated_cost_gbp: totalCost,
    destination: tripData.destination,
    location: tripData.destination,
    startDate: tripData.startDate,
    endDate: tripData.endDate,
  };
  
  console.log(`💰 Total estimated cost: £${result.total_estimated_cost_gbp}`);
  return result;
}

async function fetchRealPlacesForItinerary(destination: string, interests: string[]) {
  const allPlaces = [];
  
  try {
    // Fetch different categories based on interests
    const categories = ['attractions'];
    
    if (interests?.includes('food')) {
      categories.push('restaurants');
    }
    if (interests?.includes('history') || interests?.includes('culture')) {
      categories.push('culture');
    }
    if (interests?.includes('nature') || interests?.includes('beaches')) {
      categories.push('nature');
    }
    if (interests?.includes('nightlife')) {
      categories.push('activities');
    }

    // Fetch places for each category
    for (const category of categories) {
      try {
        console.log(`🗺️ Fetching ${category} places for ${destination}...`);
        
        // Call the places API directly with proper URL construction
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '';
        const placesUrl = `${baseUrl}/places?destination=${encodeURIComponent(destination)}&category=${category}`;
        console.log(`🔗 Calling places API: ${placesUrl}`);
        
        const response = await fetch(placesUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000), // 8 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Places API response for ${category}:`, {
            success: data.success,
            source: data.source,
            placesCount: data.places?.length || 0,
          });
          
          if (data.success && data.places) {
            console.log(`✅ Found ${data.places.length} ${category} places (source: ${data.source})`);
            // Take more places for better variety
            allPlaces.push(...data.places.slice(0, 4));
          } else {
            console.log(`⚠️ No places returned for ${category}`);
          }
        } else {
          console.error(`❌ Failed to fetch ${category} places: HTTP ${response.status}`);
          const errorText = await response.text();
          console.error(`❌ Error details: ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ Timeout/error fetching ${category} places:`, error.message);
        // Continue with other categories even if one fails
      }
    }
  } catch (error) {
    console.error('❌ Error in fetchRealPlacesForItinerary:', error.message);
  }

  console.log(`📍 Found ${allPlaces.length} total real places for ${destination}`);
  
  // If we got very few places, log a helpful message
  if (allPlaces.length < 3) {
    console.log(`💡 Tip: Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to .env for more real places`);
    console.log(`🔧 Test Google Places API at: http://localhost:3000/test-google-places?destination=${encodeURIComponent(destination)}`);
  }
  
  return allPlaces;
}

async function generateWithOllamaAndRealPlaces(ollamaUrl: string, ollamaModel: string, tripData: any, maxDuration: number, realPlaces: any[]) {
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('❌ Ollama request timed out after 60 seconds');
    controller.abort();
  }, 60000); // Reduced to 60 seconds for tinyllama

  try {
    // Quick health check first
    console.log('🔍 Quick health check...');
    const healthResponse = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // Faster health check
    });

    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    console.log('✅ Ollama is running. Available models:', healthData.models?.map(m => m.name) || []);

    // Check if our model is available
    const modelExists = healthData.models?.some(m => m.name === ollamaModel);
    if (!modelExists) {
      console.warn(`⚠️ Model ${ollamaModel} not found. Available models:`, healthData.models?.map(m => m.name));
    }

    // ULTRA SIMPLIFIED prompt for tinyllama - just basic structure
    const prompt = `Create ${maxDuration} day trip for ${tripData.destination}.

JSON only:
{
"days":[
{"date":"${tripData.startDate}","day_number":1,"activities":[
{"time":"09:00","title":"Activity","description":"Short desc","location":"${tripData.destination}","type":"morning","confidence":85,"estimated_cost_gbp":20,"duration_hours":2,"booking_required":false,"local_tip":"tip"}
]}
],
"total_estimated_cost_gbp":50,
"currency":"GBP",
"travel_tips":["tip1"]
}

ONLY JSON. ${maxDuration} days max.`;

    console.log('🤖 Sending request to Ollama...');
    const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.3,
          num_predict: 300, // Reduced for faster response
          stop: ['```', '\n\n\n', 'Human:', 'User:', 'Assistant:'], // Stop tokens
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('❌ Ollama HTTP error:', ollamaResponse.status, errorText);
      throw new Error(`Ollama error: ${ollamaResponse.status} - ${errorText}`);
    }

    const ollamaData = await ollamaResponse.json();
    console.log('✅ Ollama response received, length:', ollamaData.response?.length || 0);
    console.log('📄 Raw response preview:', ollamaData.response?.substring(0, 200) + '...');

    if (!ollamaData.response || ollamaData.response.trim().length === 0) {
      throw new Error('Empty response from Ollama');
    }

    // Use jsonrepair to fix the JSON
    try {
      let rawText = ollamaData.response.trim();
      
      // Remove markdown code blocks
      rawText = rawText.replace(/^```json/gm, '').replace(/```/gm, '');
      rawText = rawText.replace(/^Response:\s*/i, '').trim();
      
      // Extract JSON content if there's extra text
      const jsonMatch = rawText.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        rawText = jsonMatch[1];
      }
      
      console.log('🔧 Attempting to repair JSON...');
      const repairedJson = jsonrepair(rawText);
      console.log('🧹 Repaired JSON:', repairedJson.substring(0, 200) + '...');
      
      const parsed = JSON.parse(repairedJson);
      console.log('✅ Successfully parsed AI response');
      
      // Handle both array and object responses
      let finalResult;
      if (Array.isArray(parsed)) {
        // AI returned an array directly, wrap it in the expected structure
        console.log('🔄 Converting array response to expected format');
        finalResult = {
          days: parsed.map((day, index) => ({
            date: day.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            day_number: day.dayNumber || day.day_number || (index + 1),
            activities: day.activities || []
          })),
          total_estimated_cost_gbp: 100, // Default fallback
          currency: 'GBP',
          travel_tips: ['Download offline maps', 'Learn basic phrases', 'Carry cash']
        };
      } else if (parsed.days && Array.isArray(parsed.days)) {
        // AI returned the expected object structure
        finalResult = parsed;
      } else {
        throw new Error('Invalid response structure: expected array or object with days property');
      }
      
      // Validate and normalize the final result
      if (!finalResult.days || !Array.isArray(finalResult.days)) {
        throw new Error('Missing or invalid days array in response');
      }
      
      // Ensure each day has the required structure
      finalResult.days = finalResult.days.map((day, index) => {
        // Calculate proper date based on trip start date
        const dayDate = new Date(tripData.startDate);
        dayDate.setDate(dayDate.getDate() + index);
        
        return {
          date: day.date || dayDate.toISOString().split('T')[0],
          day_number: day.day_number || day.dayNumber || (index + 1),
          activities: (day.activities || []).map(activity => ({
            id: activity.id || `day${index + 1}_activity_${Math.random().toString(36).substr(2, 9)}`,
            time: activity.time || '09:00',
            title: activity.title || 'Local Experience',
            description: activity.description || 'Explore the local area and culture.',
            location: activity.location || tripData.destination,
            type: activity.type || 'morning',
            confidence: activity.confidence || 85,
            estimated_cost_gbp: activity.estimated_cost_gbp || 20,
            duration_hours: activity.duration_hours || 2,
            booking_required: activity.booking_required || false,
            local_tip: activity.local_tip || 'Ask locals for recommendations'
          }))
        };
      });
      
      // Ensure required top-level fields
      finalResult.total_estimated_cost_gbp = finalResult.total_estimated_cost_gbp || 
        finalResult.days.reduce((sum, day) => 
          sum + day.activities.reduce((daySum, activity) => daySum + (activity.estimated_cost_gbp || 0), 0), 0
        );
      finalResult.currency = finalResult.currency || 'GBP';
      finalResult.travel_tips = finalResult.travel_tips || [
        'Download offline maps before exploring',
        'Learn basic local phrases',
        'Carry cash for small vendors'
      ];
      
      console.log('✅ Final result validated and normalized');
      return finalResult;
      
    } catch (repairError) {
      console.error('💥 JSON repair failed:', repairError);
      console.error('Raw text that failed:', ollamaData.response);
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Request timed out - Ollama server may be busy');
    }
    
    throw new Error(`Ollama generation failed: ${error.message}`);
  }
}

function generateSampleItineraryWithRealPlaces(tripData: any, tripDuration: number, realPlaces: any[]) {
  console.log('🏗️ Building sample itinerary with', realPlaces.length, 'real places for', tripDuration, 'days');
  const days = [];
  
  // Safely parse the start date
  let startDate;
  try {
    startDate = new Date(tripData.startDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }
  } catch (error) {
    console.warn('⚠️ Invalid start date, using current date:', tripData.startDate);
    startDate = new Date();
  }
  
  // Distribute real places across days
  const placesPerDay = Math.max(1, Math.ceil(realPlaces.length / tripDuration));
  
  for (let i = 0; i < tripDuration; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    if (isNaN(currentDate.getTime())) {
      console.error('❌ Invalid date generated for day', i + 1);
      continue;
    }
    
    const dayPlaces = realPlaces.slice(i * placesPerDay, (i + 1) * placesPerDay);
    const activities = [];
    
    // Add morning activity (real place if available)
    if (dayPlaces.length > 0) {
      const place = dayPlaces[0];
      activities.push({
        id: `day${i + 1}_real_${place.id}`,
        time: '09:00',
        title: place.name,
        description: place.description,
        location: place.location,
        type: 'morning',
        confidence: Math.floor(place.rating * 20), // Convert 5-star to 100-point scale
        estimated_cost_gbp: place.estimated_cost_gbp,
        duration_hours: place.duration_hours,
        booking_required: place.booking_required,
        local_tip: `Highly rated local spot with ${place.rating}/5 stars`,
      });
    } else {
      activities.push({
        id: `day${i + 1}_activity1`,
        time: '09:00',
        title: `Local Breakfast Experience - Day ${i + 1}`,
        description: `Start your ${tripData.destination} adventure with authentic local breakfast at a neighbourhood café.`,
        location: 'Local Café District',
        type: 'morning',
        confidence: 90,
        estimated_cost_gbp: 15,
        duration_hours: 1,
        booking_required: false,
        local_tip: 'Arrive early to avoid crowds and get the freshest pastries',
      });
    }
    
    // Add afternoon activity (real place if available)
    if (dayPlaces.length > 1) {
      const place = dayPlaces[1];
      activities.push({
        id: `day${i + 1}_real_${place.id}`,
        time: '14:00',
        title: place.name,
        description: place.description,
        location: place.location,
        type: 'afternoon',
        confidence: Math.floor(place.rating * 20),
        estimated_cost_gbp: place.estimated_cost_gbp,
        duration_hours: place.duration_hours,
        booking_required: place.booking_required,
        local_tip: `Popular local destination with ${place.rating}/5 stars`,
      });
    } else {
      activities.push({
        id: `day${i + 1}_activity2`,
        time: '14:00',
        title: `Cultural Walking Tour - Day ${i + 1}`,
        description: `Explore the historic heart of ${tripData.destination} with a guided walking tour.`,
        location: 'Historic Centre',
        type: 'afternoon',
        confidence: 85,
        estimated_cost_gbp: 25,
        duration_hours: 2.5,
        booking_required: true,
        local_tip: 'Book online for better prices and guaranteed spots',
      });
    }
    
    // Add evening activity for variety
    if (i % 2 === 0 || tripDuration > 3) { // Add evening activities on alternating days or longer trips
      activities.push({
        id: `day${i + 1}_activity3`,
        time: '19:00',
        title: `Evening Entertainment - Day ${i + 1}`,
        description: 'Experience the local nightlife and entertainment scene.',
        location: 'Entertainment Quarter',
        type: 'evening',
        confidence: 92,
        estimated_cost_gbp: 40,
        duration_hours: 3,
        booking_required: false,
        local_tip: 'Check local event listings for special performances',
      });
    }
    
    days.push({
      date: currentDate.toISOString().split('T')[0],
      day_number: i + 1,
      activities,
    });
  }

  const totalCost = days.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, activity) => daySum + (activity.estimated_cost_gbp || 0), 0);
  }, 0);

  const itinerary = {
    days,
    total_estimated_cost_gbp: totalCost,
    currency: 'GBP',
    travel_tips: [
      'Download offline maps before exploring',
      'Learn basic local phrases for better interactions',
      'Carry cash for small vendors and tips',
      'Book popular restaurants and attractions in advance',
      'Check local customs and dress codes',
      'Keep copies of important documents',
    ],
    local_phrases: [
      { english: 'Hello', local: 'Hola', pronunciation: 'OH-lah' },
      { english: 'Thank you', local: 'Gracias', pronunciation: 'GRAH-see-ahs' },
      { english: 'Excuse me', local: 'Perdón', pronunciation: 'per-DOHN' },
      { english: 'How much?', local: '¿Cuánto cuesta?', pronunciation: 'KWAN-toh KWEH-stah' },
    ],
  };

  console.log('✅ Sample itinerary built successfully with', itinerary.days.length, 'days');
  return itinerary;
}

function generateSampleItinerary(tripData: any, tripDuration: number) {
  console.log('🏗️ Building basic sample itinerary for', tripDuration, 'days');
  const days = [];
  
  // Safely parse the start date
  let startDate;
  try {
    startDate = new Date(tripData.startDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }
  } catch (error) {
    console.warn('⚠️ Invalid start date, using current date:', tripData.startDate);
    startDate = new Date();
  }
  
  for (let i = 0; i < tripDuration; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    if (isNaN(currentDate.getTime())) {
      console.error('❌ Invalid date generated for day', i + 1);
      continue;
    }
    
    const activities = [
      {
        id: `day${i + 1}_activity1`,
        time: '09:00',
        title: `Local Breakfast Experience - Day ${i + 1}`,
        description: `Start your ${tripData.destination} adventure with authentic local breakfast at a neighbourhood café. Experience the morning culture and fuel up for the day ahead.`,
        location: 'Local Café District',
        type: 'morning',
        confidence: 90,
        estimated_cost_gbp: 15,
        duration_hours: 1,
        booking_required: false,
        local_tip: 'Arrive early to avoid crowds and get the freshest pastries',
      },
      {
        id: `day${i + 1}_activity2`,
        time: '14:00',
        title: `Cultural Walking Tour - Day ${i + 1}`,
        description: `Explore the historic heart of ${tripData.destination} with a guided walking tour. Perfect for ${tripData.group || 'travellers'} interested in ${tripData.interests?.join(' and ') || 'sightseeing'}.`,
        location: 'Historic Centre',
        type: 'afternoon',
        confidence: 85,
        estimated_cost_gbp: 25,
        duration_hours: 2.5,
        booking_required: true,
        local_tip: 'Book online for better prices and guaranteed spots',
      },
    ];

    // Add evening activity for longer trips or alternating days
    if (tripDuration > 2 && (i % 2 === 0 || tripDuration > 5)) {
      activities.push({
        id: `day${i + 1}_activity3`,
        time: '19:00',
        title: `Evening Entertainment - Day ${i + 1}`,
        description: 'Experience the local nightlife and entertainment scene.',
        location: 'Entertainment Quarter',
        type: 'evening',
        confidence: 92,
        estimated_cost_gbp: 40,
        duration_hours: 3,
        booking_required: false,
        local_tip: 'Check local event listings for special performances',
      });
    }
    
    days.push({
      date: currentDate.toISOString().split('T')[0],
      day_number: i + 1,
      activities,
    });
  }

  const totalCost = days.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, activity) => daySum + (activity.estimated_cost_gbp || 0), 0);
  }, 0);

  const itinerary = {
    days,
    total_estimated_cost_gbp: totalCost,
    currency: 'GBP',
    travel_tips: [
      'Download offline maps before exploring',
      'Learn basic local phrases for better interactions',
      'Carry cash for small vendors and tips',
      'Book popular restaurants and attractions in advance',
      'Check local customs and dress codes',
      'Keep copies of important documents',
    ],
    local_phrases: [
      { english: 'Hello', local: 'Hello', pronunciation: 'heh-LOH' },
      { english: 'Thank you', local: 'Thank you', pronunciation: 'THANK you' },
      { english: 'Excuse me', local: 'Excuse me', pronunciation: 'ek-SKYOOZ me' },
      { english: 'How much?', local: 'How much?', pronunciation: 'HOW much' },
    ],
  };

  console.log('✅ Basic sample itinerary built successfully with', itinerary.days.length, 'days');
  return itinerary;
}
