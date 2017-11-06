//const stream = require('youtube-audio-stream')
//var url = 'https://www.youtube.com/watch?v=hSlb1ezRqfA'
const { exec } = require('child_process');
const lame = require('lame')
const Speaker = require('speaker')
const fs = require('fs')
const path = require('path')
const keypress = require('keypress')
const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg');
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);
const chalk = require('chalk')
const cp = require('copy-paste')
const assert = require('assert')


//This Section involves getting and responding to keypresses
keypress(process.stdin);
process.stdin.on('keypress', (ch, key) => {
	//To Test
	if (key && key.ctrl && key.name == 'c') {
		process.stdin.pause();
		process.exit()
	}
	else if(key && key.ctrl && key.name == 'p') {
		playing = false
		screenClass = null
		streamProcess.kill()
		stream(streamProcess, cp.paste())
	}
	else if(key && key.shift && key.name == 'p') {
		if(screenClass.id = info.id) {
			if(playing) {
				playing = false
				streamProcess.kill('SIGSTOP')
			}
			else {
				playing = true
				streamProcess.kill('SIGCONT')
			}
		}
	}
	else if(key && !key.ctrl && !key.shift) {
		switch(key.name) {
			case 'up': currentIndex = -1
				break
			case 'down': currentIndex = 0
				break
			case 'left': 
				if(currentIndex <= 0) {
					currentIndex
					if(relatedIndex > 0) {
						relatedIndex--
					}
				}
				else {
					currentIndex--
				}
				break
			case 'right':
				if(currentIndex >= 3) {
					currentIndex
					if(relatedIndex < (info.related.length - 4)) {
						relatedIndex++
					}
				}
				else {
					currentIndex++
				}
				break
			case 'return':
				if(currentIndex >= 0) {
					playing = false
					screenClass = null
					streamProcess.kill()
					stream(streamProcess, info.related[relatedIndex + currentIndex].id)
				}
				else if(consoleInput) {
				}
				break
			case 'backspace':
				if(consoleInput) {
					consoleInput = consoleInput.slice(0, consoleInput.length - 1)
				}
				break

			//this basically allows normal search to happen.
			default: consoleInput += key.name
		}
	}
});
 
process.stdin.setRawMode(true);
process.stdin.resume();
var consoleInput = ''
var currentIndex = -1;
var relatedIndex = 0;
var screenClass = null
var info = {
	author: '',
	title: '',
	length: 0,
	related: null
}
var playing = false

var streamProcess

//arguments
const args = process.argv

//argument checker
const checkArguments = () => {
	switch(args[2]) {
		case '--download':
		case '--down':
		case '-d':
			assert.ok((
				args[3] === 'audio' ||
				args[3] === 'mp3' ||
				args[3] === 'wav' ||
				args[3] === 'm4a' ||
				args[3] === 'video' ||
				args[3] === 'mp4' ||
				args[3] === 'mov' ||
				args[3] === 'flv' ||
				args[3] === 'webm'
			), 'unsupported or unknown format, $format accepts enum["audio", "mp3", "wav", "m4a", "video", "mp4", "mov", "flv", "webm"]')
			assert.ok(args[4], 'no url or video id provided')
			const downloadPath = args[5] || __dirname + '/video'
			download(args[3], args[4], downloadPath)
			break
		case '--stream':
		case '-s':
			assert.ok(args[3], 'no url or video id provided')
			stream(streamProcess, args[3])
			break
		default:
			assert.ok(!args[2], 'unknown option. quitting')
			stream(streamProcess, 'https://youtu.be/TuIcBPm90aM')
	}
}
checkArguments()

