/**
 * electronPrint - Utility to trigger Electron's native print
 */
export const electronPrint = (options = {}) => {
  if (window.require) {
    const { ipcRenderer } = window.require("electron");
    ipcRenderer.send("print-command", options);

    return new Promise((resolve) => {
      ipcRenderer.once("print-finished", (event, result) => {
        resolve(result);
      });
    });
  } else {
    // Fallback if not in Electron context
    window.print();
    return Promise.resolve({ success: true });
  }
};
