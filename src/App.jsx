import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StudySession from './pages/StudySession';
import { DeckProvider } from './contexts/DeckContext';

function App() {
  return (
    <DeckProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/study/:deckId" element={<StudySession />} />
      </Routes>
    </DeckProvider>
  );
}

export default App;
