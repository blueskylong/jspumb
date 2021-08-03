import 'reflect-metadata';
import {ExceptionHandler} from "../common/ExceptionHandler";
import {StringMap} from "../common/StringMap";
import {IValidator} from "../blockui/uiruntime/IValidator";
import {JQueryGeneralComponentGenerator} from "../uidesign/view/JQueryComponent/JQueryGeneralComponentGenerator";
import {BlockedHomePage} from "../home/homepage/BlockedHomePage";


//TODO 这里的服务暂时没办法保证在调用前注册
export class ApplicationContext {
    private static Services = {};
    private static lstServices: Array<Object> = new Array<Object>();
    private static menuFuncs = {};
    private static validators = new StringMap<IValidator>();
    private static customUis = {};
    private static stepUI = {};

    public static regService(service: any, name?: string) {
        if (!name) {
            name = service.name;
        }
        ApplicationContext.Services[name] = service;
        this.lstServices.push(service);
    }


    public static getService(nameOrType: string | any) {
        if (typeof nameOrType == "string") {
            return this.Services[nameOrType];
        } else {
            for (let service of ApplicationContext.lstServices) {
                if (service == nameOrType) {
                    return service;
                } else if (this.isSubClass(service, nameOrType)) {
                    return service;
                }
            }
            return null;
        }
    }

    public static getMenuFunc(name: string) {
        console.log("menuFuncs:" + JSON.stringify(ApplicationContext.menuFuncs));
        return ApplicationContext.menuFuncs[name];
    }

    public static getCustomUi(name: string) {
        return ApplicationContext.customUis[name];
    }

    public static getCustomStepUI(name: string) {
        return ApplicationContext.stepUI[name];
    }

    public static getValidates() {
        return ApplicationContext.validators.getValues();
    }

    public static regMenuFunc(name: string, constructor: { new(...args: Array<any>): any }) {
        if (this.menuFuncs[name]) {
            console.log("************** warning![" + name + "] already exists,Replace the old one!***************")
        }
        this.menuFuncs[name] = constructor;
    }

    public static regValidator(name: string, validator: IValidator) {
        if (this.validators.has(name)) {
            console.log("************** warning![" + name + "] already exists,Replace the old one!***************")
        }
        this.validators.set(name, validator);
    }

    public static regCustomUi(name: string, constructor: { new(...args: Array<any>): any }) {
        if (this.customUis[name]) {
            console.log("************** warning![" + name + "] already exists,Replace the old one!***************")
        }
        this.customUis[name] = constructor;
    }

    public static regCustomStepUi(name: string, constructor: { new(...args: Array<any>): any }) {
        if (this.stepUI[name]) {
            console.log("************** warning![" + name + "] already exists,Replace the old one!***************")
        }
        this.stepUI[name] = constructor;
    }


    /**
     * 检查typeSuper是typeSub的父类或自己
     * @param typeSub
     * @param typeSuper
     */
    private static isSubClass(typeSub, typeSuper) {
        if (typeSub == typeSuper) {
            return true;
        }
        let protoSuper = typeSuper.prototype;
        let protoSub = typeSub.prototype;
        while (true) {
            if (protoSub === null)
                return false;
            if (protoSuper === protoSub)  // 当 O 显式原型 严格等于  L隐式原型 时，返回true
                return true;
            protoSub = protoSub.__proto__;
        }


    }
}

export function CatchException() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const origin = target[propertyKey];
        target[propertyKey] = function (...args: any[]) {
            let result;
            try {
                result = origin.apply(this, args);
            } catch (e) {
                ExceptionHandler.handleException(e);
                throw e;
            }
            return result;
        }
        return target[propertyKey];
    }
}

/**
 * 缓存,注意,这里只能用于普通的函数中,不能用于异步
 * @param value
 */
export function Cache(value: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const origin = target[propertyKey];
        // aop
        target[propertyKey] = function (...args: any[]) {
            let cacheKey = value + "_" + args.join("_");
            let result = CACHE_MAP.get(cacheKey);
            if (result) {
                return result;
            }
            result = origin.apply(this, args)
            CACHE_MAP.set(cacheKey, result);
            return result;
        }
        return target[propertyKey];
    }
}

/**
 * 生成对象
 * @param value
 */
export function PopulateBean<T>(constructor: { new(...args: Array<any>): T }) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const origin = target[propertyKey];
        // aop
        target[propertyKey] = function (...args: any[]) {
            //目前只能处理一个对象

            if (!args || args.length != 1) {
                return origin.apply(this, ...args)
            }
            if (Array.isArray(args[0])) {
                let arg = new Array<T>();
                if (args[0].length > 0) {
                    //如果都是指定的类别,就不再生成新的对象
                    //这里只判断一条
                    if (args[0][0] instanceof constructor) {
                        return origin.apply(this, args);
                    }
                    for (let obj of args[0]) {
                        arg.push(BeanFactory.populateBean(constructor, obj));
                    }
                    args[0] = arg;
                } else {
                    return origin.apply(this, args)
                }

            } else {
                args[0] = BeanFactory.populateBean(constructor, args[0]);
            }
            return origin.apply(this, args);
        }
        return target[propertyKey];
    }
}

export function Service(name: string) {
    return (_constructor: Function) => {
        let paramTypes: Array<Function> = Reflect.getMetadata('design:paramtypes', _constructor)
        //已注册
        if (ApplicationContext.getService(_constructor)) return;
        if (paramTypes) {
            for (let val of paramTypes) {
                if (val === _constructor) {
                    throw new Error('不能依赖自己');
                } else if (!ApplicationContext.getService(val)) {
                    throw new Error(`${val}没有被注册`)
                }
            }
        }
        //注册
        ApplicationContext.regService(_constructor, name);
    }
}

