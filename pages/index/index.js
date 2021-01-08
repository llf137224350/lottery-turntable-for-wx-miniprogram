const datas = [{
  "id": "792085712309854208",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 1"
}, {
  "id": "766410261029724160",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 2"
}, {
  "id": "770719340921364480",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 3"
}, {
  "id": "770946438416048128",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 4"
}, {
  "id": "781950121802735616",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 5"
}, {
  "id": "766411654436233216",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 6"
}, {
  "id": "770716883860332544",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 7"
}, {
  "id": "796879308510732288",
  "imgUrl": "../../images/icon.png",
  "title": "迅雷白金会员月卡 - 8"
}];

Page({
  data: {
    datas: datas,
    prizeId: '', // 抽中结果id
    config: {
      titleLength: 7
    }
  },
  /**
   * 次数不足回调
   * @param e
   */
  onNotEnoughHandle(e) {
    wx.showToast({
      icon: 'none',
      title: e.detail
    })
  },

  /**
   * 抽奖回调
   */
  onLuckDrawHandle() {
    this.setData({
      prizeId: this.data.datas[Math.floor(Math.random() * 10 % this.data.datas.length)].id
    });
  },

  /**
   * 动画旋转完成回调
   */
  onLuckDrawFinishHandle() {
    const datas = this.data.datas;
    const data = datas.find((item) => {
      return item.id === this.data.prizeId;
    });
    wx.showToast({
      icon: 'none',
      title: `恭喜你抽中 ${data.title}`
    })
    this.setData({
      prizeId: ''
    });
  }
})
