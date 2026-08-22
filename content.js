function getTabURL() {
  return window.location.href;
}

function validate(url) {
  // true means suspicious and false/not means valid mail
  if (!url.includes("https://mail.google.com/")) {
    return false;
  }
  if (url.includes("https://mail.google.com/") && url.split("#")[1].split("/").length == 1) {
    return false;
  }

  let from = document.querySelector(".go");
  if (!from) return "sus";

  let domain = from.innerText.split(/[@></,]/).reverse()[1].split(".")[0];
  let regexp = new RegExp(domain, "gi")
  if ([...document.querySelector(".a3s").innerHTML.matchAll(regexp)].length >= 1) {
    return "not";
  }else {
    return "sus";
  }
}

function main() {
  if(document.body.textContent.length < 1000) return 0;

  let url = getTabURL();
  let result = validate(url);
  let parsed = new URL(url);
  let hash = parsed.hash.split("/")[1];
  chrome.runtime.sendMessage({save: true, suspicious: result, path: hash ? hash.split("?")[0] : ""});

  if (result == "sus") {
    msg = "The sender's domain and the email content have inconsistencies. Be cautious before interacting with this email or its content."
    alert(msg);
  }

  return 1;
}

let inter, poped = false;
chrome.runtime.onMessage.addListener(msg => {
  if(msg.exe) {
    clearInterval(inter);
    inter = setInterval(() => {
      let txt = document.body.textContent;
      if (txt.length > 1000) {
        clearInterval(inter);
        main();
      }
    }, 2000)
  }
})