var UIListView,directorArr = [];
var _newDataStore = [];
apiReady(function() {
    UIListView = api.require('UIListView');
    checkLogin(function() {
        getSignInfo();
        getMsg();
        getDirectrListByLevel();
        getMoreInfo();
    });

    api.addEventListener({
        name: 'frame2'
    }, function(ret, err) {
        checkLogin(function() {
            getSignInfo();
            getMsg();
            getMoreInfo();
        });
    });

    apiRefresh(function() {
        getSignInfo();
    });
});

function getMsg() {
    apiAjax({
        url: '/home/notiPost/fromCenterList'
    }, function(result) {
        _newDataStore = result.data;
        renderMsgList(_newDataStore);
    });
}

function renderMsgList(msgList) {
    var _newDataStore = msgList ? msgList : [];
    // var _newDataStore = result.data;
    var str = '';
    var dataStore = [];
    for (var i = 0; i < _newDataStore.length; i++) {
        var o = {
            affairId: _newDataStore[i].NotiPost.noti_client_affair_group_uuid,
            uuid: _newDataStore[i].NotiPost.mailId,
            id: _newDataStore[i].id,
            title: _newDataStore[i].NotiPost.title,
            subTitle: _newDataStore[i].NotiPost.content,
            locationId: _newDataStore[i].NotiPost.locationId,
            votes: _newDataStore[i].NotiPost.votes
        };
        var rightBtns = [];
        var len;
        try{
            len = _newDataStore[i].NotiPost.votes.split(',').length;
        }catch(e){
            len = 0;
        }
        if(len==1){
            if(!_newDataStore[i].vote){
                rightBtns.push({
                    bgColor: '#bdbdbd',
                    width: 70,
                    title: '已阅',
                    titleColor: '#fff'
                });
            }
        }else if(len>1){
            if(!_newDataStore[i].vote){
                rightBtns.push({
                    bgColor: '#bdbdbd',
                    width: 70,
                    title: '选单',
                    titleColor: '#fff'
                });
            }
        }
        if(_newDataStore[i].atMe&&!_newDataStore[i].atReply){
            rightBtns.push({
                bgColor: '#fb8c00',
                width: 70,
                title: '回复',
                titleColor: '#fff'
            });
        }
        o.rightBtns = rightBtns;
        dataStore.push(o);
    }
    UIListView.close();
    var y = $('.aui-content').height();
    var w = api.winWidth;
    var h = api.frameHeight-y;
    UIListView.open({
        rect: {
            x: 0,
            y: y,
            w: w,
            h: h
        },
        data: dataStore,
        styles: {
            borderColor: '#eee',
            item: {
                bgColor: '#fff',
                activeBgColor: '#fff',
                height: 55.0,
                imgWidth: 40,
                imgHeight: 40,
                imgCorner: 4,
                placeholderImg: '',
                titleSize: 12.0,
                titleColor: '#000',
                subTitleSize: 12.0,
                subTitleColor: '#000',
                remarkColor: '#000',
                remarkSize: 16,
                remarkIconWidth: 30
            }
        },
        fixedOn: api.frameName
    },function(ret){
        if(ret.eventType=='clickContent'){
            UIListView.getDataByIndex({
                index: ret.index
            },function(ret){
                var affairId = ret.data.affairId;
                var title = ret.data.title;
                var locationId = ret.data.locationId;
                msgClick({
                    affairId: affairId,
                    title: title,
                    locationId: locationId
                });
            });
        }else if(ret.eventType=='clickRightBtn'){
            var btnIndex = ret.btnIndex;
            UIListView.getDataByIndex({
                index: ret.index
            },function(ret){
                var title = ret.data.rightBtns[btnIndex].title;
                var noti_client_mailId = ret.data.uuid;
                var id = ret.data.id;
                if(title=='已阅'){
                    var vote = title;
                    reply({
                        id: id,
                        noti_client_mailId: noti_client_mailId,
                        vote: vote
                    });
                }else if(title=='回复'){
                    api.prompt({
                        title: '回复',
                        buttons: ['取消', '确定']
                    }, function(ret, err) {
                        var index = ret.buttonIndex;
                        if(index==2){
                            if(ret.text==''){
                                api.toast({
                                    msg: '不能为空'
                                });
                                return;
                            }
                            reply({
                                id: id,
                                noti_client_mailId: noti_client_mailId,
                                atReply: ret.text
                            });
                        }
                    });
                }else if(title=='选单'){
                    var voteArr;
                    try{
                        voteArr = ret.data.votes.split(',');
                    }catch(e){
                        voteArr = [];
                    }
                    api.actionSheet({
                        title: '选单',
                        cancelTitle: '取消',
                        buttons: voteArr
                    }, function(ret, err) {
                        var index = ret.buttonIndex;
                        if(index<=voteArr.length){
                            var vote = voteArr[index-1];
                            reply({
                                id: id,
                                noti_client_mailId: noti_client_mailId,
                                vote: vote
                            });
                        }
                    });
                }
            });
        }
    });
    // $('.msgs').html(str);
    refresh();
    setTimeout(function(){
        api.parseTapmode();
    },500);
}

