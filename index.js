const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json()); // Parse JSON bodies

// In-memory storage
let strings = [];

function analyzeString(value) {
  if (typeof value !== 'string') throw new Error('Value must be a string');
  const length = value.length;
  const isPalindrome = value.toLowerCase() === value.toLowerCase().split('').reverse().join('');
  const uniqueChars = new Set(value).size;
  const wordCount = value.trim().split(/\s+/).length;
  const sha256Hash = crypto.createHash('sha256').update(value).digest('hex');
  const charFreq = {};
  for (let char of value) charFreq[char] = (charFreq[char] || 0) + 1;

  return {
    length,
    is_palindrome: isPalindrome,
    unique_characters: uniqueChars,
    word_count: wordCount,
    sha256_hash: sha256Hash,
    character_frequency_map: charFreq
  };
}


// POST /strings
app.post('/strings', (req, res) => {
  const { value } = req.body;
  if (!value) return res.status(400).json({ error: 'Missing value' });
  try {
    const properties = analyzeString(value);
    const id = properties.sha256_hash;
    if (strings.find(s => s.id === id)) return res.status(409).json({ error: 'String already exists' });
    const stringData = { id, value, properties, created_at: new Date().toISOString() };
    strings.push(stringData);
    res.status(201).json(stringData);
  } catch (error) {
    res.status(422).json({ error: error.message });
  }
});

// GET /strings/{string_value}
app.get('/strings/:value', (req, res) => {
  const { value } = req.params;
  const stringData = strings.find(s => s.value === value);
  if (!stringData) return res.status(404).json({ error: 'String not found' });
  res.status(200).json(stringData);
});

// GET /strings with filters
app.get('/strings', (req, res) => {
  let filtered = [...strings];
  const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

  if (is_palindrome) filtered = filtered.filter(s => s.properties.is_palindrome === (is_palindrome === 'true'));
  if (min_length) filtered = filtered.filter(s => s.properties.length >= parseInt(min_length));
  if (max_length) filtered = filtered.filter(s => s.properties.length <= parseInt(max_length));
  if (word_count) filtered = filtered.filter(s => s.properties.word_count === parseInt(word_count));
  if (contains_character) filtered = filtered.filter(s => s.value.includes(contains_character));

  if (Object.keys(req.query).length && filtered.length === 0) return res.status(400).json({ error: 'No matches' });
  res.status(200).json({ data: filtered, count: filtered.length, filters_applied: req.query });
});

// GET /strings/filter-by-natural-language
app.get('/strings/filter-by-natural-language', (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  let filters = {};
  if (query.includes('single word') && query.includes('palindromic')) filters = { word_count: 1, is_palindrome: true };
  else if (query.includes('longer than') && query.includes('characters')) filters.min_length = parseInt(query.match(/\d+/)) + 1;
  else if (query.includes('palindromic') && query.includes('vowel')) filters = { is_palindrome: true, contains_character: 'a' };
  else if (query.includes('containing') && query.includes('letter')) filters.contains_character = query.match(/[a-z]/i);

  if (Object.keys(filters).length === 0) return res.status(400).json({ error: 'Unable to parse query' });
  let filtered = [...strings];
  for (let [key, value] of Object.entries(filters)) {
    if (key === 'is_palindrome') filtered = filtered.filter(s => s.properties[key] === value);
    else if (key === 'min_length') filtered = filtered.filter(s => s.properties.length >= value);
    else if (key === 'contains_character') filtered = filtered.filter(s => s.value.includes(value));
  }
  res.status(200).json({ data: filtered, count: filtered.length, interpreted_query: { original: query, parsed_filters: filters } });
});

// DELETE /strings/{string_value}
app.delete('/strings/:value', (req, res) => {
  const { value } = req.params;
  const index = strings.findIndex(s => s.value === value);
  if (index === -1) return res.status(404).json({ error: 'String not found' });
  strings.splice(index, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));