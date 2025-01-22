async function fillFormFields(driver) {
    const script = {
      target: {
        tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id,
        allFrames: true  // This enables the script to run in all iframes
      },
      func: async (driverData) => {
        async function fillFileInput(fileData) {
          // ... existing fillFileInput code ...
        }
  
        function getStringSimilarity(str1, str2) {
          str1 = str1.toLowerCase().trim();
          str2 = str2.toLowerCase().trim();
          
          // Remove common words that might interfere with matching
          const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to'];
          commonWords.forEach(word => {
            str1 = str1.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
            str2 = str2.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
          });
          
          // Calculate Levenshtein distance
          const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
          for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
          for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
          for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
              const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
              matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + cost
              );
            }
          }
  
          const maxLength = Math.max(str1.length, str2.length);
          return 1 - matrix[str2.length][str1.length] / maxLength;
        }
  
        function findBestMatchingInput(fieldName, value) {
          const allInputs = document.querySelectorAll('input, select, textarea');
          let bestMatch = null;
          let bestScore = 0;
  
          // Convert field name to a more readable format
          const readableFieldName = fieldName
            .split('.')
            .pop()
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase();
  
          allInputs.forEach(input => {
            // Check various attributes for matching
            const attributes = [
              input.name,
              input.id,
              input.placeholder,
              input.getAttribute('aria-label'),
              input.getAttribute('data-field'),
              input.getAttribute('data-test'),
              input.getAttribute('data-cy'),
              input.getAttribute('data-automation')
            ];
  
            // Get associated label text
            const labelText = (() => {
              // Check for explicit label
              if (input.id) {
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (label) return label.textContent;
              }
              
              // Check for implicit label
              const parent = input.closest('label');
              if (parent) return parent.textContent;
  
              // Check for aria-labelledby
              const labelledBy = input.getAttribute('aria-labelledby');
              if (labelledBy) {
                return document.getElementById(labelledBy)?.textContent;
              }
  
              // Check for nearby text
              const previousText = input.previousSibling?.textContent;
              const nextText = input.nextSibling?.textContent;
              return previousText || nextText || '';
            })();
  
            attributes.push(labelText);
  
            // Calculate best matching score from all attributes
            const scores = attributes
              .filter(attr => attr)
              .map(attr => getStringSimilarity(readableFieldName, attr));
            
            const score = Math.max(...scores, 0);
  
            if (score > bestScore && score > 0.6) { // Threshold of 0.6 for minimum similarity
              bestScore = score;
              bestMatch = input;
            }
          });
  
          return bestMatch;
        }
  
        function fillInput(selector, value, isFileInput = false) {
          // Try original selectors first
          let inputs = document.querySelectorAll(selector);
          
          // If no matches found, try fuzzy matching
          if (inputs.length === 0) {
            const bestMatch = findBestMatchingInput(selector, value);
            inputs = bestMatch ? [bestMatch] : [];
          }
  
          inputs.forEach(async (input) => {
            try {
              const tag = input.tagName.toLowerCase();
  
              if (tag === "input") {
                const type = input.type.toLowerCase();
  
                if (type === "file" && isFileInput) {
                  const files = await fillFileInput(value);
                  if (files) {
                    input.files = files;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                } else if (type === "checkbox" || type === "radio") {
                  input.checked = value === true || value === input.value;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                } else if (type === "date" && value) {
                  const date = new Date(value);
                  if (!isNaN(date)) {
                    input.value = date.toISOString().split("T")[0];
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                } else if (value != null) {
                  input.value = value;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                }
              } else if (tag === "select" && value != null) {
                // Try to match select options by value or text
                const options = Array.from(input.options);
                const option = options.find(
                  opt => 
                    opt.value.toLowerCase() === String(value).toLowerCase() ||
                    opt.text.toLowerCase() === String(value).toLowerCase()
                );
                if (option) {
                  input.value = option.value;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
            } catch (error) {
              console.error(`Error filling input ${selector}:`, error);
            }
          });
          return inputs.length > 0;
        }
  
        // Your existing fieldMap...
        const fieldMap = {
          // ... (keep your existing fieldMap)
        };
  
        // Fill all fields and track success
        const results = await Promise.all(
          Object.entries(fieldMap).map(async ([field, selector]) => {
            const value = field.split(".").reduce((obj, key) => obj?.[key], driverData);
            const isFileInput = field.startsWith("documents.");
            if (value) {
              const success = await fillInput(selector, value, isFileInput);
              return { field, success };
            }
            return { field, success: false };
          })
        );
  
        // Return detailed results
        return {
          success: results.some(r => r.success),
          filledFields: results.filter(r => r.success).map(r => r.field),
          failedFields: results.filter(r => !r.success).map(r => r.field)
        };
      },
      args: [driver],
    };
  
    try {
      const results = await chrome.scripting.executeScript(script);
      const result = results[0].result;
      
      if (result.success) {
        showStatus(`Successfully filled ${result.filledFields.length} fields`);
      } else {
        showStatus(`No fields were filled`, true);
      }
      
      // Log detailed results
      console.log('Filled fields:', result.filledFields);
      console.log('Failed fields:', result.failedFields);
    } catch (error) {
      showStatus(`Error: ${error.message || error}`, true);
      console.error("Fill error:", error);
    }
  }