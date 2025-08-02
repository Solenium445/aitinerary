export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  
  // Sample reminders data
  const reminders = [
    {
      id: '1',
      type: 'flight',
      title: 'Flight Check-in Opens',
      description: 'Check-in for your flight BA456 to Barcelona opens in 2 hours',
      time: '2024-01-20T14:00:00Z',
      location: 'Heathrow Airport',
      priority: 'high',
      completed: false,
    },
    {
      id: '2',
      type: 'hotel',
      title: 'Hotel Check-in',
      description: 'Check-in at Hotel Barcelona Center starts at 3:00 PM',
      time: '2024-01-20T15:00:00Z',
      location: 'Barcelona, Spain',
      priority: 'medium',
      completed: false,
    },
    {
      id: '3',
      type: 'activity',
      title: 'Sagrada Família Tour',
      description: 'Your guided tour of Sagrada Família starts in 30 minutes',
      time: '2024-01-20T10:30:00Z',
      location: 'Sagrada Família, Barcelona',
      priority: 'high',
      completed: false,
    },
    {
      id: '4',
      type: 'location',
      title: 'Nearby: Park Güell',
      description: 'You\'re near Park Güell! Perfect time to visit this Gaudí masterpiece.',
      time: '2024-01-20T16:00:00Z',
      location: 'Park Güell, Barcelona',
      priority: 'low',
      completed: false,
    },
    {
      id: '5',
      type: 'suggestion',
      title: 'Local Market Discovery',
      description: 'Based on your interests, check out Mercat de la Boqueria nearby!',
      time: '2024-01-20T12:00:00Z',
      location: 'La Rambla, Barcelona',
      priority: 'low',
      completed: false,
    },
  ];

  // Filter by type if specified
  const filteredReminders = type === 'all' 
    ? reminders 
    : reminders.filter(r => r.type === type);

  return Response.json({
    success: true,
    reminders: filteredReminders,
    total: filteredReminders.length,
  });
}

export async function POST(request: Request) {
  try {
    const { reminderId, action } = await request.json();
    
    if (!reminderId || !action) {
      return Response.json({
        success: false,
        error: 'Reminder ID and action are required',
      }, { status: 400 });
    }

    // In a real app, this would update the reminder in the database
    if (action === 'complete') {
      return Response.json({
        success: true,
        message: 'Reminder marked as completed',
        reminderId,
      });
    } else if (action === 'snooze') {
      return Response.json({
        success: true,
        message: 'Reminder snoozed for 30 minutes',
        reminderId,
      });
    } else if (action === 'dismiss') {
      return Response.json({
        success: true,
        message: 'Reminder dismissed',
        reminderId,
      });
    }

    return Response.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('Error handling reminder action:', error);
    
    return Response.json({
      success: false,
      error: 'Failed to process reminder action',
    }, { status: 500 });
  }
}