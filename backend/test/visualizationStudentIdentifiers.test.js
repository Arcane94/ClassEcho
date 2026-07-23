const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseVisualizationStudentIdentifiers,
} = require('../src/utils/visualizationStudentIdentifiers');

test('preserves leading zeroes in visualization student identifiers', () => {
  assert.deepEqual(
    parseVisualizationStudentIdentifiers('07, 7, 008'),
    ['07', '7', '008'],
  );
});

test('keeps existing numeric sanitization and removes exact duplicates', () => {
  assert.deepEqual(
    parseVisualizationStudentIdentifiers('student-07, #07 12'),
    ['07', '12'],
  );
});

test('returns no identifiers for empty or nonnumeric input', () => {
  assert.deepEqual(parseVisualizationStudentIdentifiers(null), []);
  assert.deepEqual(parseVisualizationStudentIdentifiers('student, none'), []);
});
