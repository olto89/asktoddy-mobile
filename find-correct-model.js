const GEMINI_API_KEY = 'AIzaSyCzzjHyKVEw2lANqgr_VsOMZJ2BKCCrjmo';

async function findCorrectModel() {
  console.log('🔍 Finding correct Gemini model...\n');

  try {
    // List available models
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    const response = await fetch(listUrl);

    if (!response.ok) {
      console.error('Failed to list models:', response.status, response.statusText);
      return;
    }

    const data = await response.json();

    console.log('Available models:');
    if (data.models) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
        if (model.supportedGenerationMethods) {
          console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });

      // Find the correct flash model
      const flashModels = data.models.filter(
        model =>
          model.name.includes('flash') &&
          model.supportedGenerationMethods &&
          model.supportedGenerationMethods.includes('generateContent')
      );

      console.log('\n🎯 Flash models with generateContent:');
      flashModels.forEach(model => {
        console.log(`✅ ${model.name}`);
      });

      // Test with the most likely correct model
      if (flashModels.length > 0) {
        const testModel = flashModels[0].name;
        console.log(`\n🧪 Testing ${testModel}...`);

        const testUrl = `https://generativelanguage.googleapis.com/v1beta/${testModel}:generateContent?key=${GEMINI_API_KEY}`;
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Hello, confirm this model works!' }],
              },
            ],
          }),
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          if (testData.candidates && testData.candidates[0]) {
            console.log('✅ Model works!');
            console.log('✅ CORRECT MODEL:', testModel);
            return testModel;
          }
        } else {
          console.log('❌ Model test failed');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

findCorrectModel().catch(console.error);
