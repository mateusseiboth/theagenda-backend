import { getFieldTypeByKey, getFieldTypes } from "./initFields";

export function AutoConvert(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const originalMethod = descriptor.value;
    descriptor.value = function (data: any) {
        const keysInModel = getFieldTypes(this);
        if (!data) return originalMethod.call(this, data);

        Object.keys(data).forEach(key => {
            if (key in keysInModel) {
                const type = getFieldTypeByKey(this, key as keyof typeof this);
                let val = data[key];

                if (val === null || val === undefined) {
                    data[key] = null;
                    return;
                }

                switch (type) {
                    case 'number':
                        const n = Number(val);
                        data[key] = isNaN(n) ? null : n;
                        break;

                    case 'bigint':
                        try {
                            data[key] = BigInt(val);
                        } catch {
                            data[key] = null;
                        }
                        break;

                    case 'boolean':
                        data[key] = val === 'false' || val === 0 || val === '0' || val === 'N' ? false : data[key] === 'true' || val === 1 || val === '1' || val === "S" ? true : Boolean(val);
                        break;

                    case 'Date':
                        if (val instanceof Date) {
                            // mantém a data
                        } else {
                            if (val === 0 || val === '0') {
                                data[key] = null;
                                break;
                            }
                            const d = new Date(val);
                            data[key] = isNaN(d.getTime()) ? null : d;
                        }
                        break;

                    case 'string':
                        data[key] = String(val);
                        break;

                    default:
                        // mantém original
                        break;
                }
            }
        });

        return originalMethod.call(this, data);
    };
}