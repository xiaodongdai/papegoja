const MOVE_STEP = 3

function appendButton(parent, imgName, isDisabled, title) {
    var btn = document.createElement('button')
    //btn.className= "svp_js-controls-btn--captions svp_ui-controls__button-captions svp_is--visible svp_is--active"
    btn.className = 'my_button svp_ui-controls__button-captions svp_is--visible svp_is--active'
    var url = chrome.extension.getURL(imgName)
    btn.style.backgroundImage = `url(${url})`
    btn.disabled = isDisabled
    if(isDisabled === true) {
        btn.style.filter = 'grayscale(100)'
    }
    btn.style.display = 'inline-block'
    btn.title = title
    var span = document.createElement('span')
    span.className = 'svp_ui-controls__hidden svp_ui-controls__captions-label'
    span.innerHTML = title
    btn.appendChild(span)
    parent.appendChild(btn)
    return btn
}

function appendText(parent, letter){
    // insert the A note
    var text = document.createElement('div')
    text.className = 'a_b_notes svp_ui-controls__timeline-progress--time-remaining svp_js-controls-timeline--progress-time-remaining'
    text.style.bottom = '-30px'
    text.innerHTML = letter
    text.style.position = 'absolute'
    text.style.display = 'none'
    text.style.fontSize = '16px'
    text.style.width = '10px'
    text.draggable = true
    text.id = 'id_mark_' + letter
  
    //TODO drag: https://stackoverflow.com/questions/6230834/html5-drag-and-drop-anywhere-on-the-screen
    //https://javascript.info/mouse-drag-and-drop
    text.ondragstart = ev => {
        let rect = ev.target.getBoundingClientRect()
        let offset = null
        if(letter === 'A') {
            offset = rect.right - ev.clientX
        } else {
            offset = rect.left - ev.clientX // will be negative number!
        }
        console.log(`ondragstart called, right=${rect.right}, cientX=${ev.clientX}, offset=${offset}`)
        ev.dataTransfer.setData('text/plain', `${offset},${ev.target.id}`)
    }
    parent.appendChild(text)
    return text
}

