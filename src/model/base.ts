import { Field, getFieldTypes, getModel, InitFields } from "@qualitysistemas/bun-commons";
import 'reflect-metadata';

export interface IIncluded {
    tables: {
        [key: string]:
        | {
            type: "table"
            field: string
        }
        | {
            type: "jsonb"
            field: string
            fieldOnJson: string
        }
    }
}

export interface IBaseModelData {
    createdAt?: Date;
    updatedAt?: Date;
    enabled?: boolean;
    active?: boolean;
    modifiedBy?: string;
    [key: string]: any;
}


@InitFields
export class BaseModel {
    static tag: number;
    static included: IIncluded
    @Field() createdAt: Date;
    @Field() updatedAt: Date;
    @Field() enabled: boolean;
    @Field() active: boolean;
    @Field() modifiedBy?: string;

    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.enabled = true;
        this.active = true;
    }

    setData(data: IBaseModelData) {
        if (data) {
            const classTag = (this.constructor as typeof BaseModel).tag;
            const modelBase = getModel(classTag);
            let orderBy = [] as any;

            const typedKeys = getFieldTypes(modelBase.prototype);
            const keys = Object.keys(typedKeys);
            for (const key of keys) {
                if (key in data) {
                    (this as any)[key] = data[key] ?? null;
                }
            }
            if (data.active) {
                this.active = data.active;
            }
            if (data.enabled) {
                this.enabled = data.enabled;
            }
            // //@ts-expect-error not a error, just a type assertion
            // delete this.sequencial;

        }
    }
}
