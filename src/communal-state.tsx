import { useState, ReactNode, useContext, useMemo, useSyncExternalStore, useCallback } from 'react'
import { createContext } from 'react'
import { notifyManager } from './notificationManager'
import { Path } from './utilsAndTypes'
import { YjsClient, SharedTypeObserver } from './yjs-client'

const Context = createContext<YjsClient | undefined>(undefined)

type CommunalStateProviderProps = {
    roomName: string
    port?: number
    children?: ReactNode
}

export function CommunalStateProvider({ children, roomName, port }: CommunalStateProviderProps) {
    const yjsClient = useMemo(() => new YjsClient(roomName, port), [roomName, port])

    return <Context.Provider value={yjsClient}>{children}</Context.Provider>
}

export function useCommunalState<S>(path: Path) {
    const client = useContext(Context)

    if (client === undefined) throw 'No communalstateprovider found!'

    const [observer] = useState(() => new SharedTypeObserver<S>(client, { path: path }))

    const result = useSyncExternalStore(
        useCallback(
            (onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)),
            [observer],
        ),
        () => observer.getCurrentResult(),
        () => observer.getCurrentResult(),
    )

    return [result, () => console.log('hi')] as const
}
