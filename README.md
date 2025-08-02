# Travel Companion App

A comprehensive travel planning and companion app built with Expo and React Native.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase (Required for authentication and data storage)**
   
   a. Go to [Supabase Dashboard](https://supabase.com/dashboard)
   
   b. Create a new project or select an existing one
   
   c. Go to Settings > API
   
   d. Copy your Project URL and anon/public key
   
   e. Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   f. **CRITICAL: Set up the database tables**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click **"New Query"**
   - Copy the ENTIRE contents of `supabase/migrations/20250708170359_aged_bush.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** to create all required tables
   - You should see "Migration completed successfully" message

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The app requires a Supabase database with the following tables:
- `profiles` - User profiles
- `user_itineraries` - Travel itineraries
- `user_journal_entries` - Travel journal entries
- `user_preferences` - User travel preferences

Run the migration file in `supabase/migrations/` to set up these tables automatically.

## 🤖 AI Features (Optional)

For AI-powered itinerary generation and travel advice:

1. Install and run Ollama locally:
   ```bash
   # Install Ollama (macOS/Linux)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama server
   ollama serve
   
   # Pull a model (recommended: tinyllama for speed)
   ollama pull tinyllama:latest
   ```

2. The app will automatically use AI features when Ollama is running.

## 🗺️ Google Places Integration (Optional)

For real place data and enhanced location features:

1. Get a Google Places API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. Add it to your `.env` file:
   ```env
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```

## 📱 Features

- **Trip Planning**: AI-powered itinerary generation
- **Travel Journal**: Document your experiences with photos and notes
- **Budget Tracking**: Monitor spending across categories
- **Offline Tools**: Currency converter, emergency contacts, offline maps
- **Travel Advisor**: AI chat assistant for travel questions
- **Mood Companion**: Track wellbeing and get personalized suggestions
- **Community Features**: Tips and recommendations from other travelers

## 🛠️ Development

- **Platform**: Web-first with mobile support
- **Framework**: Expo Router with React Native
- **Database**: Supabase (PostgreSQL)
- **AI**: Ollama (local) for privacy-focused AI features
- **Maps**: Google Places API integration

## 📦 Deployment

The app includes download functionality for easy deployment:

1. Use the download buttons in the Profile tab
2. Or run the included `download-project.sh` script
3. Deploy the `dist/` folder to any static hosting service

## 🔧 Troubleshooting

**"supabaseUrl is required" error:**
- Make sure you've set up your `.env` file with valid Supabase credentials
- Restart the development server after adding environment variables

**AI features not working:**
- Check if Ollama is running: `ollama serve`
- Test the connection at: `http://localhost:3000/test-ollama`

**No real places showing:**
- Add your Google Places API key to the `.env` file
- Test the API at: `http://localhost:3000/test-google-places`

## 📄 License

This project is open source and available under the MIT License.
