export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = url.searchParams.get('destination');
  const category = url.searchParams.get('category') || 'attractions';
  
  if (!destination) {
    return Response.json({
      success: false,
      error: 'Destination is required',
    }, { status: 400 });
  }

  console.log(`🗺️ searchPlaces called with: ${destination} (${category})`);

  try {
    // Always try Google API first
    console.log('🌍 Attempting Google Places API...');
    const realPlaces = await fetchGooglePlaces(destination, category);
    
    if (realPlaces && realPlaces.length > 0) {
      console.log(`✅ Found ${realPlaces.length} real places via Google Places`);
      return Response.json({
        success: true,
        places: realPlaces,
        source: 'google_places',
        destination,
        category,
      });
    }
    
    // Try Wikipedia as fallback
    console.log('📚 Trying Wikipedia fallback...');
    const wikiPlaces = await fetchWikipediaPlaces(destination, category);
    if (wikiPlaces && wikiPlaces.length > 0) {
      console.log(`✅ Found ${wikiPlaces.length} places via Wikipedia`);
      return Response.json({
        success: true,
        places: wikiPlaces,
        source: 'wikipedia',
        destination,
        category,
      });
    }
  } catch (error) {
    console.error('❌ Error fetching real places:', error.message);
  }

  // ALWAYS return curated data as fallback
  console.log('🏛️ Using curated places database as fallback...');
  const curatedPlaces = getCuratedPlaces(destination, category);
  console.log(`🗺️ Found ${curatedPlaces.length} curated places for ${destination}`);
  
  return Response.json({
    success: true,
    places: curatedPlaces,
    source: 'curated',
    destination,
    category,
  });
}

async function fetchGooglePlaces(destination: string, category: string) {
  // Check for API key in environment variables
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  
  console.log('🔑 Environment check:');
  console.log('   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY:', apiKey ? 'SET' : 'NOT SET');
  
  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
    console.log('⚠️ Google API key missing or invalid');
    console.log('💡 To enable Google Places:');
    console.log('   1. Get API key from https://console.cloud.google.com/apis/credentials');
    console.log('   2. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_key to .env file');
    console.log('   3. Restart the dev server');
    return [];
  }
  
  console.log(`🔑 Google API key found (${apiKey.length} chars), searching...`);
  
  try {
    console.log(`🌍 Searching Google Places for: ${destination} (${category})`);
    
    // First, get the place ID for the destination using Text Search
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(destination)}&key=${apiKey}`;
    console.log('🔗 Text search URL:', textSearchUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const textSearchResponse = await fetch(textSearchUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!textSearchResponse.ok) {
      throw new Error(`Google Places Text Search error: ${textSearchResponse.status}`);
    }

    const textSearchData = await textSearchResponse.json();
    console.log(`📍 Text search status: ${textSearchData.status}`);
    console.log(`📍 Text search results: ${textSearchData.results?.length || 0} locations found`);
    
    if (textSearchData.status === 'REQUEST_DENIED') {
      console.error('❌ Google API request denied - check your API key and billing');
      console.error('💡 Make sure Places API is enabled in Google Cloud Console');
      return [];
    }
    
    if (textSearchData.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ Google API quota exceeded');
      return [];
    }
    
    if (!textSearchData.results || textSearchData.results.length === 0) {
      console.log('❌ No location found for destination:', destination);
      return [];
    }

    const location = textSearchData.results[0].geometry.location;
    console.log(`📍 Using coordinates: ${location.lat}, ${location.lng}`);
    
    // Map categories to Google Places types
    const typeMap = {
      'attractions': 'tourist_attraction',
      'restaurants': 'restaurant',
      'culture': 'museum',
      'activities': 'amusement_park',
      'nature': 'park',
      'hotels': 'lodging',
      'shopping': 'shopping_mall',
      'nightlife': 'night_club',
    };

    const placeType = typeMap[category] || 'tourist_attraction';
    console.log(`🔍 Searching for type: ${placeType}`);
    
    // Search for nearby places using Nearby Search
    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=10000&type=${placeType}&key=${apiKey}`;
    console.log('🔗 Nearby search URL:', nearbySearchUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const nearbySearchResponse = await fetch(nearbySearchUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!nearbySearchResponse.ok) {
      throw new Error(`Google Places Nearby Search error: ${nearbySearchResponse.status}`);
    }

    const nearbyData = await nearbySearchResponse.json();
    console.log(`🏢 Nearby search status: ${nearbyData.status}`);
    console.log(`🏢 Nearby search results: ${nearbyData.results?.length || 0} places found`);
    
    if (nearbyData.status === 'REQUEST_DENIED') {
      console.error('❌ Google API request denied for nearby search');
      return [];
    }
    
    if (!nearbyData.results || nearbyData.results.length === 0) {
      console.log('❌ No places found for category:', category);
      return [];
    }

    // Process and format the results
    const places = nearbyData.results.slice(0, 5).map((place: any) => {
      // Get the best photo URL if available
      let photoUrl = getDefaultImage(category);
      if (place.photos && place.photos.length > 0) {
        const photoReference = place.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
      }

      return {
        id: place.place_id,
        name: place.name,
        description: generateDescription(place, category),
        location: place.vicinity || place.formatted_address || destination,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        category: category,
        rating: place.rating || 4.0,
        estimated_cost_gbp: estimateCostFromPriceLevel(place.price_level, category),
        duration_hours: estimateDuration(category),
        booking_required: shouldRequireBooking(place, category),
        website: null,
        image: photoUrl,
        google_place_id: place.place_id,
        price_level: place.price_level,
        user_ratings_total: place.user_ratings_total,
        types: place.types,
      };
    });

    console.log(`✅ Successfully processed ${places.length} Google Places for ${destination} (${category})`);
    return places;

  } catch (error) {
    console.error('❌ Google Places API error:', error.message);
    return [];
  }
}

