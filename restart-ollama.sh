#!/bin/bash

echo "🔄 Restarting Ollama service..."

# Kill any existing Ollama processes
echo "🛑 Stopping Ollama..."
pkill -f ollama 2>/dev/null || true

# Wait a moment
sleep 2

# Start Ollama in the background
echo "🚀 Starting Ollama..."
nohup ollama serve > ollama.log 2>&1 &

# Wait for it to start
sleep 3

# Check if it's running
if pgrep -f "ollama serve" > /dev/null; then
    echo "✅ Ollama is now running!"
    echo "📋 Available models:"
    ollama list 2>/dev/null || echo "   (Run 'ollama pull mistral:7b' to install a model)"
else
    echo "❌ Failed to start Ollama"
    echo "💡 Try running manually: ollama serve"
fi

echo ""
echo "🔧 Test your setup at: http://localhost:3000/test-ollama"
echo "🔧 Full test with generation: http://localhost:3000/test-ollama?full=true"