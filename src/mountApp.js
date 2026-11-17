import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { listSheets } from './data';

export async function prepare(user) {
  return user ? listSheets(user) : [];
}

export function mount(user, sheets) {
  ReactDOM.render(<App initialSession={user} initialSheets={sheets} />, document.getElementById('root'));
}
