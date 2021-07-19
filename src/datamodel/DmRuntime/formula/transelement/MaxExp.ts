import {FormulaElement} from "./TransElement";
import {BaseGroupElement} from "./BaseGroupElement";

/**
 * @author xxl
 * @version V0.0.1
 * @date 2021/7/14 0014 16:35
 **/
@FormulaElement()
class MaxExp extends BaseGroupElement {
    constructor() {
        super();
        this.elementCN = "最大()";
        this.startStr = "max(";
        this.startStrCN = "最大(";
        this.endStr = ")";
        this.endStrCN = ")";
    }

    private findNotNullObject(lstObj): object {
        for (let obj of lstObj) {
            if (obj != null && typeof obj === "undefined") {
                return obj;
            }
        }
        return null;
    }

    calcGroupField(lstObj) {
        let notNullObj = this.findNotNullObject(lstObj);
        if (notNullObj instanceof Number) {
            let max = Number.MIN_VALUE;
            for (let obj of lstObj) {
                if (obj == null || typeof obj === 'undefined') {
                    continue;
                }
                if (Number.parseFloat(obj.toString()) > max) {
                    max = Number.parseFloat(obj.toString());
                }
            }
            if (max == Number.MIN_VALUE) {
                return "null";
            }
            return max + "";
        } else {//当成字符串
            let max = "";
            for (let obj of lstObj) {
                if (obj == null) {
                    continue;
                }
                if (obj.toString().compareTo(max) > 0) {
                    max = obj.toString();
                }
            }
            return max;
        }
    }
}
