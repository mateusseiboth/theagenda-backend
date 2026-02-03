import { convertBigIntValues, DAOFor, executePrismaQuery, filterObjectByModel, IResponsePaginate } from "@qualitysistemas/bun-commons";
import { UserModel } from "../model/UserModel";
import { BaseDAO } from "./base";

@DAOFor(UserModel.tag)
export class UserDAO extends BaseDAO {
    async create(data: UserModel): Promise<UserModel> {
        const filteredData = filterObjectByModel(data, UserModel);

        const newUser = await this.tx.user.create({
            data: filteredData as any
        });
        return convertBigIntValues(newUser) as UserModel;
    }

    async get(options: any): Promise<IResponsePaginate<UserModel>> {
        return await executePrismaQuery<UserModel>(this.tx.user, options);
    }

    async getById(id: string): Promise<UserModel | null> {
        const user = await this.tx.user.findUniqueOrThrow({
            where: { id }
        });
        return convertBigIntValues(user) as unknown as UserModel;
    }

    async getByPhone(phone: string): Promise<UserModel | null> {
        const user = await this.tx.user.findUnique({
            where: { phone }
        });
        return convertBigIntValues(user) as unknown as UserModel;
    }

    async update(data: Partial<UserModel>, id: string): Promise<UserModel> {
        const updateData: any = { ...filterObjectByModel(data, UserModel) };

        const updatedUser = await this.tx.user.update({
            where: { id },
            data: updateData
        });
        return convertBigIntValues(updatedUser) as UserModel;
    }

    async deleteById({ id, userID }: { id: string, userID: string }): Promise<void> {
        const user = await this.tx.user.findUnique({
            where: { id }
        });
        if (!user) return;

        await this.tx.user.update({
            where: { id },
            data: {
                enabled: false,
                active: false,
                modifiedBy: userID
            }
        });
    }

    async upsert(data: UserModel): Promise<UserModel> {
        const filteredData = filterObjectByModel(data, UserModel) as UserModel;
        const upsertData: any = { ...filteredData };

        const upsertedUser = await this.tx.user.upsert({
            where: { id: upsertData.id },
            create: upsertData,
            update: upsertData
        });
        return convertBigIntValues(upsertedUser) as UserModel;
    }
}
