#!/bin/bash

# This shell script is for Unix-based systems (Mac, Linux) to start development

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/en/download/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed."
    echo "It should come with Node.js installation."
    exit 1
fi

# Check if package.json exists (we're in the right directory)
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Are you in the project root directory?"
    exit 1
fi

# Inform user about options
echo "Starting development environment..."
echo "OPTIONS:"
echo "1. Run client and server together (requires concurrently)"
echo "2. Run client only"
echo "3. Run server only"
echo "4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        node run-dev.js
        ;;
    2)
        node run-client.js
        ;;
    3)
        node run-server.js
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac