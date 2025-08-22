# ContextFlow Chatbot

A modern, responsive chatbot application built with Next.js, shadcn/ui, and Google's Gemini AI API. This application provides a clean, intuitive interface for conversing with an AI assistant.

## 🚀 Features

- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Chat**: Instant responses from Google's Gemini AI
- **Message Persistence**: Chat history is saved in browser localStorage
- **Typing Indicators**: Visual feedback when the AI is generating responses
- **Message Timestamps**: Track when each message was sent
- **Clear Chat**: Easy way to start a fresh conversation
- **Dark/Light Mode**: Automatic theme detection

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **AI Provider**: Google Gemini API
- **Icons**: Lucide React
- **Language**: TypeScript

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn** package manager
3. **Google Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/)

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd contextflow-chatbot

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Add your Gemini API key to `.env.local`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key" and create a new key
4. Copy the API key and paste it into your `.env.local` file

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🗂️ Project Structure

```
contextflow-chatbot/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts     # API endpoint for chat
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── chat-interface.tsx   # Main chat component
│   │   ├── chat-input.tsx       # Message input component
│   │   └── chat-message.tsx     # Message display component
│   └── lib/
│       ├── gemini.ts            # Gemini API integration
│       └── utils.ts             # Utility functions
├── .env.local                   # Environment variables
├── .env.example                 # Environment template
└── README.md                    # This file
```

## 🔌 API Integration

The application uses Google's Gemini Pro model through the `@google/generative-ai` package. The integration is handled in:

- **`src/lib/gemini.ts`**: Gemini API client setup and response generation
- **`src/app/api/chat/route.ts`**: Next.js API route for handling chat requests

## 🎨 UI Components

The application uses several shadcn/ui components:

- **Button**: For sending messages and clearing chat
- **Input**: For typing messages
- **Card**: For message bubbles and main interface
- **ScrollArea**: For smooth scrolling chat history
- **Avatar**: For user and bot indicators

## 📱 Features in Detail

### Message Management
- Messages are stored in browser localStorage
- Automatic scrolling to latest messages
- Unique message IDs and timestamps
- Support for both user and assistant messages

### User Experience
- Loading indicators while AI generates responses
- Error handling for API failures
- Responsive design for all screen sizes
- Keyboard shortcuts (Enter to send)

### Styling
- Modern gradient background
- Clean, accessible design
- Consistent spacing and typography
- Dark/light mode support

## 🚀 Deployment

### Local Deployment

The application runs entirely in the browser except for API calls to Gemini. No backend server is required.

### Vercel Deployment

1. Push your code to a GitHub repository
2. Connect your repo to [Vercel](https://vercel.com)
3. Add your `GEMINI_API_KEY` in Vercel's environment variables
4. Deploy!

### Other Platforms

This application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Notes

- API keys are stored securely in environment variables
- All API calls are made server-side to protect your API key
- No sensitive data is stored in localStorage

## 🐛 Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**
   - Make sure your `.env.local` file exists and contains the correct API key
   - Restart the development server after adding the API key

2. **Build errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that you're using Node.js version 18 or higher

3. **API errors**
   - Verify your Gemini API key is valid and has quota available
   - Check the browser console for detailed error messages

## 📚 References

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.