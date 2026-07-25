import { processEntry } from './src/nlpEngine.js';

// Test just the problematic sentence
const text = "I stayed up late last night and I'm exhausted.";

// Manually test each past pattern against this text
const pastPatterns = [
  /(?:i\s+)?(?:finished|completed|did|done\s+with|wrapped\s+up|handled|managed\s+to|successfully)\s+([^.!?\n]+)/gi,
  /(?:i\s+)?(?:bought|cleaned|cooked|created|started|fixed|washed|paid|sent|emailed|called|submitted|organized|prepared|arranged|returned|sorted|tidied|mowed|ironed|packed|unpacked|assembled|installed|updated|renewed|registered|booked|scheduled|cancelled|moved|delivered|picked\s+up|dropped\s+off|set\s+up|took\s+out|threw\s+away|threw\s+out|gave\s+back)\s+([^.!?\n]+)/gi,
  /(?:i\s+)?(?:already|just)\s+(?:finished|did|completed|cleaned|fixed|sent|paid|washed|cooked|organized|sorted)\s+([^.!?\n]+)/gi,
  /(?:i\s+)?(?:went\s+to|ran|ate|wrote|made|took|got|had|gave|came\s+back\s+from|got\s+back\s+from)\s+([^.!?\n]+)/gi
];

console.log('Testing:', text);
let match;
for (let i = 0; i < pastPatterns.length; i++) {
  const regex = pastPatterns[i];
  while ((match = regex.exec(text)) !== null) {
    console.log(`Pattern ${i+1} matched: full="${match[0]}" | capture="${match[1]}"`);
  }
}

// Also test future patterns
const futurePatterns = [
  /(?:i\s+)?(?:need\s+to|have\s+to|gotta|got\s+to|must|should|plan\s+to|want\s+to|going\s+to|about\s+to|gonna)\s+([^.!?\n]+)/gi,
];
for (let i = 0; i < futurePatterns.length; i++) {
  const regex = futurePatterns[i];
  while ((match = regex.exec(text)) !== null) {
    console.log(`Future pattern ${i+1} matched: full="${match[0]}" | capture="${match[1]}"`);
  }
}

// Also test hobby regex
const hobbyRegex = /(?:i\s+)?(played|built|painted|practiced|read|learned|created|wrote|designed|coded|cooked|started|finished|made|crafted|composed|recorded|filmed|edited|sketched|drew|knitted|sewed|gardened|planted|harvested|carved|sculpted|programmed)\s+([^.!?\n]+)/gi;
while ((match = hobbyRegex.exec(text)) !== null) {
  console.log(`Hobby regex matched: verb="${match[1]}" object="${match[2]}"`);
}

// Test good habits regex  
const goodHabitsRegex = /(?:i\s+)?(worked\s+out|exercised|ran|walked|meditated|drank\s+water|ate\s+healthy|ate\s+well|slept\s+well|slept\s+early|went\s+to\s+the\s+gym|stretched|journaled|read)\s*([^.!?\n]*)/gi;
while ((match = goodHabitsRegex.exec(text)) !== null) {
  console.log(`Good habits matched: action="${match[1]}" detail="${match[2]}"`);
}
