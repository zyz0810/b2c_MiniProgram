let Review = require("../../../../service/review.js"),
  app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {},
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    let id = options.id
    this.data.id = id
    let that = this;
    new Review(function(data) {
      var item = [];
      var evaluateList = data.data;
      var ImageLinkArray = [];
      for (var i = 0; i < evaluateList.length; i++) {
        if (evaluateList[i].anonym) {
          evaluateList[i].name = evaluateList[i].name.replace(/^(.).*/, "$1***");
        }
        for (var j = 0; j < evaluateList[i].images.length; j++) {
          ImageLinkArray.push(evaluateList[i].images[j].source);
        }
      }
      that.setData({
        ImageLinkArray: ImageLinkArray,
        evaluateList: data.data,
        pageNumber: 1,
      })
      if (data.data.length == 0) {
        that.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      }
    }).list({
      id: this.data.id,
      pageSize: 10,
      pageNumber: 1
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    var that = this;
    var pageNumber = 1;
    wx.showNavigationBarLoading(); //加载的状态
    new Review(function(data) {
      var item = [];
      var evaluateList = data.data;
      for (var i = 0; i < evaluateList.length; i++) {
        if (evaluateList[i].anonym) {
          evaluateList[i].name = evaluateList[i].name.replace(/^(.).*/, "$1***");
        }
      }
      that.setData({
        evaluateList: data.data,
        pageNumber: 1,
      });
      if (data.data.length == 0) {
        that.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      }
      wx.stopPullDownRefresh()
      wx.hideNavigationBarLoading()
    }).list({
      id: this.data.id,
      pageSize: 10,
      pageNumber: 1
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    var that = this;
    var pageNumber = this.data.pageNumber;
    var evaluateList = this.data.evaluateList;
    var ImageLinkArray = this.data.ImageLinkArray;
    new Review(function(data) {
      if (data.data.length == 0) {
        that.setData({
          tips: '没有更多啦~',
          showtips: false
        })
      } else {
        var item = [];
        for (var i = 0; i < data.data.length; i++) {
          if (evaluateList[i].anonym) {
            data.data[i].name = data.data[i].name.replace(/^(.).*/, "$1***");
          }
          for (var j = 0; j < data.data[i].images.length; j++) {
            ImageLinkArray.push(data.data[i].images[j].source);
          }
        }
        evaluateList = evaluateList.concat(data.data)
        that.setData({
          ImageLinkArray: ImageLinkArray,
          evaluateList: evaluateList,
          loading: false,
          tips: '努力加载中',
          showtips: false,
          pageNumber: pageNumber
        })
      }
    }).list({
      id: this.data.id,
      pageSize: 10,
      pageNumber: ++pageNumber
    });
  },
  preview: function(e) {
    var current = e.target.dataset.src
    var that = this
    wx.previewImage({
      current: current,
      urls: that.data.ImageLinkArray,
      fail: function() {},
      complete: function() {
        console.info("点击图片了");
      },
    })
  }
})