function download(format, url, location) {
	ytdl.getInfo(url, (err, info) => {
		const length = info.length_seconds
		assert.ok(!err, 'There was an error retrieving the video')
		if(format === 'audio') {
			format = 'mp3'
		}
		if(format === 'video') {
			format = 'mp4'
		}
		var dwnld = ffmpeg()

		if(format === 'mp3' || format === 'wav' || format === 'm4a') {
			dwnld.input(ytdl(url, {filter: (format) => format.container == 'm4a'}))
			if(format !== 'm4a') {
				dwnld.toFormat(format)
			}
		}
		else {
			if(format === 'webm') {
				dwnld.input(ytdl(url, {filter: (format) => format.container == 'webm'}))
			}
			else if(format === 'mp4') {
				dwnld.input(ytdl(url, {filter: (format) => format.container == 'mp4'}))
			}
			else {
				dwnld.input(ytdl(url, {filter: (format) => format.container == 'mp4'}))
				dwnld.toFormat(format)
			}
		}

		dwnld.on('start', () => {
			console.log(`Downloading ${chalk.blue.bold(info.title)} as ${chalk.red(format)}`)
		})

		dwnld.on('end', () => {
			console.log('\nDownload Finished, enjoy! :D')
			process.exit()
		})

		dwnld.on('error', (err) => {
			console.log('Oops. something went wrong! exiting process.')
			console.log(err)
			process.exit()
		})

		dwnld.on('progress', (progress) => {
			var timemark = progress.timemark.slice(0, -3).split(':')
			timemark = (parseInt(timemark[0]) * 3600) + (parseInt(timemark[1]) * 60) + parseInt(timemark[2])
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
    	process.stdout.write(buildProgressBar(timemark, length));
		})

		dwnld.save(location + '.' + format)
	})

	function buildProgressBar(current, time) {
		var barLength = (time >= 3600) ? process.stdout.columns - 18 : process.stdout.columns - 12
		var percentPassed = toInt((current/time) * barLength)
		var progressBar = ''
		for(var i = 0; i < barLength; i++){
			progressBar += (i < percentPassed) ? chalk.red('\u2588') : chalk.red('\u2591')
		}
		const bar = `${chalk.bold(toMinutes(current) + ' ')}${progressBar}${chalk.bold(' ' + toMinutes(time))}`
		return bar
	}

}


/**
 * @function stream
 * @desc theres a lot going on here. i wont even try explaining in depth.
 *       check out the following packages to figure it out
 *
 *       • ytdl-core
 *       • speaker
 *       • fluent-ffmpeg
 *       • lame
 *
 *			 the functionality here is SUPER expandable if you have the
 *			 ffmpeg dependency installed. (on MacOS use homebrew)
 *
 *			 http://www.ffmpeg.org
 *
 *			 how this works (essentially):
 *			 • get youtube video data with either the id or url
 *			 • start ffmpeg process, passing in the ytdl m4a stream
 *			 • format it to mp3
 *			 • bind proper event handling [ .on('event_string', cb()) ]
 *			 • pipe mp3 stream into lame to convert to raw PCM stream
 *			 • play raw PCM stream out of the speakers
 *
 *			 All this is, essentially, is a stream => sound converter.
 *
 *			 im just passing in a youtube stream for proof of concept
 *
 *			 if you pass in literally any audio stream, it will work.
 *			 (however it may break the screeen because no info is provided)
 *
 *			 in order to make this shippable, ffmpeg needs to be replaced.
 */
function stream(proc, url) {
	//get info
	ytdl.getInfo(url, (err, i) => {
		//this is how to see what data is available (a lot)
		//console.log(i, '\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n')
		info.author = i.author.name
		info.title = i.title
		info.length = i.length_seconds
		info.id = i.video_id
		info.related = i.related_videos
		for(var k = info.related.length - 1; k >= 0; k--) {
			if(info.related[k].list) {
				info.related.splice(k, 1)
			}
		}
		//start stream
		streamProcess = ffmpeg()
		  //pass youtube stream
			.input(ytdl(url, {filter: (format) => format.container == 'm4a'}))
			//format to mp3
			.toFormat('mp3')
			//event bindings
			.on('start', () => {
				console.log('\033c')
				for(var i = 0; i <= process.stdout.rows; i++) {
					console.log('\n')
				}
				playing = true
				screenClass = new Screen(info.id)
			})
			.on('error', (err) => {
				console.log('An error with the stream occurred:\n' + err)
				streamProcess.kill()
				process.exit()
			})
			.on('end', () => {
				playing = false
			})
			//sustain audio quality over anything else (niceness value -20[top priority] -- 20[low priority])
			.renice(-20)

		//pipe it into lame
		streamProcess.pipe(new lame.Decoder)
		//pipe lame into the speaker
			.pipe(new Speaker)

		//the reason that streamProcess piping is cut off between ffmpeg and lame/speaker is to
		//preserve the ffmpeg().kill(signal || 'SIGKILL') function. otherwise, it is impossible to (in a nice way)
		//kill the stream process.
	})
}

class Screen {

	constructor(id) {
		//management variables
		this.usedLines
		this.frame = 0
		this.time = 0
		this.id = id

		//render data, its literally a string
		this.screen = ''

		//this starts everything
		this.timer()

		//the keypress package can also accept mouse clicks. might be cool in the future
		//this.mousePosition = {x: 0, y: 0}
	}

