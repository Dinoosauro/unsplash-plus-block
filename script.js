/**
 * Checks if the "chrome" namespace is available, and use it. Otherwise, Firefox's "browser" namespace will be used.
 */
const chromiumUsed = typeof chrome !== "undefined";
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

/**
 * An Object that contains all the available detection methods for Unsplash+ images
 */
const nodeChecks = {
    svgClass: (node) => !!node.querySelector(".xJdt3"), // Look for the Unsplash Plus SVG icon class
    plusLink: (node) => Array.from(node.querySelectorAll("a")).some(link => link.href.indexOf("/plus") !== -1) // Fetch all the links, and look if there's a /plus link in that array
}

/**
 * The number of times an Unsplash+ image has been blocked
 */
let finalBlockNumber = 0;
/**
 * The Timeout ID that'll save the number of times an Unsplash+ image has been blocked
 */
let previousTimeoutId;
getStorageItem("BlockedNumber").then(({ BlockedNumber }) => {
    finalBlockNumber = +BlockedNumber || 0;
});

/**
 * Delete a node from the DOM, if the extension is enabled
 * @param {Node} node the Node to delete
 */
async function deleteItem(node) {
    if ((await getStorageItem("EnableBlocking"))["EnableBlocking"] === "b") return;
    const currentDetectionMethod = (await getStorageItem("ExtractionMethod"))["ExtractionMethod"];
    if (currentDetectionMethod === "0" ? nodeChecks.svgClass(node) : currentDetectionMethod === "1" ? nodeChecks.plusLink(node) : (nodeChecks.svgClass(node) || nodeChecks.plusLink(node))) {
        node.closest("figure").remove();
        finalBlockNumber++;
        /**
         * Some browsers apply a limit of writes per hour (for Chromium is 1800). 
         * To avoid potential issues with storing the data, 2500ms will be waited (500 ms extra so that there's still room for updating extension settings from the UI)
         */
        if (!previousTimeoutId) {
            previousTimeoutId = setTimeout(() => {
                setStorageItem("BlockedNumber", finalBlockNumber.toString());
                previousTimeoutId = undefined;
            }, 2500)
        }
    }
}
/**
 * @type MutationObserver
 */
let observer;
/**
 * @type MutationObserver
 */
let change;
function startScript() {
    /**
     * The possible divs for the image containers
     */
    let getScript = [...(document.querySelector("[data-testid='feed-scroll-div'], [data-test='feed-scroll-div']")?.previousSibling?.childNodes ?? [])];
    if (getScript.length === 0 || !document.querySelector("[data-test='topic-route'], [data-test='photos-feed-route'], [data-testid='topic-route'], [data-testid='photos-feed-route']") || !document.querySelector(`[data-test="client-side-hydration-complete"], [data-testid="client-side-hydration-complete"]`)) { // Try after 500 ms if new grids are found
        setTimeout(() => startScript(), 500);
        return;
    }
    const currentPhotoTest = document.querySelector("[data-test='topic-route'], [data-test='photos-feed-route'], [data-testid='topic-route'], [data-testid='photos-feed-route']"); // The main div for both the "Picture" tab
    const scriptToLook = currentPhotoTest.lastChild; // The single tab
    change = new MutationObserver((list) => {
        for (const mutation of list) {
            if (mutation.removedNodes) {
                const arr = Array.from(mutation.removedNodes);
                if (arr.indexOf(currentPhotoTest) !== -1 || arr.indexOf(scriptToLook) !== -1) { // Look if the user has changed the header part (currentPhotoTest) or if it has changed a small section (scriptToLook)
                    observer?.disconnect();
                    change?.disconnect();
                    setTimeout(() => startScript(), 500);
                }
            }
        }
    });
    change.observe(document.querySelector(`[data-test="client-side-hydration-complete"], [data-testid="client-side-hydration-complete"]`), { childList: true, subtree: true });
    observer = new MutationObserver(async (list) => {
        for (const item of list) {
            for (const node of item.addedNodes) deleteItem(node);
        }
    })
    for (const possibleGrids of getScript) {
        observer.observe(possibleGrids, { childList: true, subtree: true }); // The last grid is where all the images are shown. The previous ones are usually advertisement/promotion grids
        for (const item of possibleGrids.querySelectorAll("figure")) deleteItem(item); // Delete all the Unsplash+ items that were already loaded
    }
}
startScript();
(chromiumUsed ? chrome : browser).runtime.onMessage.addListener(() => {
    observer?.disconnect();
    change?.disconnect();
    startScript();
})