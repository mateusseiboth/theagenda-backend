import { DeleteError } from "../errors/deleteError";
import type { BaseModel } from "../model/base";
import { Prisma } from "../prisma/generated/client";


export class BaseDAO {
    protected tx!: Prisma.TransactionClient;
    public modifiedBy!: string;

    init(tx: Prisma.TransactionClient) {
        this.tx = tx;
    }

    async getById(id: string): Promise<any> {
        throw new Error("Method getById not implemented");
    }

    async beforeDelete(id: string, model: typeof BaseModel): Promise<void> {
        try {
            const includes = model.included;
            if (includes && includes.tables) {
                const includeKeys = Object.keys(includes.tables);
                if (includeKeys.length > 0) {
                    await Promise.all(includeKeys.map(async (key) => {
                        const include = includes.tables[key];
                        let count = 0;

                        if (include.type === 'table') {
                            if (!key || !include.field) return;
                            count = await this.tx[key].count({
                                where: {
                                    [include.field]: id,
                                    enabled: true,
                                }
                            });
                        }

                        if (include.type === 'jsonb') {
                            const records: Record<string, any>[] = await this.tx.$queryRawUnsafe(
                                `
                                SELECT * FROM "${key}"
                                WHERE (
                                    jsonb_typeof("${include.field}") = 'array'
                                    AND EXISTS (
                                        SELECT 1
                                        FROM jsonb_array_elements("${include.field}") elem
                                        WHERE elem->>'${include.fieldOnJson}' = $1
                                    )
                                )
                                OR (
                                    jsonb_typeof("${include.field}") = 'object'
                                    AND "${include.field}"->>'${include.fieldOnJson}' = $1
                                )
                                `,
                                id
                            );
                            count = records.length;
                        }

                        if (count > 0) {
                            throw new DeleteError(`Registro não pode ser excluído pois existem ${count} registros relacionados`);
                        }
                    }));
                }
            }
        } catch (error) {
            console.error("Error checking relations:", error);
            throw error;
        }
    }
}
