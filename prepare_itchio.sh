#!/bin/bash
# Script to prepare files for Itch.io

# Create a properly structured upload for Itch.io
mkdir -p itchio_upload
cd itchio_upload

# Copy all dist contents
cp -r ../dist/* .

# Create an index.html that works with Itch.io's structure
echo "✅ Itch.io upload folder prepared!"
echo "📦 Ready to upload from: itchio_upload/"
echo "🎮 Zip the contents and upload to Itch.io"
