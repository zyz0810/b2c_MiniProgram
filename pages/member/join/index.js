// pages/member/join/index.js
let Tenant = require("../../../service/tenant.js"),
  WxParse = require('../../wxParse/wxParse.js'),
  app = getApp(),
  util = require("../../../utils/util.js"),
  config = require("../../../utils/config.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    productData: {
      unionData: '1'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    if (app.globalData.LOGIN_STATUS) {
      this.getData()
    } else {
      app.loginOkCallback = res => {
        this.getData()
      }
    }
  },
  getData() {
    var that = this
    new Tenant(res => {
      this.setData({
        productData: res.data
      })
      var unionData = res.data.unionData ? res.data.unionData.replace(/embed(?=\s+)/gi, 'video') : res.data.unionData;
      if (unionData != null) {
        WxParse.wxParse('unionData', 'html', unionData, that, 5);
      }
    }).view({
      id: app.globalData.tenantId
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },
  //联系我们
  callUs: function() {
    var that = this
    wx.makePhoneCall({
      phoneNumber: that.data.productData.ownerUserName,
      success(res) {

      },
      fail(err) {
        if (err.errMsg.indexOf('cancel') === -1) {
          util.errShow(that.data.productData.ownerUserName, 5000)
        }

      }
    })
  },
  onShareAppMessage() {
    var that = this
    var title = '"' + that.data.productData.name + '"' + '邀请您加盟'
    return {
      title: '"' + that.data.productData.name + '"' + '邀请您加盟',
      path: 'pages/member/join/index',
      success: function(res) {
        // 转发成功
        wx.showToast({
          title: '转发成功',
          icon: 'success'
        })
      },
      fail: function(res) {
        // 转发失败
      }
    }

  }
})