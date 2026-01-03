const textarea = document.getElementById("words")

// Load saved keywords
chrome.storage.sync.get(["blockedWords"], (data) => {
  textarea.value = (data.blockedWords || []).join("\n")
})

// Save and close popup
document.getElementById("save").addEventListener("click", () => {
  const words = textarea.value
    .split("\n")
    .map(w => w.trim())
    .filter(Boolean)

  chrome.storage.sync.set({ blockedWords: words }, () => {
    // Close the popup after saving
    window.close()
  })
})
