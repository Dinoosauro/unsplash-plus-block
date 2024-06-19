/**
 * Checks if the "chrome" namespace is available, and use it. Otherwise, Firefox's "browser" namespace will be used.
 */
const chromiumUsed = !!chrome;
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
 * An Object that contains all the available detection methods for Unsplash+ images
 */
const nodeChecks = {
    svgClass: (node) => !!node.querySelector(".xJdt3"), // Look for the Unsplash Plus SVG icon class
    plusLink: (node) => Array.from(node.querySelectorAll("a")).some(link => link.href.indexOf("/plus") !== -1) // Fetch all the links, and look if there's a /plus link in that array
}
function startScript() {
    const getScript = document.getElementsByClassName("VfiJa ec_09 Niw9H _UNLg"); // The class(es) for the grid containers
    if (getScript.length === 0) { // Try after 1500 seconds if new grids are found
        setTimeout(() => startScript(), 1500);
        return;
    }
    const observer = new MutationObserver(async (list) => {
        if ((await getStorageItem("EnableBlocking"))["EnableBlocking"] === "b") return;
        const currentDetectionMethod = (await getStorageItem("ExtractionMethod"))["ExtractionMethod"];
        for (const item of list) {
            for (let node of item.addedNodes) (currentDetectionMethod === "0" ? nodeChecks.svgClass(node) : currentDetectionMethod === "1" ? nodeChecks.plusLink(node) : (nodeChecks.svgClass(node) || nodeChecks.plusLink(node))) && node.closest("figure").remove();
        }
    })
    observer.observe(getScript[getScript.length - 1], { childList: true, subtree: true }); // The last grid is where all the images are shown. The previous ones are usually advertisement/promotion grids
}
startScript();
