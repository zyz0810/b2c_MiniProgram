let app = getApp(),
  Product = require("../../../service/product.js"),
  util = require("../../../utils/util.js"),
  config = require("../../../utils/config.js")
Page(Object.assign({}, {

  /**
   * 页面的初始数据
   */
  data: {
    activeTabIndex: 0,
    showType: false, //false块显示true行显示
    productData: [], //数据
    showUp: false,
    getDataComplete: false
  },
  __pt_toDetail(e) {
    wx.navigateTo({
      url: '/pages/home/productDetails/productDetails?id=' + e.currentTarget.dataset.id + '&from=shelf',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    this.onPullDownRefresh()
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    var that = this;
    var productData = []
    new Product(function(data) {
      for (var i = 0; i < data.data.length; i++) {
        for (var j = 0; j < data.data[i].productListModels.length; j++) {
          productData.push(data.data[i].productListModels[j])
        }
      }
      that.setData({
        productData: productData,
        getDataComplete: true
      });
      wx.stopPullDownRefresh()
      wx.hideNavigationBarLoading()
    }).shelvesList({
      shelvesNo: wx.getStorageSync('shelvesNo'),
      cartType: 'shelves',
      tenantId: app.globalData.tenantId,
      appid: config.APPID
    })

  }
}))