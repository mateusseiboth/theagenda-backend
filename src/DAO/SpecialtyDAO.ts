import { convertBigIntValues, DAOFor, executePrismaQuery, filterObjectByModel, IResponsePaginate } from "@qualitysistemas/bun-commons";
import { SpecialtyModel } from "../model/SpecialtyModel";
import { BaseDAO } from "./base";

@DAOFor(SpecialtyModel.tag)
export class SpecialtyDAO extends BaseDAO {
    async create(data: SpecialtyModel): Promise<SpecialtyModel> {
        const filteredData = filterObjectByModel(data, SpecialtyModel);

        const newSpecialty = await this.tx.specialty.create({
            data: filteredData as any
        });
        return convertBigIntValues(newSpecialty) as unknown as SpecialtyModel;
    }

    async get(options: any): Promise<IResponsePaginate<SpecialtyModel>> {
        return await executePrismaQuery<SpecialtyModel>(this.tx.specialty, options);
    }

    async getById(id: string): Promise<SpecialtyModel | null> {
        const specialty = await this.tx.specialty.findUniqueOrThrow({
            where: { id }
        });
        return convertBigIntValues(specialty) as unknown as SpecialtyModel;
    }

    async getPublicSpecialties(): Promise<SpecialtyModel[]> {
        const specialties = await this.tx.specialty.findMany({
            where: {
                enabled: true,
                active: true
            },
            orderBy: { name: 'asc' }
        });
        return convertBigIntValues(specialties) as SpecialtyModel[];
    }

    async update(data: Partial<SpecialtyModel>, id: string): Promise<SpecialtyModel> {
        const updateData: any = { ...filterObjectByModel(data, SpecialtyModel) };

        const updatedSpecialty = await this.tx.specialty.update({
            where: { id },
            data: updateData
        });
        return convertBigIntValues(updatedSpecialty) as SpecialtyModel;
    }

    async deleteById({ id, userID }: { id: string, userID: string }): Promise<void> {
        const specialty = await this.tx.specialty.findUnique({
            where: { id }
        });
        if (!specialty) return;

        await this.tx.specialty.update({
            where: { id },
            data: {
                enabled: false,
                active: false,
                modifiedBy: userID
            }
        });
    }

    async upsert(data: SpecialtyModel): Promise<SpecialtyModel> {
        const filteredData = filterObjectByModel(data, SpecialtyModel) as SpecialtyModel;
        const upsertData: any = { ...filteredData };

        const upsertedSpecialty = await this.tx.specialty.upsert({
            where: { id: upsertData.id },
            create: upsertData,
            update: upsertData
        });
        return convertBigIntValues(upsertedSpecialty) as SpecialtyModel;
    }
}
