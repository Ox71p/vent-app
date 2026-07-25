import { processEntry } from './src/nlpEngine.js';

const testInput = "Today I worked out at the gym and drank water. I also practiced guitar for 2 hours. I created my first song today. I also won an award for best keyboard design! I need to buy groceries tomorrow and call the dentist. I stayed up late last night and I'm exhausted.";

const contextData = { hobbies: 'guitar, gaming', hyperfixation: 'mechanical keyboards', goals: [] };

console.log('=== NLP ENGINE TEST ===');
console.log('Input:', testInput);
console.log('');

const result = await processEntry(testInput, contextData);

console.log('--- HOBBIES ---');
console.log('Achievements:', JSON.stringify(result.hobbies.achievements));
console.log('Milestones:', JSON.stringify(result.hobbies.milestones));
console.log('Insights:', result.hobbies.insights);

console.log('\n--- LIFESTYLE ---');
console.log('Good Habits:', JSON.stringify(result.lifestyle.goodHabits));
console.log('Bad Habits:', JSON.stringify(result.lifestyle.badHabits));
console.log('Milestones:', JSON.stringify(result.lifestyle.milestones));

console.log('\n--- TODOS ---');
result.todos.forEach((t, i) => {
  console.log(`  ${i+1}. [${t.completed ? 'DONE' : 'TODO'}] ${t.task}`, t.metadata ? JSON.stringify(t.metadata) : '');
});

console.log('\nTotal todos:', result.todos.length);