	/**
	 * @method buildProgressBar
	 * @desc builds the Youtube progress bar. edit it to your visual liking :)
	 * 
	 * @returns {string} progress bar line
	 *
	 * @todo remove the return and invoke this.addLine() within this method
	 */
	buildProgressBar() {
		var barLength = (info.length >= 3600) ? process.stdout.columns - 18 : process.stdout.columns - 12
		var percentPassed = toInt((this.time/info.length) * barLength)
		var progressBar = ''
		for(var i = 0; i < barLength; i++){
			progressBar += (i < percentPassed) ? chalk.red.bgBlack('\u2501') : chalk.white.bgBlack('\u2501')
		}
		return progressBar
	}

	/**
	 * @method timer
	 * @desc this boy refreshes the screen at 20hrtz, manages the
	 *       youtube video's progress, and resets certain variables
	 *       if the video is paused, it keeps running, just without
	 *       changing any values. this reduces complexity, but also
	 *       reduces dependability and efficiency.
	 */
	timer() {
		setTimeoutPromise(50).then(() => {
			if(playing) {
				this.frame++
			}
			if(this.frame === 20) {
				this.frame = 0
				this.time++
			}
			this.screen = ''
			this.usedLines = 0
			this.render()
			if(this.id == info.id) {
				this.timer()
			}
		})
	}

	/**
	 * @method addLine
	 * @desc This method is absolutely crucial to this working.
	 * 			 it adds to and manages the screen. correctly.
	 *
	 * @param {string} line - string to display
	 *
	 * @todo add {string} [align] param. defaults to 'left'
	 * 			 use the center() method in here once thats done
	 * 			 add alignRight() method somewhere
	 *
	 * 			 additionally:
	 * 			 allow an array of objects/strings to also be accepted.
	 * 			 if object[] each object can hold the following data
	 * 			 {
	 * 			 	 text: {string},
	 * 			   align: {string},
	 * 			   flex: {number},
	 * 			   bg: {chalk color}
	 * 			 }
	 * 			 if string[], default to flex: 1, center align, no bg.
	 *
	 * 			 doing this will expand what is possible, and make other
	 * 			 line building methods much less complex
	 */
	addLine(line) {
		this.usedLines--
		this.screen += line + '\n'
	}

	/**
	 * @method center
	 * @desc takes a string and centers it using the screen's width
	 *
	 * @param {string} text - text to center
	 *
	 * @returns {string} -full line to render
	 *
	 * @todo expand this to do a few things:
	 *  			- add a {number} [width] param
	 *  			- if no width is given, default to screen width, and invoke this.addLine()
	 *  			- return something only if a width is provided
	 */
	center(text) {
		/**
		 * @const margin
		 * @desc the required margin to center the text.
		 * @todo figure out the reason the margin doesnt calculate correctly,
		 * 			 hence me needing the + 14 bit. works on my screen at any size
		 * 			 idk if it works like that universally.
		 */
		const margin = ((process.stdout.columns - text.length) / 2) + 14
		//output string
		var output = ''
		//builds left margin
		for(var i = 0; i < margin; i++) {
			output += ' '
		}
		//concats text
		output += text
		//builds right margin
		for(var i = 0; i < margin; i++) {
			output += ' '
		}
		return output
	}

