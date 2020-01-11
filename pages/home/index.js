// pages/home/home.js

let swiperAutoHeight = require("../../template/swiperIndex/swiper.js"),
  Product = require("../../service/product.js"),
  Cart = require("../../service/cart.js"),
  member = require("../../service/member.js"),
  config = require('../../utils/config'),
  Coupon = require("../../service/coupon.js"),
  Tenant = require("../../service/tenant.js"),
  Ad = require("../../service/ad.js"),
  app = getApp(),
  util = require("../../utils/util.js"),
  navCart = require("../../template/cart/cart.js"),
  cancel = require("../../template/authorize/authorize.js"),
  bindgetuserinfo = require("../../template/authorize/authorize.js")

Page(Object.assign({}, swiperAutoHeight, navCart, cancel, bindgetuserinfo, {

  /**
   * 页面的初始数据
   */
  data: {
    scrollTo: null, //页面跳转到
    hotsell: [], //热销商品
    newsell: [], //新品
    recommendsell: [], //推荐商品
    limitsell: [],
    sys: app.globalData.sys,
    paging: {
      recommend: {},
      hotsell: {},
      newsell: {}
    },
    scrollX: true,
    homeLoadReady: false,
    storyTitle: '',
    toUpShow: false,
    nav: [],
    hotLength: '',
    recommendLength: '',
    newLength: '',
    myTime: '',
    tips: '努力加载中~'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.hideShareMenu()
    if (options.scene && !options.extension) {
      var scene = decodeURIComponent(options.scene)
      wx.setStorageSync('shelvesNo', scene.split("#")[0])
      wx.setStorageSync('extension', scene.split("#")[1])
      new member(res => {}).saveShelf({
        appId: config.APPID,
        shelfNo: scene.split("#")[0] ? scene.split("#")[0] : '',
        extensionId: scene.split("#")[1] ? scene.split("#")[1] : ''
      })
    } else {
      var extension = options.extension;
      if (extension) {
        wx.setStorageSync('extension', extension)
      }
      if (options.shelvesNo) {
        wx.setStorageSync('shelvesNo', options.shelvesNo)
      }
      new member(res => {}).saveShelf({
        appId: config.APPID,
        shelfNo: options.shelvesNo ? options.shelvesNo : '',
        extensionId: options.extension ? options.extension : ''
      })
    }
    if (app.globalData.LOGIN_STATUS) {
      this.getData()
    } else {
      app.loginOkCallbackList.push(() => {
        this.getData()
      })
    }
  },
  //跳转详情页
  toDetail(e) {
    let id = e.currentTarget.dataset.id
    util.navigateTo({
      url: './productDetails/productDetails?id=' + id,
    })
  },


  //加入购物车
  addCart(e) {
    let id = e.currentTarget.dataset.id

    new Cart((res) => {

    }).add({
      id: id,
      quantity: 1
    })
  },
  //获取数据
  getData() {
    this.setData({
      mainColor: app.globalData.mainColor
    })
    wx.showShareMenu()
    let that = this,
      promiseList = []
    //广告位(顶部)
    promiseList.push(new Promise((resolve, reject) => {
      new Ad(res => {
        resolve(res)
      }).doT(80, app.globalData.tenantId)
    }))

    //商家数据
    promiseList.push(new Promise((resolve, reject) => {
      new Tenant(res => {
        this.data.tenantData = res.data
        this.setData({
          homeLoadReady: true
        })
        wx.setNavigationBarTitle({
          title: res.data.name
        })
        resolve(res)
      }).view({
        id: app.globalData.tenantId,
        shelvesNo: wx.getStorageSync('shelvesNo') ? wx.getStorageSync('shelvesNo') : ''
      })
    }))

    Promise.all(promiseList).then(res => {
      this.setData({
        topImgs: {
          data: res[0].data.length === 0 ? [{
            image: res[1].data.thumbnail
          }] : res[0].data,
          key: 'image'
        }
      })
      setTimeout(() => {
        this.setData({
          homeLoadReady: true
        })
      }, 100)
    }, err => {
      this.setData({
        homeLoadReady: true
      })
    })

    //加载优惠券
    new Coupon(data => {
      var item = [];
      var couponList = data.data
      this.setData({
        couponList: couponList
      });
    }).listT({
      tenantId: app.globalData.tenantId
    });

    //获取热销商品
    new Product(res => {
      this.data.paging.hotsell = res.pageModel
      var len = res.data.length
      if (len == 0) {
        this.data.shows = false
        this.setData({
          hotLength: true
        })
      } else {
        this.data.shows = true
        this.setData({
          hotLength: false
        })
      }
      this.setData({
        hotsell: res.data,
        paging: this.data.paging
      })
    }).listT({
      id: app.globalData.tenantId,
      pageSize: 10,
      tagIds: 1
    })

    //频道分类
    new Tenant(data => {
      this.setData({
        nav: data.data
      })
    }).productCategoryTree({
      tenantId: app.globalData.tenantId
    })

    //获取新品商品
    new Product(res => {
      this.data.paging.newsell = res.pageModel
      var len = res.data.length
      if (len == 0) {
        this.data.shows = false
        this.setData({
          newLength: true
        })
      } else {
        this.data.shows = true
        this.setData({
          newLength: false
        })
      }
      this.setData({
        newsell: res.data,
        paging: this.data.paging,
        // showRecommd: this.data.shows,
        pageModel: res.pageModel
      })
    }).listT({
      id: app.globalData.tenantId,
      pageSize: 8,
      pageNumber: 1,
      tagIds: 2
    })

    //获取推荐商品
    new Product(res => {
      this.data.paging.recommend = res.pageModel
      var len = res.data.length
      if (len == 0) {
        this.setData({
          recommendLength: true
        })
      } else {
        this.setData({
          recommendLength: false
        })
      }
      this.setData({
        recommendsell: res.data,
        paging: this.data.paging,
        // showRecommd: this.data.shows,
        pageModel: res.pageModel
      })
    }).listT({
      id: app.globalData.tenantId,
      pageSize: 10,
      tagIds: 5
    })

    //广告位(促销)
    new Ad(res => {
      var len = res.data.length
      if (len == 0) {
        this.data.shows = false
      } else {
        this.data.shows = true
      }
      this.setData({
        promotionAdImgs: {
          data: res.data,
          key: 'image',
          show: this.data.shows
        }
      })
    }).doT(214, app.globalData.tenantId)

    // 广告位(新品)
    new Ad(res => {
      var len = res.data.length
      if (len == 0) {
        this.data.shows = false
      } else {
        this.data.shows = true
      }
      this.setData({
        newproductAdImgs: {
          data: res.data,
          key: 'image',
          show: this.data.shows
        }
      })
    }).doT(213, app.globalData.tenantId)

    //广告位(推荐)
    new Ad(res => {
      var len = res.data.length
      if (len == 0) {
        this.data.shows = true
      } else {
        this.data.shows = false
      }
      this.setData({
        recommendAdImgs: {
          data: res.data,
          key: 'image',
          show: this.data.shows
        }
      })
    }).doT(215, app.globalData.tenantId)


    //进店成为会员
    new Tenant(res => {}).becomeVip({
      id: app.globalData.tenantId,
      extension: wx.getStorageSync('extension')
    })
  },
  specialtoupper: function(e) {
    this.setData({
      scrollX: false
    })
    var tagIds = e.currentTarget.dataset.tagids;
    if (tagIds == '1') {
      var pageModel = this.data.paging.hotsell;
      var hotsell = this.data.hotsell;
      new Product((res) => {
        hotsell = hotsell.concat(res.data)
        this.setData({
          scrollX: true,
          hotsell: hotsell
        });
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    } else if (tagIds == '2') {
      this.setData({
        newsellTipsLoad: true
      })
      var pageModel = this.data.paging.newsell;
      var newsell = this.data.newsell;
      new Product((res) => {
        newsell = newsell.concat(res.data)
        this.setData({
          newsell: newsell,
          newsellTipsLoad: false
        })
        if (res.pageModel.totalPages < res.pageModel.pageNumber) {
          this.setData({
            newsellTips: '',
          })
        }
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 8,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    } else if (tagIds == '5') {
      var pageModel = this.data.paging.recommend;
      var recommendsell = this.data.recommendsell;
      new Product((res) => {
        this.setData({
          scrollX: true
        })
        wx.hideToast()
        recommendsell = recommendsell.concat(res.data)
        console.log(pageModel.pageNumber)
        console.log(recommendsell.length)

        this.setData({
          recommendsell: recommendsell
        })
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    }

  },

  /**
   * 页面上拉触底事件的处理函数
   */

  onReachBottom: function() {
    var that = this;
    wx.showNavigationBarLoading();
    // var pageModel = this.data.pageModel;
    var newPageModel = this.data.paging.newsell;
    var newsell = this.data.newsell;
    new Product(function(data) {
      wx.hideNavigationBarLoading() //完成停止加载
      if (data.pageModel.totalPages < data.pageModel.pageNumber) {
        that.setData({
          tips: '',
          showtips: false
        })
      } else {
        newsell = newsell.concat(data.data)
        that.setData({
          newsell: newsell,
          loading: false,
          tips: '努力加载中',
          showtips: false
        })
      }
    }).listT({
      id: app.globalData.tenantId,
      pageNumber: ++newPageModel.pageNumber,
      pageSize: 8,
      tagIds: 2
    })
  },
  //加载更多商品
  loadingMore: function(e) {
    var tagIds = e.currentTarget.dataset.tagids;
    if (tagIds == '1') {
      var pageModel = this.data.paging.hotsell;
      var hotsell = this.data.hotsell;
      new Product((res) => {
        hotsell = hotsell.concat(res.data)
        this.setData({
          hotsell: hotsell
        });
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    } else if (tagIds == '2') {
      this.setData({
        newsellTipsLoad: true
      })
      var pageModel = this.data.paging.newsell;
      var newsell = this.data.newsell;
      new Product((res) => {
        newsell = newsell.concat(res.data)
        this.setData({
          newsell: newsell,
          newsellTipsLoad: false
        })
        if (res.pageModel.totalPages < res.pageModel.pageNumber) {
          this.setData({
            newsellTips: '',
          })
        }
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 8,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    } else if (tagIds == '5') {
      var pageModel = this.data.paging.recommend;
      var recommendsell = this.data.recommendsell;
      new Product((res) => {
        recommendsell = recommendsell.concat(res.data)
        this.setData({
          recommendsell: recommendsell
        })
      }).listT({
        id: app.globalData.tenantId,
        pageSize: 10,
        tagIds: tagIds,
        pageNumber: ++pageModel.pageNumber
      })
    }

  },

  technical() {
    wx.navigateTo({
      url: '/pages/technical/index',
    })
  },

  onPageScroll: function(e) { // 获取滚动条当前位置
    if (e.scrollTop > 150) {
      this.setData({
        toUpShow: true
      })
    } else {
      this.setData({
        toUpShow: false
      })
    }
  },
  scrollto() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },

  //获取购物车商品数量
  getCartCount() {
    var that = this
    //获取购物车商品数量，并在tab角标处显示
    new Cart(function(data) {
      if (data.data > 0 && data.data < 99) {
        wx.setTabBarBadge({
          index: 3,
          text: data.data.toString()
        })
      } else if (data.data > 99) {
        wx.setTabBarBadge({
          index: 3,
          text: '99+'
        })
      } else {
        wx.removeTabBarBadge({
          index: 3
        })
      }
    }).count({
      tenantId: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
    })


    //获取限时抢购商品
    new Product(res => {
      var len = res.data.length

      function time1() {
        var limitsell = res.data
        for (var i = 0; i < limitsell.length; i++) {
          // limitsell[i].beginDate = util.formatTimeTwo(limitsell[i].beginDate, 'Y/M/D h:m:s')
          // limitsell[i].endDate = util.formatTimeTwo(limitsell[i].endDate, 'Y/M/D h:m:s')

          // 活动是否已经开始
          var totalSecond = limitsell[i].beginDate / 1000 - Date.parse(new Date()) / 1000;
          // 活动是否已经结束
          var endSecond = limitsell[i].endDate / 1000 - Date.parse(new Date()) / 1000;

          // var interval = setInterval(function() {
          // 秒数

          if (totalSecond < 0 && endSecond > 0) {
            var second = endSecond;
          } else {
            var second = totalSecond;
          }

          // 天数位
          var day = Math.floor(second / 3600 / 24);
          var dayStr = day.toString();
          if (dayStr.length == 1) dayStr = '0' + dayStr;

          // 小时位
          var hr = Math.floor((second - day * 3600 * 24) / 3600);
          // var hr = Math.floor(second / 3600);
          var hrStr = hr.toString();
          if (hrStr.length == 1) hrStr = '0' + hrStr;

          // 分钟位
          var min = Math.floor((second - day * 3600 * 24 - hr * 3600) / 60);
          // var min = Math.floor((second - hr * 3600) / 60);
          var minStr = min.toString();
          if (minStr.length == 1) minStr = '0' + minStr;

          // 秒位
          var sec = second - day * 3600 * 24 - hr * 3600 - min * 60;
          // var sec = second - hr * 3600 - min * 60;
          var secStr = sec.toString();
          if (secStr.length == 1) secStr = '0' + secStr;

          totalSecond--;

          if (totalSecond < 0 && endSecond > 0) {
            limitsell[i].txt = '马上秒'
            limitsell[i].countDownDay = dayStr
            limitsell[i].countDownHour = hrStr
            limitsell[i].countDownMinute = minStr
            limitsell[i].countDownSecond = secStr
            that.setData({
              limitsell: limitsell
            });
          } else if (totalSecond > 0) {
            limitsell[i].txt = '即将开秒'
            limitsell[i].countDownDay = dayStr
            limitsell[i].countDownHour = hrStr
            limitsell[i].countDownMinute = minStr
            limitsell[i].countDownSecond = secStr

            that.setData({
              limitsell: limitsell
            });
          } else if (totalSecond < 0 && endSecond < 0) {
            // clearInterval(time1);
            // wx.showToast({
            //   title: '活动已结束',
            // });
            limitsell[i].txt = '去看看'
            limitsell[i].countDownDay = '00'
            limitsell[i].countDownHour = '00'
            limitsell[i].countDownMinute = '00'
            limitsell[i].countDownSecond = '00'
            that.setData({
              limitsell: limitsell
            });
          }
          // }.bind(this), 1000);
        }
        that.setData({
          limitsell: limitsell,
        })
      }
      time1();
      // var timer = setInterval(time1, 1000);

      if (len != 0) {
        this.data.myTime = setInterval(time1, 1000)
      }
    }).listL({
      tenantId: wx.getStorageSync('tenantId') ? wx.getStorageSync('tenantId') : app.globalData.tenantId
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this
    var authorize = wx.getStorageSync('authorize')
    this.setData({
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
            authorize: true
          })
          if (app.globalData.LOGIN_STATUS) {
            this.getCartCount()
          } else {
            app.loginOkCallbackList.push(() => {
              this.getCartCount()
            })
          }
        }
      }
    })
    // wx.getSetting({
    //   success(res) {
    //     if (!res.authSetting['scope.userInfo']) {
    //       setTimeout(function() {
    //         wx.navigateTo({
    //           url: '/pages/member/scope/index',
    //         })
    //       }, 1000)
    //     }
    //   }
    // })

  },
  onHide: function() {
    clearInterval(this.data.myTime)
  },

  onUnload: function() {
    clearInterval(this.data.myTime)
  },
  /**
   * 领取优惠券
   */
  receiveCoupon: function(e) {
    let id = e.currentTarget.dataset.id
    var that = this;

    wx.getSetting({
      success(res) {
        wx.hideToast();
        if (!res.authSetting['scope.userInfo']) {
          that.setData({
            authorizeShow: true
          })
        } else {
          wx.setStorageSync('authorize', true)
          that.setData({
            authorize: true
          })
          new Coupon(function(data) {
            new Coupon(function(data) {
              var item = [];
              var couponList = data.data
              that.setData({
                couponList: couponList
              });
            }).listT({
              tenantId: app.globalData.tenantId
            });
            wx.showToast({
              title: '领取成功',
              icon: 'success',
              duration: 2000
            })
          }).pickup({
            id: id
          })
        }
      }
    })


  },
  searchWord(e) {
    this.setData({
      searchWord: e.detail.value
    })
  },
  searchImg() {
    var searchWord = this.data.searchWord ? this.data.searchWord : ''
    util.navigateTo({
      url: './productList/productList?keyWord=' + searchWord + '&page=index'
    })
  },
  // 搜索商品
  searchProduct: function(e) {
    util.navigateTo({
      url: './productList/productList?keyWord=' + e.detail.value + '&page=index'
    })
  },
  toList() {
    util.navigateTo({
      url: './productList/productList?keyWord=&page=index'
    })
  },
  adTap(e) {
    let linkid = e.currentTarget.dataset.linkid
    let linktype = e.currentTarget.dataset.linktype
    if (linktype == 'shelfPackage') {
      wx.navigateTo({
        url: '/pages/shelf/package/index?tenantId=' + app.globalData.tenantId,
      })
    } else {
      if (!linkid) {
        return
      } else {
        util.navigateTo({
          url: './productDetails/productDetails?id=' + linkid,
        })
      }
    }
  },

  //首页扫一扫进商品详情
  wxscan: function() {
    wx.scanCode({
      success: (res) => {
        util.navigateTo({
          url: '/pages/home/productDetails/productDetails?id=' + res.result,
        })
      }
    })
  },
  //分享
  onShareAppMessage: function(res) {
    var that = this;
    if (res.from === 'button') {
      // 来自页面内转发按钮
    }
    return {
      title: that.data.tenantData.name,
      path: 'pages/home/home?extension=' + app.globalData.memberInfo.id + '&shelvesNo=' + wx.getStorageSync('shelvesNo'),
      success: function(res) {
        // 转发成功
        wx.showToast({
          title: '转发成功',
          icon: 'success'
        })
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  //跳转
  toDetail(e) {
    if (e.detail.formId) {
      new member(res => {

      }).addFormId({
        formIds: e.detail.formId
      })
    }
    let id = e.currentTarget.dataset.id
    util.navigateTo({
      url: '../home/productList/productList?page=cate&cateid=' + id,
    })
  },
  __pt_toDetail(e) {
    wx.navigateTo({
      url: '/pages/home/productDetails/productDetails?id=' + e.currentTarget.dataset.id,
    })
  },

  // 打开店铺信息
  goTenantInfo() {
    wx.navigateTo({
      url: "/pages/home/tenant/info"
    })
  },
  //跳转分类页
  goCategory: function() {
    util.navigateTo({
      url: './../category/index',
    })
  },
}))