import { logDecorator } from "@qualitysistemas/bun-commons";

export { logDecorator };

export class BaseController {
    protected getNewDate(): Date {
        return new Date();
    }
}
