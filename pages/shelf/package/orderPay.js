// pages/shelf/package/orderPay.js
var app = getApp(),
  util = require('../../../utils/util.js'),
  Shelf = require("../../../service/shelf.js"),
  Order = require("../../../service/order.js"),
  cancel = require("../../../template/authorize/authorize.js"),
  bindgetuserinfo = require("../../../template/authorize/authorize.js")
Page(Object.assign({}, cancel, bindgetuserinfo, {

  /**
   * 页面的初始数据
   */
  data: {
    quantity: '1',
    amount: 0,
    memo: '',
    objectshippingMethods: [{
      id: 0,
      method: '渠道配送'
    }, {
      id: 1,
      method: '上门自取'
    }],
    count: 3,
    showModal: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.data.id = options.id
    this.setData({
      mainColor: app.globalData.mainColor,
      mobile: app.globalData.memberInfo.mobile,
      name: app.globalData.memberInfo.displayName,
      quantity: options.quantity,
      shelvesShippingMethod: 0
    })
    new Shelf(res => {
      this.setData({
        info: res.data,
        amount: options.quantity * res.data.salePrice
      })
    }).confirm({
      id: options.id,
      count: options.quantity
    })
  },
  //单选按钮选择配送方式
  radioChange: function(e) {
    console.log(e)
    var that = this;
    this.setData({
      shelvesShippingMethod: e.detail.value
    })
  },
  revisenum(e) {
    let stype = e.currentTarget.dataset.type,
      that = this,
      min = 1,
      max = 99,
      quantity = parseInt(this.data.quantity)
    switch (stype) {
      case 'input':
        quantity = (!isNaN(e.detail.value) && e.detail.value >= min && e.detail.value <= max) ? e.detail.value : this.data.quantity
        that.calcAmount(quantity)
        break;
      case 'add':
        quantity = quantity + 1 <= max ? (quantity < min ? min : ++quantity) : max
        if (quantity == max) {
          wx.showToast({
            title: '限购99',
          })
        }
        that.calcAmount(quantity)
        break;
      case 'reduce':
        quantity = quantity - 1 < min ? 1 : --quantity
        that.calcAmount(quantity)
        break;
    }
    this.setData({
      quantity: quantity
    })
  },
  //计算购物价格
  calcAmount(num) {
    this.setData({
      amount: (num * this.data.info.salePrice).toFixed(2)
    })
  },
  //输入手机号
  mobile(e) {
    this.setData({
      mobile: e.detail.value
    })
  },
  //输入留言
  inputMemo(e) {
    this.setData({
      memo: e.detail.value
    })
  },
  countdown(that) {
    var that = this
    var count = that.data.count
    if (count == 0) {
      that.setData({
        showModal: false
      })
      clearTimeout(time);
      return false;
    }
    var time = setTimeout(function() {
      that.setData({
        count: count - 1,
      })
      that.countdown(that);
    }, 1000)
  },
  formSubmit() {
    var that = this

    if (that.data.authorize == true) {
      if (!(/^1\d{10}$/.test(that.data.mobile))) {
        util.errShow('手机号格式错误');
      } else {
        wx.showLoading({
          title: '订单提交中'
        })
        new Shelf(res => {
          if (res.data.paidAmount == 0) {
            wx.hideLoading()
            that.countdown(that)
            that.setData({
              showModal: true
            })
            setTimeout(function () {
              wx.redirectTo({
                url: '../tenant/data?shelvesOrderId=' + res.data.shelvesOrderId,
              })
            }, 3000)
          } else {
            new Order(submitData => {
              wx.hideLoading()
              wx.requestPayment({
                'timeStamp': submitData.data.timeStamp,
                'nonceStr': submitData.data.nonceStr,
                'package': submitData.data.package,
                'signType': submitData.data.signType,
                'paySign': submitData.data.paySign,
                'success': function (paySucc) {
                  that.countdown(that)
                  that.setData({
                    showModal: true
                  })
                  setTimeout(function () {
                    wx.redirectTo({
                      url: '../tenant/data?shelvesOrderId=' + res.data.shelvesOrderId,
                    })
                  }, 3000)
                },
                'fail': function () {
                  wx.redirectTo({
                    url: "order",
                  })
                }
              })
            }).paymentSubmit({
              paymentPluginId: 'chinaumsAppletPayPlugin',
              sn: res.data.paymentSn
            })
          }
        }).createOrder({
          id: that.data.id,
          count: that.data.quantity,
          tenantId: app.globalData.tenantId,
          extensionId: wx.getStorageSync('shelfExtensionId'),
          mobile: that.data.mobile,
          memo: that.data.memo,
          shelvesShippingMethod: that.data.shelvesShippingMethod
        })
      }
    } else {
      that.setData({
        authorizeShow: true
      })
    }

    // wx.getSetting({
    //   success(res) {
    //     if (!res.authSetting['scope.userInfo']) {
    //       // wx.showToast({
    //       //   title: '请授权用户信息!',
    //       //   icon: 'none'
    //       // })

    //       that.setData({
    //         authorizeShow: true
    //       })

    //     } else {
    //       if (!(/^1\d{10}$/.test(that.data.mobile))) {
    //         util.errShow('手机号格式错误');
    //       } else {
    //         wx.showLoading({
    //           title: '订单提交中'
    //         })
    //         new Shelf(res => {
    //           if (res.data.paidAmount == 0) {
    //             wx.hideLoading()
    //             that.countdown(that)
    //             that.setData({
    //               showModal: true
    //             })
    //             setTimeout(function() {
    //               wx.redirectTo({
    //                 url: '../tenant/data?shelvesOrderId=' + res.data.shelvesOrderId,
    //               })
    //             }, 3000)
    //           } else {
    //             new Order(submitData => {
    //               wx.hideLoading()
    //               wx.requestPayment({
    //                 'timeStamp': submitData.data.timeStamp,
    //                 'nonceStr': submitData.data.nonceStr,
    //                 'package': submitData.data.package,
    //                 'signType': submitData.data.signType,
    //                 'paySign': submitData.data.paySign,
    //                 'success': function(paySucc) {
    //                   that.countdown(that)
    //                   that.setData({
    //                     showModal: true
    //                   })
    //                   setTimeout(function() {
    //                     wx.redirectTo({
    //                       url: '../tenant/data?shelvesOrderId=' + res.data.shelvesOrderId,
    //                     })
    //                   }, 3000)
    //                 },
    //                 'fail': function() {
    //                   wx.redirectTo({
    //                     url: "order",
    //                   })
    //                 }
    //               })
    //             }).paymentSubmit({
    //               paymentPluginId: 'chinaumsAppletPayPlugin',
    //               sn: res.data.paymentSn
    //             })
    //           }
    //         }).createOrder({
    //           id: that.data.id,
    //           count: that.data.quantity,
    //           tenantId: app.globalData.tenantId,
    //           extensionId: wx.getStorageSync('shelfExtensionId'),
    //           mobile: that.data.mobile,
    //           memo: that.data.memo,
    //           shelvesShippingMethod: that.data.shelvesShippingMethod
    //         })
    //       }
    //     }
    //   }
    // })



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

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  }

}))