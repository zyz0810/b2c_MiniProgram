let member = require("../../service/member.js"),
  util = require("../../utils/util.js"),
  config = require("../../utils/config.js")
module.exports = {
  bindgetuserinfo(e) {
    let that = this
    if (e.detail.errMsg.indexOf('fail') > -1) {
      wx.showToast({
        title: '请授权用户信息!',
        icon: 'none'
      })
      wx.setStorageSync('authorize', false)
    } else {
      wx.setStorageSync('authorize', true)
      that.setData({
        authorizeShow: false,
        authorize: true
      })
      new member(res => {
        const globalMemberInfo = getApp().globalData.memberInfo
        globalMemberInfo.username = e.detail.userInfo.nickName
        globalMemberInfo.userhead = e.detail.userInfo.avatarUrl
      }).update({
        headImg: e.detail.userInfo.avatarUrl,
        nickName: e.detail.userInfo.nickName
      })
    }
  },
  cancel() {
    this.setData({
      authorizeShow: false,
      authorize:false
    })
    wx.setStorageSync('authorize', false)
  },
}