export function MenuFunc(name: string) {

    return (_constructor: Function) => {
        let funcName = name ? name : _constructor.name;
        //注册
        ApplicationContext.regMenuFunc(funcName, _constructor as any);
        return;
    }
}

/**
 * 注册验证器,这里存的是一个实例,而不是类
 * @param name
 * @constructor
 */
export function RegValidator(name?: string) {
    return (_constructor: { new(...args: Array<any>) }) => {
        let funcName = name ? name : _constructor.name;
        //注册
        ApplicationContext.regValidator(funcName, BeanFactory.createBean(_constructor, []));
        return;
    }
}

/**
 * 注册验证器,这里存的是一个实例,而不是类
 * @param name
 * @constructor
 */
export function RegComponent(name: string) {
    return (_constructor: { new(...args: Array<any>) }) => {
        let funcName = name;
        //注册
        JQueryGeneralComponentGenerator.regCustomComponent(funcName, _constructor);
        return;
    }
}

export function RegHomeBlock(name?: string) {

    return (_constructor: Function) => {
        let funcName = name ? name : _constructor.name;
        //注册
        BlockedHomePage.regHomePageBlock(funcName, _constructor as any);
        return;
    }
}

/**
 * 注册用户自定义组件
 * @param name
 * @constructor
 */
export function CustomUi(name?: string) {
    return (_constructor: Function) => {
        let funcName = name ? name : _constructor.name;
        //注册
        ApplicationContext.regCustomUi(funcName, _constructor as any);
        return;
    }
}

let CACHE_MAP = new StringMap<object>();

//实例化工厂
export class BeanFactory {

    static createBean<T>(_constructor: { new(...args: Array<any>): T }, params: Array<any>): T {
        return new _constructor(...params);
    }

    /**
     * 创建并复制对象发生
     * @param _constructor
     * @param params
     */
    static populateBean<T>(_constructor: { new(...args: Array<any>): T }, params: any): T {
        if (!params) {
            return null;
        }
        if (params instanceof _constructor) {
            return params;
        }
        if (params instanceof StringMap) {
            params = BeanFactory.mapToObj(params) as any;
        }
        let obj = new _constructor();

        if (params instanceof StringMap) {
            params.forEach((key, value, map) => {
                let setString = "set" + key.substr(0, 1).toUpperCase() + key.substr(1);
                if (typeof obj[setString] === "function") {
                    obj[setString](value);
                } else {
                    obj[key] = value;
                }
            });
        } else {
            for (let attr in params) {
                let setString = "set" + attr.substr(0, 1).toUpperCase() + attr.substr(1);
                if (typeof obj[setString] === "function") {
                    obj[setString](params[attr]);
                } else {
                    obj[attr] = params[attr];
                }

            }
        }
        return obj;
    }

    /**
     * 创建并复制对象发生
     * @param _constructor
     * @param params
     */
    static populateBeans<T>(_constructor: { new(...args: Array<any>): T }, params: Array<any>): Array<T> {
        if (!params || params.length < 1) {
            return null;
        }
        if (params[0] instanceof _constructor) {
            return params;
        }
        if (params[0] instanceof StringMap) {
            params = BeanFactory.mapToObj(params) as any;
        }
        let result = new Array<T>();
        for (let param of params) {
            let obj = new _constructor();
            for (let attr in param) {
                let setString = "set" + attr.substr(0, 1).toUpperCase() + attr.substr(1);
                if (typeof obj[setString] === "function") {
                    obj[setString](param[attr]);
                } else {
                    obj[attr] = param[attr];
                }

            }
            result.push(obj);
        }

        return result;
    }

    private static mapToObj(value: StringMap<any> | Array<StringMap<any>>) {
        if (!value) {
            return {};
        }
        if (value instanceof StringMap) {
            return value.getObject();
        }
        let result = [];
        for (let map of value) {
            result.push(map.getObject());
        }
        return result;
    }

    static singleton = {};

    static getInstance<T>(_constructor: { new(...args: Array<any>): T }): T {

        let paramTypes: Array<Function> = Reflect.getMetadata('design:paramtypes', _constructor)
        //参数实例化
        if (paramTypes) {
            let paramInstance = paramTypes.map((val: Function) => {
                //依赖的类必须全部进行注册
                if (!ApplicationContext.getService(val)) throw new Error(`${val}没有被注册`)
                //参数还有依赖
                else if (val.length) {
                    return BeanFactory.getInstance(val as any);
                }
                //没有依赖直接创建实例
                else {
                    return new (val as any)();
                }
            })
            return new _constructor(...paramInstance);
        } else {
            return new _constructor();
        }
    }

    static getSingleton<T>(_constructor: { new(...args: Array<any>): T }, nameOrType: string | any): T {
        if (!(typeof nameOrType == "string")) {
            nameOrType = nameOrType.name;
        }
        if (this.singleton[nameOrType]) {
            return this.singleton[nameOrType];
        }
        let instance = this.getInstance(_constructor);
        this.singleton[nameOrType] = instance;
        return instance;
    }
}


export function Autowired(name: string | any) {
    return function (target: any, propertyKey: string) {
        let type = ApplicationContext.getService(name);
        target[propertyKey] = BeanFactory.getSingleton(type, name);
    }

}
