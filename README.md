# DevMate AI

## Project Overview

DevMate AI is a SaaS-style AI-powered coding assistant designed to help developers generate, understand, debug, optimize, document, review, and learn code using Large Language Models.

The platform transforms natural language requirements into production-ready code while maintaining conversation history, user-specific workspaces, downloadable outputs, and secure authentication.

---

## Project Objective

The objective of DevMate AI is to enhance developer productivity by providing an intelligent coding assistant capable of:

* Generating code from natural language prompts
* Explaining generated code
* Detecting bugs and errors
* Suggesting optimized solutions
* Generating documentation
* Reviewing code quality
* Teaching programming concepts
* Maintaining conversation history
* Providing downloadable outputs

---

## Core Features

### Natural Language Understanding

* Intent Detection
* Programming Language Detection
* Constraint Extraction
* Prompt Structuring

### Code Generation

* Natural Language → Code
* Multi-Language Support
* Function Generation
* Class Generation
* Module Generation

### Code Explanation

* Line-by-Line Explanation
* Logic Breakdown
* Workflow Explanation
* Time Complexity Analysis
* Space Complexity Analysis

### Debugging Assistant

* Syntax Error Detection
* Logical Error Detection
* Root Cause Analysis
* Corrected Code Suggestions

### Optimization Engine

* Performance Improvements
* Memory Optimization
* Maintainability Improvements
* Industry Best Practices

### Documentation Generator

* README Generation
* API Documentation
* Function Documentation
* Inline Comment Generation

### Code Review System

* Code Quality Analysis
* Naming Convention Validation
* Code Smell Detection
* Refactoring Suggestions

### Learning Assistant

* Programming Guidance
* Concept Explanations
* Coding Exercises
* Learning Paths

### Conversation System

* New Chat
* Continue Chat
* Chat Management
* Persistent Conversations

### Download System

* TXT Export
* Markdown Export

### User Management

* Registration
* Login
* JWT Authentication
* Profile Management

---

## Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* MySQL

### AI Integration

* OpenRouter

Primary Model:
qwen/qwen3-coder:free

Fallback Model:
deepseek/deepseek-v4-flash:free

---

## High-Level Architecture

User

↓

Frontend

↓

Routes

↓

Controllers

↓

Services

↓

AI Service / Database Layer

↓

Response

---

## Project Modules

1. Natural Language Understanding
2. Code Generation
3. Code Explanation
4. Debugging Assistant
5. Optimization Engine
6. Documentation Generator
7. Code Review System
8. Learning Assistant
9. Conversation System
10. Message Persistence
11. History Tracking
12. Download System
13. Authentication & Authorization

---

## Architecture Rules

### Controllers

Responsibilities:

* Request Validation
* Request Handling
* Response Formatting

Controllers must NOT contain business logic.

### Services

Responsibilities:

* Business Logic
* AI Operations
* Data Processing

### Database Layer

Responsibilities:

* Database Operations Only

### AI Layer

Responsibilities:

* Prompt Execution
* Retry Logic
* Failover Logic
* Model Communication

No module may directly communicate with OpenRouter except aiService.js.

---

## Security Requirements

* JWT Authentication
* Password Hashing
* Protected Routes
* Input Validation
* User Isolation
* Rate Limiting
* Helmet Security
* Secure Environment Variables

---

## Development Rules

1. Read README.md before every sprint.
2. Read PROJECT_CONTEXT.md before every sprint.
3. Maintain backward compatibility.
4. Reuse existing services whenever possible.
5. Avoid duplicate logic.
6. Follow service-based architecture.
7. Generate sprint reports after every sprint.
8. Verify functionality before completion.
9. Follow production-grade coding standards.
10. Never break previous sprint functionality.
