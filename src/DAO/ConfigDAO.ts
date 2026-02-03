import { convertBigIntValues, DAOFor, filterObjectByModel } from "@qualitysistemas/bun-commons";
import { ConfigModel } from "../model/ConfigModel";
import { BaseDAO } from "./base";

@DAOFor(ConfigModel.tag)
export class ConfigDAO extends BaseDAO {
    async create(data: ConfigModel): Promise<ConfigModel> {
        const filteredData = filterObjectByModel(data, ConfigModel);

        const newConfig = await this.tx.config.create({
            data: filteredData
        });
        return convertBigIntValues(newConfig) as ConfigModel;
    }

    async get(): Promise<ConfigModel | null> {
        const config = await this.tx.config.findFirst();
        return convertBigIntValues(config) as ConfigModel;
    }

    async getById(id: string): Promise<ConfigModel | null> {
        const config = await this.tx.config.findUnique({
            where: { id }
        });
        return convertBigIntValues(config) as unknown as ConfigModel;
    }

    async update(data: Partial<ConfigModel>, id: string): Promise<ConfigModel> {
        const updateData: any = { ...filterObjectByModel(data, ConfigModel) };

        const updatedConfig = await this.tx.config.update({
            where: { id },
            data: updateData
        });
        return convertBigIntValues(updatedConfig) as ConfigModel;
    }

    async upsert(data: ConfigModel): Promise<ConfigModel> {
        const existing = await this.tx.config.findFirst();

        if (existing) {
            return this.update(data, existing.id);
        }

        return this.create(data);
    }
}
