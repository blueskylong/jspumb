import {NetRequest} from "../../common/NetRequest";
import {CommonUtils} from "../../common/CommonUtils";

export class FixRowService {
    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static findFixRowComponents(fixId: number, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get("/fixrow/findFixRowComponents/" + fixId), callback);
    }

    /**
     * 保存固定行数据
     * @param dsId
     * @param masterDsId
     * @param masterKey
     * @param rows
     * @param callback
     */
    static saveFixData(fixId, rows, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/fixrow/saveFixData/"
            + fixId, rows), callback);
    }

    static findFixData(fixId, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get("/fixrow/findFixData/"
            + fixId), callback);
    }
}
