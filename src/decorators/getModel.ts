import 'reflect-metadata';

const MODEL_TAG_KEY = Symbol('model:tag');

export function ModelTagged(constructor: Function) {
    const tag = (constructor as any).tag;
    if (tag !== undefined) {
        Reflect.defineMetadata(MODEL_TAG_KEY, tag, constructor);
    }
}

export function DAOFor(modelTag: number) {
    return function (constructor: Function) {
        Reflect.defineMetadata('dao:modelTag', modelTag, constructor);
    };
}

export function getModel(tag: number): any {
    // Esta função seria implementada para buscar o model pelo tag
    // Por enquanto retorna undefined
    return undefined;
}
