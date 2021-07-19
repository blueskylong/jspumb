import {Schema} from "../../Schema";
import {BeanFactory} from "../../../../decorator/decorator";
import {FormulaParse} from "../FormulaParse";

export interface TransElement extends TransCenter {
    /**
     * 是不是可以翻译的英文(JS)元素
     * @param str
     */
    isMatchInner(str): boolean;

    /**
     * 是不是可以翻译的中文元素
     * @param str
     */
    isMatchCn(str): boolean;

    /**
     * 翻译器的执行顺序,越小越靠前
     */
    getOrder(): number;

    /**
     *
     */
    getElementType(): number;

    getName(): string;

    isOnlyForFilter(): boolean;

    getExpressionCN(): string;


}

export class TransCenter {

    /**
     * 翻译成中文
     * @param curElement
     * @param preElement
     * @param transcenter
     */
    transToCn(curElement: string, transcenter?: TransCenter): string {
        return null;
    }

    /**
     * 翻译成内部表达式(JS)
     * @param curElement
     * @param preElement
     * @param schema
     * @param transcenter
     */
    transToInner(curElement: string, schema?: Schema, transcenter?: TransCenter): string {
        return null;
    }

    /**
     * 翻译成值表达式,
     * @param curElement
     * @param rowData
     * @param schema
     * @param transcenter
     */
    async transToValue(curElement: string, rowTableId: number, rowData, schema?: Schema, transcenter?: TransCenter,
                       mapGroup?: object): Promise<string> {
        let promise = new Promise<string>(resolve => {
            resolve(null);
        })
        return promise;
    }
}


/**
 * 注册表达式翻译组件
 * @param name
 * @constructor
 */
export function FormulaElement() {
    return (_constructor: { new(...args: Array<any>) }) => {
        //注册
        FormulaParse.regTransElement(BeanFactory.createBean(_constructor, []));
    }
}
