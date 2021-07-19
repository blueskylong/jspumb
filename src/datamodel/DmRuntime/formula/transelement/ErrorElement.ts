import {FormulaElement, TransCenter, TransElement} from "./TransElement";
import {Schema} from "../../Schema";
import {DmConstants} from "../../../DmConstants";

@FormulaElement()
export class ErrorElement implements TransElement {
    getElementType(): number {
        return DmConstants.FormulaElementType.error;
    }

    getExpressionCN(): string {
        return "无法解析元素";
    }

    getName(): string {
        return "无法解析元素";
    }

    getOrder(): number {
        return DmConstants.FormulaElementType.error;
    }

    isMatchCn(str): boolean {
        return true;
    }

    isMatchInner(str): boolean {
        return true;
    }

    transToCn(curElement: string, transcenter?: TransCenter): string {
        throw new Error("[" + curElement + "]无法解析");
    }

    transToInner(curElement: string, schema?: Schema, transcenter?: TransCenter): string {
        throw new Error("[" + curElement + "]无法解析");
    }

    async transToValue(curElement: string,rowTableId, rowData, schema?: Schema, transcenter?: TransCenter): Promise<string> {
        throw new Error("[" + curElement + "]无法解析");
    }

    isOnlyForFilter(): boolean {
        return false;
    }
}
