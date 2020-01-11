let Tenant = require("../../service/tenant.js"),
  app = getApp(),
  util = require("../../utils/util.js"),
  navCart = require("../../template/cart/cart.js")

Page(Object.assign({}, navCart, {
  data: {
    // category: [],
    activeIndex: 0,
    loading: true,
    noCategory: false
  },
  onLoad: function (options) {
    if (app.globalData.LOGIN_STATUS) {
      this.getCategory()
    } else {
      app.loginOkCallbackList.push(() => {
        this.getCategory()
      })
    }
  },
  //获取数据
  getCategory() {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    let that = this,
      activeID, cateDepth = 1
    new Tenant((res) => {
      if (res.data.length === 0) {
        this.setData({
          category: [],
          loading: false,
          noCategory: true
        })
        return
      }
      activeID = res.data[0].id
      this.setData({
        category: res.data,
        activeID: activeID,
        loading: false
      })
    }).productCategoryTree({
      tenantId: app.globalData.tenantId || wx.getStorageSync('tenantId')
    })
  },
  //左分类切换
  checkout(e) {
    let index = e.currentTarget.dataset.index,
      activeID = e.currentTarget.dataset.id
    this.data.activeID = activeID
    this.data.activeIndex = index
    this.setData({
      activeID: this.data.activeID,
      activeIndex: this.data.activeIndex
    })
  },
  //跳转
  toDetail(e) {
    let id = e.currentTarget.dataset.id
    util.navigateTo({
      url: '../home/productList/productList?page=cate&cateid=' + id,
    })
  },
  // 搜索商品
  searchProduct: function (e) {
    util.navigateTo({
      url: '../home/productList/productList?keyWord=' + e.detail.value + '&page=index'
    })
  },

}))
