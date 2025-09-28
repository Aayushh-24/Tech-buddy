# TechBuddy Deployment Guide

## Overview

TechBuddy is a modern AI-powered technical documentation platform built with Next.js 15, TypeScript, and Tailwind CSS. This guide will walk you through deploying the application step by step.

## Features

- **Document Q&A**: Upload PDF/DOCX files and ask questions using RAG technology
- **AI Assistant**: Technical help with code review, documentation, and debugging
- **GitHub Integration**: Repository analysis and documentation generation
- **Secure API Management**: Client-side API key storage with localStorage
- **Modern UI**: Professional interface with hover effects and animations

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key (for AI features)
- HuggingFace API key (for document embeddings)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# HuggingFace API Key for document embeddings
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: OpenRouter API Key (fallback for server-side operations)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Database (SQLite - no additional setup required)
DATABASE_URL="file:./dev.db"

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
SIMILARITY_THRESHOLD=0.5
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npm run db:push

# (Optional) View database
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/techbuddy.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     - `HUGGINGFACE_API_KEY`
     - `OPENROUTER_API_KEY` (optional)
   - Deploy

### Option 2: Netlify

1. **Build the Application**
   ```bash
   npm run build
   npm run export  # If using static export
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `out` folder (if using static export)
   - Or connect your GitHub repository
   - Add environment variables

### Option 3: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t techbuddy .
   docker run -p 3000:3000 --env-file .env.local techbuddy
   ```

### Option 4: Traditional Server

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Set Up Reverse Proxy (Nginx Example)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Security Considerations

### API Key Management

✅ **Secure Implementation**:
- API keys are stored in localStorage (client-side)
- Keys are never exposed in server logs or code
- Server-side API calls use authorization headers
- Keys are validated before use

❌ **What to Avoid**:
- Never hardcode API keys in source code
- Never commit API keys to version control
- Never expose API keys in browser console
- Never use API keys in client-side URLs

### Environment Variables

Add these to your deployment platform's environment variables:

```env
# Required
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx

# Optional (fallback)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxx

# Database
DATABASE_URL="file:./dev.db"

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
SIMILARITY_THRESHOLD=0.5
```

## Configuration

### Customizing RAG Settings

You can adjust the RAG (Retrieval-Augmented Generation) settings:

```env
# Larger chunks for more context, smaller for more precise retrieval
CHUNK_SIZE=1000

# More overlap for better context continuity
CHUNK_OVERLAP=200

# Lower threshold for more results, higher for more relevant results
SIMILARITY_THRESHOLD=0.5
```

### Database Configuration

The application uses SQLite by default. For production, you might want to use PostgreSQL:

1. **Update DATABASE_URL**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/techbuddy"
   ```

2. **Update Prisma Schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Run Migration**
   ```bash
   npx prisma migrate dev
   ```

## Testing the Deployment

### 1. Check API Key Status

- Visit the Settings page
- Add your OpenRouter API key: `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`
- Click "Save & Validate API Key"
- Verify the status shows "Connected"

### 2. Test AI Features

- **Assistant**: Go to AI Assistant page and ask a technical question
- **Document Q&A**: Upload a PDF and ask questions about it
- **GitHub Integration**: Add your GitHub token and test repository analysis

### 3. Verify All Pages

- [ ] Home page loads with gradient effects
- [ ] Settings page shows API key status
- [ ] Assistant page works with real AI responses
- [ ] Documents page allows file upload
- [ ] All hover effects and animations work

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key format: `sk-or-v1-xxxxxxxxxxx`
   - Check if the key is valid in OpenRouter dashboard
   - Ensure you're clicking "Save & Validate API Key"

2. **Document Upload Failing**
   - Check file size (max 10MB)
   - Verify file type (PDF/DOCX only)
   - Ensure HuggingFace API key is valid

3. **Build Errors**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`
   - Check TypeScript version compatibility

4. **Database Issues**
   - Delete `dev.db` and run `npm run db:push` again
   - Check file permissions
   - Verify Prisma schema

### Performance Optimization

1. **Enable Caching**
   ```bash
   # Next.js built-in caching
   npm run build
   ```

2. **Optimize Images**
   - Use Next.js Image component
   - Compress images before upload

3. **Monitor Performance**
   - Use Vercel Analytics
   - Check browser DevTools
   - Monitor API response times

## Domain and SSL

### Custom Domain

1. **Vercel**: Add domain in Vercel dashboard
2. **Netlify**: Add domain in Netlify dashboard
3. **Custom Server**: Configure domain in DNS and set up SSL

### SSL Certificate

- **Vercel/Netlify**: Automatic SSL
- **Custom Server**: Use Let's Encrypt
  ```bash
  certbot --nginx -d yourdomain.com
  ```

## Backup and Maintenance

### Database Backup

```bash
# SQLite backup
cp dev.db backup-$(date +%Y%m%d).db

# PostgreSQL backup
pg_dump techbuddy > backup-$(date +%Y%m%d).sql
```

### Regular Maintenance

1. **Update Dependencies**
   ```bash
   npm update
   ```

2. **Monitor Logs**
   ```bash
   # Vercel
   vercel logs techbuddy

   # Custom server
   journalctl -u techbuddy
   ```

3. **Performance Monitoring**
   - Set up analytics
   - Monitor error rates
   - Track user engagement

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify environment variables
4. Check API key validity

## Next Steps

After deployment:
1. Set up analytics (Google Analytics, Plausible)
2. Configure error monitoring (Sentry, LogRocket)
3. Set up automated backups
4. Monitor performance and user feedback

---

**Note**: This application uses client-side API key storage for maximum security. Your API keys are never stored on servers and are safe even if the code is shared publicly.