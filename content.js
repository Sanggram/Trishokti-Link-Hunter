// Trishokti Active Agent - Injected directly into the page
// This solves the YouTube Shorts scrolling issue by polling the URL.

let lastUrl = location.href;

// প্যাটার্ন ম্যাচিং ফাংশন (Background এর মতোই, কিন্তু এখানে লোকাল চেকের জন্য)
function isTargetVideo(url) {
    const patterns = [
        /youtube\.com\/shorts\//,
        /youtube\.com\/watch\?v=/,
        /facebook\.com\/reel/,
        /instagram\.com\/reel\//,
        /tiktok\.com\/@.*\/video\//,
        /tiktok\.com\/v\//
    ];
    return patterns.some(regex => regex.test(url));
}

// 1. পেজ লোড হওয়ার সাথে সাথে চেক কর
if (isTargetVideo(location.href)) {
    chrome.runtime.sendMessage({ action: "auto_capture", url: location.href });
}

// 2. কন্টিনিউয়াস মনিটরিং (প্রতি ১ সেকেন্ড পর পর চেক করবে URL চেঞ্জ হয়েছে কিনা)
// Shorts স্ক্রল করলে এটা সাথে সাথে ধরবে
setInterval(() => {
    const currentUrl = location.href;
    
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        
        if (isTargetVideo(currentUrl)) {
            // কনসোলে হ্যাকার লগ
            console.log("%c[Trishokti] Target Detected: " + currentUrl, "color: #00ff41; background: #000; padding: 2px;");
            
            // হেডকোয়ার্টারে (Background Script) খবর পাঠাও
            chrome.runtime.sendMessage({ action: "auto_capture", url: currentUrl });
        }
    }
}, 1000);