import {CommonUtils} from "../../../common/CommonUtils";
import {NetRequest} from "../../../common/NetRequest";
import {BeanFactory} from "../../../decorator/decorator";
import {MenuInfo} from "../dto/MenuInfo";
import {MenuStepInfo} from "../../../blockui/steps/stepcomp/stepimpl/MenuStep";

export class MenuService {
    static URL_ROOT = "/menu";

    static findMenuInfo(menuId, callback: (data) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get(MenuService.URL_ROOT + "/findMenuInfo/" + menuId), callback);
    }

    static findUserMenu(callback: (data) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get(MenuService.URL_ROOT + "/findUserMenu/"), callback);
    }

    static async findMenuInfoAsync(menuId): Promise<MenuStepInfo> {
        let result = await NetRequest.axios.get(MenuService.URL_ROOT + "/findMenuInfo/" + menuId);
        return new Promise(resolve => resolve(BeanFactory.populateBean(MenuStepInfo, result.data.data)));
    }

}
