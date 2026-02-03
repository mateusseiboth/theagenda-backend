import 'reflect-metadata';
import type { ZodSchema } from 'zod';

const VALIDATION_META_KEY = Symbol('validation:schema');

export function Validate(schema: ZodSchema) {
    return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
        Reflect.defineMetadata(VALIDATION_META_KEY, schema, target, `param_${parameterIndex}`);
    };
}

export function WithValidation<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        constructor(...args: any[]) {
            const paramSchemas = Object.keys(Reflect.getMetadataKeys(constructor.prototype) || [])
                .map((key) => {
                    if (key.startsWith('param_')) {
                        const index = Number(key.replace('param_', ''));
                        return { index, schema: Reflect.getMetadata(VALIDATION_META_KEY, constructor.prototype, key) };
                    }
                    return null;
                })
                .filter(Boolean) as { index: number; schema: ZodSchema }[];

            // Valida cada parâmetro decorado
            for (const { index, schema } of paramSchemas) {
                schema.parse(args[index]);
            }

            super(...args);
        }
    };
}
