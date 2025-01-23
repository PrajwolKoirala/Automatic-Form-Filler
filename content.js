
//content.js

async function fillFileInput(fileUrl) {
  try {
    console.log("Starting file input fill process for URL:", fileUrl);

    // Find all file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    console.log("Found file inputs:", fileInputs.length);

    if (fileInputs.length === 0) {
      return { error: "No file input found on this page" };
    }

    // Try to fetch the file
    console.log("Fetching file from URL...");
    const response = await fetch(fileUrl, { mode: "cors" });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    console.log("File fetched successfully, type:", blob.type);

    const fileName = fileUrl.split("/").pop() || "downloaded-file";
    const fileType = blob.type || "application/octet-stream";

    // Create File object
    const file = new File([blob], fileName, { type: fileType });
    console.log("File object created:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Create DataTransfer object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    let successCount = 0;

    // Try to fill all file inputs found
    for (const fileInput of fileInputs) {
      try {
        // Set the file
        fileInput.files = dataTransfer.files;

        // Dispatch events
        ["change", "input"].forEach((eventType) => {
          const event = new Event(eventType, { bubbles: true });
          fileInput.dispatchEvent(event);
        });

        successCount++;
        console.log("Successfully filled input:", fileInput);
      } catch (inputError) {
        console.error("Error filling specific input:", inputError);
      }
    }

    if (successCount === 0) {
      return { error: "Failed to fill any file inputs" };
    }

    return {
      message: `Successfully filled ${successCount} file input${
        successCount > 1 ? "s" : ""
      }`,
      success: true,
    };
  } catch (error) {
    console.error("Error in fillFileInput:", error);

    // Provide specific error messages for common issues
    if (error.message.includes("Failed to fetch")) {
      return {
        error:
          "Could not access the file URL. Make sure the URL is accessible and allows CORS.",
      };
    }
    if (error.message.includes("HTTP error")) {
      return { error: `Failed to download file: ${error.message}` };
    }

    return { error: `Error: ${error.message}` };
  }
}
