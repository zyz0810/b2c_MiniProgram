module.exports = {
  __pt_toDetail(e) {
    wx.navigateTo({
      url: '/pages/home/productDetails/productDetails?id=' + e.currentTarget.dataset.id,
    })
  }
}