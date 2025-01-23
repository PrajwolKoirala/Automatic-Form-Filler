
// popup.js
let drivers = [];

function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = isError ? "error" : "success";
}

function showDriverInfo(driver) {
  const info = document.getElementById("driverInfo");
  if (!driver) {
    info.style.display = "none";
    return;
  }

  info.style.display = "block";
  info.innerHTML = `
    <strong>Selected Driver:</strong><br>
    Name: ${driver.firstName} ${driver.lastName}<br>
    Email: ${driver.email}<br>
    License: ${driver.license?.number || "N/A"}<br>
    Documents: ${
      Object.entries(driver.documents || {})
        .filter(([_, doc]) => doc?.url)
        .map(([type]) => type)
        .join(", ") || "None"
    }
  `;
}

async function fetchDrivers() {
  try {
    const response = await fetch("http://localhost:3000/api/drivers");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    drivers = await response.json();
    console.log("🚀 ~ file: popup.js:240 ~ fetchDrivers ~ drivers:", drivers);

    const select = document.getElementById("driverSelect");
    // Clear existing options except the first one
    while (select.options.length > 1) {
      select.remove(1);
    }

    drivers.forEach((driver) => {
      const option = document.createElement("option");
      option.value = driver._id;
      option.textContent = `${driver.firstName} ${driver.lastName} (${driver.email})`;
      select.appendChild(option);
    });
  } catch (error) {
    showStatus("Error fetching drivers: " + error.message, true);
    console.error("Fetch error:", error);
  }
}

