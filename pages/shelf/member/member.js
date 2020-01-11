// pages/shelf/member.js.
let app = getApp();
let actionsheet = require("../../../template/actionsheet/payactionsheet.js");
let util = require('../../../utils/util.js');
let receiver = require('../../../service/receiver.js');
let order = require('../../../service/order.js');
let tenant = require('../../../service/tenant.js');
let product = require('../../../service/product.js');
let cancel = require("../../../template/authorize/authorize.js"),
  bindgetuserinfo = require("../../../template/authorize/authorize.js")
Page(Object.assign({}, cancel, bindgetuserinfo,{

  /**
   * 页面的初始数据
   */
  data: {
    authorizeShow: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      userInfo: app.globalData.memberInfo
    })
  },

  backToindex: function() {
    wx.navigateBack({
      delta: 1
    })
  },

  allOrder: function() {
    var that = this
    if (that.data.authorize == true) {
      wx.navigateTo({
        url: '/pages/member/order/order'
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }
  },

  allCoupon: function() {
    var that = this
    if (that.data.authorize == true) {
      wx.navigateTo({
        url: '/pages/member/coupon/list'
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }
  },

  feedback: function() {
    var that = this
    if (that.data.authorize == true) {
      wx.navigateTo({
        url: '/pages/shelf/feedback/feedback'
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }
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
    var that = this
    var authorize = wx.getStorageSync('authorize')
    this.setData({
      mainColor: app.globalData.mainColor,
      authorize: authorize
    })
    //官方客服电话
    new tenant(res => {
      this.setData({
        mobile: res.data.mobile ? res.data.mobile : '0551-63676688'
      })
    }).view({
      id: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
    }),
    wx.getSetting({
      success(res) {
        wx.hideToast();
        if (!res.authSetting['scope.userInfo']) {
          that.setData({
            authorizeShow: false,
            authorize:false
          })
        } else {
          wx.setStorageSync('authorize', true)
          that.setData({
            authorize: true
          })
        }
      }
    })
  },
  goAuthorize: function () {
    this.setData({
      authorizeShow: true
    })
  },
  //联系我们
  callUs: function () {
    var that = this
    wx.makePhoneCall({
      phoneNumber: that.data.mobile,
      success(res) {

      },
      fail(err) {
        if (err.errMsg.indexOf('cancel') === -1) {
          util.errShow(that.data.mobile, 5000)
        }

      }
    })
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

  }
}))