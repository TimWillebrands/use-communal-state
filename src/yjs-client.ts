import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Subscribable } from './subscribable'
import { notifyManager } from './notificationManager'
import { Removable } from './removable'
import { hashPath, Path } from './utilsAndTypes'

export class YjsClient {
    private doc: Y.Doc
    private wsProvider: WebsocketProvider

    constructor(roomName: string, port?: number) {
        const protocol = location.protocol.includes('https') ? 'wss:' : 'ws:'

        const hostName =
            port !== undefined
                ? `${protocol}//${location.hostname}:${port}`
                : `${protocol}//${location.hostname}`

        this.doc = new Y.Doc()
        this.wsProvider = new WebsocketProvider(hostName, roomName, this.doc)
    }
}

export type NotifyEventType =
    | 'added'
    | 'removed'
    | 'updated'
    | 'observerAdded'
    | 'observerRemoved'
    | 'observerResultsUpdated'
    | 'observerOptionsUpdated'

export interface NotifyEvent {
    type: NotifyEventType
}

interface NotifyEventSharedAdded extends NotifyEvent {
    type: 'added'
    sharedType: SharedType<unknown>
}

interface NotifyEventSharedRemoved extends NotifyEvent {
    type: 'removed'
    sharedType: SharedType<unknown>
}

interface NotifyEventSharedUpdated extends NotifyEvent {
    type: 'updated'
    sharedType: SharedType<unknown>
    action: unknown
}

interface NotifyEventSharedObserverAdded extends NotifyEvent {
    type: 'observerAdded'
    sharedType: SharedType<unknown>
    observer: SharedTypeObserver<unknown>
}

interface NotifyEventSharedObserverRemoved extends NotifyEvent {
    type: 'observerRemoved'
    sharedType: SharedType<unknown>
    observer: SharedTypeObserver<unknown>
}

interface NotifyEventSharedObserverResultsUpdated extends NotifyEvent {
    type: 'observerResultsUpdated'
    sharedType: SharedType<unknown>
}

interface NotifyEventSharedObserverOptionsUpdated extends NotifyEvent {
    type: 'observerOptionsUpdated'
    sharedType: SharedType<unknown>
    observer: SharedTypeObserver<unknown>
}

type SharedCacheNotifyEvent =
    | NotifyEventSharedAdded
    | NotifyEventSharedRemoved
    | NotifyEventSharedUpdated
    | NotifyEventSharedObserverAdded
    | NotifyEventSharedObserverRemoved
    | NotifyEventSharedObserverResultsUpdated
    | NotifyEventSharedObserverOptionsUpdated

type SharedTypeCacheListener = (event: SharedCacheNotifyEvent) => void

export interface SharedTypeOptions {
    path: Path
    hash?: string
}

class SharedTypeCache extends Subscribable<SharedTypeCacheListener> {
    private sharedTypes: SharedType<unknown>[]
    private sharedTypeMap: Map<string, SharedType<unknown>>

    constructor() {
        super()
        this.sharedTypes = []
        this.sharedTypeMap = new Map<string, SharedType<unknown>>()
    }

    build<TData>(client: YjsClient, options: SharedTypeOptions) {
        // eslint-disable-next-line
        const sharedTypeKey = options.path!
        const sharedTypeHash = options.hash ?? hashPath(options.path)

        let sharedType = this.get<TData>(sharedTypeHash)

        if (!sharedType) {
            sharedType = new SharedType({
                client,
                cache: this,
                path: sharedTypeKey,
                hash: sharedTypeHash,
            })
            this.add(sharedType as SharedType<unknown>)
        }

        return sharedType
    }

    get<TData>(queryHash: string): SharedType<TData> | undefined {
        // TODO Dangerous cast be here
        return this.sharedTypeMap.get(queryHash) as SharedType<TData> | undefined
    }

    add(sharedType: SharedType<unknown>) {
        if (!this.sharedTypeMap.has(sharedType.hash)) {
            this.sharedTypeMap.set(sharedType.hash, sharedType)
            this.sharedTypes.push(sharedType)
            this.notify({
                type: 'added',
                sharedType,
            })
        }
    }

