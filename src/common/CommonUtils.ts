/**
 * 工具类
 */
import {AxiosResponse} from "axios";
import {Logger} from "./Logger";
import {Alert} from "../uidesign/view/JQueryComponent/Alert";
import {BeanFactory} from "../decorator/decorator";
import {HandleResult} from "./HandleResult";
import {StringMap} from "./StringMap";
import {GlobalParams} from "./GlobalParams";
import {UiUtils} from "./UiUtils";

export class CommonUtils {
    static ID_SER = -1;

    static INT_SER = 1;

    static READY_TRY_TIMES = 10;

    static configs = {};

    static genKey(id: number, version: string) {
        return id + "_" + version;
    }

    public static getConfigParam(paramName: string) {
        return CommonUtils.configs[paramName];
    }

    public static setConfigs(configs) {
        CommonUtils.configs = configs;
    }

    /**
     * 转换成双精度数值
     *
     * @param obj
     * @return
     */
    public static toDouble(obj: object): number {
        if (obj == null) {
            return 0;
        }
        if (obj instanceof Number) {
            return Number.parseFloat(obj.toString(2));
        }
        return Number.parseFloat(obj.toString());
    }

    static isEmpty(obj: any) {
        let str = typeof obj;
        if (str === "object") {
            return $.isEmptyObject(obj);
        }
        return str === "undefined" || obj == null || "" === obj;
    }

    static isEquals(obj1: Object, obj2: Object) {
        if (!obj1 && !obj2) {
            return true;
        }
        if (!obj1 || !obj2) {
            return false;
        }
        // 当前Object对象
        let propsCurr = Object.getOwnPropertyNames(obj1);
        // 要比较的另外一个Object对象
        let propsCompare = Object.getOwnPropertyNames(obj2);
        if (propsCurr.length != propsCompare.length) {
            return false;
        }
        for (var i = 0, max = propsCurr.length; i < max; i++) {
            var propName = propsCurr[i];
            if (obj1[propName] !== obj2[propName]) {
                return false;
            }
        }
        return true;
    }


    /**
     * 取得临时序号
     */
    static nextInt() {
        return CommonUtils.INT_SER++;
    }

    static genUUID(): string {

        let s = [];
        let hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        // s[8] = s[13] = s[18] = s[23] = "-";

        return "X" + s.join("");

    }

    static toUnderLine(str) {
        let temp = str.replace(/[A-Z]/g, function (match) {
            return "_" + match.toLowerCase();
        });
        if (temp.slice(0, 1) === '_') {
            temp = temp.slice(1);
        }
        return temp;
    };

    static genElementId(...ids) {
        return "C" + ids.join("_");
    }

    static toCamel(str: string) {
        if (str.indexOf("_") == -1) {
            return str;
        }
        return str.replace(/([^_])(?:_+([^_]))/g, function ($0, $1, $2) {
            return $1 + $2.toUpperCase();
        });
    }

    static getServerUrl(subUrl) {
        return "http://localhost:8080/" + (subUrl.indexOf("/") == 0 ? subUrl.substr(1) : subUrl);
    }

    static readyDo(isReady: () => boolean, callback: () => void, tryTimes?) {
        let times = tryTimes ? tryTimes : CommonUtils.READY_TRY_TIMES;
        let i = setInterval(() => {
            if (times < 0) {
                clearInterval(i);
                Alert.showMessage("初始化超时!")
                return;
            }
            times--;
            if (isReady()) {
                clearInterval(i);
                callback();
            }
        }, 100);
    }


    static isNumber(value) {
        if (typeof value === "undefined" || value == null || value == "") {
            return false;
        }
        return !isNaN(value);
    }

    /**
     * 生成普通的ID
     */
    static genId() {
        return CommonUtils.ID_SER--;
    }


    static getOffsetTopByBody(el) {
        let offsetTop = 0;
        while (el && el.tagName !== 'BODY') {
            offsetTop += el.offsetTop;
            el = el.offsetParent
        }
        return offsetTop;
    }

    static getOffsetLeftByBody(el) {
        let offsetLeft = 0;
        while (el && el.tagName !== 'BODY') {
            offsetLeft += el.offsetLeft;
            el = el.offsetParent
        }
        return offsetLeft;
    }

    static handleResponse(promise: Promise<any>, callBack?: (data: HandleResult | any) => void,
                          errCallback?: (message) => void) {
        promise.then((result) => {
            CommonUtils.handleResult(result, callBack);
        }).catch((e) => {
            UiUtils.hideMask();
            if (e.message == "Request failed with status code 401") {
                Alert.showMessage("登录信息过期,请重新登录");
                GlobalParams.getApp().showLogin();
                return;
            }
            if (errCallback) {
                errCallback(e.message);
            } else {
                Alert.showMessage("访问服务器出现异常,操作失败!");
            }
            CommonUtils.log(e.status, e.statusText, e.data);
        });
    }

    static handleResult(result: AxiosResponse, callBack?: (data) => void) {
        if (!result) {
            return;
        }
        if (result.status == 200) {
            if (callBack) {
                try {
                    let data = result.data;
                    if (CommonUtils.isHandleResult(result.data)) {
                        let handleResult = BeanFactory.populateBean(HandleResult, data);
                        if (!handleResult.getSuccess()) {
                            if (handleResult.code == 401) {
                                Alert.showMessage("请登录," + handleResult.err);
                                GlobalParams.getApp().showLogin();
                                return;
                            }
                            Alert.showMessage("操作失败:" + handleResult.err);
                            UiUtils.hideMask();
                            Logger.error(handleResult.err);
                            return;
                        }
                        callBack(handleResult);
                        return;
                    }
                    callBack(result.data);
                } catch (e) {
                    Logger.error(e.message);
                    console.error(e.stack);
                }
            }
            return;
        } else if (result.status == 401) {
            let data = result.data;
            if (CommonUtils.isHandleResult(result.data)) {
                Alert.showMessage(result.data.err);
            } else {
                Alert.showMessage("请登录");
            }

            GlobalParams.logout();
            window.location = window.location;
        }
        CommonUtils.log(result.status, result.statusText, result.data);

    }

    static isHandleResult(obj) {
        if (!obj) {
            return false;
        }
        return (obj.hasOwnProperty("changeNum") &&
            obj.hasOwnProperty("err") &&
            obj.hasOwnProperty("page") &&
            obj.hasOwnProperty("data") &&
            obj.hasOwnProperty("success")
        )
    }

    static log(code, name, message): void {

    }

    static isIE() {
        if (!!window['ActiveXObject'] || "ActiveXObject" in window)
            return true;
        else
            return false;
    }

    static getDialogFullSize() {
        return [document.body.clientWidth, document.body.clientHeight - 210];
    }

    /**
     * 分类增加子元素
     * @param map
     * @param key
     * @param subElement
     */
    static addMapListValue<T>(map: StringMap<Array<T>>, key, subElement: T) {
        let lstEle = map.get(key);
        if (!lstEle) {
            lstEle = new Array<T>();
            map.set(key, lstEle);
        }
        lstEle.push(subElement);
    }

    //     return ; //IE
    // } else if ($.browser.safari) {
    //     alert("this is safari!"); //Safar
    // } else if ($.browser.mozilla) {
    //     alert("this is mozilla!");  //Firefox
    // } else if ($.browser.opera) {
    //     alert("this is opera");     //Opera
    // }

    /**
     * 取得非空字段
     * @param obj
     */
    static noEmptyField(obj: object) {
        let result = {};
        for (let field in obj) {
            if (obj[field]) {
                result[field] = obj[field];
            }
        }
        return result;
    }
}
