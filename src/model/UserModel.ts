import { Field, InitFields, ModelTagged, WithValidation } from "@qualitysistemas/bun-commons";
import { BaseModel, IIncluded } from "./base";

@InitFields
@WithValidation
@ModelTagged
export class UserModel extends BaseModel {
    static tag = 1;
    static nome = "Usuários";
    static included: IIncluded = {
        tables: {
            appointments: {
                type: "table",
                field: "userId"
            }
        }
    }

    @Field() id!: string;
    @Field() phone!: string;
    @Field() name?: string;
    @Field() password?: string;
    @Field() role!: string;

    constructor(data: UserModel) {
        super();
        this.setData(data || {});
    }

    static getModel() {
        return new UserModel({} as UserModel);
    }
}
