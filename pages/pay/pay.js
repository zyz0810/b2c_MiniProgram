let app = getApp();
let actionsheet = require("../../template/actionsheet/payactionsheet.js");
let util = require('../../utils/util.js');
let receiver = require('../../service/receiver.js');
let order = require('../../service/order.js');
let member = require('../../service/member.js');
let tenant = require('../../service/tenant.js');
let cancel = require("../../template/authorize/authorize.js"),
  bindgetuserinfo = require("../../template/authorize/authorize.js")

Page(Object.assign({}, actionsheet, cancel, bindgetuserinfo,{

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
    calcuState: false,
    authorizeShow: false
  },

  //单选按钮选择配送方式
  radioChange: function(e) {
    var that = this;
    var shippingMethodId = this.data.objectshippingMethods[e.detail.value].id;
    var shippingMethodCode = this.data.objectshippingMethods[e.detail.value].method;
    //如果是到店提货，隐藏运费，显示选择提货地址
    if (shippingMethodCode == 'F2F') {
      this.setData({
        express: true,
        since: false,
        freight: true,
        showMemo: true,
        ifTpl: false,
        index: e.detail.value,
        shippingMethodId: shippingMethodId,
        shippingMethodCode: shippingMethodCode
      })
      //调用价格计算
      this.calcu()
      //获取所有门店列表，默认选择第一个门店
      new tenant(function(data) {
        that.setData({
          deliveryCenterList: data.data,
          deliveryCenterId: data.data[0].id
        })
      }).deliveryCenterList({
        id: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
      })
    } else if (shippingMethodCode == 'TPL') {
      this.setData({
        express: false,
        since: true,
        freight: false,
        showMemo: true,
        ifTpl: true,
        index: e.detail.value,
        shippingMethodId: shippingMethodId,
        shippingMethodCode: shippingMethodCode
      })
      //调用价格计算
      this.calcu()
    } else if (shippingMethodCode == 'PRIVY') {
      wx.showModal({
        title: '货架取货提醒',
        content: '请确认是否从门店货架现场取走货物?',
        success: function(res) {
          if (res.cancel) {
            //取消货架取货则默认为快递配送
            for (var i = 0; i < that.data.objectshippingMethods.length; i++) {
              if (that.data.objectshippingMethods[i].method == 'TPL') {
                that.setData({
                  express: false,
                  since: true,
                  freight: false,
                  showMemo: true,
                  ifTpl: true,
                  shippingMethodId: that.data.objectshippingMethods[i].id,
                  shippingMethodCode: that.data.objectshippingMethods[i].method
                })
              }
            }
          } else if (res.confirm) {
            that.setData({
              express: true,
              since: true,
              freight: true,
              showMemo: false,
              ifTpl: false,
              index: e.detail.value,
              shippingMethodId: shippingMethodId,
              shippingMethodCode: shippingMethodCode
            })
            //调用价格计算
            that.calcu()
          }
        }
      })
    }

  },

  tabTap: function(e) {
    console.log(e)
    let id = e.currentTarget.dataset.id
    var index = this.data.invoiceIndex
    var invoiceList = this.data.invoiceList
    if (id == 0) {
      invoiceList[index].headType = 'company'
    } else {
      invoiceList[index].headType = 'personal'
    }
    this.setData({
      invoiceList: invoiceList,
      currentTab: id
    })
  },
  invoiceBtn: function(e) {
    var that = this
    if (that.data.invoiceView == true) {
      that.setData({
        invoiceView: false,
        invoiceIndex: e.currentTarget.dataset.index
      })
    } else {
      that.setData({
        invoiceView: true,
        invoiceIndex: e.currentTarget.dataset.index
      })
    }
  },
  invoiceClose: function() {
    this.setData({
      invoiceView: false
    })
  },
  submitInvoice: function() {
    this.setData({
      invoiceView: false
    })
  },
  companyName: function(e) {
    // console.log(e)
    var name = e.detail.value
    var index = this.data.invoiceIndex
    var invoiceList = this.data.invoiceList
    invoiceList[index].headType = 'company'
    invoiceList[index].headName = name
    this.setData({
      companyName: name,
      invoiceList: invoiceList
    })
  },
  companyNum: function(e) {
    let num = e.detail.value
    var index = this.data.invoiceIndex
    var invoiceList = this.data.invoiceList
    invoiceList[index].headType = 'company'
    invoiceList[index].dutyParagraph = num
    this.setData({
      companyNum: num,
      invoiceList: invoiceList
    })
  },
  personalName: function(e) {
    var name = e.detail.value
    var index = this.data.invoiceIndex
    var invoiceList = this.data.invoiceList
    invoiceList[index] = {
      makeInvoice: true,
      headType: 'personal',
      headName: name,
      dutyParagraph: ''
    }
    this.setData({
      personalName: name,
      invoiceList: invoiceList
    })
  },
  bindPickerChange: function(e) {
    var that = this;
    var shippingMethodId = this.data.objectshippingMethods[e.detail.value].id;
    var shippingMethodCode = this.data.objectshippingMethods[e.detail.value].method;
    //如果是到店提货，隐藏运费，显示选择提货地址
    if (shippingMethodCode == 'F2F') {
      this.setData({
        express: true,
        since: false,
        freight: true,
      })

      //获取所有门店列表，默认选择第一个门店
      new tenant(function(data) {

        that.setData({
          deliveryCenterList: data.data,
          deliveryCenterId: data.data[0].id
        })
      }).deliveryCenterList({
        id: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
      })
    } else if (shippingMethodCode == 'TPL') {
      this.setData({
        express: false,
        since: true,
        freight: false,
      })
    }
    this.setData({
      index: e.detail.value,
      shippingMethodId: shippingMethodId,
      shippingMethodCode: shippingMethodCode
    })
    //调用价格计算
    this.calcu()
  },




  //选择提货地址
  storeAdressChange: function(e) {
    var deliveryCenterId = this.data.deliveryCenterList[e.detail.value].id;
    this.setData({
      addressId: e.detail.value,
      deliveryCenterId: this.data.deliveryCenterList[e.detail.value].id
    })
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
  //收货地址
  chooseAddress: function() {
    var that = this


    if (that.data.authorize == true) {
      if (that.data.addressList.length == 0) {
        util.navigateTo({
          url: '../member/address/add?page=pay',
        })
      } else {
        util.navigateTo({
          url: '../member/address/list?page=pay',
        })
      }
    } else {
      that.setData({
        authorizeShow: true
      })
    }

    // wx.getSetting({
    //   success(res) {
    //     wx.hideToast();
    //     if (!res.authSetting['scope.userInfo']) {
    //       that.setData({
    //         authorizeShow: true
    //       })
    //     } else {
    //       wx.setStorageSync('authorize', true)
    //       that.setData({
    //         authorize: true
    //       })
    //       if (that.data.addressList.length == 0) {
    //         util.navigateTo({
    //           url: '../member/address/add?page=pay',
    //         })
    //       } else {
    //         util.navigateTo({
    //           url: '../member/address/list?page=pay',
    //         })
    //       }
    //     }
    //   }
    // })


    
  },
  // chooseAddress: function() {
  //   var that = this;
  //   if (this.data.scopeAddress == false) {
  //     wx.showModal({
  //       title: '提示',
  //       content: '未授予地址权限，是否前往设置',
  //       success: function(res) {
  //         if (res.confirm) {
  //           wx.openSetting({
  //             success: function() {
  //               that.getSetting()
  //             }
  //           })
  //         }
  //       }
  //     })
  //   } else {
  //     wx.chooseAddress({
  //       success: function(res) {
  //         that.getSetting()
  //         //获取国家地址码
  //         new receiver(function(data) {

  //           //保存地址
  //           new receiver(function(sd) {
  //             console.log(sd)
  //             that.getAddress()
  //           },function(err){
  //             wx.showModal({
  //               // title: '提示',
  //               content: '添加地址出错，请重新添加',
  //               success(res) {
  //                 if (res.confirm) {
  //                 //  用户点击确定
  //                   util.navigateTo({
  //                     url: '../member/address/list',
  //                   })
  //                 } else if (res.cancel) {
  //                   // 用户点击取消
  //                 }
  //               }
  //             })
  //           }).save({
  //             areaId: data.data,
  //             consignee: res.userName,
  //             address: res.detailInfo,
  //             phone: res.telNumber
  //             })

  //         }).getAreaId({
  //           code: res.nationalCode
  //         })
  //       },
  //       fail: function(err) {
  //         that.getSetting()
  //         // if (err.errMsg.indexOf('auth deny') > -1) {
  //         //   wx.showModal({
  //         //     title: '提示',
  //         //     content: '未授予地址权限，是否前往设置',
  //         //     success: function(res) {
  //         //       if (res.confirm) {
  //         //         wx.openSetting({
  //         //           success: function() {
  //         //             that.getSetting()
  //         //           }
  //         //         })
  //         //       }
  //         //     }
  //         //   })
  //         // }
  //       }
  //     })
  //   }

  // },


  validatemobile: function(mobile) {

    this.setData({
      phone: mobile.detail.value
    })
    if (mobile.detail.value.length == 0) {
      util.errShow('手机号有误');
    }
    var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    if (mobile.detail.value.length != 11 || !myreg.test(mobile.detail.value)) {
      util.errShow('手机号有误');
      return false;
    }


    return true;
  },

  //输入提货人姓名
  f2fName: function(e) {
    this.setData({
      f2fName: e.detail.value
    })
  },
  onShow() {
    var that = this
    var authorize = wx.getStorageSync('authorize')
    this.setData({
      authorize: authorize
    })
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
    // this.getSetting()
    new receiver(function (data) {
      that.setData({
        addressList: data.data
      })
      // that.getAddress() 
      if (data.data.length == 0) {
        that.setData({
          receiver: ''
        })
      } else if (data.data.length == 1) {
        that.setData({
          receiver: data.data[0],
          receiverId: data.data[0].id
        })
      } else {
        that.setData({
          receiverId: that.data.receiver ? that.data.receiver.id : ''
        })
      }
      if (that.data.calcuState == true) {
        that.calcu()
      }
    }).list()

  },

    

  onLoad: function(options) {
    if (options.shelvesNo) {
      this.setData({
        shelvesNo: options.shelvesNo,
        express: false,
        since: true,
        freight: true,
        showMemo: false,
        isSelfGet: true
      })
    }
    var that = this;
    if (options.payType) {
      this.data.isSelfGet = true
      this.setData({
        isSelfGet: this.data.isSelfGet,
        express: true,
        since: true,
        freight: true
      })
    }

    //存储分享者Id
    if (wx.getStorageSync('extension')) {
      that.setData({
        extensionId: wx.getStorageSync('extension')
      })
    }
    this.getAddress();

  },


  getAddress(fn) {
    console.log('mydata:' + this.data.mydata)
    console.log('receiver:' + this.data.receiver)
    this.setData({
      mainColor: app.globalData.mainColor
    })
    var that = this
    this.data.addressIsGet = false

    new order(function(data) {
      that.data.addressIsGet = true
      //存储默认在线付款的支付方式id
      for (var i = 0; i < data.data.paymentMethods.length; i++) {
        //'online'为在线付款  'offline'为线下付款
        if (data.data.paymentMethods[i].method == 'online') {
          that.data.paymentMethodId = data.data.paymentMethods[i].id
        }
      }
      //存储默认配送方式为同城快递的id
      for (var i = 0; i < data.data.shippingMethods.length; i++) {
        //'TPL'为同城快递  'F2F'到店提货
        // if (that.data.isSelfGet && data.data.shippingMethods[i].method == 'PRIVY') {
        //   that.setData({
        //     shippingMethodId: data.data.shippingMethods[i].id,
        //     shippingMethodCode: data.data.shippingMethods[i].method
        //   })
        //   break
        // } else 
        if (data.data.shippingMethods[i].method == 'TPL') {
          that.data.shippingMethodId = data.data.shippingMethods[i].id
          that.data.shippingMethodCode = data.data.shippingMethods[i].method
        }
      }
      var availableCoupons = data.data.order.trades[0].availableCoupons,
        invoiceList = new Array(data.data.order.trades.length),
        code = availableCoupons.length > 0 ? availableCoupons[0].code : '',
        codeName = availableCoupons.length > 0 ? availableCoupons[0].title : '未使用'
      for (var i = 0; i < invoiceList.length; i++) {
        invoiceList[i] = {
          makeInvoice: false,
          headType: 'personal',
          headName: '',
          dutyParagraph: ''
        }
      }
      that.setData({
        receiver: data.data.receiver,
        invoiceList: invoiceList,
        objectshippingMethods: data.data.shippingMethods,
        order: data.data.order,
        amount: data.data.order.amount,
        discount: data.data.order.discount,
        receiverId: data.data.receiver ? data.data.receiver.id : '',
        phone: data.data.receiver ? data.data.receiver.phone : '',
        f2fName: data.data.receiver ? data.data.receiver.consignee : '',
        codes: code,
        selectCoupon: {
          code: code,
          name: codeName
        },
        calcuState: true
      })
      that.calcu()


    }).confirmOrder({
      shelvesNo: that.data.shelvesNo ? that.data.shelvesNo : '',
      cartType: 'mall',
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
        calcuPrice: data.data.trades,
        amount: data.data.amountPayable,
        discount: data.data.discount
      })
    }).calculate({
      paymentMethodId: that.data.paymentMethodId,
      shippingMethodId: that.data.shippingMethodId,
      codes: that.data.codes,
      receiverId: that.data.receiver ? that.data.receiver.id : ''
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

  //买家留言
  inputMemo: function(e) {
    this.setData({
      memo: e.detail.value
    })
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
    var that = this;
    // wx.showToast({
    //   title: '加载中',
    //   icon: 'loading',
    //   duration: 20000
    // })


    if (that.data.authorize == true) {
      if (e.detail.formId) {
        new member(res => { }).addFormId({
          formIds: e.detail.formId
        })
      }

      //同城快递提交订单
      if (that.data.shippingMethodCode == 'TPL') {
        if (!that.data.addressIsGet && that.data.getAddressCount) {
          setTimeout(() => {
            that.formSubmit(e)
            --that.data.getAddressCount
          }, 200)
          return
        }
        if (!that.data.receiverId) {
          util.errShow('请选择收货地址');
        } else {
          wx.showLoading({
            title: '订单请求中',
            mask: true
          })
          new order(function (data) {
            that.setData({
              calcuState: false
            })
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
          }).create({
            receiverId: that.data.receiverId,
            paymentMethodId: that.data.paymentMethodId,
            shippingMethodId: that.data.shippingMethodId,
            memo: that.data.memo,
            codes: that.data.codes,
            extensionId: that.data.extensionId ? that.data.extensionId : '',
            shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : '',
            cartType: 'mall',
            orderInvoiceString: JSON.stringify(that.data.invoiceList)
          })
        }
      } else if (that.data.shippingMethodCode == 'F2F') { //到店提货得订单
        var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
        if (that.data.phone.length != 11 || !myreg.test(that.data.phone)) {
          util.errShow('手机号有误');
          return false;
        } else if (!that.data.f2fName) {
          util.errShow('请输入提货人');
          return false;
        } else {
          wx.showLoading({
            title: '订单请求中',
            mask: true
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
          }).create({
            paymentMethodId: that.data.paymentMethodId,
            shippingMethodId: that.data.shippingMethodId,
            memo: that.data.memo,
            codes: that.data.codes,
            deliveryCenterId: that.data.deliveryCenterId,
            mobile: that.data.phone,
            name: that.data.f2fName,
            extensionId: that.data.extensionId ? that.data.extensionId : '',
            shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : '',
            cartType: 'mall',
            orderInvoiceString: JSON.stringify(that.data.invoiceList)
          })
        }
      } else if (that.data.shippingMethodCode == 'PRIVY') { //货柜自拿订单提交
        wx.showLoading({
          title: '订单请求中',
          mask: true
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
        }).create({
          paymentMethodId: that.data.paymentMethodId,
          shippingMethodId: that.data.shippingMethodId,
          memo: that.data.memo,
          codes: that.data.codes,
          shelvesNo: that.data.shelvesNo ? that.data.shelvesNo : '',
          extensionId: that.data.extensionId ? that.data.extensionId : '',
          cartType: 'mall',
          orderInvoiceString: JSON.stringify(that.data.invoiceList)
        })
      }
    } else {
      that.setData({
        authorizeShow: true
      })
    }

    // wx.getSetting({
    //   success(res) {
    //     wx.hideToast();
    //     if (!res.authSetting['scope.userInfo']) {
    //       that.setData({
    //         authorizeShow: true
    //       })
    //     } else {
    //       wx.setStorageSync('authorize', true)
    //       that.setData({
    //         authorize: true
    //       })

    //       if (e.detail.formId) {
    //         new member(res => { }).addFormId({
    //           formIds: e.detail.formId
    //         })
    //       }

    //       //同城快递提交订单
    //       if (that.data.shippingMethodCode == 'TPL') {
    //         if (!that.data.addressIsGet && that.data.getAddressCount) {
    //           setTimeout(() => {
    //             that.formSubmit(e)
    //             --that.data.getAddressCount
    //           }, 200)
    //           return
    //         }
    //         if (!that.data.receiverId) {
    //           util.errShow('请选择收货地址');
    //         } else {
    //           wx.showLoading({
    //             title: '订单请求中',
    //             mask: true
    //           })
    //           new order(function (data) {
    //             that.setData({
    //               calcuState: false
    //             })
    //             if (that.data.amount == '0') {
    //               wx.redirectTo({
    //                 url: '/pages/pay/payZero?sn=' + data.data,
    //               })
    //             } else {
    //               new order(function (a) {
    //                 new order(function (res) {
    //                   wx.hideLoading()
    //                   that.ActionsheetShow(Object.assign({}, res.data, {
    //                     closeJump: '/pages/member/order/order?id=1',
    //                     successJump: '/pages/pay/success'
    //                   }))
    //                 }).paymentView({
    //                   sn: a.data
    //                 })
    //               }).payment({
    //                 sn: data.data
    //               })
    //             }
    //           }).create({
    //             receiverId: that.data.receiverId,
    //             paymentMethodId: that.data.paymentMethodId,
    //             shippingMethodId: that.data.shippingMethodId,
    //             memo: that.data.memo,
    //             codes: that.data.codes,
    //             extensionId: that.data.extensionId ? that.data.extensionId : '',
    //             shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : '',
    //             cartType: 'mall',
    //             orderInvoiceString: JSON.stringify(that.data.invoiceList)
    //           })
    //         }
    //       } else if (that.data.shippingMethodCode == 'F2F') { //到店提货得订单
    //         var myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(15[0-9]{1})|(17[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
    //         if (that.data.phone.length != 11 || !myreg.test(that.data.phone)) {
    //           util.errShow('手机号有误');
    //           return false;
    //         } else if (!that.data.f2fName) {
    //           util.errShow('请输入提货人');
    //           return false;
    //         } else {
    //           wx.showLoading({
    //             title: '订单请求中',
    //             mask: true
    //           })
    //           new order(function (data) {
    //             if (that.data.amount == '0') {
    //               wx.redirectTo({
    //                 url: '/pages/pay/payZero?sn=' + data.data,
    //               })
    //             } else {
    //               new order(function (a) {
    //                 new order(function (res) {
    //                   wx.hideLoading()
    //                   that.ActionsheetShow(Object.assign({}, res.data, {
    //                     closeJump: '/pages/member/order/order?id=1',
    //                     successJump: '/pages/pay/success'
    //                   }))
    //                 }).paymentView({
    //                   sn: a.data
    //                 })
    //               }).payment({
    //                 sn: data.data
    //               })

    //             }
    //           }).create({
    //             paymentMethodId: that.data.paymentMethodId,
    //             shippingMethodId: that.data.shippingMethodId,
    //             memo: that.data.memo,
    //             codes: that.data.codes,
    //             deliveryCenterId: that.data.deliveryCenterId,
    //             mobile: that.data.phone,
    //             name: that.data.f2fName,
    //             extensionId: that.data.extensionId ? that.data.extensionId : '',
    //             shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : '',
    //             cartType: 'mall',
    //             orderInvoiceString: JSON.stringify(that.data.invoiceList)
    //           })
    //         }
    //       } else if (that.data.shippingMethodCode == 'PRIVY') { //货柜自拿订单提交
    //         wx.showLoading({
    //           title: '订单请求中',
    //           mask: true
    //         })
    //         new order(function (data) {
    //           if (that.data.amount == '0') {
    //             wx.redirectTo({
    //               url: '/pages/pay/payZero?sn=' + data.data,
    //             })
    //           } else {
    //             new order(function (a) {
    //               new order(function (res) {
    //                 wx.hideLoading()
    //                 that.ActionsheetShow(Object.assign({}, res.data, {
    //                   closeJump: '/pages/member/order/order?id=1',
    //                   successJump: '/pages/pay/success'
    //                 }))
    //               }).paymentView({
    //                 sn: a.data
    //               })
    //             }).payment({
    //               sn: data.data
    //             })
    //           }
    //         }).create({
    //           paymentMethodId: that.data.paymentMethodId,
    //           shippingMethodId: that.data.shippingMethodId,
    //           memo: that.data.memo,
    //           codes: that.data.codes,
    //           shelvesNo: that.data.shelvesNo ? that.data.shelvesNo : '',
    //           extensionId: that.data.extensionId ? that.data.extensionId : '',
    //           cartType: 'mall',
    //           orderInvoiceString: JSON.stringify(that.data.invoiceList)
    //         })
    //       }



    //     }
    //   }
    // })

  }
}))