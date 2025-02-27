import Browser from "webextension-polyfill";

console.log("Background script loaded");

const CONTEXT_MENU_ITEMS = [
  { id: "copy_without_formatting", title: "Copy without formatting" },
  { id: "paste_without_formatting", title: "Paste without formatting" },
];

function createContextMenuItems() {
  CONTEXT_MENU_ITEMS.forEach((item) => {
    Browser.contextMenus.create({
      id: item.id,
      title: item.title,
      contexts: ["all"],
    });
  });
}

function handleContextMenuClick(info) {
  if (info.menuItemId === "copy_without_formatting") {
    console.log("Copy without formatting clicked");
    copySelectionWithoutFormatting();
  } else if (info.menuItemId === "paste_without_formatting") {
    console.log("Paste without formatting clicked");
    pasteWithoutFormatting();
  }
}

function handleCommand(command) {
  if (command === "copy_without_formatting") {
    console.log("Copy without formatting command triggered");
    copySelectionWithoutFormatting();
  } else if (command === "paste_without_formatting") {
    console.log("Paste without formatting command triggered");
    pasteWithoutFormatting();
  }
}

async function getActiveTab() {
  const [activeTab] = await Browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}

async function executeScriptInActiveTab(func, args = []) {
  const activeTab = await getActiveTab();
  if (activeTab) {
    return await Browser.scripting.executeScript({
      target: { tabId: activeTab.id },
      func,
      args,
    });
  }
  return null;
}

async function copySelectionWithoutFormatting() {
  try {
    const results = await executeScriptInActiveTab(() => {
      const selection = window.getSelection().toString();
      return selection
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    });
    if (results && results[0]) {
      const sanitizedText = results[0].result;
      await writeClipboard(sanitizedText);
    } else {
      console.error("Failed to get selection or sanitize text");
    }
  } catch (error) {
    console.error("Error processing selection:", error);
  }
}

async function writeClipboard(text) {
  try {
    await executeScriptInActiveTab(
      async (text) => {
        await navigator.clipboard.writeText(text);
      },
      [text]
    );
    console.log("Text written to clipboard!");
  } catch (error) {
    console.error("Error writing to clipboard:", error);
  }
}

async function pasteWithoutFormatting() {
  try {
    await executeScriptInActiveTab(async () => {
      const text = await navigator.clipboard.readText();
      const sanitizedText = text
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const activeElement = document.activeElement;
      if (activeElement && typeof activeElement.value !== "undefined") {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        activeElement.value =
          activeElement.value.substring(0, start) +
          sanitizedText +
          activeElement.value.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd =
          start + sanitizedText.length;
      } else if (document.execCommand) {
        document.execCommand("insertText", false, sanitizedText);
      }
    });
    console.log("Text pasted without formatting!");
  } catch (error) {
    console.error("Error pasting text:", error);
  }
}

Browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  createContextMenuItems();
});

Browser.contextMenus.onClicked.addListener(handleContextMenuClick);
Browser.commands.onCommand.addListener(handleCommand);
