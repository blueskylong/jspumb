import {FormulaElement} from "./TransElement";
import {BaseGroupElement} from "./BaseGroupElement";
import {CommonUtils} from "../../../../common/CommonUtils";


/**
 * @author xxl
 * @version V0.0.1
 * @date 2021/7/14 0014 16:35
 **/
@FormulaElement()
class SumExp extends BaseGroupElement {
    constructor() {
        super();
        this.elementCN = "加和()";
        this.startStr = "sum(";
        this.startStrCN = "加和(";
        this.endStr = ")";
        this.endStrCN = ")";
    }


    calcGroupField(lstObj) {
        let dValue = 0;
        for (let obj of lstObj) {
            if (obj == null) {
                continue;
            }

            dValue += CommonUtils.toDouble(obj);
        }
        return dValue + "";
    }
}
