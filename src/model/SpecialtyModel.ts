import { Field, InitFields, ModelTagged, WithValidation } from "@qualitysistemas/bun-commons";
import { BaseModel, IIncluded } from "./base";

@InitFields
@WithValidation
@ModelTagged
export class SpecialtyModel extends BaseModel {
    static tag = 2;
    static nome = "Especialidades";
    static included: IIncluded = {
        tables: {
            appointments: {
                type: "table",
                field: "specialtyId"
            }
        }
    }

    @Field() id!: string;
    @Field() name!: string;
    @Field() description?: string;
    @Field() avgDuration!: number;
    @Field() price?: number;
    @Field() maxSimultaneous!: number;

    constructor(data: SpecialtyModel) {
        super();
        this.setData(data || {});
    }

    static getModel() {
        return new SpecialtyModel({} as SpecialtyModel);
    }
}
