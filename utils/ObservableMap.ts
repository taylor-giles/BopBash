export type MapChangeCallback<K, V> = (key: K, value: V) => void

/**
 * A wrapper for Map which calls predefined custom callbacks whenever an element is set or deleted.
 */
export default class ObservableMap<K, V> extends Map<K, V>{
    private onSet?: MapChangeCallback<K, V>;
    private onDelete?: MapChangeCallback<K, V>;

    public constructor(onSet?: MapChangeCallback<K, V>, onDelete?: MapChangeCallback<K, V>){
        super();
        this.onSet = onSet;
        this.onDelete = onDelete;
    }

    set(key: K, value: V): this {
        super.set(key, value);
        this.onSet?.(key, value);
        return this;
    }

    delete(key: K): boolean {
        const value = this.get(key);
        const result = super.delete(key);
        if(result && value){
            this.onDelete?.(key, value);
        }
        return result;
    }
}