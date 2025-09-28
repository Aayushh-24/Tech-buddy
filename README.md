# TechBuddy - AI Technical Documentation Platform

![TechBuddy Logo](https://via.placeholder.com/150x50?text=TechBuddy)

A modern, AI-powered technical documentation platform that enables users to create, manage, and query technical documentation with advanced RAG (Retrieval-Augmented Generation) capabilities.

## 🌟 Features

### 📄 Document Q&A with RAG
- **Smart Document Processing**: Advanced PDF and DOCX text extraction
- **Intelligent Chunking**: Structure-aware text segmentation with overlap
- **Vector Embeddings**: Hugging Face-powered semantic embeddings
- **Contextual Answers**: RAG-enhanced responses with source citations
- **Real-time Processing**: Asynchronous document processing with status tracking

### 🔗 GitHub Connect
- **Repository Integration**: Connect and analyze GitHub repositories
- **Content Extraction**: Fetch README files and repository metadata
- **Q&A System**: Ask questions about repository content
- **Multi-repo Support**: Manage multiple repository connections

### 🤖 DocuStart-Inspired Generator
- **Smart Configuration**: Choose document type, tone, and target audience
- **Code Context**: Add multiple code snippets with language and framework info
- **AI Generation**: OpenRouter-powered content generation
- **Export Options**: Copy, download, or save generated documents
- **Template System**: Pre-configured templates for different document types

### 🧠 AI Assistant
- **Technical Expertise**: Code review, debugging, and architecture advice
- **Quick Actions**: Pre-built prompts for common tasks
- **Multi-domain Support**: Help with various technical domains
- **Feedback System**: Rate responses for continuous improvement

### ⚙️ Advanced Settings
- **Secure API Management**: Safe storage of API keys with environment variables
- **Notification Preferences**: Customizable notification settings
- **User Preferences**: Theme, default settings, and auto-save options
- **RAG Configuration**: Advanced RAG pipeline settings and statistics

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Modern utility-first CSS framework
- **shadcn/ui**: High-quality UI component library
- **Lucide React**: Beautiful icon library
- **Framer Motion**: Smooth animations and transitions

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Database management with SQLite
- **Z-AI Web Dev SDK**: AI integration for content generation
- **Hugging Face Inference**: Advanced embeddings and AI models

### RAG Pipeline
- **Advanced Text Processing**: PDF parsing with pdf-parse, DOCX with mammoth
- **Vector Store**: In-memory vector similarity search
- **Semantic Search**: Cosine similarity for context retrieval
- **Chunking Strategies**: Structure-aware text segmentation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for Hugging Face and OpenRouter

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd techbuddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your API keys:
   ```env
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
   CHUNK_SIZE=1000
   CHUNK_OVERLAP=200
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Key Setup

### Hugging Face API Key
1. Visit [Hugging Face](https://huggingface.co/)
2. Sign up or log in to your account
3. Go to Profile → Settings → Access Tokens
4. Create a new token with "read" permissions
5. Add it to your `.env` file as `HUGGINGFACE_API_KEY`

### OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in to your account
3. Go to API Keys section
4. Generate a new API key
5. Add it to your `.env` file as `OPENROUTER_API_KEY`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── documents/     # Document management
│   │   ├── github/        # GitHub integration
│   │   ├── generate/      # Document generation
│   │   ├── assistant/     # AI assistant
│   │   ├── settings/      # Settings management
│   │   └── rag/          # RAG system endpoints
│   ├── documents/         # Document Q&A pages
│   ├── github/           # GitHub Connect pages
│   ├── generator/        # Doc Generator pages
│   ├── assistant/        # AI Assistant pages
│   └── settings/         # Settings pages
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/              # shadcn/ui components
│   ├── error-boundary/  # Error handling
│   └── loading/         # Loading states
├── lib/                  # Utility libraries
│   ├── rag/             # RAG pipeline implementation
│   ├── db.ts           # Database connection
│   └── utils.ts        # Utility functions
└── hooks/               # Custom React hooks
```

## 🧠 RAG Pipeline Architecture

The RAG (Retrieval-Augmented Generation) pipeline consists of several key components:

### 1. Document Processing
- **Text Extraction**: Uses `pdf-parse` for PDFs and `mammoth` for DOCX files
- **Advanced Chunking**: Structure-aware segmentation with configurable overlap
- **Metadata Preservation**: Maintains document structure and context

### 2. Embedding Generation
- **Hugging Face Models**: Uses `sentence-transformers/all-MiniLM-L6-v2` for embeddings
- **Batch Processing**: Efficient batch processing to avoid rate limits
- **Dimensionality**: 384-dimensional embeddings for semantic search

### 3. Vector Storage
- **In-Memory Store**: Fast vector similarity search
- **Cosine Similarity**: Accurate semantic matching
- **Metadata Indexing**: Efficient filtering and retrieval

### 4. Query Processing
- **Query Embedding**: Convert user questions to vector space
- **Context Retrieval**: Find most relevant document chunks
- **Answer Generation**: AI-powered response with source citations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HUGGINGFACE_API_KEY` | Hugging Face API key for embeddings | Required |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI generation | Required |
| `EMBEDDING_MODEL` | Hugging Face embedding model | `sentence-transformers/all-MiniLM-L6-v2` |
| `CHUNK_SIZE` | Text chunk size in characters | `1000` |
| `CHUNK_OVERLAP` | Chunk overlap in characters | `200` |
| `SIMILARITY_THRESHOLD` | Minimum similarity for retrieval | `0.5` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` |

### RAG Pipeline Settings

The RAG pipeline can be configured through the `RAGPipeline` class:

```typescript
const ragPipeline = new RAGPipeline({
  huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
  chunkSize: 1000,
  chunkOverlap: 200,
  similarityThreshold: 0.5
})
```

## 📊 Features in Detail

### Document Q&A with RAG
- **Upload Support**: PDF and DOCX files up to 10MB
- **Processing Status**: Real-time tracking of document processing
- **Smart Answers**: Context-aware responses with source citations
- **Confidence Scoring**: Response confidence metrics
- **Performance Metrics**: Processing time and system statistics

### GitHub Integration
- **Repository Analysis**: Fetch repository information and content
- **README Processing**: Extract and process README files
- **Multi-repo Support**: Connect multiple repositories
- **Query Interface**: Natural language questions about code

### Document Generation
- **Template System**: Pre-configured templates for different document types
- **Customizable Output**: Adjust tone, audience, and structure
- **Code Integration**: Include code snippets with syntax highlighting
- **Export Options**: Multiple formats and sharing options

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. **Production Database**: Configure production database URL
2. **API Keys**: Set up production API keys
3. **Security**: Ensure all environment variables are properly set
4. **Monitoring**: Set up logging and monitoring

## 🔒 Security

### API Key Management
- **Environment Variables**: All API keys stored in environment variables
- **Git Protection**: `.gitignore` prevents accidental key exposure
- **Runtime Security**: Keys only accessible on the server

### File Upload Security
- **Type Validation**: Only allowed file types (PDF, DOCX)
- **Size Limits**: 10MB maximum file size
- **Virus Scanning**: Basic file validation (extend as needed)

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: User-based access control (ready for implementation)
- **Data Retention**: Configurable data retention policies

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the established linting rules
- **Testing**: Add tests for new functionality
- **Documentation**: Update documentation for new features

## 📈 Performance

### Benchmarks
- **Document Processing**: ~2-5 seconds for average documents
- **Query Response**: ~1-3 seconds for RAG-powered answers
- **Embedding Generation**: ~100ms per chunk (batch processed)
- **Similarity Search**: <10ms for vector search

### Optimization
- **Batch Processing**: Efficient API usage with batching
- **Caching**: In-memory vector store for fast retrieval
- **Async Processing**: Non-blocking document processing
- **Rate Limiting**: Respect API rate limits

## 🐛 Troubleshooting

### Common Issues

#### API Key Problems
```bash
# Check if API keys are set
echo $HUGGINGFACE_API_KEY
echo $OPENROUTER_API_KEY
```

#### Database Issues
```bash
# Reset database
npm run db:reset

# Regenerate Prisma client
npm run db:generate
```

#### Build Problems
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Error Messages
- **"HuggingFace API key is not configured"**: Add your Hugging Face API key to `.env`
- **"Document is still being processed"**: Wait for document processing to complete
- **"Failed to process document"**: Check file format and size limits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hugging Face**: For the amazing embedding models and inference API
- **OpenRouter**: For providing access to powerful AI models
- **shadcn/ui**: For the beautiful and accessible UI components
- **Next.js**: For the excellent React framework
- **Prisma**: For the modern database toolkit

## 📞 Support

For support, please:
1. Check the [troubleshooting guide](#-troubleshooting)
2. Search existing [issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information

---

**TechBuddy** - Empowering technical documentation with AI 🚀