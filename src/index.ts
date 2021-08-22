// export * from "./dmdesign/DmDesign";
import Axios from "axios";

import "./plugins"

import {NetRequest} from "./common/NetRequest";
import "./jsplugs/jquery.dragsort";


import './common.css';
import './fonts/fonts.css'
import {App} from "./App/App";

import "./FunctionReg"
import {CommonUtils} from "./common/CommonUtils";
import {BlockedHomePage} from "./home/homepage/BlockedHomePage";

export * from "./uidesign/view/JQueryComponent"
export * from "./datamodel/DmRuntime/formula/transelement"

$.getJSON('./config.json', function (r) {
    CommonUtils.setConfigs(r);
    NetRequest.axios = Axios.create({
        baseURL: r.baseURL,
        withCredentials: true
    });
    $(() => {
        App.setHomePage(BlockedHomePage);
        new App().start();
    });

});





