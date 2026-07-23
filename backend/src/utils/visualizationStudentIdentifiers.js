// Parses the numeric seat identifiers used to build SnapClass usernames.
function parseVisualizationStudentIdentifiers(rawValue) {
  return String(rawValue ?? '')
    .trim()
    .split(/[,\s]+/)
    .map((value) => value.replace(/\D+/g, ''))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

module.exports = {
  parseVisualizationStudentIdentifiers,
};
