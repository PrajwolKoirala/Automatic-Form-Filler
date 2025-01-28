// background.js

// Listen for the extension installation event
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
  });
  
  // Listen for messages from the popup or content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);
  
    // Handle different actions
    switch (request.action) {
      case "fetchDrivers":
        fetchDrivers()
          .then((data) => sendResponse({ success: true, data }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Indicates async response
  
      case "downloadFile":
        downloadFile(request.url, request.fileName)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Indicates async response
  
      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  });
  
  // Function to fetch drivers from the API
  async function fetchDrivers() {
    try {
      const token = await getAccessToken();
  
      if (!token) {
        throw new Error("Access token not found in cookies.");
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
      return data.data.carrier.drivers;
    } catch (error) {
      console.error("Error fetching drivers:", error);
      throw error;
    }
  }
  
  // Function to get the access token from cookies
  function getAccessToken() {
    return new Promise((resolve) => {
      chrome.cookies.get(
        {
          url: "https://api.supertruck.ai",
          name: "supertruck_access_token",
        },
        (cookie) => {
          if (chrome.runtime.lastError) {
            console.error("Cookie error:", chrome.runtime.lastError);
            resolve(null);
          } else if (cookie) {
            resolve(cookie.value);
          } else {
            resolve(null);
          }
        }
      );
    });
  }
  
  // Function to download a file
  function downloadFile(url, fileName) {
    return new Promise((resolve, reject) => {
      chrome.downloads.download(
        {
          url: url,
          filename: fileName,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(downloadId);
          }
        }
      );
    });
  }