function refresh(){
    UIListView.setRefreshHeader({
        bgColor: '#F5F5F5',
        textColor: '#8E8E8E',
        textDown: '下拉可以刷新...',
        textUp: '松开开始刷新...',
        showTime: true
    }, function(ret, err) {
        if (ret) {
            getMsg();
        }
    });
}

function reply(params){
    if(!params.vote&&!params.atReply){
        api.toast({
            msg: '回复不能为空'
        });
        return;
    }
    apiAjax({
        url: '/home/notiPost/fromCenterUpdate',
        type: 'put',
        data: params
    },function(result){
        api.toast({
            msg: result.msg
        });
        getMsg();
    });
}

function msgClick(form_data) {
    var affairId = form_data.affairId;
    var title = form_data.title;
    var locationId = form_data.locationId;
    api.openWin({
        name: 'responseAffairWin',
        url: '../html/responseAffairWin.html',
        pageParam: {
            affairId: affairId,
            title: title,
            locationId: locationId
        }
    });

}



/**
 *  获取签到信息
 */
function getSignInfo(){
    apiAjax({
        url:'/home/attendance/workingNum',
    },function(res){
        renderSign(res.data);
    });
}

function renderSign(data){
    var status = data.status;
    $('.workTime').html(data.workTime);
    $('.overWorkTime').html(data.overWorkTime);
    $('.onDutyTime').html(data.onDutyTime);
    $('.total').html(data.total);
    showWorkTime(data,data.workTime);
    if(status==0){
        var str = '<div style="text-align: center;margin-top: 60px;"><a href="javascript:;" onclick="signIn();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">上班</a></div>';

        $('.sign-wrap').html(str);
    }else if(status==1){
        var onCusDutyStaff = data.onCusDutyStaff?data.onCusDutyStaff:'';
        var onDutyStaff = data.onDutyStaff?data.onDutyStaff:'';
        var onDutyInsideStaff = data.onDutyInsideStaff?data.onDutyInsideStaff:'';
        var str = '<div style="text-align: center;">'+
                        '<div class="wrap-duty">'+
                            '<label onclick="safeDuty();" style="color: rgb(117,117,117);">'+
                                '<span>安卫：</span>'+
                                '<span>'+onDutyStaff+'</span>'+
                            '</label>'+
                            '<label onclick="cusDuty();" style="color: rgb(117,117,117);text-align: center;">'+
                                '<span>客服：</span>'+
                                '<span>'+onCusDutyStaff+'</span>'+
                            '</label>'+
                            '<label onclick="insideDuty();" style="color: rgb(117,117,117);text-align: right;">'+
                                '<span>内勤：</span>'+
                                '<span>'+onDutyInsideStaff+'</span>'+
                            '</label>'+
                        '</div>'+
                        '<a href="javascript:;" style="margin-top: 10px;" onclick="signOut();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">下班</a>'+
                        '<div class="wrap-duty" >'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="goOutDialog();">登记外出</span>'+
                            '</p>'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="recallWork();">撤销上班</span>'+
                            '</p>'+
                        '</div>'+
                    '</div>';

        $('.sign-wrap').html(str);
    }else if(status==2){
        var str = '<div style="text-align: center;margin-top: 60px;">'+
                        '<a href="javascript:;" onclick="outLeave();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">下班</a>'+
                        '<div class="wrap-duty" >'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="backWork();">返岗</span>'+
                            '</p>'+
                        '</div>'+
                    '</div>';

        $('.sign-wrap').html(str);
    }else if(status==3){
        var str = '<div style="text-align: center;margin-top: 60px;"><a href="javascript:;" onclick="overWorkStart();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">加班</a></div>';

        $('.sign-wrap').html(str);
    }else if(status==4){
        var str = '<div style="text-align: center;margin-top: 60px;">'+
                        '<a href="javascript:;" onclick="overWorkEnd();" class="sign-checkin weui-btn_mini weui-btn_plain-primary">结束加班</a>'+
                        '<div class="wrap-duty" >'+
                            '<p style="padding-top: 5px;">'+
                                '<span onclick="recallOverWork();">撤销加班</span>'+
                            '</p>'+
                        '</div>'+
                    '</div>';

        $('.sign-wrap').html(str);
    }
    apiAjax({
        url: '/home/staff/getListByLevel',
        data: {
            level: 4
        }
    },function(res){
        var userIdArr = [];
        res.data.forEach(function(items){
            if (items.branch == '客户关系部') {
                userIdArr.push(items.user_id.toString());
            }
        });
        if (userIdArr.indexOf(localStorage.getItem('user_id')) === -1) return;
        var newStr = $('.sign-wrap').html();
        newStr += '<p style="color:#666;font-size: 14px;margin-left: 18px;" onclick="newContractAdd();">新合同登记</p>';
        $('.sign-wrap').html(newStr);
    });
}

