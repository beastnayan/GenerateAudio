import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import WaveSurfer from 'wavesurfer.js';
import './AudioPreview.css';
import { useNavigate } from 'react-router-dom';


const AudioPreview = () => {
  const location = useLocation();
  const { file } = location.state || {};

  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const navigate = useNavigate();


  // Function to parse SRT file content
  const parseSRT = (srtText) => {
    return srtText
      .trim() // Remove white spaces
      .split('\n\n') // Split by double newline to get each block
      .map((block) => {
        const [index, time, ...text] = block.split('\n');
        const [startTime, endTime] = time
          .split(' --> ') // Split the time string into start and end times
          .map((t) => {
            const [hours, minutes, seconds] = t.trim().split(':');
            return (
              parseFloat(hours) * 3600 +
              parseFloat(minutes) * 60 +
              parseFloat(seconds.replace(',', '.'))
            );
          });
        return {
          startTime,
          endTime,
          text: text.join('\n'), // Join the text lines back together
        };
      });
  };

  useEffect(() => {
    let isMounted = true;
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioURL(url);
  
      // Fetch and parse the SRT file
      fetch('/subtitle.srt')
        .then(response => response.text())
        .then(text => {
          if (isMounted) {
            const parsedSubtitles = parseSRT(text);
            setSubtitles(parsedSubtitles);
         
          }
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
        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
          }
          URL.revokeObjectURL(url);
          isMounted = false;
      };
    }
  }, [file]);


  
// This useEffect handles audio processing when subtitles are available
useEffect(() => {
  if (subtitles.length > 0 && waveSurferRef.current) {
    const handleAudioProcess = () => {
      const currentTime = waveSurferRef.current.getCurrentTime();
      const subtitle = subtitles.find(
        (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
      );

      if (subtitle && subtitle.text !== currentSubtitle) {
        setCurrentSubtitle(subtitle.text);
        
      }
    };
    

    // Register audioprocess event listener
    waveSurferRef.current.on('audioprocess', handleAudioProcess);

    // Clean up the listener when the component unmounts or subtitles change
    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.un('audioprocess', handleAudioProcess);
      }
    };
  }
}, [subtitles, currentSubtitle]);


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
          <div className="waveform" ref={waveformRef} />
          <div className="lyrics-container">
            <textarea
              className="lyrics-box"
              placeholder="Lyrics will appear here..."
              readOnly
              value={currentSubtitle}
            />
          </div>
        </>
      ) : (
        <p>No audio file selected</p>
      )}
    </div>
  );
};



export default  AudioPreview;
    