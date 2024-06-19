const requestedUrl = "*://*.unsplash.com/*";
/**
 * Checks if the "chrome" namespace is available, and use it. Otherwise, Firefox's "browser" namespace will be used.
 */
const chromiumUsed = !!chrome;
/**
 * Check if the user has granted permission to the extension to access the YouTube webpage, so that, if false, a warning on the extension UI will be shown.
 */
function checkPermission() {
    chromiumUsed ? chrome.permissions.contains({ origins: [requestedUrl] }, (hideItem)) : browser.permissions.contains({ origins: [requestedUrl] }).then(hideItem);
    /**
     * Show, or hide every DOM item related to browser activation
     * @param {boolean} permission 
     */
    function hideItem(permission) {
        for (const item of document.querySelectorAll("[data-activationshowup]")) item.style.display = permission ? "none" : "block";
    }
}
/**
 * Gets from the extension storage a value
 * @param {string} key the key to get from the extension storage
 * @returns a Promsie, resolved with an Object that contains the provided key with its value
 */
function getStorageItem(key) {
    return new Promise((resolve) => {
        chromiumUsed ? chrome.storage.sync.get([key], resolve) : browser.storage.sync.get([key]).then(resolve); // Get the value of that item and update the DOM
    })
}
/**
 * Save a parameter to the extension storage
 * @param {string} key the key of the value to set
 * @param {string} value the value of that key
 */
function setStorageItem(key, value) {
    chromiumUsed ? chrome.storage.sync.set({ [key]: value }) : browser.storage.sync.set({ [key]: value });
}
checkPermission();
document.getElementById("enable").onclick = () => { // Request access to the Unsplash domain
    chromiumUsed ? chrome.permissions.request({ origins: [requestedUrl] }, (() => checkPermission())) : browser.permissions.request({ origins: [requestedUrl] }).then(() => checkPermission());
}
/**
 * A Map that contains the key to update, and their checkboxes
 */
const getCheckedItems = new Map([["EnableBlocking", document.getElementById("enableUnsplashBlock")]]);
/**
 * A Map that contains the key to update, and the inputs/selects where the value will be fetched
 */
const getValueItems = new Map([["ExtractionMethod", document.getElementById("detectionMethod")]]);
(async () => {
    for (const [key, domItem] of getCheckedItems) {
        domItem.addEventListener("change", () => setStorageItem(key, domItem.checked ? "a" : "b"));
        domItem.checked = (await getStorageItem(key))[key] !== "b";
    }
    for (const [key, domItem] of getValueItems) {
        domItem.addEventListener("change", () => setStorageItem(key, domItem.value));
        domItem.value = (await getStorageItem(key))[key] ?? "default";
    }
})()