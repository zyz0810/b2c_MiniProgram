let app = getApp()
let Member = require('../../service/member.js')
let Cart = require('../../service/cart.js')
let CartShelves = require('../../service/cartShelves')
let Tenant = require("../../service/tenant.js")
let coupon = require('../../service/coupon.js')
let util = require('../../utils/util.js')
let message = require('../../service/message.js')
let config = require('../../utils/config.js')
let navCart = require("../../template/cart/cart.js")
let cancel = require("../../template/authorize/authorize.js"),
  bindgetuserinfo = require("../../template/authorize/authorize.js")
Page(Object.assign({}, navCart, cancel, bindgetuserinfo, {
  data: {
    memberInfo: {},
    authorizeShow: false
  },
  onLoad: function(options) {},

  getInfoWhenLogin() {
    this.getSetting()
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
    let that = this;
    new Member(data => {
      app.globalData.memberInfo = data.data
      this.setData({
        memberInfo: data.data
      })
    }).view({
      appid: config.APPID
    })
    //收藏商品数量
    new Member(data => {
      this.setData({
        favoriteProductCout: data.data.length
      })
    }).productList({
      tenantId: app.globalData.tenantId
    });

    //优惠券数量
    new coupon(data => {
      this.setData({
        couponLength: data.data.length
      })
    }).list({
      tenantId: app.globalData.tenantId
    })

    //会员卡数量
    new coupon(data => {
      this.setData({
        cardLength: data.data.cards.length
      })
    }).cardlist({
      tenantId: app.globalData.tenantId
    })

    //未读消息数量
    new message(data => {
      var count = parseInt(data.data.account) + parseInt(data.data.message) + parseInt(data.data.order);
      this.setData({
        count: count
      })
    }).count()

    //官方客服电话
    new Tenant(res => {
      this.setData({
        mobile: res.data.mobile ? res.data.mobile : '0551-63676688'
      })
    }).view({
      id: app.globalData.tenantId
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
  onShow: function() {
    var that = this;
    var authorize = wx.getStorageSync('authorize')
    this.setData({
      mainColor: app.globalData.mainColor,
      authorize: authorize
    })

    wx.getSetting({
      success(res) {
        wx.hideToast();
        if (!res.authSetting['scope.userInfo']) {
          that.setData({
            authorizeShow:false,
            authorize: false
          })
        } else {
          wx.setStorageSync('authorize', true)
          that.setData({
            authorize: true
          })
          if (app.globalData.LOGIN_STATUS) {
            that.getInfoWhenLogin()
          } else {
            app.loginOkCallback = res => {
              that.getInfoWhenLogin()
            }
          }
        }
      }
    })





  },
  goAuthorize: function() {
    this.setData({
      authorizeShow:true
    })
  },
  bindgetuserinfo(e) {
    console.log('bindgetuserinfo')
    let that = this
    if (e.detail.errMsg.indexOf('fail') > -1) {
      wx.showToast({
        title: '请授权用户信息!',
        icon: 'none'
      })
      wx.setStorageSync('authorize', false)
    } else {
      wx.setStorageSync('authorize', true)
      new Member(res => {
        const globalMemberInfo = getApp().globalData.memberInfo
        globalMemberInfo.username = e.detail.userInfo.nickName
        globalMemberInfo.userhead = e.detail.userInfo.avatarUrl
        this.setData({
          authorizeShow: false,
          authorize: true
        })
        if (app.globalData.LOGIN_STATUS) {
          that.getInfoWhenLogin()
        } else {
          app.loginOkCallback = res => {
            that.getInfoWhenLogin()
          }
        }
      }).update({
        headImg: e.detail.userInfo.avatarUrl,
        nickName: e.detail.userInfo.nickName
      })
    }
  },
  technical() {
    util.navigateTo({
      url: '/pages/technical/index',
    })
  },
  goAddress: function() {
    var that = this
    if (that.data.authorize == true) {
      util.navigateTo({
        url: 'address/list',
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }    
  },
  //我的钱包
  purse: function() {
    var that = this
    if (that.data.authorize == true){
      util.navigateTo({
        url: 'purse/purse',
      })
    }else{
      that.setData({
        authorizeShow: true
      })
    }
  },
  //进收藏页面
  goFavorite: function() {
    var that = this
    if (that.data.authorize == true) {
      util.navigateTo({
        url: 'favorite/favorite',
      })
    }else{
      that.setData({
        authorizeShow: true
      })
    }    
  },
  //进入券包
  goCoupon: function() {
    var that = this
    if (that.data.authorize == true) {
      util.navigateTo({
        url: '/pages/member/coupon/list',
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }
  },
  //进入微信会员卡
  goMemberCard: function() {
    var that = this
    if (that.data.authorize == true) {
      util.navigateTo({
        url: '/pages/member/coupon/list',
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }
  },
  //进消息页面
  goMessage: function() {
    var that = this
    if (that.data.authorize == true) {
      util.navigateTo({
        url: '../message/index',
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }
  },
  //我的订单
  toOrder: function(e) {
    var id = e.currentTarget.dataset.current
    var that = this
    if (that.data.authorize == true) {
      util.navigateTo({
        url: 'order/order?id=' + id,
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }    
  },
  //收货地址
  chooseAddress: function() {
    var that = this
    if (that.data.authorize == true) {
      if (this.data.scopeAddress == false) {
        wx.showModal({
          title: '提示',
          content: '未授予地址权限，是否前往设置',
          success: function (res) {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.chooseAddress({
          success: function (res) {
            that.getSetting()
          },
          fail: function (err) {
            that.getSetting()
          }
        })
      }
    } else {
      that.setData({
        authorizeShow: true
      })
    }    
  },

  //修改密码
  password: function() {



    var that = this

    if (that.data.authorize == true) {
      if (that.data.memberInfo.bindMobile !== 'binded') {
        util.errShow('您还未绑定手机', 1000, function () {
          util.navigateTo({
            url: '/pages/member/bind/bind',
          })
        })
        return;
      }
      util.navigateTo({
        url: '/pages/include/captcha/captcha?type=password&title=修改支付密码',
      })
    } else {
      that.setData({
        authorizeShow: true
      })
    }    
  },

  //绑定手机
  bindPhone: function() {
    var that = this
    if (that.data.authorize == true) {
      if (that.data.memberInfo.bindMobile !== 'binded') {
        util.navigateTo({
          url: 'bind/bind',
        })
      } else {

        util.errShow('您已绑定', 1500);
      }
    } else {
      that.setData({
        authorizeShow: true
      })
    }    
  },

  //实名认证
  goAuth() {
    var that = this
    if (that.data.authorize == true) {
      if (that.data.memberInfo.bindMobile != "binded") {
        // wx.showModal({
        //   title: '提示',
        //   content: '绑定手机后才可实名认证',
        //   cancelText: '暂不绑定',
        //   confirmText: '立即绑定',
        //   success: function(res) {
        //     if (res.confirm) {
        //       wx.navigateTo({
        //         url: '/pages/member/bind/bind',
        //       })
        //     }
        //   }
        // })
        wx.navigateTo({
          url: '/pages/member/bind/bind?where=auth',
        })
      } else if (that.data.memberInfo.authStatus == 'none' || that.data.memberInfo.authStatus == 'fail') {
        wx.navigateTo({
          url: 'auth/auth',
        })
      } else if (that.data.memberInfo.authStatus == 'wait') {
        wx.showToast({
          title: '认证中',
          icon: 'none'
        })
      } else if (that.data.memberInfo.authStatus == 'success') {
        wx.showToast({
          title: '已认证',
          icon: 'none'
        })
      }
    } else {
      that.setData({
        authorizeShow: true
      })
    }    
  },

  //联系我们
  callUs: function() {
    var that = this
    wx.makePhoneCall({
      phoneNumber: that.data.mobile,
      success(res) {

      },
      fail(err) {
        if (err.errMsg.indexOf('cancel') === -1) {
          util.errShow(that.data.mobile, 5000)
        }

      }
    })
  },

  // 我要钱
  goLoan() {
    wx.navigateTo({
      url: '/pages/loan/index',
    })
  },
  // 我要加盟
  goJoin() {
    wx.navigateTo({
      url: '/pages/member/join/index',
    })
  },
  //查看服务协议
  goAgreement() {
    util.navigateTo({
      url: 'agreement/agreement',
    })
  }

}))