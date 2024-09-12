
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UploadFile from './components/UploadFile';
import AudioPreview from './components/AudioPreview';

function App() {
  

  return (
    <>
        <Router>
      <Routes>
        <Route path="/" element={<UploadFile />} />
        <Route path="/preview" element={<AudioPreview />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
