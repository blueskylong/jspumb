import {FormulaElement, TransCenter, TransElement} from "./TransElement";
import {DmConstants} from "../../../DmConstants";
import {Schema} from "../../Schema";
import {FormulaTools} from "../FormulaTools";
import {GlobalParams} from "../../../../common/GlobalParams";
import {Constants} from "../../../../common/Constants";

@FormulaElement()
export class SysparamElement implements TransElement {

    getElementType(): number {
        return DmConstants.FormulaElementType.sysparam;
    }

    getName(): string {
        return "系统参数";
    }

    getExpressionCN(): string {
        return this.getName();
    }

    getOrder(): number {
        return this.getElementType();
    }

    isMatchCn(str): boolean {
        return FormulaTools.isSysParam(str.trim());
    }

    isMatchInner(str): boolean {
        return FormulaTools.isSysParam(str.trim());
    }

    transToCn(curElement: string, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        let sysParams = FormulaTools.getSysParams(curElement);
        if (sysParams && sysParams.length > 0) {
            for (let paramExp of sysParams) {
                let paramInfo = GlobalParams.getParamInfo(paramExp);
                curElement = FormulaTools.replaceParamNameStr(curElement, paramExp, paramInfo.name);
            }
        }
        return curElement;
    }

    transToInner(curElement: string, schema: Schema, transcenter?: TransCenter): string {
        console.log(this.getName() + "  matched!");
        let sysParams = FormulaTools.getSysParams(curElement);
        if (sysParams && sysParams.length > 0) {
            for (let paramName of sysParams) {
                let paramInfo = GlobalParams.getParamInfoByName(paramName);
                curElement = FormulaTools.replaceParamNameStr(curElement, paramName, paramInfo.id + "");
            }
        }
        return curElement;
    }

    async transToValue(curElement: string, rowTableId, rowData, schema?: Schema, transcenter?: TransCenter): Promise<string> {
        let promise = new Promise<string>(resolve => {
            let sysParams = FormulaTools.getSysParams(curElement);
            if (sysParams && sysParams.length > 0) {
                for (let paramExp of sysParams) {
                    let paramInfo = GlobalParams.getParamInfo(paramExp);
                    let value = "";
                    if (paramInfo) {
                        if (paramInfo.dataType !== Constants.FieldType.int
                            && paramInfo.dataType !== Constants.FieldType.decimal) {
                            value = "'" + paramInfo.value + "'"
                        } else {
                            value = paramInfo.value;
                        }
                    }
                    curElement = FormulaTools.replaceParamValueStr(curElement, paramExp, value);
                }
            }
            resolve(curElement);
        });
        return promise;

    }

    isOnlyForFilter(): boolean {
        return false;
    }

}
