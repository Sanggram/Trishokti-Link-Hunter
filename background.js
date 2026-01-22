// Trishokti Hunter V3 - Central Intelligence
// Receives Intel from Active Agent (content.js)

let collectedLinks = [];
const BATCH_LIMIT = 50; 

function isValidVideoUrl(url) {
    if (!url) return false;
    // সেইম প্যাটার্নগুলো এখানেও রাখলাম ডাবল চেকের জন্য
    const patterns = [
        /youtube\.com\/watch\?v=/,
        /youtube\.com\/shorts\//,
        /youtu\.be\//,
        /facebook\.com\/.*\/videos\//,
        /facebook\.com\/watch/,
        /facebook\.com\/reel/,
        /fb\.watch\//,
        /instagram\.com\/reel\//,
        /instagram\.com\/p\//,
        /tiktok\.com\/@.*\/video\//,
        /tiktok\.com\/v\//
    ];
    return patterns.some(regex => regex.test(url));
}

// ফাইল সেভিং লজিক (আগের মতোই)
function getFileName() {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, "-");
    return `trishokti_dump_${timestamp}.txt`;
}

function saveLinksToFile() {
    if (collectedLinks.length === 0) return;
    const uniqueLinks = [...new Set(collectedLinks)];
    const fileContent = uniqueLinks.join("\n");
    
    const blob = new Blob([fileContent], {type: 'text/plain'});
    const reader = new FileReader();
    
    reader.onload = function() {
        chrome.downloads.download({
            url: reader.result,
            filename: getFileName(),
            saveAs: false
        }, () => {
            console.log("Batch Saved & Wiped.");
            collectedLinks = [];
            chrome.storage.local.set({ links: [] });
            updateBadge();
        });
    };
    reader.readAsDataURL(blob);
}

function updateBadge() {
    const count = collectedLinks.length.toString();
    chrome.action.setBadgeText({ text: count });
    if (collectedLinks.length > 0) chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    else chrome.action.setBadgeBackgroundColor({ color: "#238636" });
}

// লিংক প্রসেস করা
function processUrl(url) {
    if (isValidVideoUrl(url)) {
        if (!collectedLinks.includes(url)) {
            collectedLinks.push(url);
            chrome.storage.local.set({ links: collectedLinks });
            console.log("✅ Captured:", url);
            updateBadge();

            if (collectedLinks.length >= BATCH_LIMIT) {
                saveLinksToFile();
            }
        }
    }
}

// --- COMMS LINK (From Content Script & Popup) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Content Script থেকে আসা অটোমেটিক সিগন্যাল
    if (request.action === "auto_capture") {
        processUrl(request.url);
    }
    
    // 2. Popup থেকে আসা ম্যানুয়াল সিগন্যাল
    if (request.action === "manual_capture") {
        const url = request.url;
        if (isValidVideoUrl(url)) {
            if (!collectedLinks.includes(url)) {
                processUrl(url);
                sendResponse({status: "success", msg: "Captured!"});
            } else {
                sendResponse({status: "warning", msg: "Duplicate!"});
            }
        } else {
            sendResponse({status: "error", msg: "Invalid URL"});
        }
    }
});

// Startup Sync
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['links'], (result) => {
        if (result.links) {
            collectedLinks = result.links;
            updateBadge();
        }
    });
});