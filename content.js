// Holds blocked words loaded from storage
let blockedWords = [];

/**
 * Load blocked words on startup
 */
chrome.storage.sync.get(["blockedWords"], (data) => {
  blockedWords = (data.blockedWords || []).map(w => w.toLowerCase());
  rescan(true);
});

/**
 * React to popup updates
 */
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedWords) {
    blockedWords = (changes.blockedWords.newValue || []).map(w => w.toLowerCase());
    rescan(true);
  }
});

/**
 * Normalize and tokenize text into words
 * - Keeps @mentions
 * - Removes punctuation
 * - Enforces exact word matching
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9@]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

/**
 * Extract visible text from an article (tweet)
 */
function extractVisibleText(article) {
  const walker = document.createTreeWalker(
    article,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;

        // Ignore UI chrome text
        if (node.parentElement.closest("button, nav, footer, header")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let text = "";
  let node;
  while ((node = walker.nextNode())) {
    text += node.nodeValue + " ";
  }

  return text;
}

/**
 * Process a single tweet
 */
function processArticle(article, force = false) {
  if (!force && article.dataset.wordBlockChecked === "true") return;

  const rawText = extractVisibleText(article);
  if (!rawText) return;

  const tokens = tokenize(rawText);

  const match = blockedWords.some(rule => {
    const parts = rule.split(/\s+/);
    return parts.every(p => tokens.includes(p));
  });

  if (match) {
    article.classList.add("x-blocked");
  } else {
    article.classList.remove("x-blocked");
  }

  article.dataset.wordBlockChecked = "true";
}

/**
 * Scan all existing tweets
 */
function rescan(force = false) {
  document.querySelectorAll("article").forEach(article => {
    processArticle(article, force);
  });
}

/**
 * Observe dynamically added tweets (infinite scroll)
 */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;

      if (node.tagName === "ARTICLE") {
        processArticle(node);
      } else {
        node.querySelectorAll?.("article").forEach(article => {
          processArticle(article);
        });
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
