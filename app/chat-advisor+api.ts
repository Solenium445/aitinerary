import { jsonrepair } from 'jsonrepair';

export async function POST(request: Request) {
  try {
    const { message, conversationHistory, userProfile } = await request.json();
    
    if (!message || !message.trim()) {
      return Response.json({
        success: false,
        error: 'Message is required',
      }, { status: 400 });
    }

    // Build context from conversation history
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.isUser ? 'User' : 'Advisor'}: ${msg.text}`)
      .join('\n');

    // Construct improved prompt for better responses
    const prompt = `You are a helpful travel advisor. Answer this travel question with specific, useful information about ${message}.

For the question "${message}", provide a helpful response.

Respond with valid JSON only:
{
  "response": "Write your actual helpful answer here about the travel question",
  "suggestions": ["Ask about transport", "Local attractions", "Best time to visit"]
}

ONLY JSON. No examples. No markdown. Answer the actual question about ${message}.`;

    // For distance/travel questions, provide specific examples
    const isDistanceQuestion = message.toLowerCase().includes('how far') || 
                              message.toLowerCase().includes('distance') ||
                              message.toLowerCase().includes('drive') ||
                              message.toLowerCase().includes('travel time');
    
    // Add specific context for distance questions
    let enhancedPrompt = prompt;
    if (isDistanceQuestion) {
      enhancedPrompt = `You are a helpful travel advisor. The user asks: "${message}"

Respond with valid JSON only:
{
  "response": "Provide specific distance, travel time, and transport options",
  "suggestions": ["Transport options?", "Best route?", "Travel costs?"]
}

For Weybridge to Heathrow: about 15 miles, 30-45 minutes by car, or 1 hour by public transport.
ONLY JSON response.`;
    }

    // Get Ollama configuration
    const ollamaUrl = process.env.EXPO_PUBLIC_OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.EXPO_PUBLIC_OLLAMA_MODEL || 'llama3.2:3b';

    console.log('🤖 Attempting to connect to:', ollamaUrl);
    console.log('🎯 Using model:', ollamaModel);
    console.log('💬 User message:', message);

    try {
      const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
        body: JSON.stringify({
          model: ollamaModel,
          prompt: enhancedPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 250,
            stop: ['```', '\n\n\n', 'Human:', 'User:', 'Assistant:', 'Question:', 'Response:', 'Suggestions:'],
          },
        }),
      });

      console.log('📡 Ollama response status:', ollamaResponse.status);

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        console.log('📥 Raw Ollama response:', ollamaData.response?.substring(0, 300) + '...');
        
        try {
          let rawText = ollamaData.response.trim();
          
          console.log('🔍 Raw response preview:', rawText.substring(0, 200) + '...');
          
          // More aggressive cleaning for malformed responses
          rawText = rawText.replace(/```json/g, '').replace(/```/g, '');
          rawText = rawText.replace(/^\[|\]$/g, '').trim(); // Remove array brackets
          rawText = rawText.replace(/^Response:\s*/gmi, '').trim();
          rawText = rawText.replace(/Suggestions:\s*$/gmi, '').trim();
          rawText = rawText.replace(/^\d+\.\s*/gm, '').trim();
          rawText = rawText.replace(/^Here's.*?:\s*/gi, '').trim();
          rawText = rawText.replace(/^Answer:\s*/gi, '').trim();
          
          // Handle cases where response contains example text or is malformed
          if (rawText.includes('Your detailed helpful response here') || 
              rawText.includes('Related question 1') ||
              rawText.includes('Related question 2') ||
              !rawText.includes('"response"') ||
              rawText.length < 20) {
            console.log('⚠️ Found example text in response, using fallback');
            throw new Error('Response contains example text');
          }
          
          // Clean up malformed suggestions that include "Answer:" text
          rawText = rawText.replace(/"Related question \d+: ([^"]*?) Answer: [^"]*"/g, '"$1"');
          rawText = rawText.replace(/"([^"]*?) Answer: [^"]*"/g, '"$1"');
          
          // Find JSON structure - look for complete object
          let jsonMatch = rawText.match(/(\{[\s\S]*?\})/);
          if (jsonMatch) {
            rawText = jsonMatch[1];
          }
          
          // Fix incomplete JSON by closing brackets if needed
          let openBraces = (rawText.match(/\{/g) || []).length;
          let closeBraces = (rawText.match(/\}/g) || []).length;
          while (openBraces > closeBraces) {
            rawText += '}';
            closeBraces++;
          }
          
          // Fix incomplete arrays
          let openBrackets = (rawText.match(/\[/g) || []).length;
          let closeBrackets = (rawText.match(/\]/g) || []).length;
          while (openBrackets > closeBrackets) {
            rawText += ']';
            closeBrackets++;
          }
          
          console.log('🔧 Cleaned JSON for parsing:', rawText.substring(0, 300) + '...');
          
          // Try to parse directly first
          let advisorResponse;
          try {
            advisorResponse = JSON.parse(rawText);
            console.log('✅ Direct JSON parse successful');
          } catch (directParseError) {
            console.log('🔧 Direct parse failed, attempting repair...');
            const repairedJson = jsonrepair(rawText);
            console.log('🧹 Repaired JSON:', repairedJson.substring(0, 200) + '...');
            advisorResponse = JSON.parse(repairedJson);
            console.log('✅ Repaired JSON parse successful');
          }
          
          console.log('✅ Successfully parsed AI response structure:', {
            hasResponse: !!advisorResponse.response,
            responseLength: advisorResponse.response?.length || 0,
            suggestionsCount: advisorResponse.suggestions?.length || 0
          });
          
          // Validate the response has the required structure
          if (!advisorResponse || typeof advisorResponse !== 'object') {
            throw new Error('Response is not a valid object');
          }
          
          // Ensure we have a response field
          if (!advisorResponse.response || typeof advisorResponse.response !== 'string') {
            throw new Error('Missing or invalid response field');
          }
          
          // Ensure we have suggestions array
          if (!Array.isArray(advisorResponse.suggestions)) {
            console.log('⚠️ Invalid suggestions, creating default ones');
            advisorResponse.suggestions = ['Tell me more?', 'Local tips?', 'Best time to visit?'];
          }
          
          // Clean up suggestions
          advisorResponse.suggestions = advisorResponse.suggestions
            .filter(s => typeof s === 'string' && s.length > 0 && s.length < 50)
            .map(s => s.replace(/^Related question \d+:\s*/i, '').replace(/\s*Answer:.*$/i, '').trim())
            .filter(s => s.length > 0)
            .slice(0, 4);
          
          // Add default suggestions if none are valid
          if (advisorResponse.suggestions.length === 0) {
            advisorResponse.suggestions = ['Tell me more?', 'Local tips?', 'Best time to visit?'];
          }
          
          // Validate response quality
          if (advisorResponse.response.length < 10) {
            throw new Error('Response too short');
          }
          
          // Check if response is still the example text
          if (advisorResponse.response === 'Your detailed helpful response here') {
            throw new Error('Response contains exact example text');
          }
          
          // Generate contextual suggestions if empty
          if (advisorResponse.suggestions.length === 0) {
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('nerja') || lowerMessage.includes('spain')) {
              advisorResponse.suggestions = ['What to do in Nerja?', 'Best beaches?', 'Local restaurants?'];
            } else if (lowerMessage.includes('skiing') || lowerMessage.includes('snow')) {
              advisorResponse.suggestions = ['Winter activities?', 'Mountain resorts?', 'Equipment rental?'];
            } else if (lowerMessage.includes('december') || lowerMessage.includes('winter')) {
              advisorResponse.suggestions = ['Winter weather?', 'What to pack?', 'Seasonal events?'];
            } else {
              advisorResponse.suggestions = ['Local tips?', 'Best time to visit?', 'Cultural advice?'];
            }
          }
          
          console.log('🎉 AI response successfully processed and validated');
          return Response.json({
            success: true,
            response: advisorResponse.response,
            suggestions: advisorResponse.suggestions,
            ai_powered: true,
          });
          
        } catch (parseError) {
          console.error('💥 JSON parsing failed:', parseError.message);
          console.error('🔍 Full raw response that failed to parse:');
          console.error(ollamaData.response);
          // Fall through to sample responses
        }
      } else {
        const errorText = await ollamaResponse.text();
        console.error('❌ Ollama HTTP error:', ollamaResponse.status, errorText);
      }
    } catch (ollamaError) {
      console.error('💥 Ollama connection error:', ollamaError.message);
      // Fall through to sample responses
    }

    // Enhanced fallback responses based on message content
    console.log('🔄 Using fallback response system');
    const lowerMessage = message.toLowerCase();
    let response = '';
    let suggestions: string[] = [];

    if (lowerMessage.includes('bulgaria')) {
      if (lowerMessage.includes('skiing') || lowerMessage.includes('ski')) {
        response = 'Nerja is a beautiful coastal town in southern Spain, so there\'s no skiing directly nearby. The nearest ski resort is Sierra Nevada near Granada, about 1.5 hours drive (120km) inland. For December in Nerja, you\'ll enjoy mild temperatures (15-18°C) perfect for beach walks, exploring the famous Nerja Caves, and coastal hiking instead!';
        suggestions = ['What to do in Nerja?', 'December weather?', 'Day trips from Nerja?', 'Nerja Caves info?'];
      } else if (lowerMessage.includes('malaga') && (lowerMessage.includes('far') || lowerMessage.includes('distance'))) {
        response = 'Nerja to Malaga is about 52km (32 miles) and takes approximately 1 hour by car via the A-7 coastal highway. By bus, it takes about 1.5 hours with ALSA buses running regularly. The drive offers beautiful coastal views along the Costa del Sol!';
        suggestions = ['Bus schedules?', 'Car rental tips?', 'Coastal route stops?', 'Malaga attractions?'];
      } else {
        response = 'Nerja is a charming coastal town on Spain\'s Costa del Sol! Famous for its stunning beaches, the spectacular Nerja Caves, and the Balcón de Europa viewpoint. December is perfect for visiting with mild weather (15-18°C) and fewer crowds.';
        suggestions = ['Best beaches in Nerja?', 'Nerja Caves tour?', 'December activities?', 'Where to eat?'];
      }
    } else if (lowerMessage.includes('malaga')) {
      response = 'Bulgaria is a fascinating Balkan country with rich history, beautiful mountains, and Black Sea coastline! Sofia is the vibrant capital, while Plovdiv offers ancient Roman ruins. The country is known for rose oil, delicious cuisine like banitsa and shopska salad, and warm hospitality. It\'s very affordable for travelers and offers great value.';
      suggestions = ['What to see in Sofia?', 'Bulgarian food tips?', 'Best time to visit?', 'Cultural customs?'];
    } else if (lowerMessage.includes('sofia')) {
      response = 'Sofia, Bulgaria\'s capital, is a blend of ancient and modern! Visit Alexander Nevsky Cathedral, walk down Vitosha Boulevard for shopping, explore the Roman ruins of Serdica, and take a day trip to nearby Vitosha Mountain. The city has excellent museums, vibrant nightlife, and affordable dining.';
      suggestions = ['Day trips from Sofia?', 'Sofia nightlife?', 'Best restaurants?', 'Transportation?'];
    } else if (lowerMessage.includes('plovdiv')) {
      response = 'Plovdiv is Bulgaria\'s cultural capital and one of Europe\'s oldest cities! The Old Town features beautiful 19th-century houses, the ancient Roman Theatre still hosts performances, and the city was European Capital of Culture in 2019. It\'s perfect for history lovers and has a thriving arts scene.';
      suggestions = ['Old Town highlights?', 'Roman Theatre events?', 'Museums to visit?', 'Where to stay?'];
    } else if (lowerMessage.includes('weather') || lowerMessage.includes('climate')) {
      response = 'Check the local weather forecast before you go! Pack layers as weather can change throughout the day. Don\'t forget an umbrella or light rain jacket, and comfortable walking shoes for any weather.';
      suggestions = ['What should I pack?', 'Best time to visit?', 'Seasonal activities?'];
    } else if (lowerMessage.includes('food') || lowerMessage.includes('restaurant') || lowerMessage.includes('eat')) {
      response = 'For authentic local cuisine, avoid tourist areas and look for places where locals eat. Try street food markets, ask your accommodation for recommendations, and don\'t be afraid to point at what looks good!';
      suggestions = ['Dietary restrictions?', 'Food safety tips?', 'Local specialties?', 'Budget eating?'];
    } else if (lowerMessage.includes('transport') || lowerMessage.includes('getting around') || lowerMessage.includes('travel')) {
      response = 'Download local transport apps and consider day passes for public transport. Walking is often the best way to explore city centers. For longer distances, compare prices between taxis, ride-sharing, and public transport.';
      suggestions = ['Airport transfers?', 'Transport cards?', 'Walking routes?'];
    } else if (lowerMessage.includes('safety') || lowerMessage.includes('safe')) {
      response = 'Keep copies of important documents, stay aware of your surroundings, and trust your instincts. Research common scams in the area and keep emergency contacts handy. Most destinations are very safe for tourists!';
      suggestions = ['Emergency contacts?', 'Common scams?', 'Safe areas?'];
    } else if (lowerMessage.includes('culture') || lowerMessage.includes('customs') || lowerMessage.includes('etiquette')) {
      response = 'Research local customs before you go - things like tipping, dress codes, and greeting styles vary by culture. Learning a few basic phrases in the local language goes a long way and shows respect.';
      suggestions = ['Basic phrases?', 'Dress codes?', 'Tipping guide?'];
    } else if (lowerMessage.includes('hidden') || lowerMessage.includes('gems') || lowerMessage.includes('secret')) {
      response = 'Ask locals for their favorite spots! Check local blogs and social media for recent recommendations. Often the best experiences are found by wandering off the main tourist paths and exploring neighborhoods.';
      suggestions = ['Local neighborhoods?', 'Off-beaten path?', 'Local events?'];
    } else if (lowerMessage.includes('pack') || lowerMessage.includes('luggage') || lowerMessage.includes('bring')) {
      response = 'Pack light and bring versatile clothing that can be layered. Don\'t forget essentials like a portable charger, universal adapter, and any medications. Check airline baggage restrictions before you go.';
      suggestions = ['Carry-on essentials?', 'Electronics?', 'Clothing tips?'];
    } else if (lowerMessage.includes('money') || lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      response = 'Notify your bank about travel dates to avoid card blocks. Carry some local cash for small vendors and tips. Compare exchange rates and consider using ATMs for better rates than currency exchange counters.';
      suggestions = ['ATM locations?', 'Tipping customs?', 'Budget breakdown?'];
    } else {
      response = 'I\'m here to help with any travel questions! Whether you need advice on local customs, food recommendations, transportation, or hidden gems, just ask. What specific aspect of your trip would you like to know more about?';
      suggestions = ['Food recommendations?', 'Transportation?', 'Cultural tips?', 'Safety advice?'];
    }

    return Response.json({
      success: true,
      response,
      suggestions,
      ai_powered: false,
    });

  } catch (error) {
    console.error('Error in chat advisor:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to process your message',
    }, { status: 500 });
  }
}
