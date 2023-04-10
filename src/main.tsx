import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <h1>UseCommunalState</h1>
            <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
            <p>
                Edit <code>src/App.tsx</code> and save to test HMR
            </p>
        </>
    )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
