import 'reflect-metadata';

const NESTED_MODELS = new WeakMap<object, Record<string, any>>();

export function NestedModel(modelClass: Function): PropertyDecorator {
    console.log(`[@QS-BUN] Registering nested model:`, modelClass.name);
    return (target, propertyKey) => {
        let nested = NESTED_MODELS.get(target);
        if (!nested) {
            nested = {};
            NESTED_MODELS.set(target, nested);
        }
        nested[propertyKey as string] = modelClass;
    };
}

export function getNestedModel(target: any, key: string): any | undefined {
    let proto = target;
    while (proto && proto !== Object.prototype) {
        const nested = NESTED_MODELS.get(proto);
        if (nested && nested[key]) return nested[key];
        proto = Object.getPrototypeOf(proto);
    }
    return undefined;
}
