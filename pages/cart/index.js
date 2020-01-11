var app = getApp()
let util = require('../../utils/util.js')
let Cart = require('../../service/cart.js')
let CartShelves = require('../../service/cartShelves.js')
let member = require('../../service/member.js')

// pages/cart/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cartList: [], //购物车列表
    total: 0, //计算总价
    checkAll: false, //是否选择全部
    selectedId: [], //已选择商品id
    mailPromotion: null, //包邮信息
    sys: app.globalData.sys,
    currentTab: 0
  },
  //选择顶部tab框
  clickTab(e) {
    var type = e.currentTarget.dataset.type
    if (type == this.data.currentTab) {
      return
    } else {
      this.setData({
        currentTab: type
      })
    }
  },
  //商品check事件
  checkItemChange(e) {
    //tip:setData设置数据会响应到页面，但会有延时，this.data不响应页面

    let value = e.detail.value
    let cartList = this.data.cartList
    for (let i = 0, j = cartList.length; i < j; i++) {
      if (value.indexOf(cartList[i].id + '') + 1 || value.indexOf(cartList[i].id) + 1) {
        cartList[i].selected = true
      } else {
        cartList[i].selected = false
      }
    }
    new Cart(res => {
      this.data.cartList = cartList
      this.data.selectedId = value
      this.setData({
        checkAll: [...new Set(e.detail.value)].length === this.data.cartList.length,
        cartList: cartList
      })
      this.calcTotal()
    }).selected({
      ids: value
    })
  },
  //商品check事件(货架商品)
  checkItemChangeShelf(e) {
    //tip:setData设置数据会响应到页面，但会有延时，this.data不响应页面

    let value = e.detail.value
    let cartListShelf = this.data.cartListShelf
    for (let i = 0, j = cartListShelf.length; i < j; i++) {
      if (value.indexOf(cartListShelf[i].id + '') + 1 || value.indexOf(cartListShelf[i].id) + 1) {
        cartListShelf[i].selected = true
      } else {
        cartListShelf[i].selected = false
      }
    }
    new CartShelves(res => {
      this.data.cartListShelf = cartListShelf
      this.data.selectedIdShelf = value
      this.setData({
        checkAllShelf: [...new Set(e.detail.value)].length === this.data.cartListShelf.length,
        cartListShelf: cartListShelf
      })
      this.calcTotalShelf()
    }).selected({
      ids: value
    })
  },
  // 删除购物车商品
  deleteItem(e) {
    let cartList = this.data.cartList
    let name = e.currentTarget.dataset.name
    let id = e.currentTarget.dataset.id
    let that = this
    wx.showModal({
      title: '提示',
      content: '是否确定删除该商品(' + name + ')',
      success: function(res) {
        if (res.confirm) {
          new Cart((res) => {
            var cartShop = 0
            var cartNumShelf = 0
            var cartNumAll = 0
            //获取购物车商品数量，并在tab角标处显示
            new Cart(function(data) {
              cartShop = parseInt(data.data)
              if (wx.getStorageSync('shelvesNo')) {
                new CartShelves(function(dataShelf) {
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
            that.onShow()
          }).delete({
            ids: [id]
          })
        } else if (res.cancel) {

        }
      }
    })
  },
  // 删除商品（货架商品）
  deleteItemShelf(e) {
    let cartListShelf = this.data.cartListShelf
    let name = e.currentTarget.dataset.name
    let id = e.currentTarget.dataset.id
    let that = this
    wx.showModal({
      title: '提示',
      content: '是否确定删除该商品(' + name + ')',
      success: function(res) {
        if (res.confirm) {
          new Cart((res) => {
            that.onShow()
          }).delete({
            ids: [id],
            shelvesNo: wx.getStorageSync('shelvesNo'),
            cartType: 'shelves'
          })
        }
      }
    })
  },
  //添加、减少商品数目
  revisenum(e) {
    let that = this
    let data = e.currentTarget.dataset
    let id = data.id,
      rtype = data.type,
      min = data.min
    let localnum = this.getItemById(id).quantity
    let result = min
    if (localnum < min) {
      this.setNum(id, min)
      return
    }
    if (rtype == 'add') {
      this.setNum(id, ++localnum)
      return
    }
    if (rtype == 'reduce') {
      this.setNum(id, localnum - 1 <= min ? min : --localnum)
      return
    }
  },
  //添加、减少商品数目(货架商品)
  revisenumShelf(e) {
    let that = this
    let data = e.currentTarget.dataset
    let id = data.id,
      rtype = data.type,
      min = data.min
    let localnum = this.getItemByIdShelf(id).quantity
    let result = min
    if (localnum < min) {
      this.setNumShelf(id, min)
      return
    }
    if (rtype == 'add') {
      this.setNumShelf(id, ++localnum)
      return
    }
    if (rtype == 'reduce') {
      this.setNumShelf(id, localnum - 1 <= min ? min : --localnum)
      return
    }
  },
  //通过id获取商品
  getItemById(id) {
    let cartList = this.data.cartList
    for (let i = 0, j = cartList.length; i < j; i++) {
      if (cartList[i].id == id) {
        return cartList[i]
      }
    }
  },
  //通过id获取商品(货架商品)
  getItemByIdShelf(id) {
    let cartListShelf = this.data.cartListShelf
    for (let i = 0, j = cartListShelf.length; i < j; i++) {
      if (cartListShelf[i].id == id) {
        return cartListShelf[i]
      }
    }
  },
  //输入商品数目
  inputnum(e) {
    let id = e.currentTarget.dataset.id
    let val = e.detail.value
    if (isNaN(val)) {
      this.setNum(id, val)
      return
    }
    this.setNum(id, val)
  },
  //输入商品数目(货架商品)
  inputnumShelf(e) {
    let id = e.currentTarget.dataset.id
    let val = e.detail.value
    if (isNaN(val)) {
      this.setNumShelf(id, val)
      return
    }
    this.setNumShelf(id, val)
  },
  //全选check事件
  checkAllChange(e) {
    let that = this
    let selectAll = e.detail.value.length
    let cartList = this.data.cartList
    let selectedId = []
    for (let i = 0, j = cartList.length; i < j; i++) {
      cartList[i].selected = selectAll
      selectedId.push(cartList[i].id)
    }
    new Cart(res => {
      //设置已选择商品
      this.data.selectedId = selectAll ? selectedId : []
      this.setData({
        cartList: cartList,
        checkAll: selectAll ? true : false
      })
      this.calcTotal()
    }).selected({
      ids: selectAll ? selectedId : []
    })
  },
  //全选check事件（货架商品）
  checkAllChangeShelf(e) {
    let that = this
    let selectAllShelf = e.detail.value.length
    let cartListShelf = this.data.cartListShelf
    let selectedIdShelf = []
    for (let i = 0, j = cartListShelf.length; i < j; i++) {
      cartListShelf[i].selected = selectAllShelf
      selectedIdShelf.push(cartListShelf[i].id)
    }
    new Cart(res => {
      //设置已选择商品
      this.data.selectedIdShelf = selectAllShelf ? selectedIdShelf : []
      this.setData({
        cartListShelf: cartListShelf,
        checkAllShelf: selectAllShelf ? true : false
      })
      this.calcTotalShelf()
    }).selected({
      ids: selectAllShelf ? selectedIdShelf : []
    })
  },
  //计算总价
  calcTotal() {
    //获取购物车商品数量，并在tab角标处显示
    var cartShop = 0
    var cartNumShelf = 0
    var cartNumAll = 0
    new Cart(function(data) {
      cartShop = parseInt(data.data)
      if (wx.getStorageSync('shelvesNo')) {
        new CartShelves(function(dataShelf) {
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

    let selectedId = this.data.selectedId,
      total = 0
    if (selectedId.length == 0) {
      this.setData({
        total: total
      })
      return
    }
    selectedId = [...new Set(selectedId)]
    selectedId.forEach((val, index) => {
      let item = this.getItemById(val)
      if (item)
        total += item.quantity * item.price
    })
    this.setData({
      total: total.toFixed(2)
    })
  },
  //计算总价(货架商品)
  calcTotalShelf() {
    //获取购物车商品数量，并在tab角标处显示
    var cartShop = 0
    var cartNumShelf = 0
    var cartNumAll = 0
    new Cart(function(data) {
      cartShop = parseInt(data.data)
      if (wx.getStorageSync('shelvesNo')) {
        new CartShelves(function(dataShelf) {
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
    let selectedIdShelf = this.data.selectedIdShelf,
      totalShelf = 0
    if (selectedIdShelf.length == 0) {
      this.setData({
        totalShelf: totalShelf
      })
      return
    }
    selectedIdShelf = [...new Set(selectedIdShelf)]
    selectedIdShelf.forEach((val, index) => {
      let item = this.getItemByIdShelf(val)
      if (item)
        totalShelf += item.quantity * item.price
    })
    this.setData({
      totalShelf: totalShelf.toFixed(2)
    })
  },
  //设置商品数量
  setNum(id, num) {
    let cartList = this.data.cartList
    let that = this
    if (this.getItemById(id).quantity == num) return
    //编辑数目调用接口
    new Cart(function(data) {
      for (let i = 0, j = cartList.length; i < j; i++) {
        if (cartList[i].id == id) {
          cartList[i].quantity = num
          that.data.cartList = cartList
          that.setData({
            cartList: that.data.cartList
          })
          break
        }
      }
      that.calcTotal()
    }, function(err) {
      util.errShow(err.message.content)
      that.setData({
        cartList: that.data.cartList
      })
    }).edit({
      id: id,
      quantity: num
    })
  },
  //设置商品数量(货架商品)
  setNumShelf(id, num) {
    let cartListShelf = this.data.cartListShelf
    let that = this
    if (this.getItemByIdShelf(id).quantity == num) return
    //编辑数目调用接口
    new CartShelves(function(data) {
      for (let i = 0, j = cartListShelf.length; i < j; i++) {
        if (cartListShelf[i].id == id) {
          cartListShelf[i].quantity = num
          that.data.cartListShelf = cartListShelf
          that.setData({
            cartListShelf: that.data.cartListShelf
          })
          break
        }
      }
      that.calcTotalShelf()
    }, function(err) {
      util.errShow(err.message.content)
      that.setData({
        cartListShelf: that.data.cartListShelf
      })
    }).edit({
      id: id,
      quantity: num,
      cartType: 'shelves',
      shelvesNo: wx.getStorageSync('shelvesNo')
    })
  },
  onLoad: function(options) {
    this.data.from = options.from ? options.from : ''
    if (wx.getStorageSync('shelvesNo')) {
      this.setData({
        shelvesNo: true
      })
    } else {
      this.setData({
        shelvesNo: false
      })
    }
    if (options.from) {
      this.setData({
        currentTab: 1
      })
    } else {
      this.setData({
        currentTab: 0
      })
    }
  },
  getCartDataWhenLogin() {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    var that = this
    new Cart(function(data) {
      if (!data.data.tenants || data.data.tenants.length == 0) {
        wx.removeTabBarBadge({
          index: 3
        })
        that.setData({
          cartList: [],
          total: 0,
          checkAll: false,
          selectedId: [],
          mailPromotion: null,
          getDataComplete: true
        })
        return
      }
      let selectedId = [],
        cartList = data.data.tenants[0].cartItems,
        mailPromotion = data.data.tenants[0].mailPromotion
      for (let i = 0, j = cartList.length; i < j; i++) {
        if (cartList[i].selected) {
          selectedId.push(cartList[i].id)
        }
      }
      that.data.selectedId = selectedId

      that.setData({
        cartList: cartList,
        checkAll: [...new Set(selectedId)].length === cartList.length,
        selectedId: selectedId,
        mailPromotion: mailPromotion,
        getDataComplete: true
      })

      // that.calcTotal()
      if (that.data.authorize == true) {
        that.calcTotal()
      }
    }).list({
      tenantId: app.globalData.tenantId
    })


    //货架购物车列表
    if (this.data.shelvesNo) {
      new CartShelves(function(data) {
        if (data.data.cartItems.length == 0) {
          that.setData({
            cartListShelf: [],
            totalShelf: 0,
            checkAllShelf: false,
            selectedIdShelf: [],
            getDataComplete: true
          })
          return
        }
        let selectedIdShelf = [],
          cartListShelf = data.data.cartItems
        for (let i = 0, j = cartListShelf.length; i < j; i++) {
          if (cartListShelf[i].selected) {
            selectedIdShelf.push(cartListShelf[i].id)
          }
        }
        that.data.selectedIdShelf = selectedIdShelf
        that.setData({
          cartListShelf: cartListShelf,
          checkAllShelf: [...new Set(selectedIdShelf)].length === cartListShelf.length,
          selectedIdShelf: selectedIdShelf,
          getDataComplete: true
        })
        // that.calcTotalShelf()
        if (that.data.authorize == true) {
          that.calcTotalShelf()
        }
      }).list({
        shelvesNo: wx.getStorageSync('shelvesNo'),
        tenantId: app.globalData.tenantId,
        cartType: 'shelves'
      })
    }
  },
  onShow: function() {
    var that = this
    var authorize = wx.getStorageSync('authorize')
    this.setData({
      mainColor: app.globalData.mainColor,
      authorize: authorize
    })
    wx.getSetting({
      success(res) {
        wx.hideToast();
        if (!res.authSetting['scope.userInfo']) {
          wx.setStorageSync('authorize', false)
          that.setData({
            authorize: false
          })
        } else {
          wx.setStorageSync('authorize', true)
          that.setData({
            authorize: true,
            // getDataComplete: false
          })
        }
      }
    })
    if (app.globalData.LOGIN_STATUS) {
      that.getCartDataWhenLogin()
    } else {
      app.loginOkCallbackList.push(() => {
        that.getCartDataWhenLogin()
      })
    }
  },
  //点击去逛逛
  goIndex() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },
  //结算
  submit: function(e) {
    if (e.detail.formId) {
      new member(res => {

      }).addFormId({
        formIds: e.detail.formId
      })
    }
    if (this.data.selectedId.length <= 0) {
      util.errShow('请选择结算商品')
    } else {
      util.navigateTo({
        url: '../pay/pay',
      })
    }
  },
  //结算（货架商品）
  submitShelf: function(e) {
    if (e.detail.formId) {
      new member(res => {

      }).addFormId({
        formIds: e.detail.formId
      })
    }
    if (this.data.selectedIdShelf.length <= 0) {
      util.errShow('请选择结算商品')
    } else {
      util.navigateTo({
        url: '../pay/payShelf',
      })
    }
  },


  //购物车点击进商品详情
  goProductDetail: function(e) {
    var id = e.currentTarget.dataset.id;
    var from = e.currentTarget.dataset.from;
    if (from == "shelf") {
      util.navigateTo({
        url: '/pages/home/productDetails/productDetails?id=' + id + '&from=shelf',
      })
    } else {
      util.navigateTo({
        url: '/pages/home/productDetails/productDetails?id=' + id,
      })
    }
  }
})