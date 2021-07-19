/**
 * 分组函数
 *
 * @author xxl
 * @version V0.0.1
 * @date 2021/7/14 0014 15:13
 **/
import {AbstractTransElement} from "./AbstractTransElement";
import {DmConstants} from "../../../DmConstants";
import {CommonUtils} from "../../../../common/CommonUtils";
import {FormulaTools} from "../FormulaTools";

export abstract class BaseGroupElement extends AbstractTransElement {
    public static PATTEN_GROUP_PARAM
        = /####[^#]*####/;


    public getExpressionCN() {
        return this.getName();
    }

    public getOrder() {
        return 2;
    }

    protected elementCN = "加和(*)";

    protected startStr = "sum(";
    protected startStrCN = "加和(";
    protected endStr = ")";
    protected endStrCN = ")";


    public getElementType() {
        return DmConstants.FormulaElementType.group;
    }

    public isMatchCn(str) {
        let strTrim = str.trim();
        return strTrim.startsWith(this.startStrCN) && strTrim.endsWith(this.endStrCN);
    }

    public isMatchInner(str) {
        let strTrim = str.trim();
        return strTrim.startsWith(this.startStr) && strTrim.endsWith(this.endStr);
    }

    /**
     * ${f1}.indexOf("我")===0  =>  ${字段1} 以("我")开头
     *
     * @param curElement
     * @param transcenter
     */
    public transToCn(curElement, transcenter) {
        //前面部分,可以变量,也可能是常量,需要中心去处理
        let innerParam = this.getEnInnerStr(curElement);
        let innerParamStr = transcenter.transToCn(innerParam, transcenter);
        return this.startStrCN + innerParamStr + this.endStrCN;
    }

    /**
     * ${字段1} 以("我")开头  =>  ${f1}.indexOf("我")===0
     *
     * @param curElement
     * @param transcenter
     */
    public transToInner(curElement, schema, transcenter) {
        //中间部门,也需要中心处理
        let innerParam = curElement.substring(this.startStrCN.length,
            curElement.length() - 1);
        let innerParamStr = transcenter.transToInner(innerParam, schema, transcenter);
        return this.startStr + innerParamStr + this.endStr;
    }

    /**
     * 翻译成值表达式,
     * 当前的表达式形式为 sum(${table1.field1}+3)
     * 因为有数值,所以这里直接返回计算值
     *
     * @param curElement
     * @param rowData
     * @param schema
     * @param transcenter
     */
    async transToValue(curElement, rowTableId, rowData,
                        schema, transcenter, mapGroup):Promise<string>  {
        //中间部门,也需要中心处理
        let innerParam = this.getEnInnerStr(curElement);
        let innerParamStr = await transcenter.transToValue(innerParam, rowTableId, rowData, schema, transcenter,  mapGroup);
        if (CommonUtils.isEmpty(innerParam)) {
            return curElement;
        }
        //开始计算分组信息
        return this.calcGroupField(this.calcAllRowFormula(innerParamStr, mapGroup));
    }

    /**
     * 取得中间表达式
     *
     * @param curElement
     * @return
     */
    private getEnInnerStr(curElement) {
        let indexPos = curElement.indexOf(this.startStr);
        return curElement.substring(indexPos + this.startStr.length,
            curElement.length - this.endStr.length);

    }

    /**
     * 计算第一行的数值
     *
     * @param innerParamStr ####12321321#####+3+####3334####
     * @param mapGroup      key:####12321321##### list:[2,43]
     * @return
     */
    protected calcAllRowFormula(innerParamStr, mapGroup) {
        let lstParam = FormulaTools.getParam(innerParamStr, BaseGroupElement.PATTEN_GROUP_PARAM, false);
        let lstValues = new Array<Array<object>>();
        //拿到所有的值
        if (!lstParam || lstParam.length == 0) {
            //如果没有参数，则只可能是一常量值
            return [eval(innerParamStr)];
        }
        let size = 0;
        for (let param of lstParam) {
            let lstValue = mapGroup.remove(param);
            if (size != 0 && lstValue.size() != size) {
                //这种情况应该不会出现
                throw new Error("分组内部的数据不一致");
            }
            size = lstValue.size();
            lstValues.push(lstValue);
        }
        //循环计算每一行的值
        let iParamCount = lstParam.length;
        let lstResult = new Array<object>();
        for (let i = 0; i < size; i++) {
            let sFormula = innerParamStr;
            for (let j = 0; j < iParamCount; j++) {
                sFormula = sFormula.replaceAll(lstParam[j], lstValues[j][i].toString());
            }
            lstResult.push(eval(sFormula));
        }
        return lstResult;
    }

    public isOnlyForFilter() {
        return false;
    }

    abstract calcGroupField(lstObj: Array<object>);

}
