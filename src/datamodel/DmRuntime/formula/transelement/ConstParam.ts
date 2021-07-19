import {FormulaElement, TransCenter, TransElement} from "./TransElement";
import {Schema} from "../../Schema";
import {DmConstants} from "../../../DmConstants";
import {CommonUtils} from "../../../../common/CommonUtils";

@FormulaElement()
export class ConstParam implements TransElement {
    getElementType(): number {
        return DmConstants.FormulaElementType.constant;
    }

    getName(): string {
        return "常量";
    }

    getExpressionCN() {
        return this.getName();
    }

    getOrder(): number {
        return this.getElementType();
    }

    //所有的其它不匹配的,都算做常量
    isMatchCn(str): boolean {
        let s = str.trim();
        return (s.startsWith("'") && s.endsWith("'")) ||
            (s.startsWith('"') && s.endsWith('"')) || CommonUtils.isNumber(s);
    }

    isMatchInner(str): boolean {
        let s = str.trim();
        return (s.startsWith("'") && s.endsWith("'")) ||
            (s.startsWith('"') && s.endsWith('"')) || CommonUtils.isNumber(s);
    }

    transToCn(curElement: string, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        return curElement;
    }

    transToInner(curElement: string, schema: Schema, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        curElement = curElement.trim();
        if ((curElement.startsWith("'") && curElement.endsWith("'"))
            || (curElement.startsWith('"') && curElement.endsWith('"')))
            return curElement;
        if (CommonUtils.isNumber(curElement)) {
            return curElement;
        }
        return "'" + curElement + "'"
    }

    async transToValue(curElement: string, rowTableId, rowData, schema?: Schema, transcenter?: TransCenter, mapGroup?): Promise<string> {
        let promise = new Promise<string>((resolve => {
            return this.transToInner(curElement, schema, transcenter);
        }));
        return promise;
    }

    isOnlyForFilter(): boolean {
        return false;
    }
}