    remove(sharedType: SharedType<unknown>): void {
        const sharedTypeInMap = this.sharedTypeMap.get(sharedType.hash)

        if (sharedTypeInMap) {
            sharedType.destroy()

            this.sharedTypes = this.sharedTypes.filter((x) => x !== sharedType)

            if (sharedTypeInMap === sharedType) {
                this.sharedTypeMap.delete(sharedType.hash)
            }

            this.notify({ type: 'removed', sharedType })
        }
    }

    notify(event: SharedCacheNotifyEvent) {
        notifyManager.batch(() => {
            this.listeners.forEach((listener) => {
                listener(event)
            })
        })
    }
}

type SharedTypeObserverListener<TData> = (result: { data: TData }) => void

class SharedTypeObserver<TData = unknown> extends Subscribable<SharedTypeObserverListener<TData>> {
    private readonly client: YjsClient //eslint-disable-line

    private sharedType!: SharedType<TData>
    private options: SharedTypeOptions //eslint-disable-line

    constructor(client: YjsClient, options: SharedTypeOptions) {
        super()

        this.client = client
        this.options = options

        this.setOptions(options)
    }

    protected onSubscribe(): void {
        if (this.listeners.length === 1) {
            this.sharedType.addObserver(this as SharedTypeObserver<unknown>)

            // if (shouldFetchOnMount(this.sharedType, this.options)) {
            //   this.executeFetch()
            // }

            // this.updateTimers()
        }
    }

    protected onUnsubscribe(): void {
        if (!this.listeners.length) {
            // this.destroy()
        }
    }

    setOptions(options: SharedTypeOptions) {
        this.options = options
    }
}

export interface SharedTypeState<TData = unknown /*, TError = unknown*/> {
    data: TData | undefined
    dataUpdateCount: number
    dataUpdatedAt: number
    // error: TError | null
    // errorUpdateCount: number
    // errorUpdatedAt: number
    // isInvalidated: boolean
    // status: QueryStatus
    // fetchStatus: FetchStatus
}

interface SharedTypeConfig<TData> {
    client: YjsClient
    path: Path
    cache: SharedTypeCache
    initialData?: TData
    hash?: string
}

class SharedType<TData = unknown> extends Removable {
    public readonly path: Path
    public readonly hash: string

    private observers: SharedTypeObserver<TData>[]
    private readonly cache: SharedTypeCache
    private readonly state: SharedTypeState<TData> //eslint-disable-line
    private readonly client: YjsClient //eslint-disable-line

    constructor(config: SharedTypeConfig<TData>) {
        super()

        this.path = config.path
        this.hash = config.hash ?? hashPath(config.path)
        this.observers = []
        this.cache = config.cache
        this.client = config.client
        this.state = {
            data: config.initialData,
            dataUpdateCount: 0,
            dataUpdatedAt: -1,
        }
    }

    addObserver(observer1: SharedTypeObserver<unknown>): void {
        const observer = observer1 as SharedTypeObserver<TData>
        if (this.observers.indexOf(observer) === -1) {
            this.observers.push(observer)

            // Stop the query from being garbage collected
            this.clearGcTimeout()

            this.cache.notify({
                type: 'observerAdded',
                sharedType: this as SharedType<unknown>,
                observer: observer1,
            })
        }
    }

    removeObserver(observer1: SharedTypeObserver<unknown>): void {
        const observer = observer1 as SharedTypeObserver<TData>
        if (this.observers.indexOf(observer) !== -1) {
            this.observers = this.observers.filter((x) => x !== observer)

            if (!this.observers.length) {
                this.scheduleGc()
            }

            this.cache.notify({
                type: 'observerRemoved',
                sharedType: this as SharedType<unknown>,
                observer: observer1,
            })
        }
    }

    protected optionalRemove() {
        if (!this.observers.length) {
            this.cache.remove(this as SharedType<unknown>)
        }
    }
}
