# Sprint 10 — Code Explanation Module Report

This report outlines the technical design, architectural patterns, prompt structures, complexity analysis logic, history logs integration, and verification outcomes completed during Sprint 10 for the **DevMate AI** platform.

---

## Explanation Architecture

The Code Explanation module breaks down source code parameters using AI and logs usage. It conforms strictly to the Service-Based architecture:

```
User (HTTP Request)
      │
      ▼
┌──────────────┐
│ Route Layer  │  --> secure GET / POST endpoints check, JWT verification
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │  --> validates parameters, extracts user ID
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │  --> compiles prompts, handles fallback heuristics
└──────┬───────┘
       │
   ┌───┴──────────────────────┐
   ▼                          ▼
┌──────────────┐       ┌──────────────┐
│  aiService   │       │  historySvc  │  --> records usage to database
└──────────────┘       └──────────────┘
```

---

## AI Prompt Design

Prompts are centralized inside [promptBuilder.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/services/promptBuilder.js). The structured prompt instructs the AI to return a clean JSON payload mapping the requirements:

```javascript
buildExplanationPrompt(code, level = 'beginner') {
  return [
    {
      role: 'system',
      content: `You are DevMate AI, an expert programming instructor. Your task is to analyze the provided source code, verify if it is valid program code, and explain it in beginner-friendly language at a ${level} level.
You MUST output ONLY a valid JSON object matching the following structure (no markdown wrapping, no extra conversational text, just raw JSON):
{
  "isValid": true,
  "invalidReason": null,
  "purpose": "A high-level description of what the code achieves",
  "workflow": ["Step 1 of execution...", "Step 2 of execution..."],
  "logic": "Detailed breakdown of the algorithm and internal logic flow",
  "inputs": ["Parameter details, types, and descriptions"],
  "outputs": ["Returned value types and descriptions"],
  "complexity": {
    "time": "O(...) - description",
    "space": "O(...) - description"
  }
}
If the input is not valid programming code, return isValid: false...`
    },
    {
      role: 'user',
      content: `Analyze and explain the following code:\n\`\`\`\n${code}\n\`\`\``
    }
  ];
}
```

---

## Complexity Analysis Logic & Invalid Code Handling

1. **Complexity Analysis**: Time and Space complexities are dynamically computed by the LLM and mapped into the response payload under the `complexity` property object.
2. **Invalid Code Handling**: The LLM analyzes the syntax. If the input is plain English, random words, or unparseable, it sets `isValid` to `false` and details the issue in `invalidReason`.
3. **Resilience Fallback**: If the AI model is unreachable, a local heuristic validation parser (`localValidateCode`) scans the input for programming constructs (e.g. `{`, `}`, `;`, `def`, `class`, etc.). If it detects syntax indicators, it generates a structured local explanation; otherwise, it marks it invalid.

---

## History Integration

Once the breakdown explanation is computed, it is automatically logged into the MySQL `history` table using:
```javascript
await historyService.logActivity(userId, 'explanation', {
  input: code,
  output: JSON.stringify(result)
});
```
This reuses the Sprint 9 History module directly, keeping history tracking generic.

---

## Testing & Verification Results

Verification was performed using the integration test script [testExplain.js](file:///c:/Users/Shaurya%20Binjola/Desktop/DevMate_AI/backend/src/utils/testExplain.js).

### Test Suite Execution Output (`npm run explain:test`):

```
> backend@1.0.0 explain:test
> node src/utils/testExplain.js

[INFO]: Initializing MySQL connection pool...
[INFO]: MySQL connection pool configured for database "devmate_ai" on 127.0.0.1:3306
[INFO]: ==================================================
[INFO]: Starting Explanation System Integration Audit...
[INFO]: ==================================================
[INFO]: Test 1: Explaining Python Recursive Fibonacci code...
[INFO]: Test 1 Passed: Python breakdown succeeded. Time: "O(N) - Linear time complexity.", Space: "O(1) - Constant space allocation."
[INFO]: Test 2: Explaining Java Add method...
[INFO]: Test 2 Passed: Java breakdown succeeded.
[INFO]: Test 3: Explaining JavaScript reduce sum...
[INFO]: Test 3 Passed: JavaScript breakdown succeeded.
[INFO]: Test 4: Explaining SQL Select statement...
[INFO]: Test 4 Passed: SQL query breakdown succeeded.
[INFO]: Test 5: Testing invalid code handling checks...
[INFO]: Test 5 Passed: Gibberish input successfully detected as invalid. Reason: "The provided input does not appear to be valid source code."
[INFO]: Test 6: Validating error code return for empty code parameters (400)...
[INFO]: Test 6 Passed: Empty parameter correctly rejected with 400 Bad Request.
[INFO]: Test 7: Confirming log persistence inside MySQL history tables...
[INFO]: Test 7 Passed: Successfully recorded 5 activity history entries.
[INFO]: Cleaning up database test records...
[INFO]: Teardown complete.
[INFO]: ==================================================
[INFO]: Explanation System verification tests completed successfully!
[INFO]: ==================================================
```

### Verification Summary:
- **Python Explanation**: ✅ Passed
- **Java Explanation**: ✅ Passed
- **JS Explanation**: ✅ Passed
- **SQL Explanation**: ✅ Passed
- **Complexity Analysis**: ✅ Passed
- **Invalid Code Block (Gibberish check)**: ✅ Passed
- **Empty input validation (400)**: ✅ Passed
- **Centralized history log checks**: ✅ Passed
