#!/bin/bash

echo "🚀 Testing Multer Field Name Compatibility"
echo "=========================================="

# Create a simple test image if it doesn't exist
if [ ! -f "test_image.png" ]; then
  echo "📷 Creating test image..."
  # Create a minimal 1x1 PNG
  echo -ne '\x89\x50\x4e\x47\x0d\x0a\x1a\x0a\x00\x00\x00\x0d\x49\x48\x44\x52\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90\x77\x53\xde\x00\x00\x00\x0c\x49\x44\x41\x54\x08\x99\x01\x01\x00\x00\x00\xff\xff\x00\x00\x00\x02\x00\x01\x00\x00\x00\x00\x49\x45\x4e\x44\xae\x42\x60\x82' > test_image.png
fi

echo ""
echo "🧪 Test 1: Using 'image' field name (expected behavior)"
echo "----------------------------------------"
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer test-token" \
  -F "name=Test Project 1" \
  -F "details=Test project details 1" \
  -F "image=@test_image.png" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "🧪 Test 2: Using 'uploadedFile' field name (our fix)"
echo "-------------------------------------------"
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer test-token" \
  -F "name=Test Project 2" \
  -F "details=Test project details 2" \
  -F "uploadedFile=@test_image.png" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "🧪 Test 3: Without file upload (should work)"
echo "--------------------------------------"
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project 3","details":"Test project without file upload"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "📊 Analysis:"
echo "- If Test 1 shows 'LIMIT_UNEXPECTED_FILE' with 'image', Multer is broken"
echo "- If Test 2 shows 'LIMIT_UNEXPECTED_FILE' with 'uploadedFile', our fix works"
echo "- If both Test 1 & 2 show 401 (auth error), Multer is working correctly"
echo "- If Test 3 works, the API endpoint is functional"

# Clean up test image
rm -f test_image.png
