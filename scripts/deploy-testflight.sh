#!/bin/bash

# TestFlight Deployment Script
# Automatically deploys to TestFlight based on current branch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current branch
BRANCH=$(git branch --show-current)

echo -e "${BLUE}🚀 TestFlight Deployment Script${NC}"
echo -e "Current branch: ${YELLOW}$BRANCH${NC}"

# Check if we're on a deployable branch
if [[ "$BRANCH" != "main" && "$BRANCH" != "staging" ]]; then
  echo -e "${RED}❌ Error: Deploy only from 'main' or 'staging' branches${NC}"
  echo -e "Current branch: $BRANCH"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${RED}❌ Error: You have uncommitted changes${NC}"
  echo -e "Please commit or stash your changes before deploying"
  git status --short
  exit 1
fi

# Determine profile based on branch
if [[ "$BRANCH" == "main" ]]; then
  PROFILE="production"
  echo -e "${GREEN}📱 Deploying to TestFlight (Production)${NC}"
else
  PROFILE="staging"
  echo -e "${YELLOW}📱 Deploying to TestFlight (Staging)${NC}"
fi

# Confirm deployment
echo -e "${BLUE}This will:${NC}"
echo "  1. Run quality checks (lint, typecheck)"
echo "  2. Build iOS app for $PROFILE"
echo "  3. Submit to TestFlight"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment cancelled${NC}"
  exit 0
fi

# Step 1: Quality checks
echo -e "${BLUE}🔍 Running quality checks...${NC}"
if command -v npm &> /dev/null; then
  if [[ -f "package.json" ]]; then
    echo "Running ESLint..."
    npm run lint || {
      echo -e "${RED}❌ ESLint failed${NC}"
      exit 1
    }
    
    echo "Running TypeScript check..."
    npx tsc --noEmit || {
      echo -e "${RED}❌ TypeScript check failed${NC}"
      exit 1
    }
  fi
fi

# Step 2: Build
echo -e "${BLUE}🏗️ Building iOS app for $PROFILE...${NC}"
eas build --platform ios --profile $PROFILE --wait || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}

# Step 3: Submit to TestFlight
echo -e "${BLUE}📤 Submitting to TestFlight...${NC}"
eas submit --platform ios --profile $PROFILE || {
  echo -e "${RED}❌ TestFlight submission failed${NC}"
  exit 1
}

# Success
echo ""
echo -e "${GREEN}🎉 Successfully deployed to TestFlight!${NC}"
echo -e "Profile: ${YELLOW}$PROFILE${NC}"
echo -e "Branch: ${YELLOW}$BRANCH${NC}"
echo -e "Commit: ${YELLOW}$(git rev-parse --short HEAD)${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Check TestFlight for processing status"
echo "  2. Add release notes in App Store Connect"
echo "  3. Distribute to testers when ready"