export async function POST(request: Request) {
  try {
    const { activityId, currentActivity, userPreferences } = await request.json();
    
    if (!activityId) {
      return Response.json({
        success: false,
        error: 'Activity ID is required',
      }, { status: 400 });
    }

    // Construct prompt for alternative activity suggestion
    const prompt = `Generate an alternative activity to replace the current one:

CURRENT ACTIVITY: ${currentActivity?.title || 'Unknown activity'}
CURRENT DESCRIPTION: ${currentActivity?.description || 'No description'}
CURRENT TIME SLOT: ${currentActivity?.type || 'any time'}
CURRENT LOCATION: ${currentActivity?.location || 'Same area'}
CURRENT BUDGET: £${currentActivity?.estimated_cost_gbp || 30}

USER PREFERENCES:
- Destination: ${userPreferences?.destination || 'Current location'}
- Group Type: ${userPreferences?.group || 'general'}
- Interests: ${userPreferences?.interests?.join(', ') || 'general sightseeing'}
- Budget Range: ${userPreferences?.budget || 'mid-range'}

Please suggest a completely different but equally engaging alternative that:
1. Fits the same time slot and general budget range
2. Matches the user's interests and group type
3. Offers a different type of experience
4. Is located in the same general area or easily accessible

Respond in JSON format:
{
  "title": "Alternative Activity Name",
  "description": "Detailed description explaining why this is a great alternative",
  "location": "Specific location or area",
  "estimated_cost_gbp": 25,
  "duration_hours": 2,
  "confidence": 87,
  "booking_required": false,
  "local_tip": "Helpful insider advice",
  "why_better": "Brief explanation of what makes this alternative special"
}`;

    // Get Ollama configuration - FIXED
    const ollamaUrl = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2:3b';

    try {
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.8,
            top_p: 0.9,
            num_predict: 1000,
          },
        }),
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        
        try {
          // Clean and parse the response
          let jsonResponse = ollamaData.response.trim();
          
          // Extract JSON content
          const jsonMatch = jsonResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                           jsonResponse.match(/(\{[\s\S]*\})/);
          
          if (jsonMatch) {
            jsonResponse = jsonMatch[1];
          }
          
          const newActivity = JSON.parse(jsonResponse);
          
          return Response.json({
            success: true,
            newActivity: {
              id: `${activityId}_swap_${Date.now()}`,
              time: currentActivity?.time || '10:00',
              type: currentActivity?.type || 'morning',
              ...newActivity,
            },
            ai_powered: true,
          });
        } catch (parseError) {
          console.error('Error parsing swap response:', parseError);
          // Fall through to sample alternatives
        }
      }
    } catch (ollamaError) {
      console.error('Ollama error:', ollamaError);
      // Fall through to sample alternatives
    }

    // Fallback sample alternatives based on activity type and preferences
    const sampleAlternatives = [
      {
        title: 'Hidden Local Market Discovery',
        description: 'Explore a vibrant neighbourhood market where locals shop for fresh produce, artisanal goods, and street food. Perfect for experiencing authentic local culture.',
        location: 'Local Market District',
        estimated_cost_gbp: 20,
        duration_hours: 2,
        confidence: 87,
        booking_required: false,
        local_tip: 'Visit in the morning for the freshest selections and best atmosphere',
        why_better: 'More authentic and interactive than typical tourist attractions',
      },
      {
        title: 'Rooftop Café & City Views',
        description: 'Enjoy panoramic city views while sipping locally roasted coffee at this hidden gem rooftop café. Great for photos and relaxation.',
        location: 'Historic Quarter Rooftop',
        estimated_cost_gbp: 18,
        duration_hours: 1.5,
        confidence: 92,
        booking_required: false,
        local_tip: 'Best views are during golden hour, arrive 30 minutes before sunset',
        why_better: 'Combines relaxation with stunning views and great photo opportunities',
      },
      {
        title: 'Street Art & Graffiti Tour',
        description: 'Discover colourful murals and street art in the creative quarter with insights into local artists and cultural movements.',
        location: 'Arts District',
        estimated_cost_gbp: 15,
        duration_hours: 2,
        confidence: 85,
        booking_required: false,
        local_tip: 'Bring a camera and comfortable walking shoes',
        why_better: 'Unique cultural experience showcasing contemporary local creativity',
      },
      {
        title: 'Local Cooking Workshop',
        description: 'Learn to prepare traditional dishes with a local chef in an intimate setting. Take home new skills and recipes.',
        location: 'Community Kitchen',
        estimated_cost_gbp: 45,
        duration_hours: 3,
        confidence: 94,
        booking_required: true,
        local_tip: 'Book at least 24 hours in advance, dietary restrictions can be accommodated',
        why_better: 'Hands-on cultural experience with practical skills you can use at home',
      },
      {
        title: 'Vintage Shopping Adventure',
        description: 'Hunt for unique treasures in local vintage shops and second-hand boutiques. Find one-of-a-kind souvenirs and fashion pieces.',
        location: 'Vintage Quarter',
        estimated_cost_gbp: 25,
        duration_hours: 2.5,
        confidence: 78,
        booking_required: false,
        local_tip: 'Negotiate prices politely and check items carefully before buying',
        why_better: 'Sustainable shopping with unique finds you won\'t get anywhere else',
      },
    ];

    // Select a random alternative
    const randomAlternative = sampleAlternatives[Math.floor(Math.random() * sampleAlternatives.length)];

    return Response.json({
      success: true,
      newActivity: {
        id: `${activityId}_swap_${Date.now()}`,
        time: currentActivity?.time || '10:00',
        type: currentActivity?.type || 'morning',
        ...randomAlternative,
      },
      ai_powered: false,
    });

  } catch (error) {
    console.error('Error swapping activity:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to generate alternative activity',
    }, { status: 500 });
  }
}
