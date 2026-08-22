async function getTabURL() {
  let tabsData = await chrome.tabs.query({active:true, currentWindow:true})

  return tabsData[0].url;
}

function validate(url) {
  let from = document.querySelector(".go");

  if (!from) return false;

  let domain = from.innerText.split(/[@></,]/).reverse()[1];
  
  let regexp = new RegExp(domain, "gi")
  if ([...document.body.innerHTML.matchAll(regexp)].length > 2) {
    return true;
  }else {
    return false;
  }
}

async function main() {
  // let url = await getTabURL();
  // console.log(validate(url))
  let sus = await chrome.storage.session.get("suspicious"), heading, msg, icon;

  if (sus.suspicious == "sus") {
    icon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="red" class="bi bi-x-circle-fill" viewBox=".1 .1 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
    </svg>
    `;
    heading = "Potential Fraud Alert!"
    msg = "The sender's domain and the email content have inconsistencies. Be cautious before interacting with this email or its content."
  }else if (sus.suspicious == "not") {
    icon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="lightgreen" class="bi bi-check-circle-fill" viewBox=".1 .1 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg>
    `;
    heading = "Safe Email Detected"
    msg = "The sender's domain and the email content show no suspicious correlation. It appears genuine at a first glance. Always remain cautious!"
  }else {
    icon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="lightgreen" class="bi bi-check-circle-fill" viewBox=".1 .1 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg>
    `;
    heading = "No email Detected"
    msg = "You can browse freely, a notification popup will appear if something suspicious is detected."
  }

  document.querySelector("#icon-sec").innerHTML = icon;
  document.querySelector("#heading").innerText = heading;
  document.querySelector("#msg").innerText = msg;
}

main()

chrome.storage.onChanged.addListener(() => {main()})