function newContractAdd() {
    api.openWin({
        name: 'new_contract_add',
        url: '../html/new_contract_add.html',
    });
    // api.prompt({
    //     title: '合同号',
    //     buttons: ['确定', '取消']
    // }, function(ret, err) {
    //     var index = ret.buttonIndex;
    //     var text = ret.text;
    //     if (index === 1) {
    //         text = text.toUpperCase();
    //         if (!text) {
    //             return;
    //         }
    //         apiAjax({
    //             url: '/hybrid/createContractNo',
    //             type: 'post',
    //             data: {
    //                 contract_no: text,
    //             },
    //         },function(res){
    //             api.hideProgress();
    //             api.toast({
    //                 msg: res.msg
    //             });
    //         });
    //     }
    // });
}

function outLeave(){
    confirmLeaveJob(function(){
        api.showProgress({
            title: '正在提交',
            modal: true
        });
        apiAjax({
            url: '/home/attendance/outLeave',
            type: 'put'
        },function(res){
            api.hideProgress();
            api.toast({
                msg: res.msg
            });
            getSignInfo();
        });
    });
}

function backWork(){
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/outBack',
        type: 'put'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
    });
}

/**
 *  获取指派人列表
 */
function getDirectrListByLevel(){
    apiAjax({
        url: '/home/staff/getListByLevel',
        data: {
            level: getLevel()
        }
    },function(res){
        res.data.forEach(function(items,index){
            directorArr.push(items.user_name);
        });
    });
}

function goOutDialog(){
    api.actionSheet({
        title: '选择指派人',
        cancelTitle: '取消',
        buttons: directorArr
    }, function(ret, err) {
        var index = ret.buttonIndex;
        if(index<=directorArr.length){
            var director = directorArr[index-1];
            if (localStorage.getItem('username') == director) {
                api.toast({
                    msg: "指派人不能为自己"
                });
                return;
            }
            api.prompt({
                title: '外出理由',
                buttons: ['确定', '取消']
            }, function(ret, err) {
                var index = ret.buttonIndex;
                var text = ret.text;
                if(index==1){
                    if(text==''){
                        api.toast({
                            msg: "不能为空"
                        });
                        return;
                    }
                    api.showProgress({
                        title: '正在提交',
                        modal: true
                    });
                    apiAjax({
                        url: '/home/attendance/goOut',
                        type: 'put',
                        data: {
                            director: director,
                            reason: text
                        }
                    },function(res){
                        api.hideProgress();
                        api.toast({
                            msg: res.msg
                        });
                        getSignInfo();
                    });
                }
            });
        }
    });
}

function safeDuty(){
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/hybridSafeDuty',
        type: 'post'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
    });
}

function cusDuty(){
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/hybridCusDuty',
        type: 'post'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
    });
}

function insideDuty() {
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/hybridInsideDuty',
        type: 'post'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
    });
}

function recallWork(){
    api.confirm({
        title: '提醒',
        msg: '确定撤销上班？',
        buttons: ['确定', '取消']
    }, function(ret, err) {
        var index = ret.buttonIndex;
        if(index==1){
            api.showProgress({
                title: '正在提交',
                modal: true
            });
            apiAjax({
                url: '/home/attendance/recall',
                type: 'delete'
            },function(res){
                api.hideProgress();
                api.toast({
                    msg: res.msg
                });
                getSignInfo();
            });
        }
    });
}

