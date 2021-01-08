/**
 * ease:
 * 'linear'  动画从头到尾的速度是相同的
 * 'ease'  动画以低速开始，然后加快，在结束前变慢
 * 'ease-in'  动画以低速开始
 * 'ease-in-out'  动画以低速开始和结束
 * 'ease-out'  动画以低速结束
 * 'step-start'  动画第一帧就跳至结束状态直到结束
 * 'step-end'  动画一直保持开始状态，最后一帧跳到结束状态
 */
let config = {
  size: {
    width: '572rpx',
    height: '572rpx'
  }, // 转盘宽高
  bgColors: ['#FFC53F', '#FFED97'], // 转盘间隔背景色 支持多种颜色交替
  fontSize: 10, // 文字大小
  fontColor: '#C31A34', // 文字颜色
  titleMarginTop: 12, // 最外文字边距
  titleLength: 6, // 最外文字个数
  iconWidth: 29.5, // 图标宽度
  iconHeight: 29.5, // 图标高度
  iconAndTextPadding: 4, // 最内文字与图标的边距
  duration: 8000, // 转盘转动动画时长
  rate: 1.5, // 由时长s / 圈数得到
  border: 'border: 10rpx solid #FEFAE4;', // 转盘边框
  ease: 'ease-out' // 转盘动画
};

