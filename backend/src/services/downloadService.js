import { query } from '../config/db.js';
import historyService from './historyService.js';
import logger from '../utils/logger.js';

/**
 * Custom formatters to map structured JSON values into pretty Markdown.
 */
const formatMarkdown = (featureType, outputText) => {
  let parsed = null;
  try {
    parsed = JSON.parse(outputText);
  } catch (err) {
    return `# Export Output\n\n${outputText}`;
  }

  if (featureType === 'explanation') {
    return `# Code Explanation Report

## Purpose
${parsed.purpose || 'N/A'}

## Logic
${parsed.logic || 'N/A'}

## Workflow
${Array.isArray(parsed.workflow) ? parsed.workflow.map(step => `- ${step}`).join('\n') : 'N/A'}

## Complexity
- **Time Complexity**: ${parsed.complexity?.time || 'N/A'}
- **Space Complexity**: ${parsed.complexity?.space || 'N/A'}`;
  }

  if (featureType === 'readme') return parsed.readme || '';
  if (featureType === 'function-docs') return parsed.functionDocs || '';
  if (featureType === 'api-docs') return parsed.apiDocs || '';
  if (featureType === 'comments') return parsed.commentedCode || '';

  if (featureType === 'review') {
    const naming = Array.isArray(parsed.namingConventions)
      ? parsed.namingConventions.map(n => `- **${n.variable}**: ${n.status} - ${n.recommendation}`).join('\n')
      : 'N/A';
    const smells = Array.isArray(parsed.codeSmells)
      ? parsed.codeSmells.map(s => `- **${s.type}** (Line ${s.line}): ${s.description}`).join('\n')
      : 'N/A';
    const anti = Array.isArray(parsed.antiPatterns)
      ? parsed.antiPatterns.map(a => `- **${a.pattern}**: ${a.description}`).join('\n')
      : 'N/A';
    const refac = Array.isArray(parsed.refactoringOpportunities)
      ? parsed.refactoringOpportunities.map(r => `- **${r.target}**: ${r.description}`).join('\n')
      : 'N/A';
    const bp = Array.isArray(parsed.bestPractices)
      ? parsed.bestPractices.map(b => `- ${b}`).join('\n')
      : 'N/A';

    return `# Code Review Report

- **Quality Score**: ${parsed.qualityScore}/100
- **Readability Score**: ${parsed.readabilityScore}/100
- **Maintainability Score**: ${parsed.maintainabilityScore}/100

## Naming Conventions
${naming}

## Code Smells
${smells}

## Anti-Patterns
${anti}

## Refactoring Opportunities
${refac}

## Best Practices
${bp}`;
  }

  if (featureType === 'learning-assistant') {
    const steps = Array.isArray(parsed.learningPath)
      ? parsed.learningPath.map(s => `- ${s}`).join('\n')
      : 'N/A';
    const ex = Array.isArray(parsed.exercises)
      ? parsed.exercises.map(e => `### ${e.title}\n**Description**: ${e.description}\n**Template**:\n\`\`\`\n${e.codeTemplate}\n\`\`\``).join('\n\n')
      : 'N/A';

    return `# Programming Lesson

## Explanation
${parsed.explanation || 'N/A'}

## Suggested Learning Path
${steps}

## Practice Exercises
${ex}

## Summary Response
${parsed.response || 'N/A'}`;
  }

  return `# Export Output\n\n${outputText}`;
};

/**
 * Custom formatters to map structured JSON values into pretty Plain Text.
 */
