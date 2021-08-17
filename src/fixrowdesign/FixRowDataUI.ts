import {ManagedFunc} from "../blockui/ManagedFunc";
import {MenuInfo} from "../sysfunc/menu/dto/MenuInfo";
import {MenuFunc} from "../decorator/decorator";

@MenuFunc("FixRowDataUI")
export class FixRowDataUI<T extends MenuInfo> extends ManagedFunc<T> {

}
