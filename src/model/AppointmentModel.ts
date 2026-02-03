import { Field, InitFields, ModelTagged, WithValidation } from "@qualitysistemas/bun-commons";
import { BaseModel, IIncluded } from "./base";

@InitFields
@WithValidation
@ModelTagged
export class AppointmentModel extends BaseModel {
    static tag = 3;
    static nome = "Agendamentos";
    static included: IIncluded = {
        tables: {}
    }

    @Field() id!: string;
    @Field() userId!: string;
    @Field() specialtyId!: string;
    @Field() startTime!: Date;
    @Field() endTime!: Date;
    @Field() status!: string;
    @Field() notes?: string;
    @Field() adminNotes?: string;
    @Field() confirmedAt?: Date;
    @Field() canceledAt?: Date;

    constructor(data: AppointmentModel) {
        super();
        this.setData(data || {});
    }

    static getModel() {
        return new AppointmentModel({} as AppointmentModel);
    }
}
