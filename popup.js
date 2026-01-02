const textarea = document.getElementById("words")
const status = document.getElementById("status")

chrome.storage.sync.get(["blockedWords"], data => {
  textarea.value = (data.blockedWords || []).join("\n")
})

document.getElementById("save").addEventListener("click", () => {
  const words = textarea.value
    .split("\n")
    .map(w => w.trim())
    .filter(Boolean)

  chrome.storage.sync.set({ blockedWords: words }, () => {
    status.textContent = "Saved"
    setTimeout(() => (status.textContent = ""), 1500)
  })
})
