import {FormulaElement} from "./TransElement";
import {BaseGroupElement} from "./BaseGroupElement";
import {CommonUtils} from "../../../../common/CommonUtils";

/**
 * @author xxl
 * @version V0.0.1
 * @date 2021/7/14 0014 16:35
 **/
@FormulaElement()
class AvgExp extends BaseGroupElement {
    constructor() {
        super();
        this.elementCN = "平均值()";
        this.startStr = "avg(";
        this.startStrCN = "平均值(";
        this.endStr = ")";
        this.endStrCN = ")";
    }


    calcGroupField(lstObj): string {
        let dValue = 0;
        let count = 0;
        for (let obj of lstObj) {
            if (obj == null || typeof obj === "undefined") {
                continue;
            }
            count++;
            dValue += CommonUtils.toDouble(obj);
        }
        if (count > 0) {
            return (dValue / count) + "";
        } else {
            return "0";
        }
    }
}
