import { Dispatch, SetStateAction, useState, ReactNode, useContext } from 'react'
import { createContext } from 'react'
import { YjsClient } from './yjs-client'

const Context = createContext<Readonly<YjsClient> | undefined>(undefined)

type CommunalStateProviderProps = {
    children?: ReactNode
}

const yjsClient = Object.freeze(new YjsClient('test-room'))

export function CommunalStateProvider({ children }: CommunalStateProviderProps) {
    return <Context.Provider value={yjsClient}>{children}</Context.Provider>
}

export function useCommunalState<S>(
    resourcePath: string,
    initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>] {
    const client = useContext(Context)

    if (client === undefined) throw 'No communalstateprovider found!'
    const state = useState(initialState)

    console.log('much wow', resourcePath)

    return state
}
