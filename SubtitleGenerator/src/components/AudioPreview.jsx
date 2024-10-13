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
  const [highlightedLyrics, setHighlightedLyrics] = useState([]); // Use array for highlights
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
          text: text.join(' '), // Join subtitles into one line
        };
      });
  };

  useEffect(() => {
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

        if (subtitle) {
          
          if (subtitle.index === subtitles.length) {
            setPrintedLyrics([]); 
          } else if (subtitle.index !== previousSubtitleIndex) {
            previousSubtitleIndex = subtitle.index;

            // Print all subtitles from index 1 to current index
            setPrintedLyrics(subtitles.slice(0, subtitle.index));
          }
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

    if (clickedSubtitle) {
      // Reset printed lyrics and only show clicked index
      setPrintedLyrics([clickedSubtitle]);
      // Highlight the printed lyric by adding to the array
      setHighlightedLyrics((prevHighlight) =>
        prevHighlight.includes(clickedSubtitle.index)
          ? prevHighlight // Don't add duplicate highlights
          : [...prevHighlight, clickedSubtitle.index] // Add the new highlight
      );
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
          <div className='lyrics-box'>
            {printedLyrics.map((lyrics, index) => (
              <span key={index}>
                {highlightedLyrics.includes(lyrics.id) ? (
                  <span style={{ color: 'red' }}>{lyrics.text}</span>
                ) : (
                  lyrics.text
                )}
                <br />
              </span>
            ))}
          </div>
        </>
      ) : (
        <p>No audio file selected</p>
      )}
    </div>
  );
};

export default AudioPreview;
