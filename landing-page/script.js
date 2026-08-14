const APP_URL = "https://afunwa-hairline.vercel.app/";

let deferredInstallPrompt = null;

const downloadButtons = [
  document.getElementById("downloadButton"),
  document.getElementById("downloadButtonBottom")
].filter(Boolean);

const guideButton = document.getElementById("guideButton");
const installDialog = document.getElementById("installDialog");
const closeDialog = document.getElementById("closeDialog");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

async function handleDownloadClick() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    return;
  }

  window.location.href = APP_URL;
}

downloadButtons.forEach((button) => {
  button.addEventListener("click", handleDownloadClick);
});

guideButton?.addEventListener("click", () => {
  if (typeof installDialog?.showModal === "function") {
    installDialog.showModal();
    return;
  }

  window.location.href = APP_URL;
});

closeDialog?.addEventListener("click", () => {
  installDialog?.close();
});

installDialog?.addEventListener("click", (event) => {
  if (event.target === installDialog) {
    installDialog.close();
  }
});