function generateDescription(place: any, category: string) {
  const name = place.name;
  const rating = place.rating ? `${place.rating}/5 stars` : 'highly rated';
  const types = place.types || [];
  
  if (types.includes('restaurant') || types.includes('food')) {
    return `${name} is a popular dining spot offering delicious local cuisine. With ${rating}, it's a great choice for experiencing authentic flavors and local culinary traditions.`;
  } else if (types.includes('tourist_attraction') || types.includes('museum')) {
    return `${name} is a must-visit attraction that showcases the local culture and history. Rated ${rating}, it offers visitors an enriching and memorable experience.`;
  } else if (types.includes('park') || types.includes('natural_feature')) {
    return `${name} is a beautiful natural space perfect for relaxation and outdoor activities. With ${rating}, it's an ideal spot to enjoy nature and scenic views.`;
  } else if (types.includes('shopping_mall') || types.includes('store')) {
    return `${name} is a popular shopping destination offering a variety of goods and local products. Rated ${rating}, it's perfect for finding unique items and souvenirs.`;
  } else if (types.includes('lodging')) {
    return `${name} provides comfortable accommodation with excellent service. With ${rating}, it's a great base for exploring the local area.`;
  } else {
    return `${name} is a popular local destination that offers visitors an authentic experience. Rated ${rating}, it's well worth a visit during your stay.`;
  }
}

function estimateCostFromPriceLevel(priceLevel: number | undefined, category: string): number {
  if (priceLevel === undefined || priceLevel === null) {
    return estimateCost(category);
  }

  const baseCosts = {
    'attractions': [0, 8, 15, 25, 40],
    'restaurants': [10, 20, 35, 55, 85],
    'culture': [0, 5, 12, 20, 35],
    'activities': [5, 15, 30, 50, 80],
    'nature': [0, 3, 8, 15, 25],
    'hotels': [40, 80, 120, 180, 300],
    'shopping': [5, 15, 30, 60, 120],
    'nightlife': [10, 20, 40, 70, 120],
  };

  const costs = baseCosts[category] || baseCosts['attractions'];
  return costs[Math.min(priceLevel, 4)] || costs[2];
}

function shouldRequireBooking(place: any, category: string): boolean {
  const types = place.types || [];
  
  if (types.includes('restaurant') && place.price_level >= 2) return true;
  if (types.includes('museum')) return true;
  if (types.includes('amusement_park')) return true;
  if (types.includes('lodging')) return true;
  if (types.includes('spa')) return true;
  if (types.includes('tourist_attraction') && place.rating >= 4.5) return true;
  
  if (['restaurants', 'culture', 'hotels'].includes(category)) return true;
  
  return false;
}

