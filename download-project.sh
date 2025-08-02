#!/bin/bash

# Project Download Script for Ubuntu Server
# This script creates a downloadable archive of your project

PROJECT_NAME="travel-app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="${PROJECT_NAME}_${TIMESTAMP}.tar.gz"
TEMP_DIR="/tmp/project_export"

echo "🚀 Starting project export..."

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Copy project files (excluding node_modules and other large directories)
echo "📁 Copying project files..."
rsync -av --progress \
  --exclude 'node_modules' \
  --exclude '.expo' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'ollama.log' \
  ./ "$TEMP_DIR/"

# Create archive
echo "📦 Creating archive..."
cd /tmp
tar -czf "$ARCHIVE_NAME" -C project_export .

# Move to web-accessible location (if you have a web server)
if [ -d "/var/www/html" ]; then
    mv "$ARCHIVE_NAME" "/var/www/html/"
    echo "✅ Archive created: http://your-server-ip/$ARCHIVE_NAME"
elif [ -d "/home/$(whoami)/public_html" ]; then
    mv "$ARCHIVE_NAME" "/home/$(whoami)/public_html/"
    echo "✅ Archive created: ~/public_html/$ARCHIVE_NAME"
else
    mv "$ARCHIVE_NAME" "/home/$(whoami)/"
    echo "✅ Archive created: /home/$(whoami)/$ARCHIVE_NAME"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "📊 Archive size: $(du -h /home/$(whoami)/$ARCHIVE_NAME 2>/dev/null || du -h /var/www/html/$ARCHIVE_NAME 2>/dev/null || echo 'Unknown')"
echo "🎉 Export complete!"

# Instructions
echo ""
echo "📥 To download the archive:"
echo "1. Using SCP: scp root@78.47.46.160:/path/to/$ARCHIVE_NAME ./"
echo "2. Using wget (if web server): wget http://78.47.46.160/$ARCHIVE_NAME"
echo "3. Using rsync: rsync -av root@78.47.46.160:/path/to/$ARCHIVE_NAME ./"