let preAngle = 0; // 上一次选择角度
let preAngle360 = 0; // 上一次选择角度和360度之间的差
let retryCount = 10; // 报错重试次数
let retryTimer; // 重试setTimeout
let drawTimer; // 绘制setTimeout
Component({
  properties: {
    // 是否可用
    enable: {
      type: Boolean,
      value: true
    },
    // 数据
    data: {
      type: Array,
      value: []
    },
    //  中奖id
    prizeId: {
      type: String,
      value: ''
    },
    // 配置项 传入后和默认的配置进行合并
    config: {
      type: Object,
      value: {}
    },
    // 抽奖次数
    count: {
      type: Number,
      default: 5
    }
  },
  data: {
    lotteryCount: 5,
    turnCanvasInfo: {width: 0, height: 0},
    size: config.size,
    datas: [],
    disable: false,
    canvasImgUrl: '',
    border: config.border,
    infos: []
  },
  methods: {
    async getCanvasContainerInfo(id) {
      return new Promise((resolve) => {
        const query = wx.createSelectorQuery().in(this);
        query.select(id).boundingClientRect(function (res) {
          const {width, height} = res;
          resolve({width, height});
        }).exec();
      });
    },
    async init() {
      try {
        const info = await this.getCanvasContainerInfo('#turn');
        if (info.width && info.height) {
          this.setData({
            turnCanvasInfo: info
          });
          this.drawTurn();
        } else {
          wx.showToast({
            icon: 'nont',
            title: '获取转盘宽高失败'
          })
        }
      } catch (e) {
        if (retryCount <= 0) {
          return;
        }
        retryCount--;
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        retryTimer = setTimeout(async () => {
          await this.init();
        }, 100);
      }
    },
    drawTurn() {
      const turnCanvasInfo = this.data.turnCanvasInfo;
      const datas = this.properties.datas;
      const ctx = wx.createCanvasContext('turn', this);
      // 计算没个扇区弧度
      const radian = Number((2 * Math.PI / datas.length).toFixed(2));
      // 绘制扇区并记录每个扇区信息
      const infos = this.drawSector(radian, datas, ctx, turnCanvasInfo);
      // 记录旋转角度
      this.recordTheRotationAngle(infos);
      // 绘制扇区文本及图片
      this.drawTextAndImage(datas, ctx, turnCanvasInfo, radian);
      ctx.draw(false, () => {
        this.saveToTempPath(turnCanvasInfo);
      });
    },
    saveToTempPath(turnCanvasInfo) {
      if (drawTimer) {
        clearTimeout(drawTimer);
      }
      drawTimer = setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: 'turn',
          quality: 1,
          x: 0,
          y: 0,
          width: turnCanvasInfo.width,
          height: turnCanvasInfo.height,
          success: (res) => {
            this.setData({
              canvasImgUrl: res.tempFilePath
            });
          },
          fail: (error) => {
            console.log(error);
          }
        }, this);
      }, 500);
    },
    drawSector(radian, datas, ctx, turnCanvasInfo) {
      const halfRadian = Number((radian / 2).toFixed(2));
      let startRadian = -Math.PI / 2 - halfRadian;

      const angle = 360 / datas.length;
      const halfAngle = angle / 2;
      let startAngle = -90 - halfAngle;
      const infos = [];
      // 绘制扇形
      for (let i = 0; i < datas.length; i++) {
        // 保存当前状态
        ctx.save();
        // 开始一条新路径
        ctx.beginPath();
        ctx.moveTo(turnCanvasInfo.width / 2, turnCanvasInfo.height / 2);
        ctx.arc(turnCanvasInfo.width / 2, turnCanvasInfo.height / 2, turnCanvasInfo.width / 2, startRadian, startRadian + radian);
        if (datas[i].bgColor) {
          ctx.setFillStyle(datas[i].bgColor);
        } else {
          ctx.setFillStyle(config.bgColors[i % config.bgColors.length]);
        }
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        infos.push({
          id: datas[i].id,
          angle: (startAngle + startAngle + angle) / 2
        });
        startRadian += radian;
        startAngle += angle;
      }
      return infos;
    },
    drawTextAndImage(datas, ctx, turnCanvasInfo, radian) {
      let startRadian = 0;
      // 绘制扇形文字和logo
      for (let i = 0; i < datas.length; i++) {
        // 保存当前状态
        ctx.save();
        // 开始一条新路径
        ctx.beginPath();
        ctx.translate(turnCanvasInfo.width / 2, turnCanvasInfo.height / 2);
        ctx.rotate(startRadian);
        ctx.translate(-turnCanvasInfo.width / 2, -turnCanvasInfo.height / 2);
        if (datas[i].fontSize) {
          ctx.setFontSize(datas[i].fontSize);
        } else {
          ctx.setFontSize(config.fontSize);
        }
        ctx.setTextAlign('center');
        if (datas[i].fontColor) {
          ctx.setFillStyle(datas[i].fontColor);
        } else {
          ctx.setFillStyle(config.fontColor);
        }
        ctx.setTextBaseline('top');
        if (datas[i].title) {
          ctx.fillText(datas[i].title, turnCanvasInfo.width / 2, config.titleMarginTop);
        }
        if (datas[i].subTitle) {
          ctx.fillText(datas[i].subTitle ? datas[i].subTitle : '', turnCanvasInfo.width / 2, config.titleMarginTop + config.fontSize + 2);
        }
        if (datas[i].imgUrl) {
          ctx.drawImage(datas[i].imgUrl,
            turnCanvasInfo.width / 2 - config.iconWidth / 2,
            config.titleMarginTop + config.fontSize * 2 + 2 + config.iconAndTextPadding,
            config.iconWidth, config.iconHeight);
        }
        ctx.closePath();
        ctx.restore();
        startRadian += radian;
      }
    },
    recordTheRotationAngle(infos) {
      for (let i = infos.length - 1; i >= 0; i--) {
        infos[i].angle -= infos[0].angle;
        infos[i].angle = 360 - infos[i].angle;
      }
      // 记录id及滚动的角度
      this.setData({
        infos: infos
      });
    },
    luckDrawHandle() {
      if (this.data.disable || !this.data.canvasImgUrl) {
        return;
      }
      this.setData({
        disable: true
      });
      this.triggerEvent('LuckDraw');
    },
    startAnimation(angle) {
      if (this.data.lotteryCount - 1 === -1) {
        this.setData({
          disable: false
        });
        this.triggerEvent('NotEnough', '抽奖次数不足！');
        return;
      }
      // 抽奖次数减一
      this.setData({
        lotteryCount: this.data.lotteryCount - 1
      });
      const currentAngle = preAngle;
      preAngle += Math.floor((config.duration / 1000) / config.rate) * 360 + angle + preAngle360;
      this.animate('#canvas-img', [
        {rotate: currentAngle, ease: 'linear'},
        {rotate: preAngle, ease: config.ease},
      ], config.duration, () => {
        this.setData({
          disable: false
        });
        preAngle360 = 360 - angle;
        this.triggerEvent('LuckDrawFinish');
      });
    },
    downloadHandle(url) {
      return new Promise((resolve, reject) => {
        wx.downloadFile({
          url: url, // 仅为示例，并非真实的资源
          success: (res) => {
            // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
            if (res.statusCode === 200) {
              resolve(res.tempFilePath);
            } else {
              reject();
            }
          },
          fail: () => {
            reject();
          }
        });
      });
    },
    async downloadImg(imgs) {
      let result;
      try {
        const downloadHandles = [];
        for (const url of imgs) {
          if (this.isAbsoluteUrl(url)) { // 是网络地址
            downloadHandles.push(this.downloadHandle(url));
          } else {
            downloadHandles.push(Promise.resolve(url));
          }
        }
        result = await Promise.all(downloadHandles);
      } catch (e) {
        console.log(e);
        result = [];
      }
      return result;
    },
    clearTimeout() {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (drawTimer) {
        clearTimeout(drawTimer);
      }
    },
    isAbsoluteUrl(url) {
      return /(^[a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    },
    async initData(data) {
      let title;
      let subTitle;
      let imgUrls = [];
      if (this.properties.config) {
        config = Object.assign(config, this.properties.config);
      }
      for (const d of data) {
        title = d.title;
        imgUrls.push(d.imgUrl);
        d.imgUrl = '';
        if (title.length > config.titleLength) {
          d.title = title.slice(0, config.titleLength);
          subTitle = title.slice(config.titleLength);
          if (subTitle.length > config.titleLength - 2) {
            d['subTitle'] = subTitle.slice(0, config.titleLength - 2) + '...';
          } else {
            d['subTitle'] = subTitle;
          }
        }
      }
      imgUrls = await this.downloadImg(imgUrls);
      for (let i = 0; i < imgUrls.length; i++) {
        data[i].imgUrl = imgUrls[i];
      }
      this.setData({
        datas: data
      });
      await this.init();
    }
  },
  observers: {
    'data': async function (data) {
      if (!data || !data.length) {
        return;
      }
      await this.initData(data);
    },
    'enable': function (enable) {
      this.setData({
        disable: !enable
      });
    },
    'prizeId': function (id) {
      if (!id) {
        this.setData({
          disable: false
        });
        return;
      }
      try {
        const infos = this.data.infos;
        const info = infos.find((item) => item.id === id);
        this.startAnimation(info.angle);
      } catch (e) {
        this.setData({
          disable: false
        });
      }
    },
    'count': function (lotteryCount) {
      this.setData({
        lotteryCount
      });
    }
  },
  lifetimes: {
    detached() {
      this.clearTimeout();
    }
  },
  pageLifetimes: {
    hide() {
      this.clearTimeout();
    }
  }
});
