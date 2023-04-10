import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { CommunalStateProvider, useCommunalState } from './communal-state'

function CommunalCount() {
    const [state] = useCommunalState<{ count: number }>(['count'])

    return <p>{state?.count}</p>
}

function App() {
    const [count, setCount] = useState(0)

    return (
        <CommunalStateProvider roomName="test-room" port={1234}>
            <h1>UseCommunalState</h1>
            <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
            <p>
                Edit <code>src/App.tsx</code> and save to test HMR
            </p>
            <CommunalCount />
        </CommunalStateProvider>
    )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
