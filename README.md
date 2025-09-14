# PMPanda - AI-Powered Product Manager Workbench

A React-based application that helps Product Managers create and iterate on comprehensive Product Requirements Documents (PRDs) and SPEC docs using AI assistance.

## 🎯 Project Goals

The PMPanda is designed to:

1. **Streamline PRD Creation**: Guide PMs through creating well-structured PRDs with AI assistance
2. **Support Multiple Templates**: Offer various PRD templates (Lean, Agile, Startup, Amazon, Technical, Enterprise)
3. **Provide Intelligent Assistance**: Use local LLM (Ollama) to generate content, suggest improvements, and validate completeness
4. **Enable Project Management**: Keep different projects' PRDs organized and separate
5. **Work Offline**: Use local AI model instead of cloud services for privacy and control

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   ChatView   │  │  PRDEditor   │  │  ProjectBar  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│            │               │                │            │
│            └───────────────┴────────────────┘            │
│                           │                              │
│                    ┌──────────────┐                      │
│                    │  Zustand     │                      │
│                    │  Store       │                      │
│                    └──────────────┘                      │
└─────────────────────────┬─────────────────────────────┘
                         │
                    HTTP (Port 3003)
                         │
┌─────────────────────────┴─────────────────────────────┐
│                 Backend (Express.js)                    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │   /ollama    │  │  /templates  │                   │
│  │   Proxy      │  │   Endpoint   │                   │
│  └──────────────┘  └──────────────┘                   │
└─────────────────────────┬─────────────────────────────┘
                         │
                    HTTP (Port 11434)
                         │
┌─────────────────────────┴─────────────────────────────┐
│                    Ollama Server                        │
│                  (mistral:7b-instruct)                  │
└─────────────────────────────────────────────────────┘
```

## 🚀 How It Works

### 1. **Template Selection**
When creating a new PRD, users must select a template type:
- **Lean PRD**: Minimal viable documentation (problem, solution, metrics)
- **Agile PRD**: User stories with acceptance criteria
- **Startup PRD**: Hypothesis-driven MVP approach
- **Amazon PRD**: Working backwards from press release
- **Technical PRD**: Engineering specifications
- **Enterprise PRD**: Comprehensive documentation with compliance

### 2. **AI-Assisted Generation**
The AI helps in three ways:

#### a. **Underspecified Request Handling**
If you provide minimal input (e.g., "build a fitness app"), the AI asks for:
- Problem being solved
- Target users
- Key features
- Success metrics
- Timeline/constraints

#### b. **Content Generation**
With sufficient details, the AI generates PRD sections:
- Uses existing content as context
- Follows template structure
- Maintains consistency across sections
- Suggests improvements

#### c. **General Guidance**
Answers questions about PRD best practices without generating content.

### 3. **Workflow**

```
User Input → Intent Analysis → Context Building → AI Processing → PRD Update
     ↓              ↓                ↓                 ↓              ↓
   Message    Categorize as:   Gather current    Send prompt    Update PRD
              - Underspecified  PRD content,      to Ollama     sections in
              - Generation      template type,                   real-time
              - Guidance        missing sections
