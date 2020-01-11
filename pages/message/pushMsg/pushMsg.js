let Message = require("../../../service/message.js"),
  util = require("../../../utils/util.js"),
  app = getApp()
Page({

  data: {
    sType: '',
    tips: '加载中...',
  },
  toOrder(e) {
    var sid = e.currentTarget.dataset.sid;
    util.navigateTo({
      url: '/pages/member/order/orderDetails/orderDetails?id=' + sid,

    })
  },
  showMore(e) {
    var index = e.currentTarget.dataset.index
    var msg = this.data.msg
    msg[index].showMore = !msg[index].showMore
    this.setData({
      msg: msg
    })
  },
  toAccount() {
    util.navigateTo({
      url: '/pages/member/purse/bill/bill',
    })
  },
  onLoad: function(options) {
    if (app.globalData.LOGIN_STATUS) {
      this.getInfoWhenLogin(options)
    } else {
      app.loginOkCallback = res => {
        this.getInfoWhenLogin(options)
      }
    }
  },
  getInfoWhenLogin(options) {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    let sType = options.type,
      title = sType == 'account' ? '账单消息' : (sType == "order" ? '订单消息' : '系统消息')
    wx.setNavigationBarTitle({
      title: title
    })
    new Message(res => {
      for (var i = 0; i < res.data.length; i++) {
        res.data[i].showMore = false
      }
      this.setData({
        msg: res.data,
        sType: sType,
        pageNumber: 1
      })
      if (res.data.length < 10) {
        this.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      }
    }).list({
      type: sType,
      pageNumber: 1,
      pageSize: 10
    })
  },
  onShow: function() {

  },
  onPullDownRefresh() {
    new Message(res => {
      this.setData({
        msg: res.data,
        sType: this.data.sType,
        pageNumber: 1
      })
      wx.stopPullDownRefresh()
    }).list({
      type: this.data.sType,
      pageNumber: 1,
      pageSize: 10
    })
  },
  //下拉加载
  onReachBottom() {
    var that = this;
    var pageNumber = this.data.pageNumber;
    var msg = this.data.msg;
    new Message(function(data) {
      if (data.data.length == 0) {
        that.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      } else {
        msg = msg.concat(data.data);
        that.setData({
          pageNumber: pageNumber
        })
        that.setData({
          msg: msg,
          loading: false,
          tips: '努力加载中',
          showtips: false
        })
      }
    }).list({
      pageSize: 10,
      pageNumber: ++pageNumber
    });
  }
})