	/**
	 *	@method buildRelated
	 *	@desc This one is a fucking doozy. I commented out and kept my console.logs
	 *				in hopes that it may help a future reader to understand. Essentially
	 *				builds what to render for the related videos. there are 3 stages.
	 *
	 *				Stage 1: Build all of the related video blocks as an array of strings
	 *				Stage 2: Concatenate the same line numbers of each array to build out the full row
	 *				Stage 3: Push to the screen
	 *
	 *	@param {number} index - index of selected related video
	 */
	buildRelated(index) {
		//Width of Screen
		const width = process.stdout.columns
		//Screen Data. literally every "pixel" goes here
		var items = []

		//this builds each individual related video's block
		function buildItem(data, requiredIndex, width) {
			//the returned value. The switch statement later on progressively adds to it
			var resultArray = []

			//Maximum width in 'pixels' of each block, rounded down to reduce weirdness
			const limit = toInt((width/4) - 4)

			var color = (string) => {return string}
			if(requiredIndex === index) {
				color = (string) => chalk.bgBlack.white(string)
			}

			//Data. normalized and clipped to fit the space
			const title  = clipString(data.title, limit)
			const author = clipString(data.author, limit)
			const length = toMinutes(data.length_seconds, true)
			const views  = data.short_view_count_text

			//this switch is weird, But it allows you to easily change the UI to your liking.
			//Initially, I had a top/bottom padding of 2, which looked very good, but i personally
			//wanted a shorter display so commented out some lines. edit it to your liking.
			for(var i = 0; i <= 8; i++) {
				switch(i) {
						/*case 0: resultArray.push(color(spacing(width/4 - 1)))
						break
					case 1: resultArray.push(color(spacing(width/4 - 1)))
						break*/
					case 2: resultArray.push(color(`${spacing(2)}${title}${spacing((width/4)-(title.length+4))}`))
						break
					case 3: resultArray.push(color(`${spacing(2)}${author}${spacing((width/4)-(author.length+4))}`))
						break
					case 4: resultArray.push(color(`${spacing(2)}${length}${spacing((width/4)-(length.length+4))}`))
						break
					case 5: resultArray.push(color(`${spacing(2)}${views}${spacing((width/4)-(views.length+4))}`))
						break
						/*case 6: resultArray.push(color(spacing(width/4 - 1)))
						break
					case 7: resultArray.push(color(spacing(width/4 - 1)))
						break*/
				}
			}
			return resultArray
		}

		/**
		 *	@function clipString
		 *	@desc clips a given string down to a maximum value. adds ellipses if needed.
		 *
		 *	@param {string} string - string to clip
		 *	@param {number} limit  - maximum length of string
		 *
		 *	@returns {string} - if the string fits in the space, it is not altered, otherwise, it is clipped.
		 */
		function clipString(string, limit) {
			if(string && string.length > limit) {
				return string.substring(0, limit - 3) + '...'
			}
			else {
				return string
			}
		}
		/**
		 * @function spacing
		 * @desc a helper function used to generate an arbitrary length string of spaces ' '
		 *
		 * @param {number} n - length of space
		 *
		 * @returns {string} string of length n
		 *
		 * @todo globalize this function to avoid code duplication.
		 */
		function spacing(n) {
			var string = ''
			for(var i = 0; i <= n; i++) {
				string += ' '
			}
			return string
		}

		//This for loop builds all the items as arrays of lines. and pushes them to the items array
		for(var i = 0; i < 4; i++) {
			items.push(buildItem(info.related[relatedIndex + i], i, width))
		}
		//This iterates through the finished item array to render to screen
		for(var i = 0; i < 4; i++) {
			var constructedString = ''
			//iterate through each line number of each item block,
			/**@todo change the loop value to the amount of lines in a given item*/
			for(var k = 0; k < 4; k++) {
				constructedString += items[k][i]
			}
			//push the line to the screen
			this.addLine(constructedString)
		}
	}
	render() {
		//These all Push lines to the screen
		this.addLine(this.center(`${chalk.blue.bold(info.title)} by ${chalk.red(info.author)}`))
		this.addLine(`${chalk.bgBlack.white.bold(toMinutes(this.time) + ' ')}${this.buildProgressBar()}${chalk.bgBlack.white.bold(' ' + toMinutes(info.length))}`)
		//this.addLine('')
		if(info && info.related) {
			this.buildRelated(currentIndex)
		}
		this.addLine(`SEARCH: ${consoleInput}`)

		//This is the actual rendering.
		process.stdout.moveCursor(0, this.usedLines)
		process.stdout.cursorTo(0)
		process.stdout.clearScreenDown() 
    process.stdout.write(this.screen);
	}
}


//Below this point are helper functions

/**
 * @function  toMinutes
 * @desc      Takes a number in seconds and returns a display string
 *
 * @param     {number} time - Time in seconds
 * @param     {boolean} [ignoreCurrent] - if true, ignores the value of global info.length (the length of the currently playing video)
 *
 * @returns   {string} - User friendly timecode display format
 */
const toMinutes = (time, ignoreCurrent) => {
	var hours     = time / 3600
	var minutes   = ((hours%1) * 3600)/60
	var seconds   = (minutes%1) * 60
	hours         = toInt(hours)
	minutes       = toInt(minutes)
	seconds       = toInt(seconds)

	//from here decide a user friendly display format
	if(hours || (!ignoreCurrent && info.length >= 3600)) {
		return `${toDigits(hours)}:${toDigits(minutes)}:${toDigits(seconds)}`
	}
	else {
		return `${toDigits(minutes)}:${toDigits(seconds)}`
	}
}

/**
 *	@function toInt
 *	
 *	@param {number} n - number to round down
 *
 *	@returns {number}
 */
const toInt = (n) => {
	return n-(n%1)
}

/**
 *	@function toDigits
 *	@desc returns a proper timecode string if values are low
 *
 *	@param {number} n
 *
 *	@returns {string}
 */
const toDigits = (n) => {
	if(!n) {
		return '00'
	}
	else if(n < 10) {
		return `0${n}`
	}
	else {
		return n
	}
}
