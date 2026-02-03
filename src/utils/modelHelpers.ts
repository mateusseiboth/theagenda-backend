/**
 * Converte valores BigInt para string para evitar erros de serialização JSON
 */
export function convertBigIntValues(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(convertBigIntValues);
    }

    if (typeof obj === 'object') {
        const converted: any = {};
        for (const key in obj) {
            converted[key] = convertBigIntValues(obj[key]);
        }
        return converted;
    }

    return obj;
}
