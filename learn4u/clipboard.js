/* PearlFox Learn4U - copying to the clipboard, in one place. Each function resolves true (copied) or false (blocked). */
(function () {
  function offscreen(tag) {
    var n = document.createElement(tag); n.setAttribute('aria-hidden', 'true');
    n.style.cssText = 'position:fixed;left:-9999px;top:0;';   // off screen, not display:none (that cannot be selected)
    return n;
  }
  // Older route: put the content on the page, select it, copy.
  function selectAndCopy(node) {
    document.body.appendChild(node);
    var done = false;
    try {
      if (node.select) node.select();
      else { var range = document.createRange(); range.selectNodeContents(node); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
      done = document.execCommand('copy');
    } catch (e) { done = false; }
    if (window.getSelection) window.getSelection().removeAllRanges();
    document.body.removeChild(node);
    return done;
  }
  // Rich (html plus text) when the browser allows it, so a pasted mail keeps its layout; otherwise the older route.
  function copyRich(html, text) {
    var older = function () { var n = offscreen('div'); n.innerHTML = html; return selectAndCopy(n); };
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      var item = new window.ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) });
      return navigator.clipboard.write([item]).then(function () { return true; }, function () { return older(); });
    }
    return Promise.resolve(older());
  }
  function copyPlain(text) {
    var older = function () { var n = offscreen('textarea'); n.value = text; return selectAndCopy(n); };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return older(); });
    return Promise.resolve(older());
  }
  window.L4U_CLIP = { copyRich: copyRich, copyPlain: copyPlain };
})();
