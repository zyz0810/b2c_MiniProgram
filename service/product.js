let Ajax = require('./ajax.js')
let config = require('../utils/config.js')
module.exports = class Product extends Ajax {

  /**
   * 商品详情
   * id 商品Id
   */
  view(data) {
    super.get({
      url: 'applet/product/view.jhtml',
      hideErrorTip: true,
      data: data

    });
  }

  /**
   * 商品详情（好物圈）
   * id 商品Id
   */
  viewFriend(data) {
    super.post({
      url: 'applet/member/productshare/import.jhtml?appid=' + config.APPID,
      hideErrorTip: true,
      data: data

    });
  }

  /**
   * 商品详情页分享
   * id 商品Id
   */
  share(data) {
    super.get({
      url: 'applet/product/share.jhtml',
      hideErrorTip: true,
      data: data

    });
  }

  /**
   * 获取指定商家的商品列表
   * id 商家编号
   * productCategoryTenantId 商家分类 id
   * keyword 搜索关键词
   * tagIds 商品签标(2新品,5推荐,1热销)
   * brandId 品牌
   * startPrice endPrice 介位段
   * orderType 排序 {综合排序 weight,置顶降序 topDesc, 价格升序 priceAsc,价格降序 priceDesc,销量降序 salesDesc,评分降序 scoreDesc, 日期降序 dateDesc,人气降序 hitsDesc}
   */
  listT(data) {
    super.get({
      url: 'applet/product/list/' + data.id + '.jhtml',
      hideErrorTip: true,
      data: data
    })
  }
  /**
   * 获取推荐，搭配商品列表
   * id 商品Id
   */
  recommend(data) {
    super.get({
      url: 'applet/product/recommend.jhtml',
      hideErrorTip: true,
      data: data
    });
  }
  /**限时折扣商品
   * tenantId 商家编号
   * count 商品条数
   */
  listL(data) {
    super.get({
      url: 'weixin/product/seckill/list.jhtml',
      hideErrorTip: true,
      data: data
    })
  }

  /**
   * 商品热门搜索词
   */
  hot_search() {
    super.get({
      url: 'applet/product/hot_search.jhtml'

    });
  }
  /**
   * 添加商品到收藏
   * id 商品Id
   */
  favorite(data) {
    super.post({
      url: 'applet/member/favorite/product/add.jhtml',
      data: data
    })
  }
  /**
   * 取消商品收藏
   * id 商品Id
   */
  delFavorite(data) {
    super.post({
      url: 'applet/member/favorite/product/delete.jhtml',
      data: data
    })
  }

  /**
   * 货架商品
   *  货架号:shelvesNo
   * 商家id :tenantId
   */
  shelvesList(data) {
    super.get({
      url: 'applet/productShelves/list.jhtml',
      data: data
    });
  }

  /**
   * 货架编号转货架号
   * 编号id :tenantId
   */
  getShelfNoByCode(data) {
    super.get({
      url: 'applet/member/orderShelves/getShelfNoByCode.jhtml',
      data: data
    });
  }

  /**
   * 商品访问记录
   * 商家id :tenantId
   * 商品id：productId
   * visitType   访问类型  (无线网wifi,C端app,购物屏pad,微信weixin)
   * machineType 设备类型  (手机mobile,平板pad,电脑pc)
   */
  record(data) {
    super.post({
      url: 'weixin/visitRecord/add.jhtml',
      data: data
    });
  }

  /**
   * 商品分享码获取
   * 商家id :tenantId
   * 商品id：productId
   */
  code(data) {
    super.get({
      url: 'applet/productShelves/code.jhtml',
      data: data
    });
  }
}