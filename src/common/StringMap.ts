export class StringMap<V> {
    private obj = {};

    constructor(obj?: any) {
        this.obj = {};
        if (obj) {
            for (let attr in obj) {
                this.obj[attr] = obj[attr];
            }
        }
    }


    clear(): void {
        this.obj = {};
    }

    delete(key: string): boolean {
        let result = this.obj.hasOwnProperty(key);
        delete this.obj[key];
        return result;
    }


    forEach(callbackfn: (key: string, value: V, map: StringMap<V>) => any, thisArg?: any): void {
        for (let key in this.obj) {
            if (callbackfn(key, this.obj[key], this) === false) {
                break;
            }
        }
    }

    get(key: string): V | undefined {
        return this.obj[key as any] as any;
    }

    getObject() {
        return this.obj;
    }

    has(key: string): boolean {
        return this.obj.hasOwnProperty(key);
    }

    getValues(): Array<V> {
        let result = new Array<V>();
        for (let key in this.obj) {
            result.push(this.obj[key])
        }
        return result;
    }

    getValueAsObject() {
        return this.obj;
    }

    set(key: string, value: V): StringMap<V> {
        this.obj[key] = value;
        return this;
    }

    getSize() {
        let i = 0;
        for (let key in this.obj) {
            i++;
        }
        return i;
    }

    isEqual(map: StringMap<any>) {
        if (!map) {
            return false;
        }
        if (map.getSize() != this.getSize()) {
            return false;
        }
        let result = true;
        map.forEach((key, value, map) => {
            if (!this.has(key) || this.get(key) != value) {
                result = false;
                return false;
            }
        })
        return result;
    }
}
