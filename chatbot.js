// Brain Candy Chatbot
class BrainCandyChatbot {
    constructor() {
        // No API key needed in frontend - using proxy server
        this.apiUrl = '/api/chat'; // Local proxy endpoint
        this.knowledgeBase = this.buildKnowledgeBase();
        this.videoDatabase = this.buildVideoDatabase();
    }

    buildKnowledgeBase() {
        return `
Brain Candy Knowledge Base:

ABOUT BRAIN CANDY:
- Brain Candy is a VR app available in early access on Meta Quest
- It uses flickering lights and visual patterns based on brainwave entrainment research
- The app is designed to guide users into states of relaxation, focus, and energy
- Based on research by Heinrich Kluver into altered states
- Developed by Brain Candy LLC
- Features strobing visuals (comes with seizure warnings)

SCIENCE:
- Uses bioelectric response of activated interconnected nodes
- Cognitive amplification through neural dynamics (B.R.A.I.N. C.A.N.D.Y.)
- Flickering light enters through open eyes, reaching central brain
- Sparks neural rhythms and hyperconnectivity
- Based on brainwave entrainment research
- Helps sync, energize, and achieve harmonious states
- Research shows 10 Hz rhythmic FLS can alter states

FEATURES:
- Tailored experiences with different modes
- Simple, intuitive interface
- Scientifically inspired design
- Easy to use for everyone
- Multiple DLC content available

USES:
- Stress relief and relaxation
- Focus enhancement
- Creativity boosting
- Exploring altered states of consciousness
- Mental energy and clarity

SAFETY:
- Contains strobing visuals - seizure warning required
- Not recommended for those with photosensitive epilepsy
- Users should read safety warnings before use

AVAILABILITY:
- Available on Meta Quest store
- Live preview available on website
- Early access keys available through request form
- DLC gallery with additional content
        `;
    }

    buildVideoDatabase() {
        // This should be populated with your actual YouTube content and tags
        return [
            {
                title: "Brain Candy - Official Trailer",
                url: "https://www.youtube.com/watch?v=jjqDQZ5Uha0",
                tags: ["trailer", "overview", "introduction", "demo"],
                description: "Official trailer showcasing Brain Candy's visual experiences"
            },
            {
                title: "Brainwave Entrainment Science",
                url: "https://youtu.be/0OMdNJ9WDBU",
                tags: ["science", "brainwave", "entrainment", "research"],
                description: "Scientific explanation of brainwave entrainment"
            },
            {
                title: "Cyberdelic Society Interview",
                url: "https://www.rte.ie/radio/lyricfm/clips/22463090/",
                tags: ["interview", "cyberdelic", "conference", "discussion"],
                description: "Interview about Brain Candy at Games Ground conference"
            }
        ];
    }

    async sendMessage(userMessage) {
        const context = this.buildContext(userMessage);
        
        const requestBody = {
            model: "gpt-3.5-turbo",
            max_tokens: 1000,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI assistant for Brain Candy, a VR app focused on brainwave entrainment and altered states of consciousness. Respond in a friendly, knowledgeable way using the provided knowledge base."
                },
                {
                    role: "user",
                    content: context
                }
            ],
            temperature: 0.7
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling ChatGPT API:', error);
            return this.getFallbackResponse(userMessage);
        }
    }

    buildContext(userMessage) {
        const videoRecommendations = this.findRelevantVideos(userMessage);
        
        return `You are a helpful AI assistant for Brain Candy, a VR app focused on brainwave entrainment and altered states of consciousness. 

Use this knowledge base to answer questions:
${this.knowledgeBase}

User question: "${userMessage}"

${videoRecommendations.length > 0 ? `
Relevant video recommendations:
${videoRecommendations.map(v => `- ${v.title}: ${v.url} (${v.description})`).join('\n')}

Include these video links in your response when relevant.
` : ''}

Respond in a friendly, knowledgeable way. If the question is about Brain Candy, use the knowledge base. If someone asks for video recommendations, suggest relevant videos from the database. Keep responses concise but informative.`;
    }

    findRelevantVideos(query) {
        const queryLower = query.toLowerCase();
        return this.videoDatabase.filter(video => 
            video.tags.some(tag => queryLower.includes(tag)) ||
            queryLower.includes(video.title.toLowerCase()) ||
            video.description.toLowerCase().includes(queryLower)
        );
    }

    getFallbackResponse(userMessage) {
        const query = userMessage.toLowerCase();
        
        // Simple keyword matching for common questions
        if (query.includes('what is brain candy') || query.includes('about brain candy')) {
            return "Brain Candy is a VR app that uses flickering lights and visual patterns to guide your brain into states of relaxation, focus, and energy. It's based on brainwave entrainment research and is available in early access on Meta Quest. The app combines science, art, and fun for an unforgettable experience!";
        }
        
        if (query.includes('science') || query.includes('how does it work')) {
            return "Brain Candy uses bioelectric response of activated interconnected nodes (B.R.A.I.N.) and cognitive amplification through neural dynamics (C.A.N.D.Y.). The flickering light enters through your eyes, reaches the central brain, and sparks neural rhythms and hyperconnectivity to help you achieve harmonious states.";
        }
        
        if (query.includes('video') || query.includes('youtube')) {
            const videos = this.findRelevantVideos(userMessage);
            if (videos.length > 0) {
                return `Here are some relevant videos:\n${videos.map(v => `• ${v.title}: ${v.url}`).join('\n')}`;
            }
            return "Check out our YouTube channel @BrainCandyApp for videos about brainwave entrainment and Brain Candy demos!";
        }
        
        if (query.includes('safety') || query.includes('seizure') || query.includes('warning')) {
            return "⚠️ Important Safety Information: Brain Candy contains strobing visuals and is not recommended for those with photosensitive epilepsy. Please read our seizure warning before use. Always prioritize your safety!";
        }
        
        return "I'm here to help with Brain Candy questions! You can ask me about the science behind our app, how it works, safety information, or request video recommendations. What would you like to know?";
    }
}

// Initialize chatbot
const chatbot = new BrainCandyChatbot();

// DOM elements
const messagesContainer = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    // Handle video links in bot messages
    if (!isUser && content.includes('http')) {
        content = content.replace(/(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" class="video-link">🎥 Watch Video</a>');
    }
    
    messageDiv.innerHTML = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.textContent = 'AI is thinking...';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    messageInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get bot response
        const response = await chatbot.sendMessage(message);
        removeTypingIndicator();
        addMessage(response);
    } catch (error) {
        removeTypingIndicator();
        addMessage("Sorry, I'm having trouble connecting right now. Please try again later!");
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// No API key check needed - using secure proxy server