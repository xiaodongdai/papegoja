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
    throw new Error('something wrong, return')
  }
  var button1 = document.createElement('button')
  button1.className= "svp_js-controls-btn--captions svp_ui-controls__button-captions svp_is--visible svp_is--active"
  var url = chrome.extension.getURL('letter_a.png')
  button1.style.backgroundImage = `url(${url})`

  videoArea.appendChild(button1)
  
  // insert the circle button
  var button2 = document.createElement('button')
  button2.className= "svp_js-controls-btn--captions svp_ui-controls__button-captions svp_is--visible svp_is--active"
  url = chrome.extension.getURL('circle.png')
  button2.style.backgroundImage = `url(${url})`
  button2.disabled = true
  videoArea.appendChild(button2)
  
  // insert the A note
  var a_text = document.createElement('div')
  a_text.className = "a_b_notes svp_ui-controls__timeline-progress--time-remaining svp_js-controls-timeline--progress-time-remaining"
  a_text.style.bottom = '-25px'
  a_text.innerHTML = 'A'
  a_text.style.position = 'absolute'
  a_text.style.display = 'none'
  timeline.appendChild(a_text)
  
  // insert the A note
  var b_text = document.createElement('div')
  b_text.className = "a_b_notes svp_ui-controls__timeline-progress--time-remaining svp_js-controls-timeline--progress-time-remaining"
  b_text.style.bottom = '-25px'
  b_text.innerHTML = 'B'
  b_text.style.position = 'absolute'
  b_text.style.display = 'none'
  timeline.appendChild(b_text)
  
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
  
  button1.onclick = () => {
    try{
      let left =  getPosPercentage()
      console.log('a_text.style.left=' + left)
      a_text.style.left = getPosPercentage()
      console.log('a_text.style.left=' + a_text.style.left)
      a_text.style.display = 'block'
      button2.disabled = false
      startPoint = getVideoCtl().currentTime
      state = stateEnum.POINT_A_SET
    }
    catch(e) {
      console.log('error: ' + e)
    }
  }
  
  button2.onclick = () => {
    try{
      let videoCtl = getVideoCtl()
      if(state === stateEnum.POINT_B_SET) {
        videoCtl.pause()
        // TODO: change back to circle.
        state = stateEnum.POINT_B_SET_PAUSE
      } else if(state === stateEnum.POINT_B_SET_PAUSE){
        videoCtl.play()
        // TODO: change back image to pause
        state = stateEnum.POINT_B_SET
      } else if(state === stateEnum.POINT_A_SET) {
        b_text.style.left = getPosPercentage()
        b_text.style.display = 'block'

        endPoint = videoCtl.currentTime
        if(endPoint <= startPoint) {
          return
        }
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
          state = stateEnum.INIT
        }
        
        // keydown
        // z 90, x 88, n 78, m 77
        document.addEventListener('keydown', e => {
          function moveStartPoint(pos) {
            if(startPoint + pos >= endPoint) {
              return
            }
            startPoint += pos
            getVideoCtl().currentTime = startPoint
            a_text.style.left = getPosPercentage()
          }
          
          function moveEndPoint(pos) {
            if(endPoint + pos < startPoint) {
              return
            }
            endPoint += pos
            b_text.style.left = getPosPercentage(endPoint)
          }
          console.log('keydown!', e.keyCode)
          if(e.keyCode === 90) {
            moveStartPoint(-3)
          } else if(e.keyCode === 88) {
            moveStartPoint(3)
          } else if (e.keyCode === 86) {
            moveEndPoint(-3)
          } else if (e.keyCode === 66) {
            moveEndPoint(3)
          }
        })
        
        state = stateEnum.POINT_B_SET
      }

      
    }
    catch(e) {
      console.log('error: ' + e)
    }
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