```

### 4. **State Management**
- **Zustand Store**: Manages application state
- **LocalStorage**: Persists projects and PRDs
- **Real-time Updates**: Immediate UI updates as content is generated

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- Ollama installed locally
- mistral:7b-instruct model pulled in Ollama

### Backend Setup

```bash
cd backend
npm install
node server-simple.js
```

The backend runs on port 3003 and provides:
- `/ollama` - Proxy endpoint for Ollama API
- `/templates` - PRD template definitions

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend runs on port 3000 and provides the main UI.

### Ollama Setup

1. Install Ollama: https://ollama.ai
2. Pull the model:
```bash
ollama pull mistral:7b-instruct
```
3. Ensure Ollama is running (usually starts automatically)

## 🎨 Features

### Chat Interface (Left Panel)
- **AI Conversation**: Interactive chat with the AI assistant
- **Context-Aware**: AI sees your current PRD content
- **Smart Prompting**: Automatically determines what information is needed
- **Validation Feedback**: Shows missing required sections

### PRD Editor (Right Panel)
- **Section Management**: Expand/collapse sections
- **Live Editing**: Real-time updates as you type
- **AI Suggestions**: Click "Suggest" for AI-generated content
- **Prompt Helpers**: Click prompts to add guided questions
- **Completion Tracking**: Visual indicators for required/completed sections
- **Export Options**: Save as JSON or Markdown

### Project Management (Top Bar)
- **Multiple Projects**: Keep different PRDs separate
- **Project Switching**: Easy navigation between projects
- **Auto-Save**: Changes persist automatically
- **Project Deletion**: Remove projects when done

## 🧠 AI System Prompts

The AI uses a sophisticated prompt system:

1. **System Prompt**: Defines the AI's role and behavior
2. **Context Accumulation**: Includes current PRD content
3. **Template Awareness**: Understands the selected template structure
4. **Validation Logic**: Identifies missing required sections

See `/prompts/` directory for all extracted prompts.

## 📁 Project Structure

```
pmhelper/
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main application component
│   │   ├── components/
│   │   │   ├── ChatView.js        # Chat interface
│   │   │   ├── PRDEditor.js       # PRD editing interface
│   │   │   ├── ProjectBar.js      # Project management
│   │   │   └── TemplateSelector.js # Template selection modal
│   │   ├── services/
│   │   │   └── ollamaService.js   # Ollama API integration
│   │   ├── store/
│   │   │   └── appStore.js        # Zustand state management
│   │   └── config/
│   │       └── systemPrompts.js   # AI system prompts
│   └── package.json
│
├── backend/
│   ├── server-simple.js           # Express server
│   ├── templates/                 # PRD template definitions
│   │   ├── lean-prd.json
│   │   ├── agile-prd.json
│   │   ├── startup-prd.json
│   │   ├── amazon-prd.json
│   │   ├── technical-prd.json
│   │   └── enterprise-prd.json
│   └── package.json
│
└── prompts/                        # Extracted AI prompts
    ├── 00-prompt-index.md
    ├── 01-main-system-prompt.md
    ├── 02-underspecified-request-prompt.md
    ├── 03-prd-generation-prompt.md
    └── 04-general-guidance-prompt.md
```

## 🔧 Configuration

### Timeouts
- Frontend: 5 minutes for AI responses
- Backend: 5 minutes for Ollama requests
- Configurable in `ollamaService.js` and `server-simple.js`

### Token Limits
- Default: 4096 tokens per response
- Configurable in `ollamaService.js`

### Model Selection
- Default: mistral:7b-instruct
- Changeable in `ollamaService.js`

## 🐛 Troubleshooting

### "AI thinking..." hangs
- Check Ollama is running: `ollama list`
- Verify model is installed: `ollama pull mistral:7b-instruct`
- Check backend logs for errors
- May need to increase timeout for complex PRDs

### PRD content not updating
- Ensure backend is running on port 3003
- Check browser console for errors
- Verify localStorage isn't full

### Template not loading
- Backend must be running to serve templates
- Check `/backend/templates/` directory exists
- Verify template JSON files are valid

## 🚦 Development

### Running in Development

1. Start backend:
```bash
cd backend
node server-simple.js
```

2. Start frontend:
```bash
cd frontend
npm start
```

3. Access at http://localhost:3000

### Adding New Templates

1. Create JSON file in `/backend/templates/`
2. Follow existing template structure
3. Include sections with title, description, prompts, and required flag
4. Restart backend to load new template

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📚 Documentation

- [PRD Workflow Specification](PRD_WORKFLOW_SPECIFICATION.md)
- [System Prompt Template](SYSTEM_PROMPT_TEMPLATE.md)
- [Prompt Index](/prompts/00-prompt-index.md)
- [Template Definitions](/backend/templates/)

## 🆘 Support

For issues or questions:
- Check the troubleshooting section
- Review the documentation
- Open an issue on GitHub
