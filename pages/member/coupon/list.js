let app = getApp();
let util = require('../../../utils/util.js');
let coupon = require('../../../service/coupon.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {


  },


  onLoad: function(options) {
    if (app.globalData.LOGIN_STATUS) {
      this.getInfoWhenLogin()
    } else {
      app.loginOkCallback = res => {
        this.getInfoWhenLogin()
      }
    }

  },
  getInfoWhenLogin() {
    var that = this;
    this.setData({
      mainColor: app.globalData.mainColor
    })
    new coupon(function(data) {
      that.setData({
        data: data.data
      })
    }).list({
      tenantId: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this;
  },
  goScan() {
    wx.switchTab({
      url: '/pages/home/home',
    })
  }

})