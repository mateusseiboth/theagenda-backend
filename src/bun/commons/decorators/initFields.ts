import 'reflect-metadata';

const CLASS_FIELDS = new WeakMap<object, Record<string, string>>();

export function Field(): PropertyDecorator {
    return (target, propertyKey) => {
        let fields = CLASS_FIELDS.get(target);
        if (!fields) {
            fields = {};
            CLASS_FIELDS.set(target, fields);
        }
        const type = Reflect.getMetadata('design:type', target, propertyKey);
        fields[propertyKey as string] = type?.name.toLowerCase() || 'any';
    };
}

export function InitFields<T extends { new(...args: any[]): {} }>(constructor: T) {
    const proto = constructor.prototype;
    console.log("[@QS-BUN] Initializing fields for", constructor.name);
    if (!CLASS_FIELDS.has(proto)) CLASS_FIELDS.set(proto, {});
}

export function getFieldTypes(target: any): Record<string, string> {
    const result: Record<string, string> = {};
    let proto = target; // aqui target é prototype da classe

    while (proto && proto !== Object.prototype) {
        const fields = CLASS_FIELDS.get(proto);
        if (fields) Object.assign(result, fields);
        proto = Object.getPrototypeOf(proto);
    }

    return result;
}

export function getFieldTypeByKey(instance: any, key: string): string | undefined {
    let proto = Object.getPrototypeOf(instance);
    while (proto && proto !== Object.prototype) {
        const fields = CLASS_FIELDS.get(proto);
        if (fields && key in fields) return fields[key];
        proto = Object.getPrototypeOf(proto);
    }
    return undefined;
}