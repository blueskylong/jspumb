import {FormulaElement} from "./TransElement";
import {BaseGroupElement} from "./BaseGroupElement";


/**
 * @author xxl
 * @version V0.0.1
 * @date 2021/7/14 0014 16:35
 **/
@FormulaElement()
class CountExp extends BaseGroupElement {
    constructor() {
        super();
        this.elementCN = "计数()";
        this.startStr = "count(";
        this.startStrCN = "计数(";
        this.endStr = ")";
        this.endStrCN = ")";
    }

    calcGroupField(lstObj) {
        let count = 0;
        for (let obj of lstObj) {
            if (obj == null) {
                continue;
            }
            count++;

        }
        return count + "";
    }
}
