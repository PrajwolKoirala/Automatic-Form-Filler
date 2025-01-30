

let drivers = [];

function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = isError ? "error" : "success";
}

function displayDriverData(driver) {
  const dataDisplay = document.getElementById("dataDisplay");
  dataDisplay.innerHTML = ""; // Clear previous data

  const driverData = document.createElement("div");
  driverData.className = "data-section";

  const driverInfo = `
    <h4>Driver Information</h4>
    <pre>${JSON.stringify(driver, null, 2)}</pre>
  `;
  driverData.innerHTML = driverInfo;

  dataDisplay.appendChild(driverData);

  // Add a submit button
  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit Form";
  submitButton.id = "submitFormButton";
  submitButton.addEventListener("click", async () => {
    showStatus("Submitting form...");
    const response = await submitForm(driver);
    if (response.success) {
      showStatus("Form submitted successfully!");
      console.log("Form submission response:", response.data);
    } else {
      showStatus(`Form submission failed: ${response.error}`, true);
    }
  });

  dataDisplay.appendChild(submitButton);
}

// function downloadFile(url, fileName) {
//   chrome.downloads.download(
//     {
//       url: url,
//       filename: fileName,
//     },
//     (downloadId) => {
//       if (chrome.runtime.lastError) {
//         console.error("Download failed:", chrome.runtime.lastError);
//       } else {
//         console.log(`Download started with ID: ${downloadId}`);
//       }
//     }
//   );
// }

const mimeTypeToExtension = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/zip': '.zip',
  
};