let retries = 0
let stateEnum = {
    INIT: 0,
    POINT_A_SET: 1,
    POINT_B_SET: 2,
    POINT_B_SET_PAUSE: 3
}
function main() {

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
  
    var button1 = appendButton(videoArea, 'letter_a.png', false, 'Set start point(A)')
    var button2 = appendButton(videoArea, 'circle.png', false, 'Set end point(D)')
    var ABackward = appendButton(videoArea, 'arrow_left_A.png', true, 'Move start point backward(Z)')
    var AForward = appendButton(videoArea, 'arrow_right_A.png', true, 'Move start point forward(X)')
    var BBackward = appendButton(videoArea, 'arrow_left_B.png', true, 'Move end point backward(V)')
    var BForward = appendButton(videoArea, 'arrow_right_B.png', true, 'Move end point forward(B)')  
  
    var a_text = appendText(timeline, 'A')
    var b_text = appendText(timeline, 'B')
    
    /*
    function isFullScreen() {
        return document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement
    }
    */
    
    function getFirstElement(name, className) {
        var tmp = document.getElementsByClassName(className)
        if(!tmp || !tmp.length) {
            console.log('cannot get control ', tmp)
            throw new Error('cannot get control:' + name)
        }
        return tmp[0]  
    } 
  
    function getVideoCtl() {
        return getFirstElement('videoCtl', 'svp_video')
    }
  
    function getCaptionBtn() {
        return getFirstElement('captionBtn', 'svp_js-controls-btn--language svp_ui-controls__button-captions svp_is--visible')
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
  
    document.addEventListener('keydown', e => {
        if(e.keyCode === 65) {
            button1.click()
        } else if(e.keyCode === 68) { // D
            button2.click()
        } else if(e.keyCode === 83) { // S
            let captionBtn = getCaptionBtn()
            console.log('67 clicked!', captionBtn)
            captionBtn.click()
            e.stopPropagation()
        } else if(e.keyCode === 70) { // F
            getPlayButton().click()       
        } else if(e.keyCode === 25) { // Left
            console.log('left pressed')
            let curTime = getVideoCtl().currentTime
            if(curTime - MOVE_STEP < startPoint) {
                getVideoCtl().currentTime = startPoint
            } else {
                getVideoCtl().currentTime = curTime - MOVE_STEP
            } 
        } else if(e.keyCode === 27) { // Right
            console.log('right pressed')
            let curTime = getVideoCtl().currentTime
            if(curTime + MOVE_STEP < endPoint) {
                getVideoCtl().currentTime = startPoint
            } else {
                getVideoCtl().currentTime = curTime + MOVE_STEP
            } 
        }
    })
  
  
    timeline.parentElement.ondrop = ev => {
        console.log('drop called')
        event.preventDefault()
        let data = event.dataTransfer.getData('text/plain').split(',')
        let offsetMouse = parseInt(data[0], 10)
        let id = data[1]
        let parent = timeline.getBoundingClientRect()
        let offsetParent = parent.x
        console.log(ev.target)
        if(id === 'id_mark_A') {
            let rightUpper = ev.clientX + offsetMouse - offsetParent
            console.log(`clientX=${ev.clientX}, offsetMouse=${offsetMouse}, offsetParent=${offsetParent}, rightUpper=${rightUpper}`)  
            let newStartPoint = px2Time(rightUpper)
            if(newStartPoint > endPoint && state >= stateEnum.POINT_B_SET) {
                newStartPoint = endPoint - 2
            }
            console.log(`clientX=${ev.clientX}, offsetMouse=${offsetMouse}, offsetParent=${offsetParent}, newStartPoint=${newStartPoint}`)  
            moveStartPoint(newStartPoint - startPoint)
        } else if (id === 'id_mark_B'){
            let leftUpper = ev.clientX + offsetMouse - offsetParent
            let newEndPoint = px2Time(leftUpper)
            if(newEndPoint < startPoint && state >= stateEnum.POINT_A_SET) {
                newEndPoint = startPoint + 2
            }
            moveEndPoint(newEndPoint - endPoint)
        }
    }
  
    timeline.parentElement.ondragover = ev => {
    //console.log('dragover')
        ev.preventDefault()
    }
  

  
    function px2Time(pos) {
        if(pos < 0) {
            pos = 0
        }
        let parent = timeline.getBoundingClientRect()
        if(pos > parent.width) {
            pos = parent.widthc
        }
        let duration = getVideoCtl().duration
        console.log(`duration=${duration}, pos=${pos}, parent.width=${parent.width}`)
        return duration * pos / parent.width
    } 
  
    function getPosPercentage(pos, isStart) {
        let videoCtl = getVideoCtl()
        if(!pos) {
            pos = videoCtl.currentTime
        }
        let minus = 0
        if(isStart) {
            let widthTimeline = timeline.getBoundingClientRect().width
            let widthLetter = parseInt(a_text.style.width, 10)
            minus = widthLetter * 100 / widthTimeline
            console.log(`widthTimeline=${widthTimeline}, widthLetter=${widthLetter}, minus = ${minus}`)
        }
    
        return `${(pos * 100/videoCtl.duration - minus)}%`
    }
  
  
    button1.onclick = () => {
        try{
            let left =  getPosPercentage(undefined, true)
            a_text.style.left = left
            a_text.style.display = 'block'
            enableButtons([ABackward, AForward])
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
        a_text.style.left = getPosPercentage(undefined, true)
    }

    function moveEndPoint(pos) {
        if(endPoint + pos < startPoint) {
            return
        }
        endPoint += pos
        b_text.style.left = getPosPercentage(endPoint)
    }  

    function disableButtons(btnArr) {
        btnArr.forEach(btn => {
            btn.disabled = true
            btn.style.filter='grayscale(100)'
        })
    }
  
    function enableButtons(btnArr) {
        btnArr.forEach(btn => {
            btn.disabled = false
            btn.style.filter=''
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
                return
            } else if(state === stateEnum.POINT_B_SET_PAUSE){
                let url = chrome.extension.getURL('pause.png')
                button2.style.backgroundImage = `url(${url})`
                videoCtl.play()
                state = stateEnum.POINT_B_SET
                return
            } else if(state === stateEnum.INIT) {
                let videoCtl = getVideoCtl()
                let curPoint = videoCtl.currentTime
                if(curPoint < 10) {
                    videoCtl.currentTime = 0
                } else {
                    videoCtl.currentTime = curPoint - 10
                }
                button1.click()
                videoCtl.currentTime = curPoint
            }
      
            if(state === stateEnum.POINT_A_SET) {
                b_text.style.left = getPosPercentage()
                b_text.style.display = 'block'
                // tuneTextPos(a_text, b_text)
                endPoint = videoCtl.currentTime
                if(endPoint <= startPoint) {
                    endPoint = startPoint + MOVE_STEP
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
                        moveStartPoint(-MOVE_STEP)
                    } else if(e.keyCode === 88) {
                        moveStartPoint(MOVE_STEP)
                    } else if (e.keyCode === 86) {
                        moveEndPoint(-MOVE_STEP)
                    } else if (e.keyCode === 66) {
                        moveEndPoint(MOVE_STEP)
                    }
                }
                playButton.onclick = () => {
                    startPoint = 0
                    endPoint = 0
                    a_text.style.display = 'none'
                    b_text.style.display = 'none'
                    let videoCtl = getVideoCtl()
                    videoCtl.play()
                    videoCtl.ontimeupdate = originEventHandler
                    playButton.onclick = null
                    document.removeEventListener('keydown', keydownListener)
                    disableButtons([ABackward, AForward, BBackward, BForward])
                    let url = chrome.extension.getURL('circle.png')
                    button2.style.backgroundImage = `url(${url})`
                    state = stateEnum.INIT
                }
        
                // keydown
                // z 90, x 88, n 78, m 77
                document.addEventListener('keydown', keydownListener)
                let url = chrome.extension.getURL('pause.png')
                button2.style.backgroundImage = `url(${url})`
                state = stateEnum.POINT_B_SET
            }
        }
        catch(e) {
            console.log('error: ' + e)
        }
    }
  
    ABackward.onclick = () => {
        moveStartPoint(-MOVE_STEP)
    }
  
    AForward.onclick = () => {
        moveStartPoint(MOVE_STEP)
    }
    
    BBackward.onclick = () => {
        moveEndPoint(-MOVE_STEP)
    }
  
    BForward.onclick = () => {
        moveEndPoint(MOVE_STEP)
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

