function appendButton(parent, imgName, isDisabled) {
  var btn = document.createElement('button')
  btn.className= "svp_js-controls-btn--captions svp_ui-controls__button-captions svp_is--visible svp_is--active"
  var url = chrome.extension.getURL(imgName)
  btn.style.backgroundImage = `url(${url})`
  btn.disabled = isDisabled
  parent.appendChild(btn)
  return btn
}

function appendText(parent, letter){
  // insert the A note
  var text = document.createElement('div')
  text.className = "a_b_notes svp_ui-controls__timeline-progress--time-remaining svp_js-controls-timeline--progress-time-remaining"
  text.style.bottom = '-25px'
  text.innerHTML = letter
  text.style.position = 'absolute'
  text.style.display = 'none'
  text.style.fontSize = '20px'
  text.draggable = true
  //TODO drag: https://stackoverflow.com/questions/6230834/html5-drag-and-drop-anywhere-on-the-screen
  text.ondragstart = (ev) => {
    let style = windows.getComputedStyle(ev.target, null)
    ev.dataTransfer.setData("text/plain", parseInt())
  }
  parent.appendChild(text)
  return text
}

let retries = 0
function main() {
  stateEnum = {
    INIT: 0,
    POINT_A_SET: 1,
    POINT_B_SET: 2,
    POINT_B_SET_PAUSE: 3
  }
  console.log('main called!')
  var state = stateEnum.INIT
  var startPoint = 0
  var endPoint = 0
  var videoArea = document.getElementsByClassName('play_video-area')[0]
  var timeline = document.getElementsByClassName('svp_ui-controls__timeline svp_js-controls-timeline svp_ui-controls--hide-initial svp_ui-controls--hide-on-error svp_is--visible')[0]

  console.log('test')
  if(!videoArea || !timeline) {
    if(retries === 2) {
      throw new Error('something is wrong, return')
    }
    retries += 1
    setTimeout(main, 300)
    return
  }
  
  var button1 = appendButton(videoArea, 'letter_a.png', false)
  var button2 = appendButton(videoArea, 'circle.png', true)
  var ABackward = appendButton(videoArea, 'arrow_left_A.png', true)
  var AForward = appendButton(videoArea, 'arrow_right_A.png', true)
  var BBackward = appendButton(videoArea, 'arrow_left_B.png', true)
  var BForward = appendButton(videoArea, 'arrow_right_B.png', true)  
  var a_text = appendText(timeline, 'A')
  var b_text = appendText(timeline, 'B')
  
  function getFirstElement(name, className) {
    var tmp = document.getElementsByClassName(className)
    if(!tmp || !tmp.length) {
      console.log('cannot get control ', tmp)
      throw new Error('cannot get control:' + name)
    }
    return tmp[0]  
  } 
  
  function getCursor() {
    return getFirstElement('Cursor', 'svp_ui-controls__timeline-progress--handle svp_js-controls-timeline--progress-handle svp_css-timeline--progress-handle')
  }
  
  function getVideoCtl() {
    return getFirstElement('videoCtl', 'svp_video')
  }
  
  function getPlayButton() {
    let classNamePlayButton = 'svp_js-controls-btn--play svp_ui-controls__button-play'
    let classNamePauseButton = 'svp_js-controls-btn--play svp_ui-controls__button-pause'
    var tmp = document.getElementsByClassName(classNamePlayButton)
    if(!tmp || !tmp.length) {
      tmp = document.getElementsByClassName(classNamePauseButton)
    }
    if(!tmp || !tmp.length) {
      throw new Error('cannot get play button')
    }
    return tmp[0]
  }
  
  function getPosPercentage(pos) {
    let videoCtl = getVideoCtl()
    if(!pos) {
      var pos = videoCtl.currentTime
    }
    return `${pos/videoCtl.duration*100}%`
  }
  
  function tuneTextPos(a_text, b_text) {
    let parent = timeline.getBoundingClientRect()
    let rect_a = a_text.getBoundingClientRect()
    let rect_b = b_text.getBoundingClientRect()
    if(rect_b.left < rect_a.left + 10) {
      console.log('parent', parent)
      console.log('rect_a', rect_a)
      console.log('rect_b', rect_b)
      let overlapp = rect_a.left + 10 - rect_b.left
      let move = overlapp / 2
      let a_pos = rect_a.left - parent.left - move
      let b_pos = rect_b.left - parent.left + move
      console.log(`move text, move = ${move}`)
      a_text.style.left = `${a_pos / parent.width * 100}%`
      b_text.style.left = `${b_pos / parent.width * 100}%`
      console.log(`a: ${a_text.style.left}, b: ${b_text.style.left}`)
    }
  }
  
  button1.onclick = () => {
    try{
      let left =  getPosPercentage()
      a_text.style.left = getPosPercentage()
      a_text.style.display = 'block'
      enableButtons([button2, ABackward, AForward])
      startPoint = getVideoCtl().currentTime
      state = stateEnum.POINT_A_SET
    }
    catch(e) {
      console.log('error: ' + e)
    }
  }
  
  function moveStartPoint(pos) {
    if(startPoint + pos >= endPoint) {
      return
    }
    startPoint += pos
    getVideoCtl().currentTime = startPoint
    a_text.style.left = getPosPercentage()
    tuneTextPos(a_text, b_text)
  }

  function moveEndPoint(pos) {
    if(endPoint + pos < startPoint) {
      return
    }
    endPoint += pos
    b_text.style.left = getPosPercentage(endPoint)
    tuneTextPos(a_text, b_text)
  }  

  function disableButtons(btnArr) {
    btnArr.forEach(btn => {
      btn.disabled = true
    })
  }
  
  function enableButtons(btnArr) {
    btnArr.forEach(btn => {
      btn.disabled = false
    })
  }
  
  button2.onclick = () => {
    try{
      let videoCtl = getVideoCtl()
      if(state === stateEnum.POINT_B_SET) {
        videoCtl.pause()
        let url = chrome.extension.getURL('circle.png')
        button2.style.backgroundImage = `url(${url})`
        state = stateEnum.POINT_B_SET_PAUSE
      } else if(state === stateEnum.POINT_B_SET_PAUSE){
        let url = chrome.extension.getURL('pause.png')
        button2.style.backgroundImage = `url(${url})`
        videoCtl.play()
        state = stateEnum.POINT_B_SET
      } else if(state === stateEnum.POINT_A_SET) {
        b_text.style.left = getPosPercentage()
        b_text.style.display = 'block'
        tuneTextPos(a_text, b_text)
        endPoint = videoCtl.currentTime
        if(endPoint <= startPoint) {
          return
        }
        enableButtons([ABackward, AForward, BBackward, BForward])
        videoCtl.currentTime = startPoint
        let originEventHandler = videoCtl.ontimeupdate
        videoCtl.ontimeupdate = () => {
          let curTime = videoCtl.currentTime
          if(curTime >= endPoint) {
            videoCtl.currentTime = startPoint
          }
        }
        // get the big play button and install the onclick event
        let playButton = getPlayButton()
        //playButton.className = 'svp_js-controls-btn--play svp_ui-controls__button-play'
        var keydownListener = e => {
          if(e.keyCode === 90) {
            moveStartPoint(-3)
          } else if(e.keyCode === 88) {
            moveStartPoint(3)
          } else if (e.keyCode === 86) {
            moveEndPoint(-3)
          } else if (e.keyCode === 66) {
            moveEndPoint(3)
          }
        }
        let originPlayButtonClick = playButton.onclick
        playButton.onclick = () => {
          startPoint = 0
          endPoint = 0
          a_text.style.display = 'none'
          b_text.style.display = 'none'
          let videoCtl = getVideoCtl()
          videoCtl.play()
          videoCtl.ontimeupdate = originEventHandler
          playButton.onclick = originPlayButtonClick
          document.removeEventListener('keydown', keydownListener)
          disableButtons([button2, ABackward, AForward, BBackward, BForward])
          state = stateEnum.INIT
        }
        
        // keydown
        // z 90, x 88, n 78, m 77
        document.addEventListener('keydown', keydownListener) 
        state = stateEnum.POINT_B_SET
      }
    }
    catch(e) {
      console.log('error: ' + e)
    }
  }
  
  ABackward.onclick = () => {
    moveStartPoint(-3)
  }
  
  AForward.onclick = () => {
    moveStartPoint(3)
  }
    
  BBackward.onclick = () => {
    moveEndPoint(-3)
  }
  
  BForward.onclick = () => {
    moveEndPoint(3)
  }
  
  /*
  <div class="svp_ui-controls__timeline-progress--time-remaining svp_js-controls-timeline--progress-time-remaining" style="">-57:58</div>
  set the right attribute of css, then it will move.
  */
}


window.addEventListener('DOMContentLoaded', function () {
  if(document.readyState !== 'complete') {
    console.log('not ready yet')
    document.onreadystatechange = function () {
      if(document.readyState === 'complete') {
        console.log('completed!')
        main()
        return
      }
    }
  }
})

