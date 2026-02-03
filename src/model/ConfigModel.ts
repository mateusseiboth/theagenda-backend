import { Field, InitFields, ModelTagged, WithValidation } from "@qualitysistemas/bun-commons";

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

@InitFields
@WithValidation
@ModelTagged
export class ConfigModel {
    static tag = 4;
    static nome = "Configurações";
    static included: IIncluded = {
        tables: {}
    }

    @Field() id!: string;
    @Field() workStartHour!: number;
    @Field() workEndHour!: number;
    @Field() workDays!: number[];
    @Field() slotDuration!: number;
    @Field() maxAdvanceDays!: number;
    @Field() allowCancellation!: boolean;
    @Field() cancellationHours!: number;
    @Field() createdAt!: Date;
    @Field() updatedAt!: Date;
    @Field() modifiedBy?: string;

    constructor(data: ConfigModel) {
        if (data) {
            Object.assign(this, data);
        }
    }

    setData(data: Partial<ConfigModel>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    static getModel() {
        return new ConfigModel({} as ConfigModel);
    }
}
