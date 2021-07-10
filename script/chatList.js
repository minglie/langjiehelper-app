var scroller = {
    noti_client_affair_group_uuid: null,
    page: 1,
    num: 10,
    hasmore: true,
    loading: false,
    keywords: '',
    height: 0
};
apiReady(function() {
    $('.aui-chat').html('');
    var pullRefresh = new auiPullToRefresh({
        container: document.querySelector('.aui-refresh-content'),
        triggerDistance: 100
    },function(ret){
        if(ret.status=="success"){
            if(scroller.loading) return;
            if(!scroller.hasmore) {
                api.toast({
                    msg: '没有更多了'
                });
                pullRefresh.cancelLoading();
                return;
            }
            scroller.page++;
            getMsgList(function(){
                pullRefresh.cancelLoading();
            });
        }
    });
    scroller.noti_client_affair_group_uuid = api.pageParam.affairId;
    scroller.page = 1;
    scroller.hasmore = true;
    scroller.loading = false;
    if(!api.pageParam.affairId||api.pageParam.affairId=='null'){
        api.toast({
            msg: '请登录PC端处理'
        });
        return;
    }
    getMsgList();
});

function getMsgList(cb) {
    if(!scroller.hasmore) return;
    scroller.loading = true;
    apiAjax({
        url: '/home/notiClient/list',
        data: {
            noti_client_affair_group_uuid: scroller.noti_client_affair_group_uuid,
            page: scroller.page,
            num: scroller.num,
            keywords: scroller.keywords
        }
    },function(res){
        scroller.loading = false;
        if(res.data.length==0) {
            scroller.hasmore = false;
            api.toast({
                msg: '没有更多了'
            });
        }
        res.data = res.data.reverse();
        var str = '';
        for (var i = 0; i < res.data.length; i++) {
            str += msgTemp(res.data[i]);
        }
        $('.aui-chat').prepend(str);
        setTimeout(function(){
            if(scroller.page==1){
                window.scrollTo(0, 3000);
            }else{
                var _scrollHeight = document.getElementsByTagName('body')[0].scrollHeight - scroller.height;
                document.getElementsByTagName('body')[0].scrollTop = _scrollHeight;
                window.scrollTo(0, _scrollHeight);
            }
            scroller.height = document.getElementsByTagName('body')[0].scrollHeight;
            if(api.pageParam.locationId){

            }
        },30);
        if(cb) cb();
    })
}
