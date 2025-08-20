chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "reveal-password",
    title: "Reveal/Hide Password",
    contexts: ["editable"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "reveal-password" || !tab?.id) return;

  const target = { tabId: tab.id, allFrames: false };
  if (typeof info.frameId === "number") target.frameIds = [info.frameId];

  await chrome.scripting.executeScript({
    target,
    func: () => {
      const getDeepActive = () => {
        let a = document.activeElement;
        while (a && a.shadowRoot && a.shadowRoot.activeElement) {
          a = a.shadowRoot.activeElement;
        }
        return a;
      };
      let el = getDeepActive();

      if (!(el instanceof HTMLInputElement)) {
        const hovered = [...document.querySelectorAll('input[type="password"], input[type="text"]')]
          .find(i => i.matches(':hover'));
        if (hovered) el = hovered;
      }

      if (!(el instanceof HTMLInputElement)) {
        alert("No input element focused/hovered. Click the password field first.");
        return;
      }

      const isPassword = el.type === "password";

      try {
        el.type = isPassword ? "text" : "password";
      } catch (e) {
        const clone = el.cloneNode(true);
        clone.setAttribute("type", isPassword ? "text" : "password");
        el.replaceWith(clone);
        el = clone;
      }

      const style = el.style;
      if (style) {
        style.webkitTextSecurity = "";
        style.textSecurity = "";
      }

      if (isPassword) {
        el.dataset.revealedByExtension = "true";
      } else {
        delete el.dataset.revealedByExtension;
      }
    }
  });
});
