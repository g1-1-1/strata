let f;
const textarea = document.getElementById("t");
const urlInput = document.getElementById("urlInput");
const download = document.getElementById("download");

const content = LZString.decompressFromBase64(window.location.hash.slice(1));
if (content) {
  textarea.value = content;
}

processContent(); // update urlInput and download link

function processContent() {
  window.location.hash = hash();
  urlInput.value = window.location;
  document.title = getTitle();
  download.setAttribute("download", getFilename());
  download.href = getDownloadUri();
}

function hash() {
  return LZString.compressToBase64(textarea.value);
}

function getTitle() {
  return textarea.value ? textarea.value.slice(0, 30) : "strata";
}

function getFilename() {
  return getTitle().replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_strata.txt";
}

function getDownloadUri() {
  return `data:text/plain,${encodeURIComponent(textarea.value)}`;
}

function contentChanged() {
  clearInterval(f);
  f = setTimeout(() => {
    processContent();
  }, 500);
}

function share() {
  urlInput.style.display = "block";
  urlInput.select();
  return false;
}

function unshare() {
  urlInput.style.display = "none";
}

function clear() {
  textarea.value = "";
  unshare();
  textarea.focus();
  processContent();
  return false;
}

textarea.onkeyup = contentChanged;
textarea.onpaste = contentChanged;
textarea.onfocus = unshare;
document.getElementById("share").onclick = share;
document.getElementById("new").onclick = clear;
