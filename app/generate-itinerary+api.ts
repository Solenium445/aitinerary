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
  
  // Use the new normalization function which handles extension internally
  return normalizeAIItinerary(aiItinerary, tripData, fullDuration);
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
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';
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
  // Only proceed if we have real places from Google
  if (realPlaces.length === 0) {
    console.log('❌ No real places available, skipping AI generation');
    throw new Error('No verified Google Places data available for AI generation');
  }

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

    // Create a list of verified places for the AI to use
    const placesContext = realPlaces.map(place => 
      `- ${place.name} (${place.location}) - ${place.category} - £${place.estimated_cost_gbp} - ${place.duration_hours}h - Rating: ${place.rating}/5`
    ).join('\n');

    // Enhanced prompt that strictly uses only Google Places data
    const prompt = `Create a detailed ${maxDuration}-day travel itinerary for ${tripData.destination} using ONLY the verified places listed below.

VERIFIED PLACES FROM GOOGLE PLACES API:
${placesContext}

REQUIREMENTS:
- Use ONLY places from the verified list above
- Use the EXACT names, locations, and details provided
- Do NOT invent or modify any place names or addresses
- Use the provided ratings, costs, and duration data
- Keep descriptions minimal and factual
- If you need more activities than available places, repeat places at different times

User preferences:
- Budget: ${tripData.budget}
- Group: ${tripData.group}
- Interests: ${tripData.interests?.join(', ') || 'general'}
- Accessibility needs: ${tripData.accessibility?.join(', ') || 'none'}

Respond with ONLY valid JSON in this exact format:
{
  "days": [
    {
      "date": "${tripData.startDate}",
      "day_number": 1,
      "activities": [
        {
          "id": "day1_activity1",
          "time": "09:00",
          "title": "[EXACT NAME FROM VERIFIED LIST]",
          "description": "[MINIMAL FACTUAL DESCRIPTION]",
          "location": "[EXACT LOCATION FROM VERIFIED LIST]",
          "type": "morning",
          "confidence": 92,
          "estimated_cost_gbp": [USE PROVIDED COST],
          "duration_hours": [USE PROVIDED DURATION],
          "booking_required": [USE PROVIDED BOOKING STATUS],
          "local_tip": "This popular spot is well-rated by visitors",
          "google_place_id": "[PLACE ID IF AVAILABLE]",
          "verified": true
        }
      ]
    }
  ],
  "total_estimated_cost_gbp": 200,
  "currency": "GBP",
  "travel_tips": ["Book popular venues in advance", "Check opening hours before visiting"],
  "verified_places_used": ${realPlaces.length}
}

Generate exactly ${maxDuration} days using ONLY the verified places listed above.`;

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
          temperature: 0.3,
          top_p: 0.8,
          num_predict: 2000, // Increased for detailed responses
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
      
      // Normalize and validate the AI response with robust error handling
      const normalizedResult = normalizeAIItinerary(parsed, tripData, maxDuration);
      console.log('✅ AI response normalized and validated');
      console.log('📊 Final AI result:', JSON.stringify(normalizedResult, null, 2));
      return normalizedResult;
      
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

