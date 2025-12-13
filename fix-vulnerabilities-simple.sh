#!/bin/bash

# Simple script to update React in vulnerable projects
# Run this AFTER fixing npm permissions with:
# sudo chown -R 501:20 "/Users/yeneirvine/.npm"

echo "=================================================="
echo "Updating React to 19.2.3 in all vulnerable projects"
echo "=================================================="
echo ""

# List of projects to update
declare -a PROJECTS=(
    "mp3-normalizer"
    "dj-friend-website"
    "runit_fe"
    "yene-website"
    "data-engineer-fullstack-test-template"
    "uto-website"
    "reliever"
)

for project in "${PROJECTS[@]}"; do
    echo "📦 Updating: $project"
    cd "/Users/yeneirvine/projects/$project" 2>/dev/null || continue
    npm install react@19.2.3 react-dom@19.2.3 && echo "✅ SUCCESS" || echo "❌ FAILED"
    echo ""
done

echo "=================================================="
echo "Done! Run the vulnerability scanner again to verify:"
echo "/Users/yeneirvine/projects/reliever/check-react-vulnerability.sh"
echo "=================================================="



