
function click(e) {
  var bkg = chrome.extension.getBackgroundPage()
  bkg.lang = e.target.id
  bkg.console.log('momsubtitle: language is changed to:' + bkg.lang)
  window.close();
}

document.addEventListener('DOMContentLoaded', function () {
  var divs = document.querySelectorAll('div');
  for (var i = 0; i < divs.length; i++) {
    divs[i].addEventListener('click', click);
  }
})
