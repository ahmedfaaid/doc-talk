# Legal Document RAG System

## Overview

This project implements a Retrieval-Augmented Generation (RAG) system specifically designed for legal documents. It combines vector search (ChromaDB) with graph-based knowledge representation (Neo4j) to provide enhanced retrieval capabilities for legal queries.

## Architecture

The system consists of the following components:

### Backend (Node.js/TypeScript)

- **File Management**: Upload, storage, and retrieval of legal documents
- **Document Processing**: Extraction of text, chunking, and vectorization
- **Vector Database (ChromaDB)**: Semantic search capabilities
- **Graph Database (Neo4j)**: Entity and relationship storage
- **Entity Extraction**: Identification of legal entities and relationships
- **Legal Agent**: AI-powered query processing with specialized legal tools

### Frontend (React/TypeScript)

- **File Upload Interface**: Upload legal documents with metadata
- **Chat Interface**: Interact with the legal agent
- **Document Management**: View and manage legal documents

## Key Features

1. **Legal Document Processing**
   - Support for various document formats (PDF, DOCX, TXT, etc.)
   - Automatic extraction of legal entities and relationships
   - Jurisdiction and document type classification

2. **Hybrid Search**
   - Vector-based semantic search using ChromaDB
   - Graph-based relationship search using Neo4j
   - Combined results for improved relevance

3. **Legal Agent**
   - Specialized tools for legal reasoning
   - Context-aware responses
   - Citation of relevant legal documents

## API Endpoints

### File Management

- `POST /files/upload`: Upload a new file
- `GET /files/upload/progress/{id}`: Get upload progress
- `GET /files/vector/progress/{id}`: Get vectorization progress
- `POST /files/legal/mark`: Mark a file as a legal document

### Legal Agent

- `POST /legal/query`: Submit a legal query

## Database Schema

### Files Table

- Standard file metadata (id, filename, path, etc.)
- Legal document specific fields:
  - `isLegalDocument`: Boolean flag
  - `jurisdiction`: Legal jurisdiction
  - `documentType`: Type of legal document

## Getting Started

### Prerequisites

- Node.js 18+
- ChromaDB
- Neo4j
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd backend
   npm install
   cd ../client
   npm install
   ```
3. Configure environment variables (see `.env.example`)
4. Start the backend:
   ```
   cd backend
   npm run dev
   ```
5. Start the frontend:
   ```
   cd client
   npm run dev
   ```

## Usage

1. Upload legal documents through the UI
2. Mark documents as legal documents with jurisdiction and document type
3. Submit legal queries through the chat interface
4. View responses with citations and reasoning

## Technical Implementation

### Document Processing Pipeline

1. Document upload and storage
2. Text extraction and chunking
3. Vector embedding generation
4. Entity and relationship extraction
5. Storage in ChromaDB and Neo4j

### Query Processing Pipeline

1. Query analysis
2. Tool selection and execution
3. Hybrid search (vector + graph)
4. Response generation with citations

## Future Enhancements

- Support for more document types
- Advanced legal reasoning capabilities
- Integration with legal research databases
- Multi-language support
- Batch processing of legal documents