/**
 * Print Helper Utilities
 * These functions help ensure consistent printing behavior across different browsers
 */

// Ensure Promise compatibility
import 'promise-polyfill/src/polyfill';

/**
 * Utility functions for handling printing safely across browsers
 */

/**
 * Safely executes a Promise-based function with fallback
 * @param {Function} promiseFunction - The Promise-based function to execute
 * @param {Function} fallbackFunction - The fallback function to call if the Promise fails
 */
export const safePromiseExecution = (promiseFunction, fallbackFunction) => {
  try {
    // Add a catch handler to prevent unhandled promise errors
    const result = promiseFunction();
    
    // Check if result is a Promise
    if (result && typeof result.then === 'function') {
      result.catch((error) => {
        console.error('Promise execution failed:', error);
        if (typeof fallbackFunction === 'function') {
          fallbackFunction();
        }
      });
    }
  } catch (error) {
    console.error('Error executing function:', error);
    if (typeof fallbackFunction === 'function') {
      fallbackFunction();
    }
  }
};

/**
 * Check if all stylesheets are loaded before printing
 * @returns {Promise} A Promise that resolves when styles are loaded
 */
export const ensureStylesLoaded = () => {
  return new Promise((resolve) => {
    // Function to check if all styles are loaded
    const checkStyles = () => {
      const styleSheets = Array.from(document.styleSheets);
      
      // Check if stylesheets have loaded rules
      const allLoaded = styleSheets.every(sheet => {
        try {
          // If we can access cssRules, the stylesheet has loaded
          return sheet.cssRules?.length >= 0;
        } catch (error) {
          // CORS error or stylesheet not loaded
          return false;
        }
      });
      
      if (allLoaded) {
        resolve();
      } else {
        // Check again in 50ms
        setTimeout(checkStyles, 50);
      }
    };
    
    // Start checking
    checkStyles();
    
    // Set a maximum timeout of 2 seconds to avoid hanging
    setTimeout(resolve, 2000);
  });
};

/**
 * Print HTML content using an iframe for better compatibility
 * @param {HTMLElement} contentElement - The element containing content to print
 */
export const printViaIframe = (contentElement) => {
  if (!contentElement) {
    console.error('Cannot print: no content element provided');
    return;
  }
  
  try {
    // Create a new iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '80mm';
    document.body.appendChild(printFrame);
    
    // Access the iframe document and write content
    const frameDoc = printFrame.contentDocument || 
                    (printFrame.contentWindow && printFrame.contentWindow.document);
    
    if (!frameDoc) {
      console.error('Cannot access iframe document');
      document.body.removeChild(printFrame);
      return;
    }
    
    // Copy styles for printing
    const styleSheets = document.styleSheets;
    let styleText = '';
    
    try {
      // Try to access and copy styles
      for (let i = 0; i < styleSheets.length; i++) {
        const sheet = styleSheets[i];
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (rules) {
            for (let j = 0; j < rules.length; j++) {
              styleText += rules[j].cssText + '\n';
            }
          }
        } catch (e) {
          console.log('Could not access styles from sheet', i, e);
        }
      }
    } catch (e) {
      console.log('Error copying styles:', e);
    }
    
    // Add print-specific styles
    styleText += `
      @page { size: 80mm auto !important; margin: 0mm !important; }
      body { 
        font-family: 'Courier New', monospace !important;
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print { display: none !important; }
      table, tr, td, th { page-break-inside: avoid !important; }
      * { color: black !important; background: white !important; }
    `;
    
    // Write to iframe document
    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>${styleText}</style>
        </head>
        <body>
          ${contentElement.innerHTML}
        </body>
      </html>
    `);
    frameDoc.close();
    
    // Wait for content and styles to load
    setTimeout(() => {
      try {
        // Print and then remove the iframe
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        document.body.removeChild(printFrame);
      }
    }, 500);
    
  } catch (error) {
    console.error('Error creating print frame:', error);
  }
};

/**
 * Ensure image loading before printing
 * @param {Function} printFunction - The function to call after images are loaded
 * @param {HTMLElement} container - The container element with images to check
 */
export const ensureImagesLoaded = (printFunction, container) => {
  if (!container) {
    printFunction();
    return;
  }
  
  const images = container.querySelectorAll('img');
  if (images.length === 0) {
    printFunction();
    return;
  }
  
  let loadedImages = 0;
  const totalImages = images.length;
  
  const checkAllImagesLoaded = () => {
    loadedImages++;
    if (loadedImages === totalImages) {
      printFunction();
    }
  };
  
  images.forEach(img => {
    if (img.complete) {
      checkAllImagesLoaded();
    } else {
      img.addEventListener('load', checkAllImagesLoaded);
      img.addEventListener('error', checkAllImagesLoaded);
    }
  });
}; 