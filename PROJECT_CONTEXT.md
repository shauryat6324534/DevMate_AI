# PROJECT_CONTEXT

## Project Name

DevMate AI

---

## Project Vision

DevMate AI aims to become an intelligent developer companion capable of helping programmers throughout the software development lifecycle.

The platform combines code generation, explanation, debugging, optimization, documentation, review, and learning assistance into a single unified AI-powered experience.

---

## Primary Objective

Build a SaaS-style AI Coding Assistant that can:

* Generate Code
* Explain Code
* Debug Code
* Optimize Code
* Generate Documentation
* Review Code Quality
* Teach Programming Concepts

while supporting:

* Authentication
* Persistent Conversations
* History Tracking
* Downloadable Outputs

---

## Module Dependency Flow

Authentication

↓

Conversations

↓

Messages

↓

History

↓

AI Features

---

## AI Architecture

All AI-powered features must use:

* aiService.js
* promptBuilder.js

Direct OpenRouter access is prohibited.

---

## AI Request Flow

Controller

↓

Feature Service

↓

Prompt Builder

↓

AI Service

↓

OpenRouter

↓

Response

---

## Module 1 — Natural Language Understanding

Responsibilities:

* Intent Detection
* Language Detection
* Constraint Extraction
* Prompt Preparation

---

## Module 2 — Code Generation

Responsibilities:

* Generate Functions
* Generate Classes
* Generate Modules
* Support Multiple Languages

---

## Module 3 — Code Explanation

Responsibilities:

* Explain Logic
* Explain Workflow
* Explain Complexity
* Provide Beginner-Friendly Explanations

---

## Module 4 — Debugging Assistant

Responsibilities:

* Detect Errors
* Explain Root Causes
* Suggest Fixes
* Generate Corrected Code

---

## Module 5 — Optimization Engine

Responsibilities:

* Improve Performance
* Improve Readability
* Improve Maintainability
* Recommend Best Practices

---

## Module 6 — Documentation Generator

Responsibilities:

* README Generation
* API Documentation
* Function Documentation
* Comment Generation

---

## Module 7 — Code Review System

Responsibilities:

* Quality Analysis
* Code Smell Detection
* Naming Convention Validation
* Refactoring Suggestions

---

## Module 8 — Learning Assistant

Responsibilities:

* Concept Explanations
* Coding Exercises
* Learning Paths
* Programming Guidance

---

## Module 9 — Conversation System

Responsibilities:

* New Chat
* Continue Chat
* Chat Management
* User Isolation

---

## Module 10 — Message Persistence

Responsibilities:

* Store User Messages
* Store AI Responses
* Retrieve Message History

---

## Module 11 — History System

Responsibilities:

* Track Feature Usage
* Retrieve User History
* Maintain User Isolation

History must be maintained for:

* Code Generation
* Code Explanation
* Debugging
* Optimization
* Documentation
* Code Reviews
* Learning Assistant

---

## Module 12 — Download System

Supported Downloads:

* Generated Code
* Explanations
* Documentation
* Review Reports
* Learning Content

Formats:

* TXT
* Markdown (.md)

---

## Database Tables

users

conversations

messages

history

downloads

---

## Non-Functional Requirements

* Scalable
* Secure
* Maintainable
* Modular
* Production Ready

---

## Future Scope

* Multi-AI Provider Support
* Team Collaboration
* Code Execution Sandbox
* Voice Input
* Subscription Plans
* Admin Dashboard

---

## Mandatory Sprint Rule

Every sprint must generate:

SPRINT_X_IMPLEMENTATION_REPORT.md

The report must include:

* Sprint Objective
* Files Created
* Files Modified
* Architecture Decisions
* Database Changes
* API Changes
* Service Layer Changes
* Testing Results
* Verification Results
* Security Considerations
* Future Improvements

The report should be detailed enough for another developer to understand the implementation without reading the source code.
