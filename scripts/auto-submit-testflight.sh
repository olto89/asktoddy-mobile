#!/bin/bash

# Auto-submit to TestFlight once build completes
# This script monitors the build and submits when ready

echo "🚀 Monitoring build for auto-submission to TestFlight..."

# Function to check latest build status
check_build_status() {
    eas build:list --limit=1 --json --non-interactive 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data and len(data) > 0:
        build = data[0]
        print(f'{build[\"status\"]}:{build[\"id\"]}')
    else:
        print('no_builds:')
except:
    print('error:')
"
}

# Monitor until build is finished
BUILD_ID=""
while true; do
    STATUS_ID=$(check_build_status)
    STATUS=$(echo $STATUS_ID | cut -d: -f1)
    CURRENT_ID=$(echo $STATUS_ID | cut -d: -f2)
    
    if [ -z "$BUILD_ID" ]; then
        BUILD_ID=$CURRENT_ID
        echo "📱 Monitoring build: $BUILD_ID"
    fi
    
    case $STATUS in
        "finished")
            echo "✅ Build completed successfully!"
            echo "🚀 Auto-submitting to TestFlight..."
            
            # Submit to TestFlight
            eas submit --platform ios --latest --non-interactive
            
            if [ $? -eq 0 ]; then
                echo "✅ Successfully submitted to TestFlight!"
                echo "📧 Check your email for App Store Connect notification"
                echo "⏰ TestFlight processing usually takes 5-10 minutes"
            else
                echo "❌ Failed to submit to TestFlight"
                exit 1
            fi
            break
            ;;
        "errored")
            echo "❌ Build failed - cannot submit to TestFlight"
            exit 1
            ;;
        "canceled")
            echo "⚠️ Build was canceled"
            exit 1
            ;;
        *)
            echo "⏳ Build status: $STATUS (checking again in 30 seconds...)"
            sleep 30
            ;;
    esac
done

echo "🎉 Auto-submission process complete!"