// apiReady(function(){
//     $('.name').click(function(){
//         triggerCheckLogin();
//     });
//     triggerCheckLogin();
//
//     api.addEventListener({
//         name: 'frame3'
//     }, function(ret, err) {
//         triggerCheckLogin();
//     });
// });

function triggerCheckLogin(){
    checkLogin(function(){
        $('.name').text(localStorage.getItem('username'));
    });
}

function logout(){
    if(!localStorage.getItem('token')) return;
    var dialog = new auiDialog({});
    dialog.alert({
        title:"提示",
        msg:'确定退出',
        buttons:['取消','确定']
    },function(ret){
        if(ret&&ret.buttonIndex==2){
            apiAjax({
                url: '/hybrid/user/logout',
                type: 'delete',
                data: {
                    self_phone: localStorage.getItem('phone')
                }
            },function(result){

            });
            localStorage.removeItem('username');
            localStorage.removeItem('phone');
            localStorage.removeItem('user_id');
            localStorage.removeItem('token');
            localStorage.removeItem('lastPhone');
            localStorage.removeItem('lastTime');
            //群发execScript需要更新登陆的页面
            updateLoginStatus();
        }
    });
}

function addContacts() {
    api.openContacts(function(ret, err) {
        if (ret) {
            var phone = ret.phone;
            var name = ret.name;
            phone = phone.replace(/\s/ig, '');
            api.prompt({
                title: '公司名',
                buttons: ['确定', '取消']
            }, function(ret, err) {
                var index = ret.buttonIndex;
                var text = ret.text;
                if (index === 1) {
                    subContacts(name, phone, text);
                }
            });
        }
    });
}

function subContacts(name, phone, company) {
    api.showProgress({
        title: '正在提交...',
        text: '',
        modal: true
    });
    apiAjax({
        url: '/hybrid/contacts/add',
        type: 'post',
        data: {
            name: name,
            phone: phone,
            company: company
        }
    },function(result){
        api.toast({
            msg: result.msg
        });
        api.hideProgress();
    });
}
