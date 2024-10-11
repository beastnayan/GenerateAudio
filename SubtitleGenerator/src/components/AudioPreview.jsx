import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WaveSurfer from 'wavesurfer.js';
import './AudioPreview.css';

const AudioPreview = () => {
  const location = useLocation();
  const { file } = location.state || {};
  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [printedLyrics, setPrintedLyrics] = useState([]); // Track printed lyrics
  const [highlightedLyrics, setHighlightedLyrics] = useState(new Set()); // Use Set for unique highlights
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const navigate = useNavigate();

  // Function to parse SRT file content
  const parseSRT = (srtText) => {
    return srtText
      .replace(/\r\n/g, '\n')
      .replace(/\n\n+/g, '\n\n')
      .trim()
      .split('\n\n')
      .map((block) => {
        const [index, time, ...text] = block.split('\n');
        const [startTime, endTime] = time.split(' --> ').map((t) => {
          const [hours, minutes, seconds] = t.trim().split(':');
          return (
            parseFloat(hours) * 3600 +
            parseFloat(minutes) * 60 +
            parseFloat(seconds.replace(',', '.'))
          );
        });
        return {
          index: parseInt(index), // Ensure index is a number
          startTime,
          endTime,
          text: text.join('\n'),
        };
      });
  };

  useEffect(() => {
    let isMounted = true;
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioURL(url);

      fetch('/subtitle.srt')
        .then(response => response.text())
        .then(text => {
          const parsedSubtitles = parseSRT(text);
          setSubtitles(parsedSubtitles);
        });

      // Initialize WaveSurfer
      waveSurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#ccc',
        progressColor: '#007bff',
        cursorColor: '#333',
        responsive: true,
        height: 50,
        width: 1100,
      });
      waveSurferRef.current.load(url);

      waveSurferRef.current.on('ready', () => {
        waveSurferRef.current.play();
      });

      return () => {
        isMounted = false;
        URL.revokeObjectURL(url);
        if (waveSurferRef.current) {
          waveSurferRef.current.destroy();
        }
      };
    }
  }, [file]);

  useEffect(() => {
    if (subtitles.length > 0 && waveSurferRef.current) {
      let previousSubtitleIndex = -1;

      const handleAudioProcess = () => {
        const currentTime = waveSurferRef.current.getCurrentTime();
        const subtitle = subtitles.find(
          (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
        );

        if (subtitle && subtitle.index !== previousSubtitleIndex) {
          previousSubtitleIndex = subtitle.index;

          // Concatenate new subtitle text
          setPrintedLyrics((prevSubtitle) =>
            prevSubtitle.some(item => item.id === subtitle.index && item.text === subtitle.text)
              ? prevSubtitle
              : [...prevSubtitle, { id: subtitle.index, text: subtitle.text }]
          );
        }
      };

      waveSurferRef.current.on('audioprocess', handleAudioProcess);

      return () => {
        if (waveSurferRef.current) {
          waveSurferRef.current.un('audioprocess', handleAudioProcess);
        }
      };
    }
  }, [subtitles]);

  // Handle user click on the waveform to highlight printed lyrics
  const handleWaveformClick = () => {
    const currentTime = waveSurferRef.current.getCurrentTime();
    const clickedSubtitle = subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );

    if (clickedSubtitle && printedLyrics.some(item => item.id === clickedSubtitle.index && item.text === clickedSubtitle.text)) {
      // Highlight the printed lyric by adding to the Set
      setHighlightedLyrics(prev => new Set(prev).add(clickedSubtitle.text));
    }
  };

  useEffect(() => {
    if (waveSurferRef.current) {
      // Register click listener for the waveform
      waveformRef.current.addEventListener('click', handleWaveformClick);
    }
    return () => {
      if (waveformRef.current) {
        waveformRef.current.removeEventListener('click', handleWaveformClick);
      }
    };
  }, [printedLyrics]);

  const handlePlayPause = () => {
    if (waveSurferRef.current) {
      waveSurferRef.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  const backButton = () => {
    navigate('/', { state: { file } });
  };

  return (
    <div className="preview-container">
      <h1>Audio Preview</h1>

      <button onClick={handlePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button onClick={backButton}>
        Back
      </button>

      {file ? (
        <>
          <audio className="audio" controls>
            <source src={audioURL} type={file.type} />
            Your browser does not support the audio element.
          </audio>
          <div className="waveform" ref={waveformRef} style={{ cursor: 'pointer' }} />
          <div
            className="lyrics-box"
            contentEditable={true} // Allow editing for styling
            dangerouslySetInnerHTML={{
              __html: printedLyrics
                .map((lyric) =>
                  highlightedLyrics.has(lyric.text)
                    ? `<span style="color: red;">${lyric.text}</span>`
                    : lyric.text
                )
                .join('<br />'), // Join with line breaks
            }}
          />
        </>
      ) : (
        <p>No audio file selected</p>
      )}
    </div>
  );
};

export default AudioPreview;
