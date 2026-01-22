// Update display on load
function updateDisplay() {
    chrome.storage.local.get(['links'], (result) => {
        const count = result.links ? result.links.length : 0;
        document.getElementById('count').innerText = count;
    });
}
updateDisplay();

// Listen for background updates
chrome.storage.onChanged.addListener((changes) => {
    if (changes.links) updateDisplay();
});

// Show temporary message
function showMsg(text, color="#00ff41") {
    const m = document.getElementById('msg');
    m.style.color = color;
    m.innerText = text;
    setTimeout(() => { m.innerText = ""; }, 2000);
}

// 1. Force Download
document.getElementById('forceDownload').addEventListener('click', () => {
    chrome.storage.local.get(['links'], (result) => {
        const collectedLinks = result.links || [];
        if (collectedLinks.length === 0) {
            showMsg("No links collected!", "#ff0000");
            return;
        }

        // Logic to download file manually (same as background)
        const fileContent = collectedLinks.join("\n");
        const blob = new Blob([fileContent], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manual_dump_${Date.now()}.txt`;
        a.click();
        
        // Clean up
        chrome.storage.local.set({ links: [] });
        showMsg("Downloaded & Cleared!");
    });
});

// 2. Manual Grab (Force Capture)
document.getElementById('manualGrab').addEventListener('click', () => {
    // Get current tab URL
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab) {
            // Send to background to process
            chrome.runtime.sendMessage({
                action: "manual_capture", 
                url: activeTab.url
            }, (response) => {
                if(response.status === "success") showMsg("CAPTURED!", "#00ff41");
                else if(response.status === "warning") showMsg("ALREADY EXISTS", "#ffa500");
                else showMsg("INVALID VIDEO URL", "#ff0000");
            });
        }
    });
});

// 3. Clear Memory
document.getElementById('clearList').addEventListener('click', () => {
    chrome.storage.local.set({ links: [] });
    showMsg("Memory Wiped!", "#ff0000");
});