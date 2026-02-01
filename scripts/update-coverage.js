#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const coverageFile = 'coverage/coverage-final.json';
const readmeFile = 'README.md';

try {
  const coverage = JSON.parse(readFileSync(coverageFile, 'utf8'));
  const readme = readFileSync(readmeFile, 'utf8');

  // Calculate coverage from all files
  let totalStatements = 0, coveredStatements = 0;
  let totalBranches = 0, coveredBranches = 0;
  let totalFunctions = 0, coveredFunctions = 0;
  let totalLines = 0, coveredLines = 0;

  Object.values(coverage).forEach(file => {
    if (!file || !file.s) return;

    // Statements
    const statements = file.s || {};
    totalStatements += Object.keys(statements).length;
    coveredStatements += Object.values(statements).filter(v => v > 0).length;

    // Branches
    const branches = file.b || {};
    totalBranches += Object.keys(branches).length;
    coveredBranches += Object.values(branches).filter(
      v => Array.isArray(v) && v.some(b => b > 0)
    ).length;

    // Functions
    const functions = file.f || {};
    totalFunctions += Object.keys(functions).length;
    coveredFunctions += Object.values(functions).filter(v => v > 0).length;

    // Lines (approximate from statements)
    if (file.statementMap) {
      totalLines += Object.keys(file.statementMap).length;
      coveredLines += Object.values(statements).filter(v => v > 0).length;
    }
  });

  const stmtCoverage = totalStatements > 0 
    ? ((coveredStatements / totalStatements) * 100).toFixed(2) 
    : '0.00';
  const branchCoverage = totalBranches > 0 
    ? ((coveredBranches / totalBranches) * 100).toFixed(2) 
    : '0.00';
  const funcCoverage = totalFunctions > 0 
    ? ((coveredFunctions / totalFunctions) * 100).toFixed(2) 
    : '0.00';
  const lineCoverage = totalLines > 0 
    ? ((coveredLines / totalLines) * 100).toFixed(2) 
    : '0.00';

  // Get badge color
  const getColor = (coverage) => {
    const cov = parseFloat(coverage);
    if (cov >= 90) return 'brightgreen';
    if (cov >= 80) return 'green';
    if (cov >= 70) return 'yellowgreen';
    if (cov >= 60) return 'yellow';
    return 'red';
  };

  const badgeColor = getColor(stmtCoverage);
  const badgeUrl = `https://img.shields.io/badge/coverage-${stmtCoverage}%25-${badgeColor}`;

  // Create coverage section
  const coverageSection = `## Test Coverage

![Coverage](${badgeUrl})

| Metric | Coverage |
|--------|----------|
| Statements | ${stmtCoverage}% |
| Branches | ${branchCoverage}% |
| Functions | ${funcCoverage}% |
| Lines | ${lineCoverage}% |

`;

  // Update README
  let updatedReadme = readme;

  // Check if coverage section exists
  if (readme.includes('## Test Coverage')) {
    // Replace existing coverage section
    updatedReadme = readme.replace(
      /## Test Coverage[\s\S]*?(?=\n## |$)/,
      coverageSection.trim() + '\n\n'
    );
  } else {
    // Insert before License section
    updatedReadme = readme.replace(/(## License)/, coverageSection + '$1');
  }

  writeFileSync(readmeFile, updatedReadme);
  console.log('✅ Coverage updated in README');
  console.log(`   Statements: ${stmtCoverage}%`);
  console.log(`   Branches: ${branchCoverage}%`);
  console.log(`   Functions: ${funcCoverage}%`);
  console.log(`   Lines: ${lineCoverage}%`);

} catch (error) {
  console.error('❌ Error updating coverage:', error.message);
  process.exit(1);
}

