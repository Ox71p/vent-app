import './style.css'
import { processEntry } from './nlpEngine.js'
import { auth } from './auth.js'

document.addEventListener('DOMContentLoaded', () => {
  // 1. Brain Energy Slider Logic
  const sliderContainer = document.getElementById('brainEnergySlider');
  const sliderInput = document.getElementById('sliderInput');
  const sliderThumb = document.getElementById('sliderThumb');
  const brandSubtext = document.querySelector('.brand-subtext');
  
  // Prepare typewriter span
  brandSubtext.innerHTML = '<span class="typewriter-text"></span>';
  const typeTextSpan = brandSubtext.querySelector('.typewriter-text');
  
  const ventTextarea = document.getElementById('ventTextarea');

  const scatteredTexts = [
    "Ground yourself. Empty the noise.",
    "One thought at a time.",
    "A safe space for tangled thoughts.",
    "Breathe in. Exhale the chaos."
  ];
  
  const steadyTexts = [
    "Balanced and present. Start typing.",
    "Riding the equilibrium. Write away.",
    "Steady flow. What's on your mind?",
    "A clear runway. What are you building?"
  ];
  
  const lockedTexts = [
    "Zero distractions. Absolute clarity.",
    "Hyper-focused. Channel the energy.",
    "Ride the wave. Capture the lightning.",
    "In the zone. Leave your mark."
  ];

  let typeInterval = null;

  const typeWriterEffect = (text) => {
    clearInterval(typeInterval);
    typeTextSpan.textContent = '';
    let i = 0;
    
    // Tiny delay before starting
    setTimeout(() => {
      typeInterval = setInterval(() => {
        if (i < text.length) {
          typeTextSpan.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 25); // Fast, snappy typewriter
    }, 50); 
  };


  const updateSliderState = (value) => {
    // Reset state classes
    sliderContainer.classList.remove('slider-state-1', 'slider-state-2', 'slider-state-3');
    sliderContainer.classList.add(`slider-state-${value}`);

    // Update body theme for global colors
    document.body.classList.remove('theme-scattered', 'theme-steady', 'theme-locked');

    let targetText = "";

    // Update global text target
    if (value === '1') {
      document.body.classList.add('theme-scattered');
      targetText = scatteredTexts[Math.floor(Math.random() * scatteredTexts.length)];
    } else if (value === '2') {
      document.body.classList.add('theme-steady');
      targetText = steadyTexts[Math.floor(Math.random() * steadyTexts.length)];
    } else if (value === '3') {
      document.body.classList.add('theme-locked');
      targetText = lockedTexts[Math.floor(Math.random() * lockedTexts.length)];
      
      // Trigger fantastic pulse micro-animation
      sliderThumb.classList.remove('pulse-fantastic-active');
      // Trigger reflow to restart animation
      void sliderThumb.offsetWidth;
      sliderThumb.classList.add('pulse-fantastic-active');
    }

    typeWriterEffect(targetText);
  };

  // Set default Normal state
  updateSliderState(sliderInput.value);

  // Input event handles both drag and snap effectively
  sliderInput.addEventListener('input', (e) => {
    const val = e.target.value;
    updateSliderState(val);
    
    // Haptic feedback trigger
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  });

  // Alexithymia Shortcut: Double Tap to Reset
  sliderContainer.addEventListener('dblclick', (e) => {
    sliderInput.value = '2';
    updateSliderState('2');
    
    // Flash white micro-animation
    sliderThumb.classList.remove('flash-white-active');
    void sliderThumb.offsetWidth;
    sliderThumb.classList.add('flash-white-active');
    
    // Emit background state payload
    console.log({ state: "unknown", trigger: "alexithymia_shortcut_reset" });
  });

  // Cleanup completed animations
  sliderThumb.addEventListener('animationend', (e) => {
    if (e.animationName === 'pulseFantastic') {
      sliderThumb.classList.remove('pulse-fantastic-active');
    } else if (e.animationName === 'flashWhite') {
      sliderThumb.classList.remove('flash-white-active');
    }
  });

  // Focus the text box initially so the native cursor blinks inside
  ventTextarea.focus();

  // State to track if we are on the main Vent screen
  let isHomeActive = true;

  // Enforce permanent focus on the text area ONLY when on the main Vent view and NO draft exists
  ventTextarea.addEventListener('blur', () => {
    if (isHomeActive && ventTextarea.value.length === 0 && !document.body.classList.contains('show-warning')) {
      setTimeout(() => {
        ventTextarea.focus();
      }, 10);
    }
  });

  // 2. Textarea Auto-Resize & Typing Mode Behavior
  const body = document.body;

  // Auto-resize logic
  const adjustHeight = () => {
    // Disable transition temporarily to measure accurate scrollHeight without lag
    ventTextarea.style.transition = 'none';
    const oldHeight = ventTextarea.style.height;
    ventTextarea.style.height = '60px'; // Minimum height
    const newHeight = ventTextarea.scrollHeight + 'px';
    
    ventTextarea.style.height = oldHeight; // Restore to current before animating
    
    // Force browser reflow
    void ventTextarea.offsetHeight;
    
    // Enable fluid transition and apply target height
    ventTextarea.style.transition = 'height 0.15s cubic-bezier(0.25, 1, 0.5, 1), background 0.3s ease, border-color 0.3s ease';
    ventTextarea.style.height = newHeight;

    // Handle typing mode toggle and draft state
    if (ventTextarea.value.length > 0) {
      body.classList.add('has-draft');
      // Only force typing-mode if they are actively typing (it has focus)
      if (document.activeElement === ventTextarea) {
        body.classList.add('typing-mode');
      }
    } else {
      body.classList.remove('has-draft');
      body.classList.remove('typing-mode');
    }
  };

  const draftPreview = document.getElementById('draftPreview');
  const updateDraftPreview = () => {
    const text = ventTextarea.value.trim();
    if (!text) {
      draftPreview.textContent = '';
      return;
    }
    const words = text.split(/\s+/);
    if (words.length > 3) {
      draftPreview.textContent = '... ' + words.slice(-3).join(' ');
    } else {
      draftPreview.textContent = text;
    }
  };

  ventTextarea.addEventListener('input', adjustHeight);
  adjustHeight(); // Initial check

  ventTextarea.addEventListener('focus', () => {
    body.classList.add('writing-mode');
    if (ventTextarea.value.length > 0) {
      body.classList.add('typing-mode');
    }
  });

  ventTextarea.addEventListener('blur', () => {
    body.classList.remove('input-focused');
  });

  // --- NEW TYPING INTERACTION STATES ---
  const btnContinueWriting = document.getElementById('btnContinueWriting');
  const btnVentDiscard = document.getElementById('btnVentDiscard');
  const btnVentSubmit = document.getElementById('btnVentSubmit');
  const btnWarningCancel = document.getElementById('btnWarningCancel');
  const btnWarningConfirm = document.getElementById('btnWarningConfirm');
  const btnSayItInstead = document.getElementById('btnSayItInstead');

  // --- SPEECH RECOGNITION ---
  window.voiceRecognition = null;
  window.isRecording = false;

  if (btnSayItInstead) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      window.voiceRecognition = new SpeechRecognition();
      window.voiceRecognition.continuous = true;
      window.voiceRecognition.interimResults = true;

      btnSayItInstead.addEventListener('click', () => {
        if (!window.isRecording) {
          window.voiceRecognition.start();
          window.isRecording = true;
          btnSayItInstead.textContent = 'Listening (Click to stop)...';
          btnSayItInstead.style.color = '#ff4757';
          body.classList.add('typing-mode');
        } else {
          window.voiceRecognition.stop();
          window.isRecording = false;
          btnSayItInstead.textContent = 'Say it instead?';
          btnSayItInstead.style.color = '';
        }
      });

      window.voiceRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          ventTextarea.value = (ventTextarea.value + ' ' + finalTranscript).trim();
          adjustHeight();
        }
      };

      window.voiceRecognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        window.isRecording = false;
        btnSayItInstead.textContent = 'Say it instead?';
        btnSayItInstead.style.color = '';
        showToast('Microphone error: ' + event.error);
      };
    } else {
      btnSayItInstead.addEventListener('click', () => showToast('Voice typing not supported in this browser.'));
    }
  }
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  const btnToastClose = document.getElementById('btnToastClose');
  let toastTimeout;

  const showToast = (message) => {
    if (toastMessage) {
      toastMessage.textContent = message;
    }
    toastNotification.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3000);
  };

  if (btnToastClose) {
    btnToastClose.addEventListener('click', () => {
      toastNotification.classList.remove('show');
      clearTimeout(toastTimeout);
    });
  }

  // Clicking outside pauses typing
  document.addEventListener('mousedown', (e) => {
    // Only handle if in typing mode
    if (body.classList.contains('typing-mode')) {
      // Don't close if they click inside the input container or the warning modal
      if (!e.target.closest('.minimal-input-container') && !e.target.closest('.warning-modal-overlay')) {
        body.classList.remove('typing-mode');
        updateDraftPreview();
        ventTextarea.blur();
      }
    }
  });

  // Clicking continue resumes typing
  btnContinueWriting.addEventListener('click', () => {
    body.classList.add('typing-mode');
    ventTextarea.focus();
  });

  // Type anywhere to resume writing
  document.addEventListener('keydown', (e) => {
    if (isHomeActive && body.classList.contains('has-draft') && !body.classList.contains('typing-mode') && !body.classList.contains('show-warning')) {
      // Resume if it's a standard character or backspace
      if ((e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) || e.key === 'Backspace') {
        body.classList.add('typing-mode');
        ventTextarea.focus();
      }
    }
  });

  // Helper to terminate mic
  const terminateMic = () => {
    if (window.voiceRecognition && window.isRecording) {
      window.voiceRecognition.stop();
      window.isRecording = false;
      if (btnSayItInstead) {
        btnSayItInstead.textContent = 'Say it instead?';
        btnSayItInstead.style.color = '';
      }
    }
  };

  // Clicking X opens warning modal
  btnVentDiscard.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent losing focus
    body.classList.add('show-warning');
  });

  // Cancel warning
  btnWarningCancel.addEventListener('click', () => {
    terminateMic();
    body.classList.remove('show-warning');
  });

  // Confirm discard
  btnWarningConfirm.addEventListener('click', () => {
    terminateMic();
    ventTextarea.value = '';
    body.classList.remove('show-warning', 'typing-mode', 'has-draft');
    updateDraftPreview();
    adjustHeight();
    ventTextarea.focus(); // Returns to empty naked cursor
  });

  // Submit vent
  btnVentSubmit.addEventListener('mousedown', async (e) => {
    e.preventDefault(); // Prevent focus loss
    terminateMic();
    const text = ventTextarea.value.trim();
    if (text.length > 0) {
      // 1. Instantly clear UI for the user
      ventTextarea.value = '';
      body.classList.remove('typing-mode', 'has-draft');
      updateDraftPreview();
      adjustHeight();
      ventTextarea.focus();
      showToast('Processing entry...');

      // 2. Prepare Context Data
      const contextData = {
        hobbies: localStorage.getItem('ventHobbies') || '',
        hyperfixation: localStorage.getItem('ventHyperfixation') || '',
        goals: JSON.parse(localStorage.getItem('ventGoals')) || []
      };

      try {
        // 3. Call NLP Engine
        const nlpResult = await processEntry(text, contextData);

        // 4. Save to Logs
        const entry = {
          id: Date.now(),
          text: text,
          timestamp: new Date().toISOString(),
          archived: false,
          nlpData: nlpResult // Attach derived data to log record
        };
        logEntries.unshift(entry);
        localStorage.setItem('ventEntries', JSON.stringify(logEntries));
        evaluateProfileAvatar();
        renderLogs();

        // 5. Update State for other tabs
        updateGlobalIntelligenceState(nlpResult);

        showToast('Saved & Analyzed');
      } catch (err) {
        console.error(err);
        showToast('Error parsing entry');
      }
    }
  });

  // --- LOG ENTRIES MANAGEMENT ---
  let logEntries = JSON.parse(localStorage.getItem('ventEntries')) || [];
  const entryCountEl = document.getElementById('entryCount');
  const logsContainer = document.getElementById('logsContainer');

  const evaluateProfileAvatar = () => {
    const userLevel = logEntries.filter(e => !e.archived).length;
    if (entryCountEl) {
      entryCountEl.textContent = `Lvl ${userLevel}`;
    }

    const avatarContainer = document.getElementById('profileAvatarContainer');
    const popoverWrap = document.getElementById('popoverAvatarWrap');
    const popoverTitle = document.getElementById('popoverArchetypeTitle');
    const popoverDesc = document.getElementById('popoverArchetypeDesc');

    if (!avatarContainer || !popoverWrap) return;

    if (userLevel < 5) {
      avatarContainer.innerHTML = `<div class="avatar-dot"></div>`;
      popoverWrap.innerHTML = `<div class="avatar-dot"></div>`;
      popoverTitle.textContent = 'Initializing...';
      popoverDesc.textContent = `Keep venting to unlock.`;
    } else {
      // Mock Backend AI response for Level 5+
      const archetypeImageUrl = 'https://api.dicebear.com/7.x/shapes/svg?seed=Vent&backgroundColor=000000';
      const archetypeName = 'The Architect';
      const archetypeDesc = 'You build robust systems and carefully map out your goals. Highly analytical and structured in your daily logs.';
      
      avatarContainer.innerHTML = `<img src="${archetypeImageUrl}" class="archetype-avatar" alt="Archetype">`;
      popoverWrap.innerHTML = `<img src="${archetypeImageUrl}" class="archetype-avatar" alt="Archetype" style="width: 100%; height: 100%; border-radius: 50%;">`;
      popoverTitle.textContent = archetypeName;
      popoverDesc.textContent = archetypeDesc;
    }
  };

  // Popover Toggle Logic
  const profileAvatarContainer = document.getElementById('profileAvatarContainer');
  const profilePopover = document.getElementById('profilePopover');
  if (profileAvatarContainer && profilePopover) {
    profileAvatarContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePopover.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!profilePopover.contains(e.target) && !profileAvatarContainer.contains(e.target)) {
        profilePopover.classList.add('hidden');
      }
    });
  }

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    const dateOpt = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOpt = { hour: 'numeric', minute: '2-digit' };
    return `${d.toLocaleDateString(undefined, dateOpt)} at ${d.toLocaleTimeString(undefined, timeOpt)}`;
  };

  const logSearchInput = document.getElementById('logSearchInput');
  const logDateFilter = document.getElementById('logDateFilter');
  const logViewToggle = document.getElementById('logViewToggle');
  const calendarContainer = document.getElementById('calendarContainer');
  const logEditModal = document.getElementById('logEditModal');
  const logEditTextarea = document.getElementById('logEditTextarea');
  const btnLogEditSave = document.getElementById('btnLogEditSave');
  const btnLogEditCancel = document.getElementById('btnLogEditCancel');
  
  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');
  const btnDeleteCancel = document.getElementById('btnDeleteCancel');

  let currentEditEntryId = null;
  let currentDeleteEntryId = null;

  if (logSearchInput) logSearchInput.addEventListener('input', () => renderLogs());
  if (logDateFilter) logDateFilter.addEventListener('change', () => renderLogs());
  if (logViewToggle) logViewToggle.addEventListener('change', () => renderLogs());

  if (btnLogEditCancel) {
    btnLogEditCancel.addEventListener('click', () => {
      logEditModal.style.display = 'none';
      currentEditEntryId = null;
    });
  }

  if (btnLogEditSave) {
    btnLogEditSave.addEventListener('click', () => {
      if (currentEditEntryId) {
        const entry = logEntries.find(e => e.id === currentEditEntryId);
        if (entry) {
          entry.text = logEditTextarea.value;
          localStorage.setItem('ventEntries', JSON.stringify(logEntries));
          renderLogs();
          if (window.updateGlobalIntelligenceState) window.updateGlobalIntelligenceState();
        }
      }
      logEditModal.style.display = 'none';
      currentEditEntryId = null;
    });
  }

  if (btnDeleteCancel) {
    btnDeleteCancel.addEventListener('click', () => {
      deleteConfirmModal.style.display = 'none';
      currentDeleteEntryId = null;
    });
  }

  if (btnDeleteConfirm) {
    btnDeleteConfirm.addEventListener('click', () => {
      if (currentDeleteEntryId) {
        logEntries = logEntries.filter(e => e.id !== currentDeleteEntryId);
        localStorage.setItem('ventEntries', JSON.stringify(logEntries));
        evaluateProfileAvatar();
        renderLogs();
        if (window.updateGlobalIntelligenceState) window.updateGlobalIntelligenceState();
      }
      deleteConfirmModal.style.display = 'none';
      currentDeleteEntryId = null;
    });
  }

  const renderCalendar = (filteredEntries, mode) => {
    logsContainer.style.display = 'none';
    calendarContainer.style.display = 'grid';
    calendarContainer.className = `calendar-container ${mode}`;
    calendarContainer.innerHTML = '';

    const days = mode === 'weekly' ? 7 : 30; // simple mock representation
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const cellDate = new Date(today);
      cellDate.setDate(today.getDate() - i);
      const cellDateStr = cellDate.toISOString().split('T')[0];
      
      const cellEntries = filteredEntries.filter(e => e.timestamp.startsWith(cellDateStr));
      
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      cell.innerHTML = `<div class="cal-date">${cellDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>`;
      
      cellEntries.forEach(() => {
        const dot = document.createElement('div');
        dot.className = 'cal-entry-dot';
        cell.appendChild(dot);
      });
      
      calendarContainer.appendChild(cell);
    }
  };

  const renderLogs = () => {
    if (!logsContainer) return;
    
    let filteredEntries = [...logEntries];
    
    // Apply filters
    const searchVal = logSearchInput ? logSearchInput.value.toLowerCase() : '';
    if (searchVal) {
      filteredEntries = filteredEntries.filter(e => e.text.toLowerCase().includes(searchVal));
    }
    
    const dateVal = logDateFilter ? logDateFilter.value : '';
    if (dateVal) {
      filteredEntries = filteredEntries.filter(e => e.timestamp.startsWith(dateVal));
    }
    
    const viewMode = logViewToggle ? logViewToggle.value : 'list';
    
    if (viewMode === 'archived') {
      filteredEntries = filteredEntries.filter(e => e.archived);
    } else {
      filteredEntries = filteredEntries.filter(e => !e.archived);
    }

    if (viewMode === 'weekly' || viewMode === 'monthly') {
      renderCalendar(filteredEntries, viewMode);
      return;
    } else {
      logsContainer.style.display = 'flex';
      if (calendarContainer) calendarContainer.style.display = 'none';
    }

    logsContainer.innerHTML = '';
    
    if (filteredEntries.length === 0) {
      logsContainer.innerHTML = '<p class="view-subtitle">Your past entries will appear here.</p>';
      return;
    }

    filteredEntries.forEach(entry => {
      const card = document.createElement('div');
      card.className = `log-card ${entry.archived ? 'archived' : ''}`;
      card.id = `log-entry-${entry.id}`;
      
      const header = document.createElement('div');
      header.className = 'log-card-header';
      header.textContent = formatDate(entry.timestamp);

      const bodyContent = document.createElement('div');
      bodyContent.className = 'log-card-body truncated';
      bodyContent.innerHTML = entry.text;
      bodyContent.onclick = () => {
        bodyContent.classList.toggle('truncated');
      };

      // Add Info prompt UI
      let addInfoPromptHtml = '';
      if (entry.nlpData && entry.nlpData.missingInfoPrompt) {
        let inputHtml = `<input type="text" class="add-info-input" placeholder="Type answer here...">`;
        
        if (entry.nlpData.missingInfoType === 'time') {
          inputHtml = `
            <select class="add-info-input" style="padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-color);">
              <option value="" disabled selected>Select a time...</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="3:00 PM">3:00 PM</option>
              <option value="4:00 PM">4:00 PM</option>
              <option value="5:00 PM">5:00 PM</option>
              <option value="6:00 PM">6:00 PM</option>
              <option value="7:00 PM">7:00 PM</option>
              <option value="8:00 PM">8:00 PM</option>
            </select>
          `;
        } else if (entry.nlpData.missingInfoType === 'duration') {
          inputHtml = `
            <select class="add-info-input" style="padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-color);">
              <option value="" disabled selected>Select duration...</option>
              <option value="15 mins">15 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="45 mins">45 mins</option>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="3+ hours">3+ hours</option>
              <option value="All day">All day</option>
            </select>
          `;
        }

        addInfoPromptHtml = `
          <div class="add-info-prompt">
            <strong>Add Info:</strong> ${entry.nlpData.missingInfoPrompt}
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
              ${inputHtml}
              <button class="log-btn btn-add-info">Update Context</button>
            </div>
          </div>
        `;
      }

      const actions = document.createElement('div');
      actions.className = 'log-card-actions';

      const btnEdit = document.createElement('button');
      btnEdit.className = 'log-btn btn-edit';
      btnEdit.textContent = 'Edit';
      btnEdit.onclick = () => {
        if (logEditModal && logEditTextarea) {
          logEditTextarea.value = entry.text;
          currentEditEntryId = entry.id;
          logEditModal.style.display = 'flex';
        }
      };

      const btnArchive = document.createElement('button');
      btnArchive.className = 'log-btn btn-archive';
      btnArchive.textContent = entry.archived ? 'Unarchive' : 'Archive';
      btnArchive.onclick = () => {
        entry.archived = !entry.archived;
        localStorage.setItem('ventEntries', JSON.stringify(logEntries));
        renderLogs();
        if (window.updateGlobalIntelligenceState) window.updateGlobalIntelligenceState();
      };

      const btnDelete = document.createElement('button');
      btnDelete.className = 'log-btn btn-delete';
      btnDelete.textContent = 'Delete';
      btnDelete.onclick = () => {
        if (deleteConfirmModal) {
          currentDeleteEntryId = entry.id;
          deleteConfirmModal.style.display = 'flex';
        }
      };

      const btnMap = document.createElement('button');
      btnMap.className = 'log-btn btn-map';
      btnMap.textContent = 'Change Map';
      
      const mapContainer = document.createElement('div');
      mapContainer.className = 'mind-map-container';
      mapContainer.style.display = 'none';

      btnMap.onclick = () => {
        if (mapContainer.style.display === 'none') {
          mapContainer.style.display = 'block';
          generateMindMap(mapContainer, entry);
        } else {
          mapContainer.style.display = 'none';
        }
      };

      actions.appendChild(btnMap);
      actions.appendChild(btnEdit);
      actions.appendChild(btnArchive);
      actions.appendChild(btnDelete);

      card.appendChild(header);
      card.appendChild(bodyContent);
      
      if (addInfoPromptHtml) {
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = addInfoPromptHtml;
        const btnAddInfo = infoDiv.querySelector('.btn-add-info');
        const infoInput = infoDiv.querySelector('.add-info-input');
        if (btnAddInfo && infoInput) {
          btnAddInfo.onclick = async () => {
            if (btnAddInfo.disabled) return;
            const addedText = infoInput.value;
            if (addedText) {
              btnAddInfo.disabled = true;
              btnAddInfo.textContent = 'Updating...';
              
              const snippet = entry.nlpData.triggerSnippet || "";
              let injectionString = ` [Added: ${addedText}]`;
              if (entry.nlpData.missingInfoType === 'time') {
                injectionString = ` at ${addedText}`;
              } else if (entry.nlpData.missingInfoType === 'duration') {
                injectionString = ` for ${addedText}`;
              }

              if (snippet && entry.text.includes(snippet)) {
                // Determine if snippet ends with punctuation
                const trimmedSnippet = snippet.trim();
                const lastChar = trimmedSnippet.slice(-1);
                
                if (['.', '!', '?'].includes(lastChar)) {
                  // Insert before the punctuation
                  const baseSnippet = trimmedSnippet.slice(0, -1);
                  entry.text = entry.text.replace(snippet, baseSnippet + injectionString + lastChar + " ");
                } else {
                  entry.text = entry.text.replace(snippet, snippet + injectionString);
                }
              } else {
                // Fallback: append at the end
                entry.text += injectionString;
              }
              
              // Clean up any double spaces that might occur
              entry.text = entry.text.replace(/\s{2,}/g, ' ');

              // RE-RUN NLP
              entry.nlpData = await processEntry(entry.text, {
                hobbies: localStorage.getItem('userHobbies') || '',
                hyperfixation: localStorage.getItem('userHyperfixation') || ''
              });

              localStorage.setItem('ventEntries', JSON.stringify(logEntries));
              renderLogs();
              if (window.updateGlobalIntelligenceState) window.updateGlobalIntelligenceState();
            }
          };
        }
        card.appendChild(infoDiv);
      }

      card.appendChild(mapContainer);
      card.appendChild(actions);

      logsContainer.appendChild(card);
    });
  };

  const generateMindMap = (container, entry) => {
    // If no NLP data exists for this entry, show a message
    if (!entry.nlpData) {
      container.innerHTML = '<p class="empty-text">No analytical data available for this entry.</p>';
      return;
    }

    const { hobbies, lifestyle, todos } = entry.nlpData;
    let nodesHtml = '';

    // Center Node
    nodesHtml += `<div class="map-node root-node">Journal Entry</div>`;

    // Branches
    const branches = [];
    if (hobbies && hobbies.achievements && hobbies.achievements.length > 0) branches.push({ name: 'Achievements', items: hobbies.achievements, color: '#facc15' });
    if (hobbies && hobbies.milestones && hobbies.milestones.length > 0) branches.push({ name: 'Hobbies', items: hobbies.milestones, color: '#38bdf8' });
    if (lifestyle && lifestyle.goodHabits.length > 0) branches.push({ name: 'Good Habits', items: lifestyle.goodHabits, color: '#4ade80' });
    if (lifestyle && lifestyle.badHabits.length > 0) branches.push({ name: 'Bad Habits', items: lifestyle.badHabits, color: '#f87171' });
    if (todos && todos.length > 0) branches.push({ name: 'To-Do', items: todos.map(t => t.task), color: '#fbbf24' });

    if (branches.length === 0) {
      container.innerHTML = '<p class="empty-text">No external connections mapped.</p>';
      return;
    }

    nodesHtml += '<div class="map-branches">';
    branches.forEach(b => {
      nodesHtml += `
        <div class="map-branch" style="--branch-color: ${b.color}">
          <div class="branch-connector"></div>
          <div class="map-node category-node">${b.name}</div>
          <div class="map-leaves">
            ${b.items.map(item => `<div class="map-node leaf-node clickable-node" data-category="${b.name}">${item}</div>`).join('')}
          </div>
        </div>
      `;
    });
    nodesHtml += '</div>';

    container.innerHTML = nodesHtml;

    // Attach click listeners for routing
    const leafNodes = container.querySelectorAll('.leaf-node');
    leafNodes.forEach(node => {
      node.addEventListener('click', () => {
        const category = node.getAttribute('data-category');
        let targetId = '';
        if (category === 'Hobbies' || category === 'Achievements') targetId = 'view-hobbies';
        else if (category === 'Good Habits' || category === 'Bad Habits') targetId = 'view-lifestyle';
        else if (category === 'To-Do') targetId = 'view-todo';
        
        if (targetId) {
          const targetDockItem = document.querySelector(`.dock-item[data-target="${targetId}"]`);
          if (targetDockItem) {
            targetDockItem.click();
            // Optional: Scroll target view to top
            const targetView = document.getElementById(targetId);
            if (targetView) {
              targetView.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }
      });
    });
  };

  evaluateProfileAvatar();
  renderLogs();

  // 3. SPA Routing & Dock State
  const dockItems = document.querySelectorAll('.dock-item');
  const appViews = document.querySelectorAll('.app-view');
  
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      // 1. Update Dock UI
      dockItems.forEach(d => d.classList.remove('active'));
      item.classList.add('active');

      // 2. Routing Logic
      const targetId = item.getAttribute('data-target');
      
      // Update global state for focus lock
      isHomeActive = (targetId === 'view-vent');
      
      // Toggle Views
      appViews.forEach(view => {
        if (view.id === targetId) {
          view.classList.add('active');
          // If returning home, immediately focus the textarea
          if (isHomeActive) ventTextarea.focus();
        } else {
          view.classList.remove('active');
        }
      });
      
      // 3. (Removed auto-close nav bubble)
    });

  // --- NETLIFY IDENTITY (GOTRUE) AUTHENTICATION LOGIC ---
  const viewAuth = document.getElementById('view-auth');
  const viewVent = document.getElementById('view-vent');
  const bottomDock = document.getElementById('bottomDock');
  const topHeader = document.querySelector('.top-header');
  
  const authForm = document.getElementById('authForm');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authToggleBtn = document.getElementById('authToggleBtn');
  const authToggleText = document.getElementById('authToggleText');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const authError = document.getElementById('authError');
  
  // The Sign Out button from Settings (pane: set-account)
  const btnSignOut = document.querySelector('#set-account .settings-row:last-child .settings-btn');
  
  let isSignUpMode = false;

  authToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
      btnAuthSubmit.textContent = 'Create Account';
      authToggleText.textContent = 'Already have an account?';
      authToggleBtn.textContent = 'Log In';
    } else {
      btnAuthSubmit.textContent = 'Log In';
      authToggleText.textContent = 'Need an account?';
      authToggleBtn.textContent = 'Sign Up';
    }
    authError.textContent = '';
  });

  const updateUIForAuth = (user) => {
    // Hide all views first
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    
    if (user) {
      // User is logged in
      viewAuth.style.display = 'none';
      viewVent.classList.add('active');
      isHomeActive = true;
      if (bottomDock) bottomDock.style.display = 'flex';
      if (topHeader) topHeader.style.display = 'flex';
      
      // Update dummy profile ID in settings if possible
      const ventIdEl = document.querySelector('#set-account .setting-desc');
      if (ventIdEl && ventIdEl.textContent.includes('user_0x')) {
        ventIdEl.textContent = user.id.substring(0, 10);
      }
    } else {
      // User is logged out
      viewAuth.style.display = 'flex';
      viewAuth.classList.add('active');
      isHomeActive = false;
      if (bottomDock) bottomDock.style.display = 'none';
      if (topHeader) topHeader.style.display = 'none';
    }
  };

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    authError.textContent = '';
    
    try {
      if (isSignUpMode) {
        await auth.signup(email, password);
        authError.style.color = '#4caf50'; // green for success
        authError.textContent = "Account created! Please check your email for a confirmation link.";
      } else {
        const user = await auth.login(email, password, true); // true = remember
        updateUIForAuth(user);
      }
    } catch (error) {
      authError.style.color = '#ff4757'; // reset to red
      authError.textContent = error.message || error.json?.error_description || "Authentication failed.";
    }
  });

  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      const user = auth.currentUser();
      if (user) {
        user.logout().then(() => {
          updateUIForAuth(null);
        }).catch(err => {
          console.error("Error logging out", err);
          updateUIForAuth(null);
        });
      } else {
        updateUIForAuth(null);
      }
    });
  }

  // Initial Auth Check
  updateUIForAuth(auth.currentUser());

});

  // 5. Settings Logic
  const settingsTabs = document.querySelectorAll('.settings-tab');
  const settingsPanes = document.querySelectorAll('.settings-pane');

  if (settingsTabs.length > 0) {
    settingsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active state
        settingsTabs.forEach(t => t.classList.remove('active'));
        settingsPanes.forEach(p => p.classList.remove('active'));
        
        // Add active state
        tab.classList.add('active');
        const targetPane = document.getElementById(tab.getAttribute('data-tab'));
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // --- COMPREHENSIVE SETTINGS LOGIC ---
    // Selectors
    const nameInput = document.getElementById('settingName');
    const userHandleDisplay = document.getElementById('userHandleDisplay');
    const pronounsInput = document.getElementById('settingPronouns');
    const hyperfixationInput = document.getElementById('settingHyperfixation');
    const energySelect = document.getElementById('settingEnergy');
    const zodiacSelect = document.getElementById('settingZodiac');
    const hobbiesInput = document.getElementById('settingHobbies');
    const placeInput = document.getElementById('settingPlace');
    const lightModeToggle = document.getElementById('settingLightMode');
    const brightnessSlider = document.getElementById('settingBrightness');
    const brightnessOverlay = document.getElementById('brightnessOverlay');
    const zenToggle = document.getElementById('settingZen');
    const hapticToggle = document.getElementById('settingHaptic');
    const dyslexiaToggle = document.getElementById('settingDyslexiaFont');

    // Goals Modal Selectors
    const btnManageGoals = document.getElementById('btnManageGoals');
    const goalsModal = document.getElementById('goalsModal');
    const btnGoalsClose = document.getElementById('btnGoalsClose');
    const goalsList = document.getElementById('goalsList');
    const newGoalInput = document.getElementById('newGoalInput');
    const btnAddGoal = document.getElementById('btnAddGoal');

    // Load and Apply Initial State
    const applySettings = () => {
      // Name
      const savedName = localStorage.getItem('ventUserName') || '@neurodivergent_';
      if (nameInput) nameInput.value = savedName;
      if (userHandleDisplay) userHandleDisplay.textContent = savedName;

      // About Me
      if (pronounsInput) pronounsInput.value = localStorage.getItem('ventPronouns') || '';
      if (hyperfixationInput) hyperfixationInput.value = localStorage.getItem('ventHyperfixation') || '';
      if (energySelect) energySelect.value = localStorage.getItem('ventEnergy') || '';
      if (zodiacSelect) zodiacSelect.value = localStorage.getItem('ventZodiac') || '';
      if (hobbiesInput) hobbiesInput.value = localStorage.getItem('ventHobbies') || '';
      if (placeInput) placeInput.value = localStorage.getItem('ventPlace') || '';

      // Interface
      const isLightMode = localStorage.getItem('ventLightMode') === 'true';
      if (lightModeToggle) lightModeToggle.checked = isLightMode;
      document.body.classList.toggle('theme-light', isLightMode);

      const savedBrightness = localStorage.getItem('ventBrightness') || '0';
      if (brightnessSlider) brightnessSlider.value = savedBrightness;
      if (brightnessOverlay) brightnessOverlay.style.background = `rgba(0,0,0,${savedBrightness / 100})`;

      const isZenMode = localStorage.getItem('ventZenMode') === 'true';
      if (zenToggle) zenToggle.checked = isZenMode;
      document.body.classList.toggle('zen-mode-active', isZenMode);

      // Accessibility
      if (hapticToggle) hapticToggle.checked = localStorage.getItem('ventHaptic') !== 'false'; // default true
      
      const isDyslexia = localStorage.getItem('ventDyslexia') === 'true';
      if (dyslexiaToggle) dyslexiaToggle.checked = isDyslexia;
      document.body.classList.toggle('dyslexia-font', isDyslexia);
    };

    applySettings();

    // Event Listeners
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        localStorage.setItem('ventUserName', e.target.value);
        if (userHandleDisplay) userHandleDisplay.textContent = e.target.value || '@neurodivergent_';
      });
    }

    if (pronounsInput) pronounsInput.addEventListener('input', (e) => localStorage.setItem('ventPronouns', e.target.value));
    if (hyperfixationInput) hyperfixationInput.addEventListener('input', (e) => localStorage.setItem('ventHyperfixation', e.target.value));
    if (energySelect) energySelect.addEventListener('change', (e) => localStorage.setItem('ventEnergy', e.target.value));
    if (zodiacSelect) zodiacSelect.addEventListener('change', (e) => localStorage.setItem('ventZodiac', e.target.value));
    if (hobbiesInput) hobbiesInput.addEventListener('input', (e) => localStorage.setItem('ventHobbies', e.target.value));
    if (placeInput) placeInput.addEventListener('input', (e) => localStorage.setItem('ventPlace', e.target.value));

    if (lightModeToggle) {
      lightModeToggle.addEventListener('change', (e) => {
        localStorage.setItem('ventLightMode', e.target.checked);
        document.body.classList.toggle('theme-light', e.target.checked);
      });
    }

    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('ventBrightness', val);
        if (brightnessOverlay) brightnessOverlay.style.background = `rgba(0,0,0,${val / 100})`;
      });
    }

    if (zenToggle) {
      zenToggle.addEventListener('change', (e) => {
        localStorage.setItem('ventZenMode', e.target.checked);
        document.body.classList.toggle('zen-mode-active', e.target.checked);
      });
    }

    if (hapticToggle) hapticToggle.addEventListener('change', (e) => localStorage.setItem('ventHaptic', e.target.checked));

    if (dyslexiaToggle) {
      dyslexiaToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          body.classList.add('dyslexia-font');
          localStorage.setItem('ventDyslexia', 'true');
        } else {
          body.classList.remove('dyslexia-font');
          localStorage.setItem('ventDyslexia', 'false');
        }
      });
    }

    // --- NLP STATE MANAGEMENT & RENDERING ---
    const updateGlobalIntelligenceState = () => {
      renderTodos();
      renderHobbies();
      renderLifestyle();
    };

    // Expose it globally so the submit button handler can use it
    window.updateGlobalIntelligenceState = updateGlobalIntelligenceState;

    window.jumpToEntry = (entryId) => {
      // 1. Switch to logs tab
      const logsDockItem = document.querySelector('.dock-item[data-target="view-logs"]');
      if (logsDockItem) logsDockItem.click();
      
      // 2. Clear filters so the entry is definitely rendered
      const searchInput = document.getElementById('logSearchInput');
      const dateFilter = document.getElementById('logDateFilter');
      const viewToggle = document.getElementById('logViewToggle');
      if (searchInput) searchInput.value = '';
      if (dateFilter) dateFilter.value = '';
      if (viewToggle) viewToggle.value = 'list';
      renderLogs();
      
      // 3. Scroll to it and highlight
      setTimeout(() => {
        const card = document.getElementById(`log-entry-${entryId}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.transition = 'box-shadow 0.3s, border-color 0.3s';
          card.style.borderColor = 'var(--accent-color)';
          card.style.boxShadow = '0 0 15px var(--accent-color)';
          setTimeout(() => {
            card.style.borderColor = '';
            card.style.boxShadow = '';
          }, 2000);
        }
      }, 100);
    };

    window.toggleTodo = (entryId, todoIdx) => {
      const entry = logEntries.find(e => String(e.id) === String(entryId));
      if (entry && entry.nlpData && entry.nlpData.todos) {
        entry.nlpData.todos[todoIdx].completed = !entry.nlpData.todos[todoIdx].completed;
        localStorage.setItem('ventEntries', JSON.stringify(logEntries));
        renderTodos();
      }
    };

    window.promptAddDate = (entryId, todoIdx) => {
      const entry = logEntries.find(e => String(e.id) === String(entryId));
      if (!entry || !entry.nlpData || !entry.nlpData.todos) return;
      const todo = entry.nlpData.todos[todoIdx];
      const current = (todo.metadata && todo.metadata.date) ? todo.metadata.date : '';
      const dateStr = prompt("Enter a date and/or time for this task (e.g., 'Tomorrow', 'Monday at 5pm'):", current);
      if (dateStr !== null) {
        if (!todo.metadata) todo.metadata = {};
        todo.metadata.date = dateStr.trim();
        if (todo.metadata.date === '') delete todo.metadata.date; // Clear it if emptied
        localStorage.setItem('ventEntries', JSON.stringify(logEntries));
        renderTodos();
      }
    };

    window.editTodoText = (entryId, todoIdx) => {
      const entry = logEntries.find(e => String(e.id) === String(entryId));
      if (!entry || !entry.nlpData || !entry.nlpData.todos) return;
      const todo = entry.nlpData.todos[todoIdx];
      const newText = prompt("Edit task:", todo.task);
      if (newText !== null && newText.trim() !== '') {
        todo.task = newText.trim();
        localStorage.setItem('ventEntries', JSON.stringify(logEntries));
        renderTodos();
      }
    };

    window.deleteTodo = (entryId, todoIdx) => {
      if (!confirm("Delete this task?")) return;
      const entry = logEntries.find(e => String(e.id) === String(entryId));
      if (!entry || !entry.nlpData || !entry.nlpData.todos) return;
      entry.nlpData.todos.splice(todoIdx, 1);
      localStorage.setItem('ventEntries', JSON.stringify(logEntries));
      renderTodos();
    };

    window.togglePriority = (entryId, todoIdx) => {
      const entry = logEntries.find(e => String(e.id) === String(entryId));
      if (!entry || !entry.nlpData || !entry.nlpData.todos) return;
      const todo = entry.nlpData.todos[todoIdx];
      if (!todo.metadata) todo.metadata = {};
      
      const priorities = ['low', 'normal', 'high'];
      let currentIdx = priorities.indexOf(todo.metadata.priority);
      if (currentIdx === -1) currentIdx = 1; // Default to normal
      
      todo.metadata.priority = priorities[(currentIdx + 1) % priorities.length];
      localStorage.setItem('ventEntries', JSON.stringify(logEntries));
      renderTodos();
    };

    const renderTodos = () => {
      const todoContainer = document.getElementById('todoContainer');
      const searchInput = document.getElementById('todoSearchInput');
      const dateFilter = document.getElementById('todoDateFilter');
      const viewToggle = document.getElementById('todoViewToggle');
      if (!todoContainer) return;
      
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
      const filterDate = dateFilter ? dateFilter.value : '';
      const viewType = viewToggle ? viewToggle.value : 'pending';

      const activeEntries = logEntries.filter(e => !e.archived);
      let html = '';
      let hasTasks = false;

      // Flatten tasks to make filtering and sorting easier
      let allTasks = [];
      activeEntries.forEach(entry => {
        if (entry.nlpData && entry.nlpData.todos && entry.nlpData.todos.length > 0) {
          entry.nlpData.todos.forEach((todo, idx) => {
            allTasks.push({
              ...todo,
              entryId: entry.id,
              todoIdx: idx,
              timestamp: entry.timestamp
            });
          });
        }
      });

      // Filter tasks
      allTasks = allTasks.filter(task => {
        // View Toggle
        if (viewType === 'pending' && task.completed) return false;
        if (viewType === 'completed' && !task.completed) return false;
        // Search
        if (searchTerm && !task.task.toLowerCase().includes(searchTerm)) return false;
        // Date (compare YYYY-MM-DD from entry timestamp or task metadata)
        if (filterDate) {
          const entryDate = new Date(task.timestamp).toISOString().split('T')[0];
          // If the task has a specific date string, it's harder to match exactly against the date picker without parsing relative dates.
          // For now, filter by the entry creation date.
          if (entryDate !== filterDate) return false;
        }
        return true;
      });

      if (window.currentTodoLayout && window.currentTodoLayout !== 'list') {
        todoContainer.style.display = 'none';
        const todoCalendarContainer = document.getElementById('todoCalendarContainer');
        if (todoCalendarContainer) {
          todoCalendarContainer.style.display = 'grid';
          const mode = window.currentTodoLayout;
          todoCalendarContainer.className = `calendar-container ${mode}`;
          todoCalendarContainer.innerHTML = '';
          
          const today = new Date();
          let daysToRender = [];
          
          if (mode === 'weekly') {
            // Rolling 7 days
            let firstDay, lastDay;
            for (let i = 6; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(today.getDate() - i);
              if (i === 6) firstDay = d;
              if (i === 0) lastDay = d;
              daysToRender.push(d);
            }
            // Add header
            const header = document.createElement('div');
            header.style.gridColumn = '1 / -1';
            header.style.textAlign = 'center';
            header.style.fontSize = '1.2rem';
            header.style.marginBottom = '1rem';
            header.style.color = 'var(--text-color)';
            header.style.fontWeight = '500';
            header.textContent = `${firstDay.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${lastDay.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`;
            todoCalendarContainer.appendChild(header);
          } else {
            // Exact current month
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Add header
            const header = document.createElement('div');
            header.style.gridColumn = '1 / -1';
            header.style.textAlign = 'center';
            header.style.fontSize = '1.2rem';
            header.style.marginBottom = '1rem';
            header.style.color = 'var(--text-color)';
            header.style.fontWeight = '500';
            header.textContent = today.toLocaleString('default', { month: 'long', year: 'numeric' });
            todoCalendarContainer.appendChild(header);
            
            for (let i = 1; i <= daysInMonth; i++) {
              daysToRender.push(new Date(currentYear, currentMonth, i));
            }
          }

          daysToRender.forEach(cellDate => {
            const cellDateStr = cellDate.toLocaleDateString('sv-SE'); // YYYY-MM-DD local
            const cellTasks = allTasks.filter(t => t.timestamp.startsWith(cellDateStr));
            
            const cell = document.createElement('div');
            cell.className = 'cal-cell';
            cell.innerHTML = `<div class="cal-date">${cellDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>`;
            
            cellTasks.forEach((task) => {
              const dot = document.createElement('div');
              dot.className = 'cal-entry-dot';
              dot.style.background = task.completed ? '#4caf50' : '#ffa502'; // Green for completed, Orange for pending
              cell.appendChild(dot);
            });
            
            if (cellTasks.length > 0) {
              cell.style.cursor = 'pointer';
              cell.addEventListener('click', () => {
                const modal = document.getElementById('calendarEntryModal');
                const modalTitle = document.getElementById('calendarModalTitle');
                const modalContent = document.getElementById('calendarModalContent');
                
                modalTitle.textContent = cellDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                
                let contentHtml = '<ul style="list-style: none; padding: 0;">';
                cellTasks.forEach(t => {
                  contentHtml += `<li style="margin-bottom: 0.8rem; display: flex; align-items: flex-start; gap: 0.8rem;">
                    <span style="color: ${t.completed ? '#4caf50' : '#ffa502'}; margin-top: 2px;">•</span>
                    <span style="color: var(--text-color);">${t.task}</span>
                  </li>`;
                });
                contentHtml += '</ul>';
                modalContent.innerHTML = contentHtml;
                
                modal.classList.add('show');
              });
            }
            
            todoCalendarContainer.appendChild(cell);
          });
        }
      } else {
        const todoCalendarContainer = document.getElementById('todoCalendarContainer');
        if (todoCalendarContainer) todoCalendarContainer.style.display = 'none';
        todoContainer.style.display = 'block';

        if (allTasks.length === 0) {
          todoContainer.innerHTML = '<p class="empty-text">No tasks found.</p>';
        } else {
          html = allTasks.map(task => {
            let metadataHtml = '';
            let hasDate = false;
            
            // Priority Flag (default to normal)
            let priority = task.metadata && task.metadata.priority ? task.metadata.priority : 'normal';
            let priorityIndicator = '';
            if (priority === 'high') priorityIndicator = '<span class="priority-flag high" title="High Priority" style="margin-right: 4px; font-size: 0.85em;">🔴</span>';
            else if (priority === 'low') priorityIndicator = '<span class="priority-flag low" title="Low Priority" style="margin-right: 4px; font-size: 0.85em;">🟢</span>';

            if (task.metadata) {
              if (task.metadata.date) { metadataHtml += `<span class="task-meta-tag" style="cursor:pointer;" onclick="event.preventDefault(); event.stopPropagation(); window.promptAddDate('${task.entryId}', ${task.todoIdx})" title="Edit Date">📅 ${task.metadata.date}</span>`; hasDate = true; }
              if (task.metadata.time) { metadataHtml += `<span class="task-meta-tag" style="cursor:pointer;" title="Edit Time">⏰ ${task.metadata.time}</span>`; hasDate = true; }
              if (task.metadata.duration) metadataHtml += `<span class="task-meta-tag">⏱️ ${task.metadata.duration}</span>`;
            }
            
            const addDateBtn = !hasDate ? `<span class="task-meta-tag add-date-btn" onclick="event.preventDefault(); event.stopPropagation(); window.promptAddDate('${task.entryId}', ${task.todoIdx})" style="cursor: pointer; border: 1px dashed rgba(255,255,255,0.3); background: transparent; color: rgba(255,255,255,0.6);" title="Add Date">+ Add Date</span>` : '';

            const actionsHtml = `
              <div class="todo-actions" style="display: flex; gap: 0.4rem; opacity: 0; transition: opacity 0.2s ease; align-items: center;">
                <button type="button" title="Toggle Priority" onclick="window.togglePriority('${task.entryId}', ${task.todoIdx})" style="background:none; border:none; cursor:pointer; color:inherit; font-size: 1rem;">🚩</button>
                <button type="button" title="Edit Task" onclick="window.editTodoText('${task.entryId}', ${task.todoIdx})" style="background:none; border:none; cursor:pointer; color:inherit; font-size: 1rem;">✏️</button>
                <button type="button" title="Change Date/Time" onclick="window.promptAddDate('${task.entryId}', ${task.todoIdx})" style="background:none; border:none; cursor:pointer; color:inherit; font-size: 1rem;">📅</button>
                <button type="button" title="Delete Task" onclick="window.deleteTodo('${task.entryId}', ${task.todoIdx})" style="background:none; border:none; cursor:pointer; color:#ff4757; font-size: 1rem;">🗑️</button>
              </div>
            `;

            return `
              <div class="todo-item" style="display: flex; align-items: center; justify-content: space-between; padding-right: 16px;">
                <label class="todo-label" style="flex: 1;">
                  <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="window.toggleTodo('${task.entryId}', ${task.todoIdx})">
                  <div style="flex: 1;">
                    <span class="todo-text ${task.completed ? 'completed' : ''}" onclick="event.preventDefault(); event.stopPropagation(); window.jumpToEntry('${task.entryId}')" title="Jump to entry">
                      ${priorityIndicator}${task.task}
                    </span>
                    <div style="margin-top: 0.4rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                      ${metadataHtml}
                      ${addDateBtn}
                    </div>
                  </div>
                </label>
                ${actionsHtml}
              </div>
            `;
          }).join('');
          todoContainer.innerHTML = html;
        }
      }
    };

    // Attach Event Listeners to To-Do controls
    const attachTodoListeners = () => {
      const searchInput = document.getElementById('todoSearchInput');
      const dateFilter = document.getElementById('todoDateFilter');
      const viewToggle = document.getElementById('todoViewToggle');
      const btnViewOption = document.getElementById('btnViewOption');
      
      window.currentTodoLayout = window.currentTodoLayout || 'list';
      
      if (btnViewOption) {
        btnViewOption.value = window.currentTodoLayout;
        btnViewOption.addEventListener('change', (e) => {
          window.currentTodoLayout = e.target.value;
          renderTodos();
        });
      }
      
      const btnCalendarModalClose = document.getElementById('btnCalendarModalClose');
      const calendarEntryModal = document.getElementById('calendarEntryModal');
      if (btnCalendarModalClose && calendarEntryModal) {
        btnCalendarModalClose.addEventListener('click', () => {
          calendarEntryModal.classList.remove('show');
        });
        calendarEntryModal.addEventListener('click', (e) => {
          if (e.target === calendarEntryModal) {
            calendarEntryModal.classList.remove('show');
          }
        });
      }
      
      if (searchInput) searchInput.addEventListener('input', renderTodos);
      if (dateFilter) dateFilter.addEventListener('change', renderTodos);
      if (viewToggle) viewToggle.addEventListener('change', renderTodos);
      
      const quickAddForm = document.getElementById('todoQuickAddForm');
      const quickAddInput = document.getElementById('todoQuickAddInput');
      const btnQuickAddDate = document.getElementById('btnQuickAddDate');
      const quickAddDateLabel = document.getElementById('quickAddDateLabel');
      const hiddenDateInput = document.getElementById('todoQuickAddHiddenDate');
      
      const todoDateModal = document.getElementById('todoDateModal');
      const btnTodoDateConfirm = document.getElementById('btnTodoDateConfirm');
      const btnTodoDateCancel = document.getElementById('btnTodoDateCancel');

      // Custom Calendar State
      let currentCalDate = new Date();
      let selectedCalDate = new Date();

      const timeHour = document.getElementById('timeHour');
      const timeMinute = document.getElementById('timeMinute');
      const timeAmPm = document.getElementById('timeAmPm');
      
      const renderCustomCalendar = () => {
        const calGrid = document.getElementById('calGrid');
        const calMonthYear = document.getElementById('calMonthYear');
        if (!calGrid || !calMonthYear) return;

        // Init time dropdowns if empty
        if (timeHour && timeHour.children.length === 0) {
          for (let i = 1; i <= 12; i++) {
            const opt = document.createElement('option');
            opt.value = i.toString().padStart(2, '0');
            opt.textContent = i.toString().padStart(2, '0');
            if (i === 12) opt.selected = true; // default 12
            timeHour.appendChild(opt);
          }
          for (let i = 0; i < 60; i += 5) {
            const opt = document.createElement('option');
            opt.value = i.toString().padStart(2, '0');
            opt.textContent = i.toString().padStart(2, '0');
            if (i === 0) opt.selected = true;
            timeMinute.appendChild(opt);
          }
        }

        calMonthYear.textContent = currentCalDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        
        // Clear old days (keep day headers)
        Array.from(calGrid.children).forEach((child, idx) => {
          if (idx >= 7) child.remove();
        });

        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Prev month padding
        for (let i = firstDay - 1; i >= 0; i--) {
          const div = document.createElement('div');
          div.className = 'cal-day muted';
          div.textContent = daysInPrevMonth - i;
          calGrid.appendChild(div);
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
          const div = document.createElement('div');
          div.className = 'cal-day';
          div.textContent = i;
          
          if (selectedCalDate && 
              selectedCalDate.getDate() === i && 
              selectedCalDate.getMonth() === month && 
              selectedCalDate.getFullYear() === year) {
            div.classList.add('active');
          }

          div.addEventListener('click', () => {
            selectedCalDate = new Date(year, month, i);
            renderCustomCalendar();
          });
          
          calGrid.appendChild(div);
        }

        // Next month padding
        const totalCells = firstDay + daysInMonth;
        const nextPadding = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= nextPadding; i++) {
          const div = document.createElement('div');
          div.className = 'cal-day muted';
          div.textContent = i;
          calGrid.appendChild(div);
        }
      };

      const btnCalPrev = document.getElementById('btnCalPrev');
      const btnCalNext = document.getElementById('btnCalNext');
      if (btnCalPrev) {
        btnCalPrev.addEventListener('click', () => {
          currentCalDate.setMonth(currentCalDate.getMonth() - 1);
          renderCustomCalendar();
        });
      }
      if (btnCalNext) {
        btnCalNext.addEventListener('click', () => {
          currentCalDate.setMonth(currentCalDate.getMonth() + 1);
          renderCustomCalendar();
        });
      }

      if (btnQuickAddDate && todoDateModal) {
        btnQuickAddDate.addEventListener('click', () => {
          renderCustomCalendar();
          todoDateModal.style.display = 'flex';
        });
        btnTodoDateCancel.addEventListener('click', () => {
          todoDateModal.style.display = 'none';
        });
        btnTodoDateConfirm.addEventListener('click', () => {
          const h = parseInt(timeHour.value, 10);
          const m = parseInt(timeMinute.value, 10);
          const isPm = timeAmPm.value === 'PM';
          
          let hour24 = h;
          if (isPm && h !== 12) hour24 += 12;
          if (!isPm && h === 12) hour24 = 0;
          
          selectedCalDate.setHours(hour24, m, 0, 0);
          hiddenDateInput.value = selectedCalDate.toISOString();
          quickAddDateLabel.textContent = selectedCalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
          
          todoDateModal.style.display = 'none';
        });
        // Click outside modal to close
        todoDateModal.addEventListener('click', (e) => {
          if (e.target === todoDateModal) todoDateModal.style.display = 'none';
        });
      }

      if (quickAddForm) {
        quickAddForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!quickAddInput.value.trim()) return;
          
          let manualEntry = logEntries.find(e => e.id === 'manual-todos');
          if (!manualEntry) {
            manualEntry = {
              id: 'manual-todos',
              timestamp: new Date().toISOString(),
              text: 'Manual Tasks',
              archived: false,
              nlpData: { todos: [], hobbies: {}, lifestyle: {} }
            };
            logEntries.push(manualEntry);
          }
          
          if (!manualEntry.nlpData) manualEntry.nlpData = { todos: [] };
          if (!manualEntry.nlpData.todos) manualEntry.nlpData.todos = [];
          
          let dateStr = '';
          if (hiddenDateInput && hiddenDateInput.value) {
            const d = new Date(hiddenDateInput.value);
            dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
          }
          
          manualEntry.nlpData.todos.push({
            task: quickAddInput.value.trim(),
            completed: false,
            metadata: { priority: 'normal', date: dateStr }
          });
          
          localStorage.setItem('ventEntries', JSON.stringify(logEntries));
          quickAddInput.value = '';
          if (hiddenDateInput) hiddenDateInput.value = '';
          if (quickAddDateLabel) quickAddDateLabel.textContent = 'Add Date';
          if (popupDateInput) popupDateInput.value = '';
          renderTodos();
        });
      }
    };
    attachTodoListeners();

    const renderHobbies = () => {
      const hobbiesContainer = document.getElementById('hobbiesContainer');
      if (!hobbiesContainer) return;
      
      const activeEntries = logEntries.filter(e => !e.archived);
      
      const allAchievements = [];
      const allMilestones = [];
      const allInsights = [];
      const allAdvice = [];

      activeEntries.forEach(e => {
        if (e.nlpData && e.nlpData.hobbies) {
          const h = e.nlpData.hobbies;
          if (h.achievements) h.achievements.forEach(a => allAchievements.push({ text: a, entryId: e.id }));
          if (h.milestones) h.milestones.forEach(m => allMilestones.push({ text: m, entryId: e.id }));
          if (h.insights) allInsights.push({ text: h.insights, entryId: e.id });
          if (h.advice) allAdvice.push({ text: h.advice, entryId: e.id });
        }
      });

      const deduplicate = (arr) => {
        const map = new Map();
        arr.forEach(item => {
          if (!map.has(item.text)) map.set(item.text, item.entryId);
        });
        return Array.from(map.entries()).map(([text, entryId]) => ({ text, entryId }));
      };

      const uniqueAchievements = deduplicate(allAchievements);
      const uniqueMilestones = deduplicate(allMilestones);
      const uniqueInsights = deduplicate(allInsights);
      const uniqueAdvice = deduplicate(allAdvice);

      if (uniqueAchievements.length === 0 && uniqueMilestones.length === 0 && uniqueInsights.length === 0 && uniqueAdvice.length === 0) {
        hobbiesContainer.innerHTML = '<p class="empty-text">No hobby data derived yet.</p>';
        return;
      }

      const renderLink = (item) => `<span style="cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: text-decoration-color 0.2s;" onmouseover="this.style.textDecorationColor='currentColor'" onmouseout="this.style.textDecorationColor='transparent'" onclick="window.jumpToEntry('${item.entryId}')" title="Jump to entry">${item.text}</span>`;

      hobbiesContainer.innerHTML = `
        <div class="data-card">
          <h4>Achievements</h4>
          ${uniqueAchievements.length > 0 ? `<ul>${uniqueAchievements.map(a => `<li>${renderLink(a)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No achievements recorded yet.</p>'}
        </div>
        <div class="data-card">
          <h4>Milestones</h4>
          ${uniqueMilestones.length > 0 ? `<ul>${uniqueMilestones.map(m => `<li>${renderLink(m)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No milestones tracked yet.</p>'}
        </div>
        <div class="data-card">
          <h4>Intelligence Insights</h4>
          ${uniqueInsights.length > 0 ? `<ul>${uniqueInsights.map(i => `<li>${renderLink(i)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No behavioral insights available.</p>'}
        </div>
        <div class="data-card">
          <h4>Elite Mastery Advice</h4>
          ${uniqueAdvice.length > 0 ? `<ul>${uniqueAdvice.map(a => `<li class="advice-text">${renderLink(a)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No mastery tips generated yet.</p>'}
        </div>
      `;
    };

    const renderLifestyle = () => {
      const lifestyleContainer = document.getElementById('lifestyleContainer');
      if (!lifestyleContainer) return;
      
      const activeEntries = logEntries.filter(e => !e.archived);
      
      const allGoodHabits = [];
      const allBadHabits = [];
      const allMilestones = [];
      const allInsights = [];

      activeEntries.forEach(e => {
        if (e.nlpData && e.nlpData.lifestyle) {
          const l = e.nlpData.lifestyle;
          if (l.goodHabits) l.goodHabits.forEach(h => allGoodHabits.push({ text: h, entryId: e.id }));
          if (l.badHabits) l.badHabits.forEach(h => allBadHabits.push({ text: h, entryId: e.id }));
          if (l.milestones) l.milestones.forEach(m => allMilestones.push({ text: m, entryId: e.id }));
          if (l.insights) allInsights.push({ text: l.insights, entryId: e.id });
        }
      });

      const deduplicate = (arr) => {
        const map = new Map();
        arr.forEach(item => {
          if (!map.has(item.text)) map.set(item.text, item.entryId);
        });
        return Array.from(map.entries()).map(([text, entryId]) => ({ text, entryId }));
      };

      const uniqueGoodHabits = deduplicate(allGoodHabits);
      const uniqueBadHabits = deduplicate(allBadHabits);
      const uniqueMilestones = deduplicate(allMilestones);
      const uniqueInsights = deduplicate(allInsights);

      if (uniqueGoodHabits.length === 0 && uniqueBadHabits.length === 0 && uniqueMilestones.length === 0 && uniqueInsights.length === 0) {
        lifestyleContainer.innerHTML = '<p class="empty-text">No lifestyle data derived yet.</p>';
        return;
      }

      const renderLink = (item) => `<span style="cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: text-decoration-color 0.2s;" onmouseover="this.style.textDecorationColor='currentColor'" onmouseout="this.style.textDecorationColor='transparent'" onclick="window.jumpToEntry('${item.entryId}')" title="Jump to entry">${item.text}</span>`;

      lifestyleContainer.innerHTML = `
        <div class="data-card">
          <h4>Good Habits</h4>
          ${uniqueGoodHabits.length > 0 ? `<ul>${uniqueGoodHabits.map(h => `<li>${renderLink(h)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No good habits recorded yet.</p>'}
        </div>
        <div class="data-card">
          <h4>Bad Habits</h4>
          ${uniqueBadHabits.length > 0 ? `<ul>${uniqueBadHabits.map(h => `<li>${renderLink(h)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No bad habits tracked yet.</p>'}
        </div>
        <div class="data-card">
          <h4>Milestones</h4>
          ${uniqueMilestones.length > 0 ? `<ul>${uniqueMilestones.map(m => `<li>${renderLink(m)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No milestones tracked yet.</p>'}
        </div>
        <div class="data-card">
          <h4>Intelligence Insights</h4>
          ${uniqueInsights.length > 0 ? `<ul>${uniqueInsights.map(i => `<li>${renderLink(i)}</li>`).join('')}</ul>` : '<p class="empty-text" style="margin-top:0">No behavioral insights available.</p>'}
        </div>
      `;
    };

    // Initial renders
    renderTodos();
    renderHobbies();
    renderLifestyle();

    // Goals Management
    let myGoals = JSON.parse(localStorage.getItem('ventGoals')) || [];

    const renderGoals = () => {
      if (!goalsList) return;
      goalsList.innerHTML = '';
      if (myGoals.length === 0) {
        goalsList.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center;">No goals yet.</p>';
        return;
      }
      myGoals.forEach((goal, idx) => {
        const div = document.createElement('div');
        div.className = 'goal-item';
        div.innerHTML = `
          <div class="goal-item-content">
            <span class="goal-rank">#${idx + 1}</span>
            <span>${goal}</span>
          </div>
          <button class="settings-btn" style="padding: 4px 8px; font-size: 12px; background: rgba(255,51,51,0.1); border-color: rgba(255,51,51,0.5); color: #ff3333;" data-idx="${idx}">X</button>
        `;
        div.querySelector('button').addEventListener('click', (e) => {
          const index = parseInt(e.target.getAttribute('data-idx'), 10);
          myGoals.splice(index, 1);
          localStorage.setItem('ventGoals', JSON.stringify(myGoals));
          renderGoals();
        });
        goalsList.appendChild(div);
      });
    };

    if (btnManageGoals && goalsModal) {
      btnManageGoals.addEventListener('click', () => {
        renderGoals();
        goalsModal.classList.add('active');
      });
    }
    
    if (btnGoalsClose && goalsModal) {
      btnGoalsClose.addEventListener('click', () => goalsModal.classList.remove('active'));
    }

    if (btnAddGoal && newGoalInput) {
      btnAddGoal.addEventListener('click', () => {
        const val = newGoalInput.value.trim();
        if (val) {
          myGoals.push(val);
          localStorage.setItem('ventGoals', JSON.stringify(myGoals));
          newGoalInput.value = '';
          renderGoals();
        }
      });
      newGoalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnAddGoal.click();
      });
    }


    // Export Data Mock
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        const data = localStorage.getItem('ventEntries') || '[]';
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vent_data_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Data Exported');
      });
    }

    // Clear Data Mock
    const btnClearData = document.getElementById('btnClearData');
    if (btnClearData) {
      btnClearData.addEventListener('click', () => {
        if (confirm('Are you absolutely sure? This will delete all your local data and logs permanently.')) {
          localStorage.clear();
          logEntries = [];
          evaluateProfileAvatar();
          renderLogs();
          showToast('All Data Erased');
        }
      });
    }
  }

});
