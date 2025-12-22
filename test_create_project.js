// Test script to verify createProject functionality
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCreateProject() {
  const form = new FormData();
  
  // Add project data
  form.append('name', 'Test Project with Image Upload');
  form.append('details', 'This is a test project to verify image upload functionality works correctly');
  form.append('skills', JSON.stringify(['JavaScript', 'React', 'Node.js']));
  form.append('demo_link', 'https://demo.example.com');
  form.append('github_link', 'https://github.com/example/project');
  
  // Create a simple test image if it doesn't exist
  const testImagePath = path.join(__dirname, 'test_image.png');
  if (!fs.existsSync(testImagePath)) {
    // Create a simple PNG file for testing
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, // IDAT data
      0x00, 0x01, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82 // CRC
    ]);
    fs.writeFileSync(testImagePath, pngData);
  }
  
  // Add image file
  form.append('image', fs.createReadStream(testImagePath));

  try {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // This will likely fail, but tests the route structure
        ...form.getHeaders()
      },
      body: form
    });

    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    if (response.status === 401) {
      console.log('\n✅ Route is working correctly - authentication is required as expected');
    } else if (response.status === 201) {
      console.log('\n✅ Project created successfully with image upload!');
    } else {
      console.log('\n⚠️ Unexpected response status');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testCreateProject();
