let app = getApp();
let actionsheet = require("../../template/actionsheet/payactionsheet.js");
let util = require('../../utils/util.js');
let order = require('../../service/order.js');
let member = require('../../service/member.js');
let tenant = require('../../service/tenant.js');

Page(Object.assign({}, actionsheet, {

  /**
   * 页面的初始数据
   */
  data: {
    ifshowGuide: true,
    index: 0,
    express: false,
    since: true,
    freight: false,
    storeAdress: ['合肥市瑶海区', '合肥市庐阳区'],
    addressId: 0,
    showCouponSelect: false,
    selectCoupon: {
      name: '未使用',
      code: ''
    },
    memo: '',
    codes: [],
    addressIsGet: true,
    getAddressCount: 10,
    showMemo: true,
    invoiceView: false,
    currentTab: 1,
    companyName: '',
    companyNum: '',
    personalName: '',
    orderInvoices: [],
    ifTpl: true,
    calcuState: false
  },
  //选择服务导购
  guideChange: function(e) {
    var extensionId = this.data.guideList[e.detail.value].id;
    this.setData({
      guideId: e.detail.value,
      extensionId: extensionId
    })
  },
  getSetting() {
    var that = this
    wx.getSetting({
      success: function(res) {
        that.data.scopeAddress = res.authSetting['scope.address'] == undefined ? 'undefined' : res.authSetting['scope.address']
      }
    })
  },

  onShow() {
    var that = this
    wx.getSetting({
      success(res) {
        wx.hideToast();
        if (!res.authSetting['scope.userInfo']) {
          that.setData({
            authorizeShow: false
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

  onLoad: function(options) {
    //存储分享者Id
    if (wx.getStorageSync('extension')) {
      this.setData({
        extensionId: wx.getStorageSync('extension')
      })
    }
    this.getAddress();
  },
  getAddress(fn) {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    var that = this
    this.data.addressIsGet = false
    new order(function(data) {
      that.data.addressIsGet = true
      //存储默认配送方式为同城快递的id
      for (var i = 0; i < data.data.shippingMethods.length; i++) {
        if (data.data.shippingMethods[i].method == 'PRIVY') {
          that.data.shippingMethodId = data.data.shippingMethods[i].id
          that.data.shippingMethodCode = data.data.shippingMethods[i].method
        }
      }
      var availableCoupons = data.data.order.trades[0].availableCoupons,
        invoiceList = new Array(data.data.order.trades.length),
        code = availableCoupons.length > 0 ? availableCoupons[0].code : '',
        codeName = availableCoupons.length > 0 ? availableCoupons[0].title : '未使用'
      that.setData({
        objectshippingMethods: data.data.shippingMethods,
        order: data.data.order,
        amount: data.data.order.amount,
        codes: code,
        selectCoupon: {
          code: code,
          name: codeName
        },
        calcuState: true
      })
      that.calcu()
    }).confirmOrderShelves({
      shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : '',
      cartType: 'shelves',
      tenantId: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : getApp().globalData.tenantId
    })

    //获取货架员工列表
    if (wx.getStorageSync('shelvesNo')) {
      if (wx.getStorageSync('extension')) {
        that.setData({
          ifshowGuide: true
        })
        return
      }
      new member(function(data) {
        if (data.data.length > 0) {
          that.setData({
            ifshowGuide: false
          })
        }
        that.setData({
          guideList: data.data,
          extensionId: data.data ? data.data[0].id : '',
          guideId: data.data ? 0 : '',
          guideSelected: data.data ? data.data[0] : ''
        })
      }).employeeShelves({
        shelvesNo: wx.getStorageSync('shelvesNo')
      })
    }
  },

  //计算价格方法
  calcu: function() {
    var that = this;
    new order(function(data) {
      that.setData({
        homeLoadReady: true,
        calcuPrice: data.data.trades,
        amount: data.data.amountPayable,
        discount: data.data.discount
      })
    }).calculateShelves({
      shelvesNo: wx.getStorageSync('shelvesNo'),
      cartType: 'shelves',
      codes: that.data.codes,
    })
  },
  //显示
  toogleCouponSelect() {
    this.setData({
      showCouponSelect: !this.data.showCouponSelect
    })
  },
  //选择优惠券
  selectCoupon(e) {
    let code = e.currentTarget.dataset.code,
      name = e.currentTarget.dataset.name,
      codes = [];
    codes.push(code);
    this.setData({
      selectCoupon: {
        code: code ? code : '',
        name: name ? name : (code ? '已使用' : '未使用')
      },
      showCouponSelect: false,
      codes: codes
    })
    this.calcu()
  },
  switchChange(e) {
    var index = e.currentTarget.dataset.index
    var invoiceList = this.data.invoiceList
    invoiceList[index].makeInvoice = e.detail.value
    this.setData({
      invoiceList: invoiceList,
      invoiceIndex: index
    })
  },
  //确认下单提交
  formSubmit: function(e) {
    var formId = e.detail.formId;
    var that = this;
    console.log(e)


    //未授权
    if (e.detail.errMsg.indexOf('fail') > -1) {
      wx.showToast({
        title: '请授权用户信息!',
        icon: 'none'
      })
    } else {
      //授权成功
      wx.showModal({
        title: '货架取货提醒',
        content: '请确认是否从门店货架现场取走货物?',
        success: function (res) {
          if (res.cancel) { } else if (res.confirm) {
            wx.showLoading({
              title: '付款请求中',
            })
            new order(function (data) {
              if (that.data.amount == '0') {
                wx.redirectTo({
                  url: '/pages/pay/payZero?sn=' + data.data,
                })
              } else {
                new order(function (a) {
                  new order(function (res) {
                    wx.hideLoading()
                    that.ActionsheetShow(Object.assign({}, res.data, {
                      closeJump: '/pages/member/order/order?id=1',
                      successJump: '/pages/pay/success'
                    }))
                  }).paymentView({
                    sn: a.data
                  })
                }).payment({
                  sn: data.data
                })
              }
            }, function () {
              wx.hideLoading()
            }).createShelves({
              codes: that.data.codes,
              shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : '',
              extensionId: that.data.extensionId ? that.data.extensionId : '',
              cartType: 'shelves'
            })
          }
        }
      })
    }
    
  }
}))