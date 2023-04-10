export type Path = readonly string[]

/**
 * Default query keys hash function.
 * Hashes the value into a stable hash.
 */
export function hashPath(path: Path): string {
    return path.join('/')
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
//eslint-disable-next-line
export function isPlainObject(o: any): o is Object {
    if (!hasObjectPrototype(o)) {
        return false
    }

    // If has modified constructor
    const ctor = o.constructor
    if (typeof ctor === 'undefined') {
        return true
    }

    // If has modified prototype
    const prot = ctor.prototype
    if (!hasObjectPrototype(prot)) {
        return false
    }

    // If constructor does not have an Object-specific method
    //eslint-disable-next-line
    if (!prot.hasOwnProperty('isPrototypeOf')) {
        return false
    }

    // Most likely a plain Object
    return true
}

//eslint-disable-next-line
function hasObjectPrototype(o: any): boolean {
    return Object.prototype.toString.call(o) === '[object Object]'
}
