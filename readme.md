# Node.yt


## Getting Started

Make sure you have node, npm, and homebrew installed.

This project stands on the backbones of the incredible FFmpeg project (ffmpeg.org)

to install this on macOS with all available options, run

```
brew install ffmpeg --with-fdk-aac --with-ffplay --with-freetype --with-frei0r --with-libass --with-libvo-aacenc --with-libvorbis --with-libvpx --with-opencore-amr --with-openjpeg --with-opus --with-rtmpdump --with-schroedinger --with-speex --with-theora --with-tools

```

## Installing

all thats needed is to clone this project, then run

```
npm i
```

or

```
yarn
```

and boom, done. you can test it out with

```
npm run test
```

or

```
node index.js
```

## Usage

The Download command accepts 3 arguments

* **format** - enum["audio", "mp3", "wav", "m4a", "video", "mp4", "mov", "webm"]
* **video** - the video url or video id
* **path** - the download path, defaults to `./video.[formatExtension]`

***format argument, "audio" will download as mp3***
***format argument, "video" will download as m4a***

```
node index.js -d $format $video $path
```

The Stream command accepts 1 argument

* **video** - the video url or video id

```
node index.js -s $video
```
