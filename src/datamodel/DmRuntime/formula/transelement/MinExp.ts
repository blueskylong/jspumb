import {BaseGroupElement} from "./BaseGroupElement";
import {FormulaElement} from "./TransElement";

/**
 * @author xxl
 * @version V0.0.1
 * @date 2021/7/14 0014 16:35
 **/
@FormulaElement()
export class MinExp extends BaseGroupElement {
    constructor() {
        super();
        this.elementCN = "最小()";
        this.startStr = "sum(";
        this.startStrCN = "最小(";
        this.endStr = ")";
        this.endStrCN = ")";
    }

    private findNotNullObject(lstObj) {
        for (let obj of lstObj) {
            if (obj != null) {
                return obj;
            }
        }
        return null;
    }

    calcGroupField(lstObj) {
        let notNullObj = this.findNotNullObject(lstObj);
        if (notNullObj instanceof Number) {
            let min = Number.MAX_VALUE;
            for (let obj of lstObj) {
                if (obj == null || typeof obj === "undefined") {
                    continue;
                }
                if (parseFloat(obj.toString()) < min) {
                    min = parseFloat(obj.toString());
                }
            }
            if (min == Number.MAX_VALUE) {
                return "null";
            }
            return min + "";
        } else {//当成字符串
            let min = "";
            for (let obj of lstObj) {
                if (obj == null || typeof obj === "undefined") {
                    continue;
                }
                if (obj.toString().compareTo(min) < 0) {
                    min = obj.toString();
                }
            }
            return min;
        }
    }
}
