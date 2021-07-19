import {NetRequest} from "../../common/NetRequest";
import {CommonUtils} from "../../common/CommonUtils";

export class DmService {
    static URL_ROOT = "/dm";

    /**
     * 查询一个方案的全部信息
     * @param schemaId
     * @param version
     */
    static findSchemaInfo(schemaId, version) {
        return NetRequest.axios.get(DmService.URL_ROOT + "/findSchemaInfo/"
            + schemaId + "/" + version);
    }

    /**
     * 查询一个方案的全部信息
     * @param schemaId
     * @param version
     */
    static findSchemaIds(callback: (data) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get(DmService.URL_ROOT + "/findSchemaIds"), callback);
    }

    static findCanSelectTable(schemaId) {
        return NetRequest.axios.get(DmService.URL_ROOT + "/findDefaultDBTablesNotInSchema/"
            + schemaId);
    }

    /**
     * 查询一表列条件数据
     * @param dsId
     * @param fieldId
     * @param filter
     * @param callback
     */
    static findTableFieldRows(dsId, fieldId, filter, callback: (data) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/dmdata/findTableFieldRows/" +
            dsId + "/" + fieldId, filter), callback);
    }

}
