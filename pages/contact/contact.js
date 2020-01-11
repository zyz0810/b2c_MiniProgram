let app = getApp();
let util = require('../../utils/util.js');
let tenant = require('../../service/tenant.js');
let lbs = require('../../service/lbs.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {


  },
  onShow: function() {
    if (app.globalData.LOGIN_STATUS) {
      this.getData()
    } else {
      app.loginOkCallback = res => {
        this.getData()
      }
    }
  },


  onLoad: function(options) {

  },

  getData() {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    var that = this;
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success: function(res) {
        var latitude = res.latitude
        var longitude = res.longitude
        new lbs(function(data) {
          new lbs(function() {
            new tenant(function(data) {
              that.setData({
                listData: data.data,
                pageModel: data.pageModel
              })
            }).deliveryCenterList({
              id: app.globalData.tenantId,
              isCurrentArea: true,
              pageNumber: 1,
              pageSize: 8
            })
          }).update({
            lat: latitude,
            lng: longitude,
            areaId: data.data.bd_area.cityId ? data.data.bd_area.cityId : 1029
          })
        }).get({
          lat: latitude,
          lng: longitude
        })
      },
      fail: function(err) {
        new tenant(function(data) {
          that.setData({
            listData: data.data,
            pageModel: data.pageModel
          })
        }).deliveryCenterList({
          id: app.globalData.tenantId,
          isCurrentArea: true,
          pageNumber: 1,
          pageSize: 8
        })
        console.log(err)
        if (err.errMsg.indexOf('auth') > -1) {
          wx.showModal({
            title: '提示',
            content: '未授予定位权限，是否前往设置',
            success: function(res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      }
    })
    new tenant(function(data) {
      that.setData({
        logo: data.data.logo
      })
    }).view({
      id: app.globalData.tenantId
    })
  },
  goNav: function(e) {
    var lng = e.currentTarget.dataset.lng;
    var lat = e.currentTarget.dataset.lat;
    var name = e.currentTarget.dataset.name;
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success: function(res) {
        var latitude = res.latitude
        var longitude = res.longitude
        wx.openLocation({
          latitude: lat,
          longitude: lng,
          scale: 28,
          name: name
        })
      },
      fail: function(err) {
        if (err.errMsg.indexOf('auth') > -1) {
          wx.showModal({
            title: '提示',
            content: '未授予定位权限，是否前往设置',
            success: function(res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      }
    })
  },
  goCall: function(e) {
    var phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      success(res) {},
      fail(err) {}
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    var that = this;
    new tenant(function(data) {
      wx.stopPullDownRefresh()
      that.setData({
        listData: data.data,
        pageModel: data.pageModel
      })
      if (data.data.length == 0) {
        that.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      } else if (data.data.length == that.data.pageModel.pageSize) {
        that.setData({
          tips: '努力加载中~',
          showtips: false
        })
      }
    }).deliveryCenterList({
      id: app.globalData.tenantId,
      pageNumber: 1,
      isCurrentArea: true,
      pageSize: 8
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    var that = this;
    wx.showNavigationBarLoading();
    var pageModel = this.data.pageModel;
    var listData = this.data.listData;
    if (this.data.pageModel.totalPages > this.data.pageModel.pageNumber) {
      new tenant(function(data) {
        wx.hideNavigationBarLoading() //完成停止加载
        if (data.pageModel.totalPages < data.pageModel.pageNumber) {
          that.setData({
            tips: '没有更多啦~',
            showtips: false
          })
        } else {
          listData = listData.concat(data.data)
          that.setData({
            listData: listData,
            loading: false,
            tips: data.data.length < that.data.pageModel.pageSize ? '没有更多啦~' : '努力加载中',
            showtips: false
          })
        }
      }).deliveryCenterList({
        pageNumber: ++pageModel.pageNumber,
        pageSize: 8,
        id: app.globalData.tenantId,
        isCurrentArea: true,
      });
    } else {
      wx.hideNavigationBarLoading() //完成停止加载
      that.setData({
        tips: '没有更多啦~',
        showtips: false
      })
    }
  }
})