async function fetchWikipediaPlaces(destination: string, category: string) {
  try {
    const searchResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!searchResponse.ok) {
      return [];
    }

    const summary = await searchResponse.json();
    
    return [{
      id: `wiki-${destination.toLowerCase().replace(/\s+/g, '-')}`,
      name: summary.title,
      description: summary.extract || `Explore the highlights of ${destination}`,
      location: destination,
      coordinates: { lat: 0, lng: 0 },
      category: category,
      rating: 4.3,
      estimated_cost_gbp: estimateCost(category),
      duration_hours: estimateDuration(category),
      booking_required: false,
      website: summary.content_urls?.desktop?.page,
      image: summary.thumbnail?.source || getDefaultImage(category),
    }];

  } catch (error) {
    console.error('Wikipedia API error:', error);
    return [];
  }
}

function getCuratedPlaces(destination: string, category: string) {
  const placesDatabase = {
    'marbella': {
      attractions: [
        {
          id: 'marbella-old-town',
          name: 'Marbella Old Town (Casco Antiguo)',
          description: 'Charming historic quarter with narrow cobblestone streets, whitewashed buildings, and traditional Andalusian architecture.',
          location: 'Casco Antiguo, Marbella',
          coordinates: { lat: 36.5108, lng: -4.8856 },
          rating: 4.6,
          estimated_cost_gbp: 0,
          duration_hours: 2,
          booking_required: false,
          image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
        },
        {
          id: 'puerto-banus',
          name: 'Puerto Banús Marina',
          description: 'Luxury marina famous for its upscale shops, restaurants, and impressive yachts.',
          location: 'Puerto Banús, Marbella',
          coordinates: { lat: 36.4848, lng: -4.9516 },
          rating: 4.4,
          estimated_cost_gbp: 0,
          duration_hours: 2.5,
          booking_required: false,
          image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
        },
      ],
      restaurants: [
        {
          id: 'dani-garcia',
          name: 'Dani García Restaurant',
          description: 'Michelin-starred restaurant offering innovative Andalusian cuisine with modern techniques.',
          location: 'Puente Romano, Marbella',
          coordinates: { lat: 36.4977, lng: -4.9089 },
          rating: 4.8,
          estimated_cost_gbp: 150,
          duration_hours: 3,
          booking_required: true,
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        },
      ],
    },
    'barcelona': {
      attractions: [
        {
          id: 'sagrada-familia',
          name: 'Sagrada Família',
          description: 'Antoni Gaudí\'s masterpiece basilica, a UNESCO World Heritage site with stunning architecture.',
          location: 'Carrer de Mallorca, 401, Eixample, Barcelona',
          coordinates: { lat: 41.4036, lng: 2.1744 },
          rating: 4.8,
          estimated_cost_gbp: 26,
          duration_hours: 2,
          booking_required: true,
          image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
        },
        {
          id: 'park-guell',
          name: 'Park Güell',
          description: 'Whimsical park designed by Gaudí featuring colorful mosaics and panoramic city views.',
          location: 'Carrer d\'Olot, s/n, Gràcia, Barcelona',
          coordinates: { lat: 41.4145, lng: 2.1527 },
          rating: 4.6,
          estimated_cost_gbp: 10,
          duration_hours: 2.5,
          booking_required: true,
          image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
        },
      ],
      restaurants: [
        {
          id: 'cal-pep',
          name: 'Cal Pep',
          description: 'Legendary tapas bar serving exceptional seafood and traditional Catalan dishes.',
          location: 'Plaça de les Olles, 8, Born, Barcelona',
          coordinates: { lat: 41.3833, lng: 2.1833 },
          rating: 4.7,
          estimated_cost_gbp: 45,
          duration_hours: 1.5,
          booking_required: false,
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        },
      ],
    },
    'valencia': {
      attractions: [
        {
          id: 'city-of-arts-sciences',
          name: 'City of Arts and Sciences',
          description: 'Futuristic architectural complex featuring the Oceanogràfic aquarium and Science Museum.',
          location: 'Av. del Professor López Piñero, 7, Valencia',
          coordinates: { lat: 39.4561, lng: -0.3545 },
          rating: 4.7,
          estimated_cost_gbp: 35,
          duration_hours: 4,
          booking_required: true,
          image: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
        },
      ],
      restaurants: [
        {
          id: 'casa-roberto-valencia',
          name: 'Casa Roberto',
          description: 'Authentic Valencian restaurant famous for traditional paella valenciana.',
          location: 'Carrer de Mestre Gozalbo, 19, Valencia',
          coordinates: { lat: 39.4699, lng: -0.3763 },
          rating: 4.6,
          estimated_cost_gbp: 35,
          duration_hours: 1.5,
          booking_required: true,
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        },
      ],
    },
  };

  const destKey = destination.toLowerCase().replace(/\s+/g, '').replace(',', '');
  
  // Try exact match first
  let places = placesDatabase[destKey]?.[category] || [];
  
  // Try partial matches
  if (places.length === 0) {
    for (const [key, data] of Object.entries(placesDatabase)) {
      if (destKey.includes(key) || key.includes(destKey.split(',')[0])) {
        places = data[category] || [];
        if (places.length > 0) break;
      }
    }
  }
  
  // Generate generic places if no curated data exists
  if (places.length === 0) {
    places = generateGenericPlaces(destination, category);
  }
  
  return places.map(place => ({
    ...place,
    category,
  }));
}