// Comprehensive AI response normalization function
function normalizeAIItinerary(parsed: any, tripData: any, targetDuration: number) {
  console.log('🔧 Starting AI itinerary normalization...');
  console.log('📊 Input data:', { 
    hasDays: !!parsed.days, 
    daysLength: parsed.days?.length || 0, 
    targetDuration,
    startDate: tripData.startDate 
  });

  // Handle both array and object responses
  let rawDays = [];
  if (Array.isArray(parsed)) {
    console.log('🔄 Converting array response to days format');
    rawDays = parsed;
  } else if (parsed.days && Array.isArray(parsed.days)) {
    console.log('✅ Using days array from object response');
    rawDays = parsed.days;
  } else {
    console.warn('⚠️ Invalid response structure, creating empty days array');
    rawDays = [];
  }

  console.log(`📋 Processing ${rawDays.length} raw days for target of ${targetDuration} days`);

  // Step 1: Normalize existing days with proper structure and validation
  const normalizedDays = rawDays.map((day, index) => {
    const dayDate = new Date(tripData.startDate);
    dayDate.setDate(dayDate.getDate() + index);
    
    const normalizedDay = {
      date: day.date || dayDate.toISOString().split('T')[0],
      day_number: index + 1, // Force sequential numbering
      activities: (day.activities || []).map((activity, actIndex) => ({
        id: activity.id || `day${index + 1}_activity${actIndex + 1}_${Math.random().toString(36).substr(2, 6)}`,
        time: activity.time || (actIndex === 0 ? '09:00' : actIndex === 1 ? '14:00' : '19:00'),
        title: activity.title || `Local Experience ${actIndex + 1}`,
        description: activity.description || `Explore the local culture and attractions of ${tripData.destination}.`,
        location: activity.location || `${tripData.destination} Center`,
        type: activity.type || (actIndex === 0 ? 'morning' : actIndex === 1 ? 'afternoon' : 'evening'),
        confidence: Math.max(70, Math.min(100, activity.confidence || 85)),
        estimated_cost_gbp: Math.max(0, activity.estimated_cost_gbp || activity.price || 20),
        duration_hours: Math.max(0.5, Math.min(8, activity.duration_hours || activity.duration || 2)),
        booking_required: !!activity.booking_required,
        local_tip: activity.local_tip || activity.tip || 'Ask locals for their recommendations',
        rating: Math.max(3.0, Math.min(5.0, activity.rating || 4.2))
      }))
    };
    
    console.log(`✅ Normalized day ${index + 1}: ${normalizedDay.activities.length} activities`);
    return normalizedDay;
  });

  console.log(`📊 Normalized ${normalizedDays.length} days, need ${targetDuration} total`);

  // Step 2: Extend to target duration if needed
  const finalDays = [...normalizedDays];
  
  if (finalDays.length < targetDuration) {
    console.log(`🔄 Extending from ${finalDays.length} to ${targetDuration} days`);
    
    for (let i = finalDays.length; i < targetDuration; i++) {
      const dayDate = new Date(tripData.startDate);
      dayDate.setDate(dayDate.getDate() + i);
      
      // Clone and adapt from earlier days (cycle through available days)
      const sourceDay = normalizedDays[i % normalizedDays.length] || null;
      
      let newActivities = [];
      
      if (sourceDay && sourceDay.activities.length > 0) {
        console.log(`🔄 Cloning day ${(i % normalizedDays.length) + 1} for day ${i + 1}`);
        
        // Clone activities with variations
        newActivities = sourceDay.activities.map((activity, actIndex) => ({
          id: `day${i + 1}_cloned_activity${actIndex + 1}_${Math.random().toString(36).substr(2, 6)}`,
          time: activity.time,
          title: `${activity.title} - Day ${i + 1} Variation`,
          description: `${activity.description} Continue exploring with a different perspective on day ${i + 1}.`,
          location: activity.location.replace(/Day \d+/g, `Day ${i + 1}`),
          type: activity.type,
          confidence: Math.max(75, activity.confidence - 5), // Slightly lower confidence for cloned
          estimated_cost_gbp: activity.estimated_cost_gbp + Math.floor(Math.random() * 10 - 5), // Small cost variation
          duration_hours: activity.duration_hours,
          booking_required: activity.booking_required,
          local_tip: `${activity.local_tip} Perfect for day ${i + 1} of your journey.`,
          rating: Math.max(3.5, activity.rating - 0.2) // Slightly lower rating for variations
        }));
      } else {
        console.log(`🏗️ Creating default activities for day ${i + 1}`);
        
        // Create default activities if no source available
        newActivities = [
          {
            id: `day${i + 1}_default_morning`,
            time: '09:00',
            title: `Morning Discovery - Day ${i + 1}`,
            description: `Start day ${i + 1} with a local breakfast and morning exploration of ${tripData.destination}.`,
            location: `${tripData.destination} Morning District`,
            type: 'morning',
            confidence: 82,
            estimated_cost_gbp: 18,
            duration_hours: 2,
            booking_required: false,
            local_tip: 'Early morning is perfect for avoiding crowds',
            rating: 4.1
          },
          {
            id: `day${i + 1}_default_afternoon`,
            time: '14:00',
            title: `Afternoon Adventure - Day ${i + 1}`,
            description: `Discover new areas of ${tripData.destination} with afternoon activities and local experiences.`,
            location: `${tripData.destination} Cultural Quarter`,
            type: 'afternoon',
            confidence: 88,
            estimated_cost_gbp: 32,
            duration_hours: 3,
            booking_required: true,
            local_tip: 'Book ahead for popular afternoon activities',
            rating: 4.3
          }
        ];
      }
      
      finalDays.push({
        date: dayDate.toISOString().split('T')[0],
        day_number: i + 1,
        activities: newActivities
      });
      
      console.log(`✅ Extended day ${i + 1} with ${newActivities.length} activities`);
    }
  }

  // Step 3: Final validation and sorting
  finalDays.sort((a, b) => a.day_number - b.day_number);
  
  // Step 4: Calculate total cost
  const totalCost = finalDays.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, activity) => 
      daySum + (activity.estimated_cost_gbp || 0), 0);
  }, 0);

  // Step 5: Build final result
  const finalResult = {
    days: finalDays,
    total_estimated_cost_gbp: totalCost,
    currency: 'GBP',
    travel_tips: parsed.travel_tips || [
      'Download offline maps before exploring',
      'Learn basic local phrases for better interactions',
      'Carry cash for small vendors and tips',
      'Book popular restaurants and attractions in advance'
    ],
    local_phrases: parsed.local_phrases || [
      { english: 'Hello', local: 'Hello', pronunciation: 'heh-LOH' },
      { english: 'Thank you', local: 'Thank you', pronunciation: 'THANK you' },
      { english: 'Excuse me', local: 'Excuse me', pronunciation: 'ek-SKYOOZ me' }
    ]
  };

  console.log('🎉 Final normalized itinerary:');
  console.log(`📊 Days: ${finalResult.days.length}`);
  console.log(`💰 Total cost: £${finalResult.total_cost_gbp}`);
  console.log(`📋 Activities per day: ${finalResult.days.map(d => d.activities.length).join(', ')}`);
  console.log('📄 Complete final JSON:', JSON.stringify(finalResult, null, 2));

  return finalResult;
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
    if (i % 2 === 0 || tripDuration > 3) {
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
