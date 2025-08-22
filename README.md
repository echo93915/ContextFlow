# ContextFlow

**A sophisticated AI-powered chatbot application with advanced context management and document integration capabilities.**

ContextFlow is a modern, feature-rich chatbot application built with Next.js 15, featuring a beautiful interface, intelligent conversation management, and innovative context flow capabilities for enhanced AI interactions.

![Built with Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Powered by Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange)

## ✨ Key Features

### 🎯 Core Functionality
- **Advanced Chat Interface**: Modern, responsive design with real-time AI conversations
- **Context Management**: Upload PDFs and URLs to provide context for more accurate responses
- **Smart Chat History**: Persistent conversation management with intelligent organization
- **Multi-Modal Input**: Support for text input with voice interface placeholder
- **Real-time Responses**: Powered by Google's latest Gemini AI models

### 🎨 User Experience
- **Grok-Inspired Design**: Clean, modern interface inspired by premium AI chat applications
- **Responsive Layout**: Seamless experience across desktop and mobile devices
- **Collapsible Sidebar**: Space-efficient design with expandable navigation
- **Smart Empty States**: Intuitive onboarding and helpful placeholder content
- **Loading Animations**: Elegant typing indicators and smooth transitions

### 🗂️ Advanced Features
- **Context Upload System**: Drag-and-drop file uploads for PDFs and web content
- **Chat Session Management**: Create, switch between, and delete conversation threads
- **Upload History**: Track and manage your document uploads with timestamps
- **Auto-Save**: Automatic persistence of conversations and context across sessions
- **Keyboard Shortcuts**: Enhanced productivity with intuitive key combinations

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router & Turbopack
- **Language**: TypeScript 5
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4 with modern animations
- **AI Integration**: Google Gemini API (@google/generative-ai)
- **Icons**: Lucide React
- **State Management**: React Hooks with localStorage persistence

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn** package manager
3. **Google Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/)

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/echo93915/ContextFlow.git
cd ContextFlow

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
ContextFlow/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts     # Chat API endpoint with Gemini integration
│   │   ├── globals.css           # Global styles and animations
│   │   ├── layout.tsx           # Root layout with metadata
│   │   └── page.tsx             # Main application entry point
│   ├── components/
│   │   ├── ui/                  # shadcn/ui component library
│   │   │   ├── avatar.tsx       # User/bot avatar components
│   │   │   ├── button.tsx       # Interactive button components
│   │   │   ├── card.tsx         # Content card containers
│   │   │   ├── input.tsx        # Form input elements
│   │   │   └── scroll-area.tsx  # Scrollable content areas
│   │   ├── chat-layout.tsx      # Main layout with sidebar and chat
│   │   ├── main-chat.tsx        # Core chat interface with Grok-style design
│   │   ├── chat-message.tsx     # Individual message display
│   │   ├── sidebar.tsx          # Navigation and context management
│   │   └── header.tsx           # Application header with controls
│   └── lib/
│       ├── gemini.ts            # Gemini AI client and response handling
│       └── utils.ts             # Utility functions and helpers
├── public/                      # Static assets and icons
├── components.json              # shadcn/ui configuration
├── .env.local                   # Environment variables (create this)
├── PROGRESS.md                  # Development progress tracking
└── README.md                    # This documentation
```

## 🔌 API Integration

The application uses Google's latest Gemini models through the official `@google/generative-ai` package:

- **`src/lib/gemini.ts`**: Gemini API client configuration and response generation
- **`src/app/api/chat/route.ts`**: Next.js API route handling chat requests securely
- **Environment Variables**: API keys stored securely server-side
- **Error Handling**: Comprehensive error management with user-friendly messages

## 🎨 Architecture & Components

### Core Components

- **`ChatLayout`**: Main application layout with state management
- **`MainChat`**: Grok-inspired chat interface with empty states
- **`Sidebar`**: Context management and conversation history
- **`Header`**: Application controls and user interface
- **`ChatMessage`**: Individual message rendering with avatars

### UI Component Library

Built on shadcn/ui with Radix UI primitives:
- **Button**: Interactive elements with hover states
- **Input**: Form controls with validation
- **ScrollArea**: Smooth scrolling with custom styling
- **Avatar**: User and bot profile indicators
- **Card**: Content containers and message bubbles

## 📱 Advanced Features

### Context Management System
- **File Upload**: Drag-and-drop PDF support for document context
- **URL Integration**: Web content extraction for enhanced responses
- **Upload History**: Persistent tracking of context sources
- **Context Switching**: Easy management of different knowledge bases

### Smart Chat Management
- **Session Persistence**: Automatic saving of conversations
- **Chat History**: Organized conversation threads with timestamps
- **Quick Switching**: Navigate between different chat sessions
- **Bulk Operations**: Delete and manage multiple conversations

### Enhanced User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Loading States**: Elegant animations during AI processing
- **Keyboard Navigation**: Full keyboard accessibility
- **Auto-scroll**: Smart message positioning
- **Empty States**: Helpful onboarding and guidance

## 🚀 Deployment

### Production-Ready Features
- **Environment Configuration**: Secure API key management
- **No Backend Required**: Serverless architecture using Next.js API routes
- **Static Asset Optimization**: Efficient loading and caching
- **Responsive Performance**: Optimized for all device types

### Recommended Platforms

#### Vercel (Recommended)
```bash
# Deploy to Vercel with zero configuration
npm run build
vercel --prod
```

1. Push your code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Add `GEMINI_API_KEY` in environment variables
4. Deploy automatically with each push

#### Other Supported Platforms
- **Netlify**: Full Next.js support with edge functions
- **Railway**: Container deployment with automatic scaling
- **DigitalOcean App Platform**: Managed hosting with CI/CD
- **AWS Amplify**: Full-stack hosting with global CDN

## 🔒 Security & Privacy

- ✅ **API Security**: Keys stored server-side, never exposed to client
- ✅ **Data Privacy**: Conversations stored locally, no external data collection
- ✅ **HTTPS Encryption**: All communications secured in production
- ✅ **Input Validation**: Comprehensive request sanitization
- ✅ **Error Handling**: Secure error messages without sensitive information

## 🐛 Troubleshooting

### Common Issues

1. **API Configuration**
   ```bash
   # Check if API key is configured
   echo $GEMINI_API_KEY
   
   # Restart development server
   npm run dev
   ```

2. **Build Errors**
   ```bash
   # Clean install dependencies
   rm -rf node_modules package-lock.json
   npm install
   
   # Verify Node.js version (18+)
   node --version
   ```

3. **Runtime Errors**
   - Check browser console for detailed error messages
   - Verify Gemini API quota and billing status
   - Ensure environment variables are properly configured

### Performance Optimization

- Use browser dev tools to monitor performance
- Check Network tab for API response times
- Monitor localStorage usage for large conversation histories

## 🛠️ Development

### Getting Started
```bash
# Clone and setup
git clone https://github.com/echo93915/ContextFlow.git
cd ContextFlow
npm install

# Start development server with turbopack
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Built With
- [Next.js 15](https://nextjs.org/docs) - Full-stack React framework
- [shadcn/ui](https://ui.shadcn.com/) - Modern component library
- [Google Gemini API](https://ai.google.dev/docs) - Advanced AI integration
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first styling
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🙏 Acknowledgments

- Google AI Team for the powerful Gemini API
- shadcn for the beautiful UI component library
- Vercel team for the excellent Next.js framework
- The open-source community for inspiration and tools

---

**Built with ❤️ using modern web technologies**
