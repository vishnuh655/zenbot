import React from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
// import icon from '../../assets/icon.svg';
import './App.global.css';
// import opts from '../../../extensions/exchanges/5roi/test';

const Main = () => {
  return (
    <div className="absolute inset-0 bg-white text-center h-full flex flex-col justify justify-center">
      ZENBOT ❤
    </div>
  );
};

export default function App() {
  console.log('opts');
  return (
    <Router>
      <Switch>
        <Route path="/" component={Main} />
      </Switch>
    </Router>
  );
}
