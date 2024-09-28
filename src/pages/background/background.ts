import Browser from "webextension-polyfill";

console.log("Background script loaded");

Browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

Browser.contextMenus.create({
  id: "copy_without_formatting",
  title: "Copy without formatting",
  contexts: ["all"],
});

Browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "copy_without_formatting") {
    console.log("Copy without formatting clicked");
    copySelectionWithoutFormatting();
  }
});

Browser.commands.onCommand.addListener((command) => {
  if (command === "copy_without_formatting") {
    console.log("Copy without formatting command triggered");
    copySelectionWithoutFormatting();
  }
});

async function copySelectionWithoutFormatting() {
  try {
    const [activeTab] = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab) {
      const results = await Browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          const selection = window.getSelection().toString();
          return selection
            .replace(/[\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        },
      });
      console.log("Results:", results);
      if (results && results[0]) {
        const sanitizedText = results[0].result;
        await writeClipboard(sanitizedText);
      } else {
        console.error("Failed to get selection or sanitize text");
      }
    }
  } catch (error) {
    console.error("Error processing selection:", error);
  }
}

async function writeClipboard(text) {
  try {
    const [activeTab] = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab) {
      await Browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (text) => navigator.clipboard.writeText(text),
        args: [text],
      });
      console.log("Text written to clipboard!");
    }
  } catch (error) {
    console.error("Error writing to clipboard:", error);
  }
}