async function fillFormFields(driver) {
  const script = {
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
        .id,
        allFrames: true // Inject into all frames
    },
    func: async (driverData) => {
      async function fillFileInput(fileData) {
        if (!fileData?.url) return false;

        try {
          const response = await fetch(fileData.url);
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          const blob = await response.blob();
          const file = new File([blob], fileData.fileName || "file", {
            type: fileData.mimeType || blob.type,
          });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          return dataTransfer.files;
        } catch (error) {
          console.error("Error fetching file:", error);
          return false;
        }
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
    

      // function fillInput(selector, value, isFileInput = false) {
      //   let inputs = document.querySelectorAll(selector);
      //   if (inputs.length === 0) {
      //     const labelInput = findInputByLabel(selector.split(",")[0].trim());
      //     if (labelInput) {
      //       inputs = [labelInput];
      //     }
      //   }

      //   inputs.forEach(async (input) => {
      //     try {
      //       const tag = input.tagName.toLowerCase();

      //       if (tag === "input") {
      //         const type = input.type.toLowerCase();

      //         if (type === "file" && isFileInput) {
      //           const files = await fillFileInput(value);
      //           if (files) {
      //             input.files = files;
      //             input.dispatchEvent(new Event("change", { bubbles: true }));
      //           }
      //         } else if (type === "checkbox" || type === "radio") {
      //           input.checked = value === true || value === input.value;
      //           input.dispatchEvent(new Event("change", { bubbles: true }));
      //         } else if (type === "date" && value) {
      //           const date = new Date(value);
      //           if (!isNaN(date)) {
      //             input.value = date.toISOString().split("T")[0];
      //             input.dispatchEvent(new Event("change", { bubbles: true }));
      //           }
      //         } else if (value != null) {
      //           input.value = value;
      //           input.dispatchEvent(new Event("change", { bubbles: true }));
      //         }
      //       } else if (tag === "select" && value != null) {
      //         const option = Array.from(input.options).find(
      //           (opt) => opt.value.toLowerCase() === String(value).toLowerCase()
      //         );
      //         if (option) {
      //           input.value = option.value;
      //           input.dispatchEvent(new Event("change", { bubbles: true }));
      //         }
      //       }
      //     } catch (error) {
      //       console.error(`Error filling input ${selector}:`, error);
      //     }
      //   });
      //   return true;
      // }

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

      //  Map all possible field selectors
      // const fieldMap = {
      //   'firstName': '[name="firstName"], [name="first_name"],[name="fname"], [name="first"], #firstName, #first_name, #fname, #first, [placeholder*="first name" i], input[type="text"][id*="first" i],[placeholder*="first name" i], [placeholder*="given name" i], input[type="text"][id*="first" i], input[type="text"][id*="fname" i],  input[aria-label*="first name" i], input[aria-label*="given name" i],  input[data-field*="first" i], input[data-name*="first" i],  input[class*="first-name" i], input[class*="firstName" i],  input[label*="first name" i],  input[aria-describedby*="first" i]',
      //   'lastName': '[name="lastName"], #lastName, [placeholder*="last name" i], input[type="text"][id*="last" i]',
      //   'email': '[name="email"], #email, [type="email"], input[placeholder*="email" i]',
      //   'phone.primary': '[name="primaryPhone"], #primaryPhone, [name="phone"], #phone, [placeholder*="phone" i]',
      //   'phone.emergency': '[name="emergencyPhone"], #emergencyPhone, [placeholder*="emergency" i]',
      //   'address.street': '[name="street"], #street, [placeholder*="street" i], [name="address"]',
      //   'address.city': '[name="city"], #city, [placeholder*="city" i]',
      //   'address.state': '[name="state"], #state, [placeholder*="state" i]',
      //   'address.zipCode': '[name="zipCode"], #zipCode, [placeholder*="zip" i], [placeholder*="postal" i]',
      //   'address.country': '[name="country"], #country, [placeholder*="country" i]',
      //   'license.number': '[name="licenseNumber"], #licenseNumber, [placeholder*="license" i]',
      //   'license.type': '[name="licenseType"], #licenseType',
      //   'license.issueDate': '[name="licenseIssueDate"], #licenseIssueDate',
      //   'license.expiryDate': '[name="licenseExpiryDate"], #licenseExpiryDate',
      //   'personalInfo.dateOfBirth': '[name="dateOfBirth"], #dateOfBirth, [placeholder*="birth" i]',
      //   'personalInfo.gender': '[name="gender"], #gender',
      //   'personalInfo.ssn': '[name="ssn"], #ssn, [placeholder*="social" i]',
      //   'personalInfo.nationality': '[name="nationality"], #nationality',
      //   'documents.licenseImage': '[name="licenseImage"], #driverLicense, input[type="file"][name*="license" i]',
      //   'documents.profilePhoto': '[name="photo"], #profilePhoto, input[type="file"][name*="profile" i], input[type="file"][name*="photo" i]',
      //   'documents.insuranceDoc': '[name="insuranceDoc"], #insuranceDoc, input[type="file"][name*="insurance" i]'
      // };

      const fieldMap = {
        firstName:
          '[name="firstName"], [name="first_name"],[name="fname"], [name="first"], #firstName, #first_name, #fname, #first, [placeholder*="first name" i], input[type="text"][id*="first" i],[placeholder*="first name" i], [placeholder*="given name" i], input[type="text"][id*="first" i], input[type="text"][id*="fname" i],  input[aria-label*="first name" i], input[aria-label*="given name" i],  input[data-field*="first" i], input[data-name*="first" i],  input[class*="first-name" i], input[class*="firstName" i],  input[label*="first name" i],  input[aria-describedby*="first" i]',
        lastName:
          '[name="lastName"], [name="last_name"], [name="lname"], [name="last"], #lastName, #last_name, #lname, #last, [placeholder*="last name" i], input[type="text"][id*="last" i], input[type="text"][id*="lname" i], input[aria-label*="last name" i], input[data-field*="last" i], input[data-name*="last" i], input[class*="last-name" i], input[class*="lastName" i], input[label*="last name" i], input[aria-describedby*="last" i]',
        email:
          '[name="email"], [name="emailAddress"], #email, #emailAddress, input[type="email"], [placeholder*="email" i], input[type="text"][id*="email" i], input[aria-label*="email" i], input[data-field*="email" i], input[data-name*="email" i], input[class*="email" i], input[label*="email" i], input[aria-describedby*="email" i]',
        "phone.primary":
          '[name="primaryPhone"], [name="phone"], [name="phoneNumber"], #primaryPhone, #phone, #phoneNumber, [placeholder*="phone" i], input[type="text"][id*="phone" i], input[aria-label*="phone" i], input[data-field*="phone" i], input[data-name*="phone" i], input[class*="phone" i], input[label*="phone" i], input[aria-describedby*="phone" i]',
        "phone.emergency":
          '[name="emergencyPhone"], [name="emergency_phone"], [name="emergency"], #emergencyPhone, #emergency_phone, #emergency, [placeholder*="emergency" i], input[type="text"][id*="emergency" i], input[aria-label*="emergency" i], input[data-field*="emergency" i], input[data-name*="emergency" i], input[class*="emergency" i], input[label*="emergency" i], input[aria-describedby*="emergency" i]',
        "address.street":
          '[name="street"], [name="streetAddress"], #street, #streetAddress, [placeholder*="street" i], [placeholder*="address" i], input[type="text"][id*="street" i], input[aria-label*="street" i], input[data-field*="street" i], input[data-name*="street" i], input[class*="street" i], input[label*="street" i], input[aria-describedby*="street" i]',
        "address.city":
          '[name="city"], #city, [placeholder*="city" i], input[type="text"][id*="city" i], input[aria-label*="city" i], input[data-field*="city" i], input[data-name*="city" i], input[class*="city" i], input[label*="city" i], input[aria-describedby*="city" i]',
        "address.state":
          '[name="state"], #state, [placeholder*="state" i], input[type="text"][id*="state" i], input[aria-label*="state" i], input[data-field*="state" i], input[data-name*="state" i], input[class*="state" i], input[label*="state" i], input[aria-describedby*="state" i]',
        "address.zipCode":
          '[name="zipCode"], [name="postalCode"], #zipCode, #postalCode, [placeholder*="zip" i], [placeholder*="postal" i], input[type="text"][id*="zip" i], input[aria-label*="zip" i], input[data-field*="zip" i], input[data-name*="zip" i], input[class*="zip" i], input[label*="zip" i], input[aria-describedby*="zip" i]',
        "address.country":
          '[name="country"], #country, [placeholder*="country" i], input[type="text"][id*="country" i], input[aria-label*="country" i], input[data-field*="country" i], input[data-name*="country" i], input[class*="country" i], input[label*="country" i], input[aria-describedby*="country" i]',
        "license.number":
          '[name="licenseNumber"], [name="license"], #licenseNumber, #license, [placeholder*="license" i], input[type="text"][id*="license" i], input[aria-label*="license" i], input[data-field*="license" i], input[data-name*="license" i], input[class*="license" i], input[label*="license" i], input[aria-describedby*="license" i]',
        "license.type":
          '[name="licenseType"], #licenseType, [placeholder*="license type" i], input[type="text"][id*="licenseType" i], input[aria-label*="license type" i], input[data-field*="licenseType" i], input[data-name*="licenseType" i], input[class*="licenseType" i], input[label*="license type" i], input[aria-describedby*="licenseType" i]',
        "license.issueDate":
          '[name="licenseIssueDate"], #licenseIssueDate, [placeholder*="issue date" i], input[type="text"][id*="licenseIssueDate" i], input[aria-label*="issue date" i], input[data-field*="licenseIssueDate" i], input[data-name*="licenseIssueDate" i], input[class*="licenseIssueDate" i], input[label*="issue date" i], input[aria-describedby*="licenseIssueDate" i]',
        "license.expiryDate":
          '[name="licenseExpiryDate"], #licenseExpiryDate, [placeholder*="expiry date" i], input[type="text"][id*="licenseExpiryDate" i], input[aria-label*="expiry date" i], input[data-field*="licenseExpiryDate" i], input[data-name*="licenseExpiryDate" i], input[class*="licenseExpiryDate" i], input[label*="expiry date" i], input[aria-describedby*="licenseExpiryDate" i]',
        "personalInfo.dateOfBirth":
          '[name="dateOfBirth"], [name="dob"], #dateOfBirth, #dob, [placeholder*="birth" i], input[type="text"][id*="dateOfBirth" i], input[type="text"][id*="dob" i], input[aria-label*="date of birth" i], input[data-field*="dateOfBirth" i], input[data-name*="dateOfBirth" i], input[class*="dateOfBirth" i], input[label*="date of birth" i], input[aria-describedby*="dateOfBirth" i]',
        "personalInfo.gender":
          '[name="gender"], #gender, [placeholder*="gender" i], input[type="text"][id*="gender" i], input[aria-label*="gender" i], input[data-field*="gender" i], input[data-name*="gender" i], input[class*="gender" i], input[label*="gender" i], input[aria-describedby*="gender" i]',
        "personalInfo.ssn":
          '[name="ssn"], #ssn, [placeholder*="social" i], [placeholder*="SSN" i], input[type="text"][id*="ssn" i], input[aria-label*="SSN" i], input[data-field*="ssn" i], input[data-name*="ssn" i], input[class*="ssn" i], input[label*="SSN" i], input[aria-describedby*="ssn" i]',
        "personalInfo.nationality":
          '[name="nationality"], #nationality, [placeholder*="nationality" i], input[type="text"][id*="nationality" i], input[aria-label*="nationality" i], input[data-field*="nationality" i], input[data-name*="nationality" i], input[class*="nationality" i], input[label*="nationality" i], input[aria-describedby*="nationality" i]',
        "documents.licenseImage":
          '[name="licenseImage"], [name="driverLicense"], #licenseImage, #driverLicense, input[type="file"][name*="license" i], input[type="file"][id*="license" i], input[type="file"][data-field*="license" i], input[type="file"][data-name*="license" i], input[type="file"][class*="license" i], input[type="file"][aria-label*="license" i], input[type="file"][aria-describedby*="license" i]',
        "documents.profilePhoto":
          '[name="photo"], [name="profilePhoto"], #profilePhoto, #photo, input[type="file"][name*="profile" i], input[type="file"][name*="photo" i], input[type="file"][id*="photo" i], input[type="file"][data-field*="photo" i], input[type="file"][data-name*="photo" i], input[type="file"][class*="photo" i], input[type="file"][aria-label*="photo" i], input[type="file"][aria-describedby*="photo" i]',
        "documents.insuranceDoc":
          '[name="insuranceDoc"], #insuranceDoc, [name*="insurance" i], input[type="file"][name*="insurance" i], input[type="file"][id*="insurance" i], input[type="file"][data-field*="insurance" i], input[type="file"][data-name*="insurance" i], input[type="file"][class*="insurance" i], input[type="file"][aria-label*="insurance" i], input[type="file"][aria-describedby*="insurance" i]',
      };

 
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
    
      // Fill all fields
      for (const [field, selector] of Object.entries(fieldMap)) {
        const value = field
          .split(".")
          .reduce((obj, key) => obj?.[key], driverData);
        const isFileInput = field.startsWith("documents.");
        if (value) fillInput(selector, value, isFileInput);
      }
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
 

  // try {
  //   const result = await chrome.scripting.executeScript(script);
  //   showStatus(result[0].result || "Success");
  // } catch (error) {
  //   showStatus(`Error: ${error.message || error}`, true);
  //   console.error("Fill error:", error);
  // }
}

async function submitForm() {
  const script = {
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id,
      allFrames: true
    },
    func: async () => {
      function findForm() {
        const filledInputs = document.querySelectorAll('input[filled="true"]');
        if (filledInputs.length > 0) {
          return filledInputs[0].closest('form');
        }
        
        const forms = document.querySelectorAll('form');
        if (forms.length === 0) return null;
        
        let bestForm = null;
        let maxFilledInputs = 0;
        
        forms.forEach(form => {
          const filledInputCount = Array.from(form.querySelectorAll('input')).filter(input => 
            input.value || (input.files && input.files.length > 0) || input.checked
          ).length;
          
          if (filledInputCount > maxFilledInputs) {
            maxFilledInputs = filledInputCount;
            bestForm = form;
          }
        });
        
        return bestForm;
      }

      return new Promise((resolve, reject) => {
        const form = findForm();
        
        if (!form) {
          resolve({ 
            success: false, 
            error: 'No form found on the page' 
          });
          return;
        }

        const submitter = {
          handleEvent: async function(event) {
            event.preventDefault();
            
            try {
              const formData = new FormData(form);
              const action = form.action || window.location.href;
              const method = (form.method || 'GET').toUpperCase();

              let fetchOptions = {
                method: method,
                headers: {
                  'Accept': 'application/json, text/html, text/plain'
                }
              };

              if (method === 'GET') {
                const params = new URLSearchParams(formData);
                const url = new URL(action);
                url.search = params.toString();
                
                const response = await fetch(url.toString(), fetchOptions);
                
                const responseText = await response.text();
                
                resolve({
                  success: response.ok,
                  status: response.status,
                  contentType: response.headers.get('content-type'),
                  rawResponse: responseText,
                  prettyResponse: tryParseResponse(responseText, response.headers.get('content-type'))
                });
              } 
              else {
                fetchOptions.body = formData;
                
                const response = await fetch(action, fetchOptions);
                
                const responseText = await response.text();
                
                resolve({
                  success: response.ok,
                  status: response.status,
                  contentType: response.headers.get('content-type'),
                  rawResponse: responseText,
                  prettyResponse: tryParseResponse(responseText, response.headers.get('content-type'))
                });
              }
            } catch (error) {
              resolve({
                success: false,
                error: error.message || 'Form submission failed'
              });
            } finally {
              form.removeEventListener('submit', submitter);
            }
          }
        };
        
        function tryParseResponse(responseText, contentType) {
          try {
            // Try parsing JSON
            if (contentType && contentType.includes('application/json')) {
              return JSON.stringify(JSON.parse(responseText), null, 2);
            }
            
            // Try parsing HTML
            if (contentType && contentType.includes('text/html')) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(responseText, 'text/html');
              const title = doc.querySelector('title')?.textContent || 'No Title';
              const bodyText = doc.body?.textContent?.trim() || 'Empty Body';
              return `Title: ${title}\n\nBody Preview: ${bodyText.substring(0, 500)}...`;
            }
            
            // For plain text or other types
            return responseText;
          } catch (parseError) {
            return responseText;
          }
        }
        
        try {
          form.addEventListener('submit', submitter);
          
          const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') || 
                             Array.from(form.querySelectorAll('button')).find(btn => 
                               btn.textContent.toLowerCase().includes('submit') || 
                               btn.textContent.toLowerCase().includes('save') ||
                               btn.textContent.toLowerCase().includes('continue')
                             );
          
          if (submitButton) {
            submitButton.click();
          } else {
            form.submit();
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'Failed to trigger form submission'
          });
        }
      });
    }
  };

  try {
    const results = await chrome.scripting.executeScript(script);
    if (!results || !results[0] || !results[0].result) {
      throw new Error('Script execution failed');
    }
    return results[0].result;
  } catch (error) {
    return {
      success: false,
      error: `Script execution failed: ${error.message}`
    };
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDrivers();

  // Set up event listeners
  document.getElementById("driverSelect").addEventListener("change", (e) => {
    const driver = drivers.find((d) => d._id === e.target.value);
    showDriverInfo(driver);
  });

  document.getElementById("fillButton").addEventListener("click", async () => {
    const select = document.getElementById("driverSelect");
    const driverId = select.value;

    if (!driverId) {
      showStatus("Please select a driver", true);
      return;
    }

    const driver = drivers.find((d) => d._id === driverId);
    if (!driver) {
      showStatus("Driver not found", true);
      return;
    }

    select.classList.add("loading");
    await fillFormFields(driver);
    select.classList.remove("loading");
  });

  document.getElementById("submitButton").addEventListener("click", async () => {
    try {
      showStatus("Submitting form...");
      const result = await submitForm();
      
      if (result.success) {
        showStatus(`Form submitted successfully! Status: ${result.status}`);
        console.log('Content Type:', result.contentType);
        console.log('Raw Response:', result.rawResponse);
        console.log('Parsed Response:', result.prettyResponse);
        
        // Optional: You can create a modal or expand the status div to show more details
        const statusDiv = document.getElementById("status");
        statusDiv.innerHTML += `
          <div class="response-details">
            <strong>Content Type:</strong> ${result.contentType}<br>
            <strong>Status:</strong> ${result.status}<br>
            <details>
              <summary>Response Details</summary>
              <pre>${escapeHtml(result.prettyResponse)}</pre>
            </details>
          </div>
        `;
      } else {
        showStatus(`Form submission failed: ${result.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      showStatus(`Error submitting form: ${error.message || 'Unknown error'}`, true);
      console.error("Submission error:", error);
    }
  });
});