
import { Field, InitFields, ModelTagged, WithValidation } from "@qualitysistemas/bun-commons";
import { BaseModel } from "./base";

@InitFields
@WithValidation
@ModelTagged
export class WhatsAppLogModel extends BaseModel {
    static tag = 14;

    @Field() id!: string;
    @Field() phone!: string;
    @Field() message!: string;
    @Field() messageType!: "APPOINTMENT_CONFIRMATION" | "REMINDER" | "TEST" | "CUSTOM";
    @Field() status!: "PENDING" | "SENT" | "FAILED" | "DELIVERED" | "READ";
    @Field() appointmentId?: string;
    @Field() error?: string;
    @Field() sentAt?: Date;
    @Field() deliveredAt?: Date;
    @Field() readAt?: Date;


    constructor(data?: Partial<WhatsAppLogModel>) {
        super();
        if (data) {
            Object.assign(this, data);
        }
    }

    static getModel() {
        return new WhatsAppLogModel();
    }
}