const formatPlainText = (featureType, outputText) => {
  let parsed = null;
  try {
    parsed = JSON.parse(outputText);
  } catch (err) {
    return outputText;
  }

  if (featureType === 'explanation') {
    return `Code Explanation Report
========================
Purpose: ${parsed.purpose || 'N/A'}
Logic: ${parsed.logic || 'N/A'}
Workflow:
${Array.isArray(parsed.workflow) ? parsed.workflow.map(step => `  - ${step}`).join('\n') : '  - N/A'}
Complexity:
  - Time Complexity: ${parsed.complexity?.time || 'N/A'}
  - Space Complexity: ${parsed.complexity?.space || 'N/A'}`;
  }

  if (featureType === 'readme') return parsed.readme || '';
  if (featureType === 'function-docs') return parsed.functionDocs || '';
  if (featureType === 'api-docs') return parsed.apiDocs || '';
  if (featureType === 'comments') return parsed.commentedCode || '';

  if (featureType === 'review') {
    const naming = Array.isArray(parsed.namingConventions)
      ? parsed.namingConventions.map(n => `  - ${n.variable}: ${n.status} - ${n.recommendation}`).join('\n')
      : '  - N/A';
    const smells = Array.isArray(parsed.codeSmells)
      ? parsed.codeSmells.map(s => `  - ${s.type} (Line ${s.line}): ${s.description}`).join('\n')
      : '  - N/A';
    const anti = Array.isArray(parsed.antiPatterns)
      ? parsed.antiPatterns.map(a => `  - ${a.pattern}: ${a.description}`).join('\n')
      : '  - N/A';
    const refac = Array.isArray(parsed.refactoringOpportunities)
      ? parsed.refactoringOpportunities.map(r => `  - ${r.target}: ${r.description}`).join('\n')
      : '  - N/A';
    const bp = Array.isArray(parsed.bestPractices)
      ? parsed.bestPractices.map(b => `  - ${b}`).join('\n')
      : '  - N/A';

    return `Code Review Report
==================
Quality Score: ${parsed.qualityScore}/100
Readability Score: ${parsed.readabilityScore}/100
Maintainability Score: ${parsed.maintainabilityScore}/100

Naming Conventions:
${naming}

Code Smells:
${smells}

Anti-Patterns:
${anti}

Refactoring Opportunities:
${refac}

Best Practices:
${bp}`;
  }

  if (featureType === 'learning-assistant') {
    const steps = Array.isArray(parsed.learningPath)
      ? parsed.learningPath.map(s => `  - ${s}`).join('\n')
      : '  - N/A';
    const ex = Array.isArray(parsed.exercises)
      ? parsed.exercises.map(e => `  - Title: ${e.title}\n    Description: ${e.description}\n    Template: ${e.codeTemplate}`).join('\n\n')
      : '  - N/A';

    return `Programming Lesson
==================
Explanation: ${parsed.explanation || 'N/A'}
Suggested Learning Path:
${steps}
Practice Exercises:
${ex}
Summary Response: ${parsed.response || 'N/A'}`;
  }

  return outputText;
};

export const downloadService = {
  /**
   * Formats a user history output and writes metadata logs to the downloads table.
   * @param {number} userId - Owner context.
   * @param {number} historyId - Log entry to export.
   * @param {string} format - File format ('txt' or 'md').
   * @param {string[]} expectedFeatureTypes - Array of compatible history feature types.
   */
  async exportToFile(userId, historyId, format = 'txt', expectedFeatureTypes = []) {
    const rawRecord = await historyService.getRawHistory(historyId);

    if (!rawRecord) {
      const error = new Error('Log record not found');
      error.statusCode = 404;
      throw error;
    }

    if (rawRecord.userId !== userId) {
      const error = new Error('Not authorized to access this log record');
      error.statusCode = 403;
      throw error;
    }

    // Load full details
    const record = await historyService.getHistoryById(userId, historyId);

    if (!expectedFeatureTypes.includes(record.featureType)) {
      const error = new Error(`Requested log is incompatible with this download route. Category: "${record.featureType}"`);
      error.statusCode = 400;
      throw error;
    }

    const cleanFormat = format.toLowerCase() === 'md' ? 'md' : 'txt';
    let fileContent = '';

    if (record.featureType === 'code-gen') {
      fileContent = cleanFormat === 'md'
        ? `# Generated Code\n\n\`\`\`\n${record.output}\n\`\`\``
        : record.output;
    } else {
      fileContent = cleanFormat === 'md'
        ? formatMarkdown(record.featureType, record.output)
        : formatPlainText(record.featureType, record.output);
    }

    const filename = `devmate-${record.featureType}-${historyId}.${cleanFormat}`;

    // DB Audit Requirements: store user_id, file_name, file_type
    logger.info(`Download Service: Logging download event metadata in database for file "${filename}"`);
    await query(
      'INSERT INTO downloads (user_id, file_name, file_type) VALUES (?, ?, ?)',
      [userId, filename, cleanFormat]
    );

    return {
      filename,
      content: fileContent,
      mimeType: cleanFormat === 'md' ? 'text/markdown' : 'text/plain'
    };
  }
};

export default downloadService;
