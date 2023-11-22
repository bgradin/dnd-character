import React from 'react';
import './scss/main.scss';

import CharacterSheet from './components/Character/CharacterSheet';

function App() {
  return (
    <div className="app">
      <div className="unsupported-size">
        Unsupported size. Please view this site on a larger screen.
      </div>
      <div className="container">
        <CharacterSheet />
      </div>
    </div>
  );
}

export default App;