function recallOverWork(){
    api.confirm({
        title: '提醒',
        msg: '确定撤销加班？',
        buttons: ['确定', '取消']
    }, function(ret, err) {
        var index = ret.buttonIndex;
        if(index==1){
            api.showProgress({
                title: '正在提交',
                modal: true
            });
            apiAjax({
                url: '/home/attendance/recallOverWork',
                type: 'delete'
            },function(res){
                api.hideProgress();
                api.toast({
                    msg: res.msg
                });
                getSignInfo();
            });
        }
    });
}

/**
 *  签到
 *  0 -> 1
 */
function signIn(){
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/sign'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
        getLocation(function(point){
            var gps = JSON.stringify(point);
            apiAjax({
                url: '/home/attendance/signGps',
                type: 'put',
                data: {
                    gps: gps
                }
            },function(){});
        });
    });
}

/**
 *  下班
 *  1 -> 0
 */
function signOut(){
    confirmLeaveJob(function(){
        api.showProgress({
            title: '正在提交',
            modal: true
        });
        apiAjax({
            url: '/home/attendance/leave'
        },function(res){
            api.hideProgress();
            api.toast({
                msg: res.msg
            });
            getSignInfo();
        });
    });
}

function overWorkStart(){
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/overWork',
        type: 'put'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
        getLocation(function(point){
            var gps = JSON.stringify(point);
            apiAjax({
                url: '/home/attendance/overWorkGps',
                type: 'put',
                data: {
                    on_gps: gps
                }
            },function(){});
        });
    });
}

function overWorkEnd(){
    api.showProgress({
        title: '正在提交',
        modal: true
    });
    apiAjax({
        url: '/home/attendance/endOverWork',
        type: 'put'
    },function(res){
        api.hideProgress();
        api.toast({
            msg: res.msg
        });
        getSignInfo();
    });
}

function confirmLeaveJob(cb){
    api.confirm({
        title: '提醒',
        msg: '确定下班？',
        buttons: ['确定', '取消']
    }, function(ret, err) {
        var index = ret.buttonIndex;
        if(index==1){
            cb();
        }
    });
}

//获取位置信息
function getLocation(cb){
    const geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
        cb(r.point);
    });
}

function showWorkTime(data,workTime){
    if(data.status==1||data.status==2){
        show();
        // clearInterval(timer);
        timer = setInterval(function(){
            show();
        },60*1000);
    }

    function show(){
        var sign_on_time = Date.parse(data.checkTime);
        var _date = dateTime()+' 09:00:00';
        _date = _date.replace(/-/g,'/');
        var todayNineClock = Date.parse(_date);
        // var todayNineClock = Date.parse(moment().format('YYYY-MM-DD')+' 09:00:00');
        if(sign_on_time<todayNineClock){
            sign_on_time = todayNineClock;
        }
        var resStamp = Date.now() - sign_on_time;
        resStamp = resStamp<0?0:resStamp;
        var viewWorkTime = parseInt(Number(resStamp));
        viewWorkTime += Number(workTime)*1000*60*60;
        var hours,minute;
        hours = parseInt(viewWorkTime/1000/60/60);
        minute = parseInt(viewWorkTime/1000/60%60);
        viewWorkTime = hours+'时'+minute+'分';
        $('.workTime').html(viewWorkTime);
    }
}

function more() {
    if($('.more').css('display')=='none'){
        $('.more').slideDown();
        $('.moreBar').text('收起');
    }else{
        $('.more').slideUp();
        $('.moreBar').text('更多');
    }
}

/**
 * 获取更多信息
 */
function getMoreInfo(){
    apiAjax({
        url: '/home/attendance/onlineAssessment',
        data: {
            keywords: localStorage.getItem('username'),
            filter: JSON.stringify({
                date: '当月'
            })
        }
    },function(res){
        apiAjax({
            url: '/home/attendance/getHasMobileStaffArr'
        },function(hasMobileStaffArr){
            if(hasMobileStaffArr.indexOf(localStorage.getItem('user_id'))==-1){
                $('.appSign').html('<div>'+
                        '<p>进度警告</p>'+
                        '<p class="warnProgress"></p>'+
                    '</div><div></div><div></div><div></div>');
            }
            for(var key in res.data.data[0]){
                $('.'+key).text(res.data.data[0][key]);
            }
        });
    });
}

function showPopup() {
    var popup = new auiPopup();
    popup.init({
        frameBounces:false,
        location:'top-right',
        buttons:[{
            text:'注销',
            value:'注销'
        }],
    },function(ret){
        log(ret);
    });
}
