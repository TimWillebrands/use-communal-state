import { Dispatch, SetStateAction, useState } from 'react'

export function useCommunalState<S>(
    resourcePath: string,
    initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>] {
    const state = useState(initialState)

    console.log('much wow', resourcePath)

    return state
}
