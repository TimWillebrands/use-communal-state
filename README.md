# use-communal-state


An exploration trying to merge the react-query syntax with a networking layer based on yjs. Synchronising state across multiple clients without a specialised backend. 

Allowing a style/syntax like this:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { CommunalStateProvider, useCommunalState } from './communal-state'

function CountButton() {
    const [state, setState] = useCommunalState<{ count: number }>(['count'])
    return (
        <button onClick={() => setState((s) => ({ count: (s?.count ?? 0) + 1 }))}>
            count is {state?.count}
        </button>
    )
}

function App() {
    return (
        <CommunalStateProvider roomName="test-room" port={1234}>
            <h1>UseCommunalState</h1>
            <CountButton />
            <CountButton />
            <CountButton />
            <p>
                Edit <code>src/App.tsx</code> and save to test HMR
            </p>
        </CommunalStateProvider>
    )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
```