async function downloadFile(url, fileName, folderName) {
  try {
    // Fetch the file to get the Content-Type header
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Get the Content-Type header
    const contentType = response.headers.get('Content-Type');
    console.log(`Content-Type for ${fileName}: ${contentType}`);

    // Determine the file extension based on the Content-Type
    const fileExtension = mimeTypeToExtension[contentType] || '.bin'; // Default to .bin if unknown
    const fullFileName = `${fileName}${fileExtension}`;
    const fullPath = `${folderName}/${fullFileName}`;

    // Download the file using the Chrome downloads API
    chrome.downloads.download(
      {
        url: url,
        filename: fullPath,
        conflictAction: 'uniquify', // Avoid overwriting files with the same name
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download failed:", chrome.runtime.lastError);
        } else {
          console.log(`Download started with ID: ${downloadId}`);
        }
      }
    );
  } catch (error) {
    console.error("Error downloading file:", error);
  }
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function displayCarrierData(carrier) {
  console.log("🚀 ~ file: popup.js:764 ~ displayCarrierData ~ carrier:", carrier);
  const dataDisplay = document.getElementById("dataDisplay");
  dataDisplay.innerHTML = "";

  // Create scrollable container
  const container = document.createElement("div");
  container.className = "data-container";

  // Status message
  const statusMessage = document.createElement("div");
  statusMessage.className = "status-message";
  statusMessage.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414L7 8.586l3.293-3.293a1 1 0 1 1 1.414 1.414z"/>
    </svg>
    <span>Please check your details before submitting</span>
  `;
  container.appendChild(statusMessage);

  // Carrier Authority Section
  const authoritySection = document.createElement("div");
  authoritySection.className = "section";
  authoritySection.innerHTML = `
    <h3 class="section-header">Carrier Authority : </h3>
    <div class="info-grid">
     <div class="info-item">
        <span class="info-label">Company Name : </span>
        <span class="info-value">${carrier.carrierAuthority.name}</span>
      </div>
        <div class="info-item">
        <span class="info-label">Company Email : </span>
        <span class="info-value">${carrier.carrierAuthority.companyEmail}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Authority Name : </span>
        <span class="info-value">${carrier.carrierAuthority.authorityName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">MC Number : </span>
        <span class="info-value">${carrier.carrierAuthority.mcNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">DOT Number : </span>
        <span class="info-value">${carrier.carrierAuthority.dotNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">EIN : </span>
        <span class="info-value">${carrier.carrierAuthority.companyEIN}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Address : </span>
        <span class="info-value">${carrier.carrierAuthority.authorityAddress}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Phone : </span>
        <span class="info-value">${carrier.carrierAuthority.companyPhoneNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email : </span>
        <span class="info-value">${carrier.carrierAuthority.companyEmail}</span>
      </div>
    </div>

     <h3 class="section-header">Driver : </h3>
    <div class="info-grid">
     <div class="info-item">
        <span class="info-label">Driver Type : </span>
        <span class="info-value">${carrier.drivers[0].driverType}</span>
      </div>
        <div class="info-item">
        <span class="info-label">Driver Name : </span>
        <span class="info-value">${carrier.drivers[0].name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Hazmat : </span>
        <span class="info-value">${carrier.drivers[0].hazmat}</span>
      </div>
      <div class="info-item">
        <span class="info-label">License Number : </span>
        <span class="info-value">${carrier.drivers[0].licenseNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Payment Type: </span>
        <span class="info-value">${carrier.drivers[0].paymentType}</span>
      </div>
    </div>
  `;
  container.appendChild(authoritySection);

  // Documents Section
  const documentsSection = document.createElement("div");
  documentsSection.className = "section";
  documentsSection.innerHTML = `
    <h3 class="section-header">Documents</h3>
    <div class="document-grid">
      ${carrier.documents
        .map(
          (doc) => `
        <div class="document-card">
          <div class="doc-icon-container">
        <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.19141 11.375C9.56075 11.375 9.92648 11.312 10.2677 11.1895C10.6089 11.067 10.919 10.8874 11.1801 10.6611C11.4413 10.4347 11.6485 10.166 11.7898 9.87029C11.9312 9.57456 12.0039 9.2576 12.0039 8.9375C12.0039 8.6174 11.9312 8.30044 11.7898 8.00471C11.6485 7.70898 11.4413 7.44027 11.1801 7.21393C10.919 6.98758 10.6089 6.80804 10.2677 6.68554C9.92648 6.56305 9.56075 6.5 9.19141 6.5C8.44549 6.5 7.73012 6.75681 7.20267 7.21393C6.67522 7.67105 6.37891 8.29104 6.37891 8.9375C6.37891 9.58397 6.67522 10.204 7.20267 10.6611C7.73012 11.1182 8.44549 11.375 9.19141 11.375Z" fill="#37B36D"/>
<path d="M23.25 22.75C23.25 23.612 22.8549 24.4386 22.1517 25.0481C21.4484 25.6576 20.4946 26 19.5 26H4.5C3.50544 26 2.55161 25.6576 1.84835 25.0481C1.14509 24.4386 0.75 23.612 0.75 22.75V3.25C0.75 2.38805 1.14509 1.5614 1.84835 0.951903C2.55161 0.34241 3.50544 0 4.5 0L14.8125 0L23.25 7.3125V22.75ZM4.5 1.625C4.00272 1.625 3.52581 1.7962 3.17418 2.10095C2.82254 2.4057 2.625 2.81902 2.625 3.25V19.5L6.795 15.886C6.94278 15.7582 7.13554 15.6769 7.34272 15.6548C7.5499 15.6327 7.75966 15.6712 7.93875 15.7641L12 17.875L16.0444 12.9675C16.1235 12.8716 16.2258 12.7917 16.3441 12.7335C16.4624 12.6753 16.5939 12.6401 16.7295 12.6304C16.8651 12.6206 17.0015 12.6366 17.1293 12.6771C17.2571 12.7177 17.3731 12.7818 17.4694 12.8651L21.375 16.25V7.3125H17.625C16.8791 7.3125 16.1637 7.05569 15.6363 6.59857C15.1088 6.14145 14.8125 5.52147 14.8125 4.875V1.625H4.5Z" fill="#37B36D"/>
</svg>

          </div>
          <div class="doc-info">
            <div class="doc-name">${truncateText(doc.type.replace(/_/g, " ").toUpperCase(), 8)}</div>
          </div>
          <div class="download-icon" data-url="${doc.path}" data-filename="${
            doc.name
          }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
  container.appendChild(documentsSection);

  dataDisplay.appendChild(container);

  // Add click handlers for download icons
  const downloadIcons = document.querySelectorAll(".download-icon");
  downloadIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      const url = icon.getAttribute("data-url");
      const fileName = icon.getAttribute("data-filename");
      const folderName = `${carrier.drivers[0].name}`;
      downloadFile(url, fileName, folderName);
    });
  });
}

async function getAccessToken() {
  return new Promise((resolve) => {
    // Get the current active tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("Error fetching active tab:", chrome.runtime.lastError);
        resolve(null);
        return;
      }

      const currentTab = tabs[0];
      if (!currentTab || !currentTab.url) {
        console.error("No active tab or URL found.");
        resolve(null);
        return;
      }

      // Parse the URL to extract query parameters
      const url = new URL(currentTab.url);
      const token = url.searchParams.get("token"); // Replace "token" with the actual query parameter name

      if (token) {
        console.log("Token found in query params:", token);
        resolve(token);
      } else {
        console.log("Token not found in query params.");
        resolve(null);
      }
    });
  });
}

// async function fetchDrivers() {
//   try {
//     const token = await getAccessToken();

//     if (!token) {
//       showStatus(
//         "Access token not found in cookies. Please log in to the application.",
//         true
//       );
//       return;
//     }

//     const response = await fetch(
//       "https://api.supertruck.ai/production/api/v1/broker-setup-agent/list-assigned-tickets/2",
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     drivers = data.data.carrier.drivers.map((driver) => ({
//       _id: driver.id,
//       firstName: driver.name.split(" ")[0],
//       lastName: driver.name.split(" ")[1] || "",
//       email: `${driver.name.replace(/\s/g, "").toLowerCase()}@example.com`,
//       license: {
//         number: driver.id,
//       },
//       documents: data.data.carrier.documents.reduce((acc, doc) => {
//         acc[doc.type] = { url: doc.path, fileName: doc.name };
//         return acc;
//       }, {}),
//     }));

//     console.log("Fetched drivers:", drivers);
//     return data.data.carrier; // Return carrier data
//   } catch (error) {
//     showStatus("Error fetching drivers: " + error.message, true);
//     console.error("Fetch error:", error);
//     return null;
//   }
// }

// async function fillFormFields(driver, documents) {
//   const script = {
//     target: {
//       tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
//         .id,
//       allFrames: true,
//     },
//     func: async (driverData) => {
//       console.log("Injected script is running!");
//       console.log("Driver data received in injected script:", driverData);

//       try {
//         await new Promise((resolve) => {
//           const checkForm = () => {
//             const form = document.querySelector("form");
//             if (form) {
//               console.log("Form found:", form);
//               resolve();
//             } else {
//               console.log("Form not found, retrying...");
//               setTimeout(checkForm, 100);
//             }
//           };
//           checkForm();
//         });

//         // Function to fill file inputs
//         async function fillFileInput(fileData) {
//           if (!fileData?.url) return false;

//           try {
//             const response = await fetch(fileData.url);
//             if (!response.ok)
//               throw new Error(`HTTP error! status: ${response.status}`);

//             const blob = await response.blob();
//             const file = new File([blob], fileData.fileName || "file", {
//               type: fileData.mimeType || blob.type,
//             });

//             const dataTransfer = new DataTransfer();
//             dataTransfer.items.add(file);

//             return dataTransfer.files;
//           } catch (error) {
//             console.error("Error fetching file:", error);
//             return false;
//           }
//         }

//         // Function to fill inputs
//         function fillInput(selector, value, isFileInput = false) {
//           const inputs = document.querySelectorAll(selector);
//           console.log(`Inputs found for selector "${selector}":`, inputs);

//           if (inputs.length === 0) {
//             console.error(`No inputs found for selector: ${selector}`);
//             return false;
//           }

//           inputs.forEach(async (input) => {
//             try {
//               const tag = input.tagName.toLowerCase();

//               if (tag === "input") {
//                 const type = input.type.toLowerCase();

//                 if (type === "file" && isFileInput) {
//                   const files = await fillFileInput(value);
//                   if (files) {
//                     input.files = files;
//                     input.dispatchEvent(new Event("change", { bubbles: true }));
//                   }
//                 } else if (type === "checkbox" || type === "radio") {
//                   input.checked = value === true || value === input.value;
//                   input.dispatchEvent(new Event("change", { bubbles: true }));
//                 } else if (type === "date" && value) {
//                   const date = new Date(value);
//                   if (!isNaN(date)) {
//                     input.value = date.toISOString().split("T")[0];
//                     input.dispatchEvent(new Event("change", { bubbles: true }));
//                   }
//                 } else if (value != null) {
//                   input.value = value;
//                   input.dispatchEvent(new Event("change", { bubbles: true }));
//                 }
//               } else if (tag === "select" && value != null) {
//                 const option = Array.from(input.options).find(
//                   (opt) =>
//                     opt.value.toLowerCase() === String(value).toLowerCase() ||
//                     opt.text.toLowerCase() === String(value).toLowerCase()
//                 );
//                 if (option) {
//                   input.value = option.value;
//                   input.dispatchEvent(new Event("change", { bubbles: true }));
//                 }
//               }
//             } catch (error) {
//               console.error(`Error filling input ${selector}:`, error);
//             }
//           });

//           return inputs.length > 0;
//         }
//           console.log("🚀 ~ file: popup.js:1111 ~ fillInput ~ length:", documents.licenseImage);

//         // Field mapping
//         const fieldMap = {
//           name: '#firstName,  [name="first_name"], [name="firstName"]',
//           driverType: '#lastName, [name="last_name"], [name="lastName"]',
//           email: '#email, [name="email"], [name="user_email"]',
//           licenseNumber:
//             '#license-number, [name="license_number"], [name="licenseNumber"]',
//           "documents.licenseImage":
//             '#license-image, [name="license_image"], [name="licenseImage"]',
//         };

//         // Fill all fields
//         const results = await Promise.all(
//           Object.entries(fieldMap).map(async ([field, selector]) => {
//             const value = field
//               .split(".")
//               .reduce((obj, key) => obj?.[key], driverData);
//             const isFileInput = field.startsWith("documents.");
//             if (value) {
//               const success = await fillInput(selector, value, isFileInput);
//               return { field, success };
//             }
//             return { field, success: false };
//           })
//         );

//         return {
//           success: results.some((r) => r.success),
//           filledFields: results.filter((r) => r.success).map((r) => r.field),
//           failedFields: results.filter((r) => !r.success).map((r) => r.field),
//         };
//       } catch (error) {
//         console.error("Error in injected script:", error);
//         return {
//           success: false,
//           error: error.message || "Unknown error in injected script",
//         };
//       }
//     },
//     args: [driver],
//   };

//   try {
//     const results = await chrome.scripting.executeScript(script);
//     console.log("Script execution results:", results);

//     if (!results || results.length === 0) {
//       throw new Error("No results returned from script execution.");
//     }

//     const result = results[0].result;
//     console.log("Script result:", result);

//     if (result.success) {
//       showStatus(`Successfully filled ${result.filledFields.length} fields`);
//     } else {
//       showStatus(`No fields were filled. Error: ${result.error}`, true);
//     }

//     console.log("Filled fields:", result.filledFields);
//     console.log("Failed fields:", result.failedFields);

//     return result;
//   } catch (error) {
//     showStatus(`Error: ${error.message || error}`, true);
//     console.error("Fill error:", error);
//     return { success: false, error: error.message };
//   }
// }

async function fetchDrivers() {
  try {
    const token = await getAccessToken();

    if (!token) {
      showStatus(
        "Access token not found in cookies. Please log in to the application.",
        true
      );
      return;
    }

    const response = await fetch(
      "https://api.supertruck.ai/production/api/v1/broker-setup-agent/list-assigned-tickets/2",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const drivers = data.data.carrier.drivers.map((driver) => ({
      _id: driver.id,
      firstName: driver.name.split(" ")[0],
      lastName: driver.name.split(" ")[1] || "",
      email: `${driver.name.replace(/\s/g, "").toLowerCase()}@example.com`,
      license: {
        number: driver.id,
      },
      documents: data.data.carrier.documents.reduce((acc, doc) => {
        acc[doc.type] = { url: doc.path, fileName: doc.name };
        return acc;
      }, {}),
    }));

    console.log("Fetched drivers:", drivers);

    // Download documents for each driver
    // drivers.forEach((driver) => {
    //   const folderName = `Drivers/${driver.firstName}_${driver.lastName}`;

    //   Object.entries(driver.documents).forEach(([docType, doc]) => {
    //     downloadFile(doc.url, doc.fileName, folderName);
    //   });
    // });

    return data.data.carrier;
  } catch (error) {
    showStatus("Error fetching drivers: " + error.message, true);
    console.error("Fetch error:", error);
    return null;
  }
}

async function fillFormFields(carrier) {
  console.log("Extension context - Carrier data:", carrier);

  const script = {
    target: {
      tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id,
      allFrames: true,
    },
    func: async (carrierData) => {
      const debug = (message, data) => {
        console.log(
          `%c[Form Filler Debug] ${message}`,
          'background: #f0f0f0; color: #333; padding: 2px 5px; border-radius: 3px;',
          data || ''
        );
      };

      debug('Script injected successfully');
      debug('Carrier data received:', carrierData);

      try {
        // Wait for form with timeout
        const form = await new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 20; // Maximum 20 attempts
          const checkForm = () => {
            attempts++;
            const form = document.querySelector("form");
            if (form) {
              debug('Form found:', form);
              resolve(form);
            } else if (attempts >= maxAttempts) {
              reject(new Error(`Form not found after ${maxAttempts} attempts`));
            } else {
              debug(`Form not found, attempt ${attempts}/${maxAttempts}`);
              setTimeout(checkForm, 100);
            }
          };
          checkForm();
        });

        // Function to fill file inputs
        async function fillFileInput(fileData) {
          debug('Attempting to fill file input with:', fileData);
          
          if (!fileData?.path) {
            debug('No file path provided');
            return false;
          }

          try {
            const response = await fetch(fileData.path);
            if (!response.ok) {
              debug('File fetch failed:', response.statusText);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            debug('File blob created:', blob.type);

            const file = new File([blob], fileData.name || 'file', {
              type: blob.type
            });
            debug('File object created:', file);

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            return dataTransfer.files;
          } catch (error) {
            debug('Error in fillFileInput:', error);
            return false;
          }
        }

        // Function to fill inputs
        async function fillInput(selector, value, isFileInput = false) {
          // Try both form-scoped and document-scoped queries
          const formInputs = form.querySelectorAll(selector);
          const docInputs = document.querySelectorAll(selector);
          const inputs = formInputs.length > 0 ? formInputs : docInputs;
          
          debug(`Found ${inputs.length} inputs for selector:`, selector);

          if (inputs.length === 0) {
            // Try additional common selectors for file inputs
            if (isFileInput) {
              const additionalSelectors = [
                'input[type="file"]',
                'input[accept="image/*"]',
                'input[accept=".jpg,.jpeg,.png,.pdf"]'
              ];
              for (const addSelector of additionalSelectors) {
                const addInputs = form.querySelectorAll(addSelector);
                if (addInputs.length > 0) {
                  debug(`Found file input using alternative selector: ${addSelector}`);
                  inputs = addInputs;
                  break;
                }
              }
            }
            
            if (inputs.length === 0) {
              debug('No inputs found for selector:', selector);
              return false;
            }
          }

          for (const input of inputs) {
            try {
              const tag = input.tagName.toLowerCase();
              debug('Processing input:', { tag, type: input.type, selector });

              if (tag === "input") {
                const type = input.type.toLowerCase();

                if (type === "file" && isFileInput) {
                  debug('Handling file input');
                  const files = await fillFileInput(value);
                  if (files) {
                    input.files = files;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    debug('File input filled successfully');
                  }
                } else if (type === "checkbox" || type === "radio") {
                  input.checked = value === true || value === input.value;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                  debug('Checkbox/Radio input filled');
                } else if (type === "date" && value) {
                  const date = new Date(value);
                  if (!isNaN(date)) {
                    input.value = date.toISOString().split("T")[0];
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                    debug('Date input filled');
                  }
                } else if (value != null) {
                  input.value = value;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                  debug('Text input filled:', value);
                }
              } else if (tag === "select" && value != null) {
                const option = Array.from(input.options).find(
                  (opt) =>
                    opt.value.toLowerCase() === String(value).toLowerCase() ||
                    opt.text.toLowerCase() === String(value).toLowerCase()
                );
                if (option) {
                  input.value = option.value;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                  debug('Select input filled');
                }
              }
            } catch (error) {
              debug('Error filling input:', error);
            }
          }

          return inputs.length > 0;
        }

        // Get driver and relevant documents
        const driver = carrierData.drivers[0];
        const documents = carrierData.documents;
        
        debug('Processing driver:', driver);
        debug('Available documents:', documents);
        
        // Find license document
        const licenseDoc = documents.find(doc => 
          doc.type.toLowerCase().includes('license') || 
          doc.name.toLowerCase().includes('license')
        );
        debug('Found license document:', licenseDoc);

        // Field mapping
        const fieldMap = {
          'name': '#firstName, [name="first_name"], [name="firstName"]',
          'driverType': '#lastName, [name="last_name"], [name="lastName"]',
          'email': '#email, [name="email"], [name="user_email"]',
          'licenseNumber': '#license-number, [name="license_number"], [name="licenseNumber"]',
          'licenseFile': '[name="driverLicense"], #driverLicense'  // Try any file input if specific ones aren't found
        };

        debug('Starting to fill fields with mapping:', fieldMap);

        // Fill all fields
        const results = await Promise.all(
          Object.entries(fieldMap).map(async ([field, selector]) => {
            let value;
            if (field === 'licenseFile') {
              value = licenseDoc;
            } else {
              value = driver[field];
            }

            debug(`Processing field ${field} with value:`, value);

            const isFileInput = field.endsWith('File');
            if (value) {
              const success = await fillInput(selector, value, isFileInput);
              return { field, success };
            }
            return { field, success: false };
          })
        );

        const result = {
          success: results.some((r) => r.success),
          filledFields: results.filter((r) => r.success).map((r) => r.field),
          failedFields: results.filter((r) => !r.success).map((r) => r.field),
        };

        debug('Fill operation completed with result:', result);
        return result;

      } catch (error) {
        debug('Critical error in injected script:', error);
        return {
          success: false,
          error: error.message || "Unknown error in injected script",
        };
      }
    },
    args: [carrier],
  };

  try {
    console.log("Extension context - About to inject script");
    
    const results = await chrome.scripting.executeScript(script);
    console.log("Extension context - Script execution results:", results);

    if (!results || results.length === 0) {
      throw new Error("No results returned from script execution.");
    }

    const result = results[0].result;
    console.log("Extension context - Script result:", result);

    if (result.success) {
      showStatus(`Successfully filled ${result.filledFields.length} fields`);
    } else {
      showStatus(`No fields were filled. Error: ${result.error}`, true);
    }

    return result;
  } catch (error) {
    console.error("Extension context - Fill error:", error);
    showStatus(`Error: ${error.message || error}`, true);
    return { success: false, error: error.message };
  }
}

async function submitForm(driver) {
  return new Promise(async (resolve) => {
    chrome.scripting.executeScript(
      {
        target: {
          tabId: (
            await chrome.tabs.query({ active: true, currentWindow: true })
          )[0].id,
        },
        func: async (driverData) => {
          try {
            // Find the form on the page
            const form = document.querySelector("form");
            if (!form) {
              throw new Error("No form found on the page.");
            }

            // Determine the form's method and action
            const method = form.method.toUpperCase();
            const action = form.action;

            // Prepare the request options
            const formData = new FormData(form);
            let requestOptions = {
              method: method,
              headers: {
                Accept: "application/json", // Ensure the server returns JSON
              },
            };

            // Handle GET and HEAD methods (no body allowed)
            if (method === "GET" || method === "HEAD") {
              // Convert FormData to URL query parameters
              const params = new URLSearchParams(formData);
              const url = `${action}?${params.toString()}`;
              const response = await fetch(url, requestOptions);
              if (!response.ok) {
                throw new Error(
                  `Form submission failed: ${response.statusText}`
                );
              }
              const data = await response.json();
              return { success: true, data };
            } else {
              // For POST, PUT, PATCH, etc., include the body
              requestOptions.body = formData;
              const response = await fetch(action, requestOptions);

              // Check if the response is JSON
              const contentType = response.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response: ${text}`);
              }

              if (!response.ok) {
                throw new Error(
                  `Form submission failed: ${response.statusText}`
                );
              }

              const data = await response.json();
              return { success: true, data };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        args: [driver],
      },
      (results) => {
        const result = results[0].result;
        resolve(result);
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const fetchAndFillButton = document.getElementById("fetchAndFillButton");
  const initialContent = document.getElementById("initialContent");
  const dataContent = document.getElementById("dataContent");

  fetchAndFillButton.addEventListener("click", async () => {
    // Hide initial content and show data content
    initialContent.classList.add("hidden");
    dataContent.classList.add("visible");

    showStatus("Fetching data...");

    // Fetch carrier data
    const carrier = await fetchDrivers();

    if (!carrier) {
      showStatus("No carrier data found or failed to fetch data.", true);
      return;
    }

    // Display carrier data in the popup
    displayCarrierData(carrier);
    showStatus("Data fetched successfully!");

    // Fill form fields for the first driver
    const driver = carrier.drivers[0];
    // const result = await fillFormFields(driver);
    // In your click handler
const result = await fillFormFields(carrier);  // Pass the entire carrier object

    if (result && result.success) {
      showStatus(`Successfully filled ${result.filledFields.length} fields.`);
    } else {
      showStatus(
        `Failed to fill fields: ${result?.error || "Unknown error"}`,
        true
      );
    }
  });
});