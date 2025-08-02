export async function GET(request: Request) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location');
  
  // Sample map data - in production, integrate with mapping service
  const mapData = {
    center: {
      latitude: 41.3851,
      longitude: 2.1734, // Barcelona coordinates
    },
    markers: [
      {
        id: 'cafe-central',
        title: 'Café Central',
        description: 'Perfect morning coffee spot',
        latitude: 41.3851,
        longitude: 2.1734,
        type: 'food',
      },
      {
        id: 'sagrada-familia',
        title: 'Sagrada Familia',
        description: 'Iconic Gaudí masterpiece',
        latitude: 41.4036,
        longitude: 2.1744,
        type: 'activity',
      },
      {
        id: 'park-guell',
        title: 'Park Güell',
        description: 'Mosaic wonderland',
        latitude: 41.4145,
        longitude: 2.1527,
        type: 'activity',
      },
    ],
  };

  return Response.json(mapData);
}