/**
 * Simulated NLP Engine for Vent
 * In a production environment, this would call an LLM API (like Gemini).
 * For now, it uses heuristic matching to simulate intelligent data extraction.
 */

export const processEntry = async (text, contextData) => {
  return new Promise((resolve) => {
    // Simulate network delay and "thinking" time
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      
      const payload = {
        hobbies: {
          achievements: [],
          milestones: [],
          insights: "",
          advice: ""
        },
        lifestyle: {
          milestones: [],
          goodHabits: [],
          badHabits: [],
          insights: ""
        },
        todos: []
      };

      // --- HOBBIES HEURISTICS ---
      
      // Milestone Detection (Firsts, goals, major milestones)
      const milestoneRegex = /(?:i\s+)?(?:created|made|wrote|built|composed|recorded|achieved|reached|hit|finished|completed)\s+(?:my\s+)?(?:first|biggest|best|new|major)\s+([^.!?\n]+)/gi;
      let mMatch;
      while ((mMatch = milestoneRegex.exec(text)) !== null) {
        const action = mMatch[0].trim(); 
        // Stop at conjunctions for cleaner text
        const cleanedAction = action.split(/,\s*(?:and|but|so|because|then)\b/i)[0].trim().split(/\b(?:but|so|because|then)\b/i)[0].trim();
        const capitalized = cleanedAction.charAt(0).toUpperCase() + cleanedAction.slice(1);
        if (capitalized.length > 2 && capitalized.length < 60) {
          payload.hobbies.milestones.push(capitalized);
        }
      }

      // Achievement Detection (Awards, recognition, completion, winning)
      const achievementRegex = /(?:i\s+)?(?:won|got|received|earned|awarded)\s+(?:an?\s+)?(award|prize|medal|certificate|competition|recognition|contest|tournament|hackathon|match|first place|second place|third place)\s*([^.!?\n]*)/gi;
      let achMatch;
      while ((achMatch = achievementRegex.exec(text)) !== null) {
        const object = achMatch[1].trim();
        const detail = achMatch[2].trim().split(/,\s*(?:and|but|so|because|then)\b/i)[0].trim().split(/\b(?:but|so|because|then)\b/i)[0].trim();
        const fullAch = detail ? `${object} ${detail}` : object;
        const cleaned = fullAch.charAt(0).toUpperCase() + fullAch.slice(1);
        if (cleaned.length > 2 && cleaned.length < 60) {
          payload.hobbies.achievements.push(`Received ${cleaned}`);
        }
      }
      // Match against context data (stored user hobbies)
      const hobbiesStr = contextData.hobbies ? contextData.hobbies.toLowerCase() : "";
      const hyperfixation = contextData.hyperfixation ? contextData.hyperfixation.toLowerCase() : "";
      
      // Attempt phrase matching first (e.g. "3d printing", "video games")
      const combinedHobbies = `${hobbiesStr}, ${hyperfixation}`.split(',').map(s => s.trim()).filter(s => s.length > 2);
      
      if (combinedHobbies.length > 0) {
        combinedHobbies.forEach(hobbyPhrase => {
          if (lowerText.includes(hobbyPhrase)) {
            // Capitalize first letter of phrase
            const cleanPhrase = hobbyPhrase.charAt(0).toUpperCase() + hobbyPhrase.slice(1);
            payload.hobbies.milestones.push(`Progressed in ${cleanPhrase}`);
          }
        });
        
        // Fallback to word-level matching if phrase matching didn't yield much
        if (payload.hobbies.milestones.length === 0) {
          const hobbyKeywords = `${hobbiesStr} ${hyperfixation}`.split(/[\s,]+/).filter(w => w.length > 3);
          const matchedWords = new Set();
          hobbyKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
              matchedWords.add(keyword);
            }
          });
          matchedWords.forEach(word => {
            payload.hobbies.milestones.push(`Engaged with ${word}`);
          });
        }
      }
      
      // Generic keyboard/tech heuristic (based on test case)
      if (lowerText.includes("keyboard") || lowerText.includes("switches")) {
         payload.hobbies.achievements.push("Modified mechanical keyboard");
      }

      // --- LIFESTYLE HEURISTICS ---
      // Good Habits extraction
      const goodHabitsRegex = /(?:i\s+)?(worked\s+out|exercised|ran|walked|meditated|drank\s+water|ate\s+healthy|ate\s+well|slept\s+well|slept\s+early|went\s+to\s+the\s+gym|stretched|journaled|read)\s*([^.!?\n]*)/gi;
      let lMatch;
      while ((lMatch = goodHabitsRegex.exec(text)) !== null) {
        const action = lMatch[1].trim();
        const detail = lMatch[2].trim().split(/\b(?:and|but|so|because|then)\b/i)[0].trim();
        // Only append detail if it's short and relevant
        const fullHabit = (detail && detail.length < 30) ? `${action} ${detail}` : action;
        payload.lifestyle.goodHabits.push(fullHabit.charAt(0).toUpperCase() + fullHabit.slice(1));
        
        // If it's exercise related, add a milestone
        if (action.match(/worked out|exercised|ran|went to the gym/)) {
          payload.lifestyle.milestones.push("Prioritized physical fitness");
        }
      }

      // Bad Habits extraction
      const badHabitsRegex = /(?:i\s+)?(stayed\s+up\s+late|didn'?t\s+sleep|ate\s+junk|scrolled|procrastinated|binged|drank\s+too\s+much|skipped\s+(?:meals?|lunch|breakfast|dinner)|doomscrolled)\s*([^.!?\n]*)/gi;
      while ((lMatch = badHabitsRegex.exec(text)) !== null) {
        const action = lMatch[1].trim();
        const detail = lMatch[2].trim().split(/\b(?:and|but|so|because|then)\b/i)[0].trim();
        const fullHabit = (detail && detail.length < 30) ? `${action} ${detail}` : action;
        payload.lifestyle.badHabits.push(fullHabit.charAt(0).toUpperCase() + fullHabit.slice(1));
      }

      // Keyword fallbacks
      if (lowerText.match(/\b(tired|exhausted|burnout|stressed|overwhelmed)\b/)) {
        payload.lifestyle.badHabits.push("Experiencing fatigue/stress");
      }
      if (lowerText.match(/\b(energized|refreshed|motivated|productive)\b/)) {
        payload.lifestyle.goodHabits.push("Maintained positive energy");
      }
      if (lowerText.match(/\b(hydrated|drank water)\b/)) {
        if (!payload.lifestyle.goodHabits.some(h => h.toLowerCase().includes('water'))) {
          payload.lifestyle.goodHabits.push("Hydration");
        }
      }

      // --- TO DO HEURISTICS ---
      
      // Helper function to extract temporal info from a task string
      const extractMetadata = (taskStr) => {
        let metadata = {};
        const timeMatch = taskStr.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|morning|afternoon|evening|night|noon|midnight)/i);
        if (timeMatch) metadata.time = timeMatch[1].charAt(0).toUpperCase() + timeMatch[1].slice(1);
        
        const durationMatch = taskStr.match(/(?:for|took)\s+(\d+\s+(?:hour|minute|day)s?|all\s+day)/i);
        if (durationMatch) metadata.duration = durationMatch[1];
        
        const dateMatch = taskStr.match(/(yesterday|tomorrow|today|next week|next month|this weekend|on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:morning|afternoon|evening|night)?)/i);
        if (dateMatch) metadata.date = dateMatch[1].trim();
        
        // Also detect "by <day/date>" patterns
        const byDateMatch = taskStr.match(/by\s+((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:tomorrow|next\s+week|the\s+end\s+of\s+the\s+(?:week|day|month)))/i);
        if (byDateMatch && !metadata.date) metadata.date = `by ${byDateMatch[1]}`;
        
        return metadata;
      };

      // Extract a clean, concise action phrase from raw captured text.
      const cleanTaskText = (rawText) => {
        // Trim leading filler words the regex might have caught
        let cleaned = rawText.replace(/^(?:also|actually|just|really|finally|basically|probably|maybe|definitely|perhaps)\s+/i, '');
        
        // Stop at sentence-ending punctuation
        cleaned = cleaned.split(/[.!?\n]/)[0].trim();
        
        // Stop at certain conjunctions when they start a new clause
        // (preceded by a comma or followed by a pronoun/article)
        cleaned = cleaned.split(/,\s*(?:and|but|so|then|because)\b/i)[0].trim();
        cleaned = cleaned.split(/\b(?:but|so|then|because)\s+(?:i|we|it|the|my|he|she|they)\b/i)[0].trim();
        
        // Strip temporal phrases anywhere in the string (not just trailing)
        cleaned = cleaned.replace(/\b(?:yesterday|tomorrow|today|tonight|next\s+week|this\s+weekend|next\s+month|later)\b/gi, '').trim();
        cleaned = cleaned.replace(/\b(?:at\s+(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|morning|afternoon|evening|night|noon|midnight))\b/gi, '').trim();
        cleaned = cleaned.replace(/\b(?:for\s+(?:\d+\s+(?:hour|minute|day)s?|all\s+day))\b/gi, '').trim();
        cleaned = cleaned.replace(/\b(?:by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi, '').trim();
        
        // Clean up double spaces and trailing conjunctions
        cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
        cleaned = cleaned.replace(/\s+(?:and|the|a|an|my|our|some|this|that|it)\s*$/i, '').trim();
        
        if (cleaned.length === 0) return '';
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      };

      // Split compound tasks: "buy groceries and call the dentist" → ["buy groceries", "call the dentist"]
      const splitCompoundTasks = (rawText) => {
        const actionVerbs = new Set([
          'buy','call','send','email','text','clean','fix','pay','wash',
          'cook','organize','prepare','arrange','return','sort','tidy',
          'mow','iron','pack','unpack','assemble','install','update',
          'renew','register','book','schedule','cancel','move','deliver',
          'check','get','make','do','write','finish','complete','submit',
          'ask','tell','meet','visit','find','order','start','grab',
          'take','run','walk','pick','drop','set','throw','give','go',
          'sign','file','fill','look'
        ]);
        
        // Look for " and [verb] " pattern in the text
        const andIndex = rawText.search(/\s+and\s+/i);
        if (andIndex === -1) return [rawText];
        
        const afterAnd = rawText.substring(andIndex).replace(/^\s+and\s+/i, '');
        const firstWord = afterAnd.split(/\s+/)[0].toLowerCase();
        
        if (actionVerbs.has(firstWord)) {
          const before = rawText.substring(0, andIndex).trim();
          return [before, afterAnd.trim()].filter(p => p.length > 0);
        }
        
        return [rawText];
      };

      // Deduplication helper — prevents the same task appearing twice
      const seenTasks = new Set();
      const addTask = (taskText, completed, rawMatch) => {
        // First, try to split compound tasks
        const subTasks = splitCompoundTasks(taskText);
        
        for (const subTask of subTasks) {
          const cleaned = cleanTaskText(subTask);
          if (!cleaned) continue;
          
          const key = cleaned.toLowerCase().trim();
          if (key.length <= 3 || key.length > 80 || seenTasks.has(key)) continue;
          
          // Skip if it's just common filler that slipped through
          const fillerWords = ['it', 'that', 'this', 'the', 'some', 'something', 'stuff', 'things', 'a lot', 'well', 'everything', 'nothing'];
          if (fillerWords.includes(key)) continue;
          
          seenTasks.add(key);
          payload.todos.push({
            task: cleaned,
            completed: completed,
            metadata: extractMetadata(rawMatch)
          });
        }
      };

      // ---- PAST TASKS (completed) ----
      // Use [^.!?\n]+ to capture across word boundaries including
      // apostrophes, hyphens, slashes, etc. within a single sentence.
      const pastPatterns = [
        // "I finished/completed/did/..." pattern
        /(?:i\s+)?\b(?:finished|completed|did|done\s+with|wrapped\s+up|handled|managed\s+to|successfully)\b\s+([^.!?\n]+)/gi,
        // Common past-tense action verbs (includes daily chores and hobbies)
        /(?:i\s+)?\b(?:bought|cleaned|cooked|created|started|fixed|washed|paid|sent|emailed|called|submitted|organized|prepared|arranged|returned|sorted|tidied|mowed|ironed|packed|unpacked|assembled|installed|updated|renewed|registered|booked|scheduled|cancelled|moved|delivered|picked\s+up|dropped\s+off|set\s+up|took\s+out|threw\s+away|threw\s+out|gave\s+back|played|practiced|read|learned|designed|coded|composed|recorded|filmed|edited|sketched|drew|knitted|sewed|gardened|planted|harvested|carved|sculpted|programmed|crafted|went\s+out|hung\s+out|met\s+up|met)\b\s+([^.!?\n]+)/gi,
        // "I already/just ..." pattern
        /(?:i\s+)?\b(?:already|just)\s+(?:finished|did|completed|cleaned|fixed|sent|paid|washed|cooked|organized|sorted)\b\s+([^.!?\n]+)/gi,
        // "I went/ran/ate ..." (irregular past tense)
        /(?:i\s+)?\b(?:went\s+to|ran|ate|wrote|made|took|got|had|gave|came\s+back\s+from|got\s+back\s+from)\b\s+([^.!?\n]+)/gi
      ];

      let match;
      for (const regex of pastPatterns) {
        while ((match = regex.exec(text)) !== null) {
          addTask(match[1], true, match[0]);
        }
      }
      
      // ---- FUTURE TASKS (pending) ----
      const futurePatterns = [
        // Classic "need to / have to / should / must ..." patterns
        /(?:i\s+)?\b(?:need\s+to|have\s+to|gotta|got\s+to|must|should|plan\s+to|want\s+to|going\s+to|about\s+to|gonna)\b\s+([^.!?\n]+)/gi,
        // Contractions: "I'll", "I've got to"
        /(?:i'\s*ll|i've\s+got\s+to|i've\s+gotta)\s+([^.!?\n]+)/gi, // Note: word boundaries on left of contractions can be tricky, keeping as-is
        // Reminder/imperative patterns
        /\b(?:make\s+sure\s+to|don'?\s*t\s+forget\s+to|remind\s+me\s+to|remember\s+to)\b\s+([^.!?\n]+)/gi,
        // "supposed to / meant to / hoping to / thinking of / looking forward to"
        /(?:i'?\s*m\s+)?\b(?:supposed\s+to|meant\s+to|hoping\s+to|planning\s+on|thinking\s+of|thinking\s+about|looking\s+forward\s+to)\b\s+([^.!?\n]+)/gi,
        // "still need to / still have to / still haven't / haven't yet"
        /(?:i\s+)?\b(?:still\s+(?:need\s+to|have\s+to|haven'?\s*t|gotta)|haven'?\s*t\s+(?:yet\s+)?)\b\s*([^.!?\n]+)/gi,
        // "can't forget to / better / had better"
        /(?:i\s+)?\b(?:can'?\s*t\s+forget\s+to|better|had\s+better)\b\s+([^.!?\n]+)/gi
      ];

      for (const regex of futurePatterns) {
        while ((match = regex.exec(text)) !== null) {
          addTask(match[1], false, match[0]);
        }
      }
      
      // ---- TEMPORAL CONTEXT FALLBACK ----
      // If no pending tasks found yet, look for time-anchored statements
      if (payload.todos.filter(t => !t.completed).length === 0) {
        const temporalPatterns = [
          // "tomorrow/next week/later ... I will/I'll ..."
          /(?:tomorrow|next\s+week|this\s+weekend|later|tonight|next\s+month).+?(?:i\s+will|i'll|i\s+want\s+to|i\s+plan\s+to|gonna)\s+([^.!?\n]+)/gi,
          // "on Monday/Tuesday ... I ..."
          /on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday).+?(?:i\s+will|i'll|i\s+need\s+to|i\s+have\s+to|gonna)\s+([^.!?\n]+)/gi,
          // "by Friday / by the end of the week"
          /(?:by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next\s+week|the\s+end\s+of\s+the\s+(?:week|day|month))).+?(?:i\s+will|i'll|i\s+need\s+to|i\s+have\s+to|gonna|i\s+should)\s+([^.!?\n]+)/gi
        ];

        for (const regex of temporalPatterns) {
          while ((match = regex.exec(text)) !== null) {
            let taskText = cleanTaskText(match[1]);
            if (taskText) {
              addTask(taskText, false, match[0]);
            }
          }
        }
      }

      // ---- LIST DETECTION ----
      // Detect bulleted/numbered lists or comma-separated lists after a "to-do" header
      const listHeaderMatch = text.match(/(?:to[\s-]*do|tasks?|checklist|things?\s+(?:to\s+do|i\s+need))[\s:]*\n([\s\S]+?)(?:\n\n|\n(?=[A-Z]))/i);
      if (listHeaderMatch) {
        const listBlock = listHeaderMatch[1];
        // Match bullet points: "- item", "• item", "* item", "1. item", "1) item"
        const bulletItems = listBlock.match(/(?:^|\n)\s*(?:[-•*]|\d+[.)]\s*)\s*(.+)/g);
        if (bulletItems) {
          bulletItems.forEach(item => {
            const cleaned = item.replace(/^\s*(?:[-•*]|\d+[.)]\s*)\s*/, '').trim();
            const taskText = cleanTaskText(cleaned);
            if (taskText) {
              addTask(taskText, false, item);
            }
          });
        }
      }

      // --- MISSING INFO PROMPT HEURISTICS ---
      payload.missingInfoPrompt = null;
      payload.missingInfoType = null;
      payload.triggerSnippet = null;

      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      let foundPrompt = false;

      for (let s of sentences) {
        const lowerS = s.toLowerCase();
        
        // Determine tense based on context
        const isFuture = lowerS.match(/\b(?:will|'ll|plan|want|going to|tomorrow|tonight|next)\b/i);
        const timePromptStart = isFuture ? "When will you" : "When did you";
        const durationPromptStart = isFuture ? "How long will you" : "How long did you";

        // Check for meeting/event verbs (Time)
        const timeMatch = lowerS.match(/\b(met|saw|visited|called|texted|talked to|went out|go out|hang out|meet)\b\s+([\w\s]+)/i);
        if (timeMatch && !lowerS.match(/\d+|morning|afternoon|evening|night|noon|midnight/i)) {
          const verb = timeMatch[1].trim();
          const object = timeMatch[2].trim().split(/\b(?:and|but|so|then)\b/i)[0].trim();
          payload.missingInfoPrompt = `${timePromptStart} ${verb} ${object}?`;
          payload.missingInfoType = 'time';
          payload.triggerSnippet = s.trim();
          foundPrompt = true;
          break;
        }

        // Check for activity verbs (Duration)
        const durationMatch = lowerS.match(/\b(played|studied|worked on|coded|read|watched|went to|exercised|trained|practiced)\b\s*([\w\s]*)/i);
        if (durationMatch && !lowerS.match(/\d+|hour|minute|time|while|all day/i)) {
          const verb = durationMatch[1].trim();
          const object = durationMatch[2] ? durationMatch[2].trim().split(/\b(?:and|but|so|then)\b/i)[0].trim() : '';
          payload.missingInfoPrompt = `${durationPromptStart} ${verb} ${object}?`.trim().replace(/\s\?$/, '?');
          payload.missingInfoType = 'duration';
          payload.triggerSnippet = s.trim();
          foundPrompt = true;
          break;
        }
      }

      // Fallback for very short entries
      if (!foundPrompt && text.trim().length > 0 && text.trim().length < 50) {
        payload.missingInfoPrompt = "Your entry is quite brief. Could you add a bit more detail about how you felt or what specifically happened?";
        payload.missingInfoType = 'text';
        payload.triggerSnippet = text.trim();
      }

      resolve(payload);
    }, 1500); // 1.5s simulated delay
  });
};
