let Tenant = require("../../service/tenant.js"),
  app = getApp(),
  util = require("../../utils/util.js"),
  Cart = require("../../service/cart.js"),
  CartShelves = require("../../service/cartShelves.js"),
  navCart = require("../../template/cart/cart.js")

Page(Object.assign({}, navCart, {
  data: {
    // category: [],
    activeIndex: 0,
    loading: true,
    noCategory: false
  },
  onShow() {
    var cartShop = 0
    var cartNumShelf = 0
    var cartNumAll = 0


    var that = this
    wx.getSetting({
      success(res) {
        wx.hideToast();
        if (!res.authSetting['scope.userInfo']) {
          wx.setStorageSync('authorize', false)
        } else {
          wx.setStorageSync('authorize', true)
          //获取购物车商品数量，并在tab角标处显示
          new Cart(function (data) {
            cartShop = parseInt(data.data)
            if (wx.getStorageSync('shelvesNo')) {
              new CartShelves(function (dataShelf) {
                dataShelf.data.cartItems && dataShelf.data.cartItems.length > 0 && dataShelf.data.cartItems.forEach(item => {
                  cartNumShelf += item.quantity
                })
                cartNumAll = parseInt(cartShop) + parseInt(cartNumShelf)
                if (cartNumAll > 0 && cartNumAll < 99) {
                  wx.setTabBarBadge({
                    index: 3,
                    text: cartNumAll.toString()
                  })
                } else if (cartNumAll > 99) {
                  wx.setTabBarBadge({
                    index: 3,
                    text: '99+'
                  })
                } else {
                  wx.removeTabBarBadge({
                    index: 3
                  })
                }
              }).list({
                shelvesNo: wx.getStorageSync('shelvesNo'),
                tenantId: app.globalData.tenantId,
                cartType: 'shelves'
              })
            } else {
              cartNumAll = cartShop
              if (cartNumAll > 0 && cartNumAll < 99) {
                wx.setTabBarBadge({
                  index: 3,
                  text: cartNumAll.toString()
                })
              } else if (cartNumAll > 99) {
                wx.setTabBarBadge({
                  index: 3,
                  text: '99+'
                })
              } else {
                wx.removeTabBarBadge({
                  index: 3
                })
              }
            }

          }).count({
            tenantId: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
          })
        }
      }
    })

    
  },
  onLoad: function(options) {
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
  searchProduct: function(e) {
    util.navigateTo({
      url: '../home/productList/productList?keyWord=' + e.detail.value + '&page=index'
    })
  },

}))