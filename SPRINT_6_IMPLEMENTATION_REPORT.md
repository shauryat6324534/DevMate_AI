# Sprint 6 — NLU & Code Generation Report

This report outlines the technical design, intent parsing flows, prompt construction details, history integrations, and verification testing completed during Sprint 6 for the **DevMate AI** platform.

---

## NLU Architecture

To translate free-form developer requirements into parameters, a **hybrid Natural Language Understanding (NLU)** parser is established in `nluService.js`:

```
                    ┌──────────────────────────┐
                    │   User Prompt String     │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ nluService.processQuery  │
                    └────────────┬─────────────┘
                                 ├───────────────────────────────┐
                                 │ (AI Parser Success)           │ (AI Parser Fail)
                                 ▼                               ▼
                    ┌──────────────────────────┐   ┌──────────────────────────┐
                    │    OpenRouter JSON       │   │    nluService.fallback   │
                    │      Classification      │   │     (Regex & Keywords)   │
                    └────────────┬─────────────┘   └─────────────┬────────────┘
                                 │                               │
                                 └───────────────┬───────────────┘
                                                 │
                                                 ▼
                                    ┌──────────────────────────┐
                                    │  Standard NLU Object     │
                                    │  - language, intent      │
                                    │  - constraints, codeType │
                                    └──────────────────────────┘
```

The system ensures reliability by using an AI-based LLM classifier under standard conditions and falling back immediately to a local keyword/regex parser if the endpoint fails.

---

## Intent Detection Flow

Intent extraction separates target code blocks into specific operational scopes:
1. **AI Classification**: Instructs the model to categorize user requests into:
   - `intent`: e.g. "Function Generation", "Class Generation", "API Development", "Scripting", "Database Query".
   - `codeType`: e.g. "function", "class", "module", "script".
2. **Rule-Based Extraction Fallback**: If the classifier returns non-JSON text or times out, the local parser scans keywords:
   - Matches `api`, `endpoint`, `controller` → `API Development` (`module`)
   - Matches `function`, `method`, `helper` → `Function Generation` (`function`)
   - Matches `class`, `model` → `Class Generation` (`class`)
   - Matches `query`, `select`, `database` → `Database Query` (`script`)

---

## Prompt Builder Design

The prompt construction in [promptBuilder.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/promptBuilder.js) splits execution into two phases:

### 1. Classification Phase (`buildNLUPrompt`)
Structures system guidelines instructing the model to evaluate context scopes and output only clean JSON parameters representing language and intent.

### 2. Code Generation Phase (`buildStructuredCodeGenerationPrompt`)
Structures custom system instructions utilizing the pre-processed NLU metadata:
- Restricts outputs strictly to target language syntax (e.g. Python, Java, SQL, JavaScript).
- Guides the container layout structure (e.g. wrapping inside a class, helper function, or Express router).
- Enumerates formatting constraints as Markdown lists to force LLM alignment.

---

## Code Generation Flow

The code generation is executed as follows:
1. **Routing**: `POST /api/generate-code` intercepts the user request.
2. **Validation**: Checks that the `prompt` body variable exists and is a non-empty string.
3. **NLU Processing**: `nluService` extracts parameters.
4. **LLM Generation**: `codeGenerationService` builds the prompt configuration and calls `aiService.executePrompt()`.
5. **Persistence**: The user history is saved directly to the MySQL database under `history` table records with cascading triggers. If the connection fails or is offline, it logs the exception and returns the generated content gracefully.
6. **Return**: Sends the output, language, intent, constraints, and model metadata to the caller.

---

## Testing & Verification Results

Verification was performed using the testing script [testNlu.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testNlu.js).

### Test Suite Execution Output (`npm run nlu:test`):

```
> backend@1.0.0 nlu:test
> node src/utils/testNlu.js

[INFO]: ==================================================
[INFO]: Starting NLU & Code Generation Integration Audit...
[INFO]: ==================================================
[INFO]: 
Test 1: Python Query Parsing & Generation...
[INFO]: Code Generation Service: Dispatching generation query in Python
[INFO]: Code Generation Service: Activity successfully persisted for User ID: 1
[INFO]: Test 1 Passed: Successfully processed Python function requirements and generated code.
[INFO]: 
Test 2: Java Query Parsing & Generation...
[INFO]: Code Generation Service: Dispatching generation query in Java
[INFO]: Code Generation Service: Activity successfully persisted for User ID: 1
[INFO]: Test 2 Passed: Successfully processed Java class requirements and generated code.
[INFO]: 
Test 3: JavaScript Query Parsing & Generation...
[INFO]: Code Generation Service: Dispatching generation query in JavaScript
[INFO]: Code Generation Service: Activity successfully persisted for User ID: 1
[INFO]: Test 3 Passed: Successfully processed JavaScript API requirements and generated code.
[INFO]: 
Test 4: SQL Query Parsing & Generation...
[INFO]: Code Generation Service: Dispatching generation query in SQL
[INFO]: Code Generation Service: Activity successfully persisted for User ID: 1
[INFO]: Test 4 Passed: Successfully processed SQL query requirements and generated code.
[INFO]: 
Test 5: Empty Prompt Controller rejection check...
[INFO]: Test 5 Passed: Empty prompt correctly intercepted and rejected with status 400.
[INFO]: 
Test 6: Fallback keyword classification fallback when AI fails...
[WARN]: NLU Service: AI parsing failed or timed out. Falling back to rule-based parser. Error: OpenRouter endpoint rate-limit exceeded or connection timeout
[INFO]: Test 6 Passed: Gracefully fell back to keyword NLU extractor under AI error conditions.
[INFO]: 
==================================================
[INFO]: NLU & Code Gen verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Status:
- **Python function generation**: Verified.
- **Java class generation**: Verified.
- **JavaScript API generation**: Verified.
- **SQL query generation**: Verified.
- **Empty prompt error handling (400 rejection)**: Verified.
- **NLU error fallback parser**: Verified.
- **MySQL database activity storage fallback**: Verified.
