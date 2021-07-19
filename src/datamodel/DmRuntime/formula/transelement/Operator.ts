import {FormulaElement, TransCenter, TransElement} from "./TransElement";
import {Schema} from "../../Schema";
import {DmConstants} from "../../../DmConstants";

@FormulaElement()
export class Operator implements TransElement {
    static patten = /[\+\-\*\/]/;

    getElementType(): number {
        return DmConstants.FormulaElementType.mathOperator;
    }

    getName(): string {
        return "数学操作符";
    }

    getExpressionCN(): string {
        return this.getName();
    }

    getOrder(): number {
        return this.getElementType() + 10;
    }

    isMatchCn(str): boolean {
        return Operator.patten.test(str);
    }

    isMatchInner(str): boolean {
        return Operator.patten.test(str);
    }

    transToCn(curElement: string, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        let strs = curElement.split(Operator.patten);
        if (strs.length < 2) {
            throw new Error(this.getName() + "数学运算符,需要二个操作数");
        }
        let oper = curElement.substr(strs[0].length, 1);
        let rightExp = curElement.substr(strs[0].length + 1);
        //仅将式子分隔成二块,由中心处理其它
        return transcenter.transToCn(strs[0]) + oper + transcenter.transToCn(rightExp);
    }

    transToInner(curElement: string, schema: Schema, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        let strs = curElement.split(Operator.patten);
        if (strs.length < 2) {
            throw new Error(this.getName() + "数学运算符,需要二个操作数");
        }
        let oper = curElement.substr(strs[0].length, 1);
        let rightExp = curElement.substr(strs[0].length + 1);
        //仅将式子分隔成二块,由中心处理其它
        return transcenter.transToInner(strs[0]) + oper + transcenter.transToInner(rightExp);
    }

    async transToValue(curElement: string, rowTableId, rowData, schema?: Schema, transcenter?: TransCenter, mapGroup?): Promise<string> {
        console.log(this.getName() + "  matched!");
        let strs = curElement.split(Operator.patten);
        if (strs.length < 2) {
            throw new Error(this.getName() + "数学运算符,需要二个操作数");
        }
        let oper = curElement.substr(strs[0].length, 1);
        let rightExp = curElement.substr(strs[0].length + 1);
        //仅将式子分隔成二块,由中心处理其它
        let str = await transcenter.transToValue(strs[0], rowTableId, rowData, schema, transcenter,  mapGroup) +
            oper + await transcenter.transToValue(rightExp, rowTableId, rowData, schema, transcenter,  mapGroup);
        let promise = new Promise<string>(resolve => {
            resolve(str);
        });
        return promise;

    }

    isOnlyForFilter(): boolean {
        return false;
    }

}
