import React , {useState} from "react";
import { useNavigate } from 'react-router-dom';
import './UploadFile.css'

function UploadFile () {

    const [file, setFile] = useState(null);
    const navigate = useNavigate();
  
    const handleFileChange = (event) => {
      const selectedFile = event.target.files[0];
      if (selectedFile && selectedFile.type.startsWith('audio')) {
        setFile(selectedFile);
      }
    };
  
    const handleDrop = (event) => {
      event.preventDefault();
      const selectedFile = event.dataTransfer.files[0];
      if (selectedFile && selectedFile.type.startsWith('audio')) {
        setFile(selectedFile);
      }
    };
  
    const handleDragOver = (event) => {
      event.preventDefault();
    };
  
    const handleRemove = () => {
      setFile(null);
    };
  
    const handlePreview = () => {
      navigate('/preview', { state: { file } });
    };
  
    return (
      <div className="dropbox-container">
        <h1>Upload File | |  New Prop</h1>
        <h1>Nayan</h1>
        <div
          className="dropbox"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("fileInput").click()}
        >
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <p>Drag & drop a file here or click to choose one</p>
        </div>
        {file && (
          <div className="file-info">
            <p><strong>File Name:</strong> {file.name}</p>
            <p><strong>File Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
            <p><strong>File Type:</strong> {file.type || 'Unknown'}</p>
            {file.type.startsWith('audio') && (
              <>
                <button onClick={handlePreview} className="preview-button">Preview Audio</button>
                <button onClick={handleRemove} className="remove-button">Remove File</button>
              </>
            )}
          </div>
        )}
        <div></div>
      </div>
    );

}

export default UploadFile;