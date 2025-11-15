#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Building Pluely with API keys..."

export APP_ENDPOINT="https://pluely.com/pluely/v2"
export API_ACCESS_KEY="ZKsmfwMpXrAoSJzh6Bn03kKyfTIREdej3qW2912c5326048e794uY2xlcmsuYWNjbDzB677FcPl7bbP1EpoxSECuyZ"

echo "APP_ENDPOINT=$APP_ENDPOINT"
echo "API_ACCESS_KEY=${API_ACCESS_KEY:0:20}..."

npm run tauri build

echo "Build complete!"
echo "AppImage: src-tauri/target/release/bundle/appimage/Pluely_0.1.8_amd64.AppImage"
