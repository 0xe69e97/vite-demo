import React from 'react'
import logo from './logo.svg'
// console.log(logo, 'logo')
import './App.css'

export default class App extends React.Component {
  constructor() {
    super()
    this.state = {
      count: 0
    }
  }

  addCount() {
    this.setState(({ count }) => {
      return {
        count: count + 1
      }
    })
  }

  render() {
    return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Vite + React!</p>
        <p>
          <button type="button" onClick={() => this.addCount()}>
            count is: {this.state.count}
          </button>
        </p>
        <p>
          Edit <code>App.jsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
    )
  }
}