function generateGenericPlaces(destination: string, category: string) {
  const cityName = destination.split(',')[0].trim();
  
  const templates = {
    attractions: [
      {
        name: `${cityName} Historic Center`,
        description: `Explore the charming historic center of ${cityName} with its traditional architecture and cultural landmarks.`,
        estimated_cost_gbp: 0,
        duration_hours: 2,
        booking_required: false,
      },
      {
        name: `${cityName} Main Square`,
        description: `The heart of ${cityName}, featuring beautiful architecture and vibrant atmosphere.`,
        estimated_cost_gbp: 0,
        duration_hours: 1,
        booking_required: false,
      },
    ],
    restaurants: [
      {
        name: `Local Flavors of ${cityName}`,
        description: `Authentic local restaurant serving traditional ${cityName} cuisine with fresh, regional ingredients.`,
        estimated_cost_gbp: 35,
        duration_hours: 1.5,
        booking_required: true,
      },
    ],
    culture: [
      {
        name: `${cityName} Cultural Center`,
        description: `Local cultural center showcasing the history, art, and traditions of ${cityName}.`,
        estimated_cost_gbp: 8,
        duration_hours: 1.5,
        booking_required: false,
      },
    ],
    activities: [
      {
        name: `${cityName} Walking Tour`,
        description: `Guided walking tour showcasing the best of ${cityName} with local insights and hidden gems.`,
        estimated_cost_gbp: 20,
        duration_hours: 3,
        booking_required: true,
      },
    ],
    nature: [
      {
        name: `${cityName} Natural Area`,
        description: `Beautiful natural area perfect for relaxation and enjoying the local landscape.`,
        estimated_cost_gbp: 0,
        duration_hours: 2,
        booking_required: false,
      },
    ],
  };

  const categoryTemplates = templates[category] || templates.attractions;
  
  return categoryTemplates.map((template, index) => ({
    id: `${cityName.toLowerCase().replace(/\s+/g, '-')}-${category}-${index + 1}`,
    ...template,
    location: `${cityName} City Center`,
    coordinates: { lat: 0, lng: 0 },
    rating: 4.0 + Math.random() * 0.8,
    category,
    image: getDefaultImage(category),
  }));
}

function getDefaultImage(category: string): string {
  const images = {
    attractions: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
    restaurants: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    culture: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
    activities: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
    nature: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg',
  };
  
  return images[category] || images.attractions;
}

function estimateCost(category: string): number {
  const costs = {
    attractions: Math.floor(Math.random() * 20) + 10,
    restaurants: Math.floor(Math.random() * 40) + 25,
    hotels: Math.floor(Math.random() * 100) + 80,
    activities: Math.floor(Math.random() * 30) + 15,
    culture: Math.floor(Math.random() * 15) + 8,
    nature: Math.floor(Math.random() * 10) + 5,
  };
  
  return costs[category] || 20;
}

function estimateDuration(category: string): number {
  const durations = {
    attractions: Math.floor(Math.random() * 2) + 1,
    restaurants: 1.5 + Math.random() * 1,
    hotels: 0,
    activities: Math.floor(Math.random() * 3) + 2,
    culture: Math.floor(Math.random() * 2) + 1,
    nature: Math.floor(Math.random() * 3) + 2,
  };
  
  return durations[category] || 2;
}
