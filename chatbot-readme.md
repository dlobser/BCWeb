# Brain Candy Chatbot Setup

## Quick Start

1. **Get Claude API Key**: 
   - Sign up at https://console.anthropic.com/
   - Create an API key
   - Add it to `chatbot.js` line 5: `this.apiKey = 'your-api-key-here';`

2. **Test the Chatbot**:
   - Open `chatbot.html` in your browser
   - The bot will work with basic responses even without the API key
   - With API key, you get full Claude AI responses

## Features

### Knowledge Base
The chatbot knows about:
- Brain Candy app features and benefits
- Brainwave entrainment science
- Safety warnings and seizure information
- How to use the app
- VR experience details

### Video Recommendations
Currently includes:
- Official trailer
- Science explanations
- Conference interviews

### To Add More Videos:
Edit the `buildVideoDatabase()` function in `chatbot.js`:

```javascript
{
    title: "Your Video Title",
    url: "https://youtube.com/watch?v=...",
    tags: ["keyword1", "keyword2", "topic"],
    description: "Brief description of the video content"
}
```

## Customization

### Adding Knowledge:
Edit the `buildKnowledgeBase()` function in `chatbot.js` to add more information about Brain Candy.

### Styling:
Modify `chatbot.html` CSS to match your brand colors and fonts.

### Tags for Video Matching:
Use these tag categories:
- **Topics**: "science", "relaxation", "focus", "creativity"
- **Content Type**: "tutorial", "demo", "interview", "review"
- **Audience**: "beginner", "advanced", "medical", "research"

## Security Notes

- Never commit your API key to version control
- Consider using environment variables for production
- The API key should be kept secure on your server

## File Structure
```
chatbot.html    - Main chatbot page
chatbot.js      - Chatbot logic and API integration
README.md       - This file
```

The chatbot is now accessible from your main page via the "AI Assistant" button!
